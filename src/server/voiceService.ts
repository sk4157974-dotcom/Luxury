import { GoogleGenAI } from '@google/genai';
import WebSocket from 'ws';

export interface AudioResult {
  base64Pcm: string;
  audioUrl: string;
}

// In-memory cache for generated voice audio (Aoede voice)
export const ttsAudioCache = new Map<string, AudioResult>();
export const inFlightTts = new Map<string, Promise<AudioResult | null>>();

/**
 * Resolves the configured Gemini API key from standard environment variable names.
 * Supports GEMINI_API_KEY, GOOGLE_API_KEY, GOOGLE_GENAI_API_KEY, and VITE_GEMINI_API_KEY.
 */
export function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
}

/**
 * Natural Indian conversational speech formatting:
 * - Greet with Hello instead of repetitive Namaste
 * - Prevent duplicate "ji ji"
 * - Indian currency pronunciation ("35 rupaye")
 * - Soft comma pauses for gentle, unhurried 5-star Indian hospitality rhythm
 * - Strip markdown, asterisks, brackets, and emojis completely
 */
export function cleanSpeechText(text: string): string {
  if (!text) return '';
  let clean = text
    .replace(/\bNamaste\s*ji\s*ji\b/gi, 'Hello ji, ')
    .replace(/\bNamaste\s*ji\b/gi, 'Hello ji, ')
    .replace(/\bNamaste\b/gi, 'Hello, ')
    .replace(/\bji\s+ji\b/gi, 'ji')
    .replace(/\bHello\s+Hello\b/gi, 'Hello')
    .replace(/(?:₹|Rs\.?|INR|\$)\s*(\d+)/gi, ' $1 rupaye, ')
    .replace(/\b(\d+)\s*(?:rupees|rupee|rs\.?|\/-)\b/gi, ' $1 rupaye, ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, ' ')
    .replace(/[*#_~`•–\[\]\(\)]/g, ' ')
    .replace(/^-\s+/gm, '')
    .replace(/:\s*/g, ', ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure Indian English phonetic cadence:
  if (/^(?:hello|hi|welcome)\b/i.test(clean) && !/^(?:hello\s+ji|namaste\s+ji)/i.test(clean)) {
    clean = clean.replace(/^(?:hello|hi|welcome)\b[,\s!]*/i, 'Hello ji, ');
  }

  // Full complete spoken response (up to 2200 characters)
  if (clean.length > 2200) {
    const sub = clean.slice(0, 2200);
    const lastPunct = Math.max(
      sub.lastIndexOf('.'),
      sub.lastIndexOf('!'),
      sub.lastIndexOf('?')
    );
    if (lastPunct > 1600) {
      return sub.slice(0, lastPunct + 1).trim();
    }
    return sub.trim();
  }
  return clean;
}

/**
 * Audio helper: Convert 24kHz 16-bit mono PCM into standard playable WAV format
 */
export function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20); // PCM format
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitDepth, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([wavHeader, pcmBuffer]);
}

/**
 * Real-time bidirectional Gemini Live conversational voice generation
 * Uses models/gemini-3.1-flash-live-preview with Aoede voice (The exact natural human voice)
 */
export async function generateLivePcmViaWs(
  apiKey: string,
  spokenText: string,
  voiceName: string = 'Aoede'
): Promise<string | null> {
  return new Promise((resolve) => {
    try {
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      const ws = new WebSocket(url);
      const pcmBuffers: Buffer[] = [];
      let completed = false;

      const timer = setTimeout(() => {
        if (!completed) {
          completed = true;
          try { ws.close(); } catch (_) {}
          if (pcmBuffers.length > 0) {
            const combined = Buffer.concat(pcmBuffers);
            resolve(combined.toString('base64'));
          } else {
            resolve(null);
          }
        }
      }, 8500);

      ws.on('open', () => {
        ws.send(JSON.stringify({
          setup: {
            model: 'models/gemini-3.1-flash-live-preview',
            generationConfig: {
              responseModalities: ['AUDIO'],
              speechConfig: {
                voiceConfig: {
                  prebuiltVoiceConfig: { voiceName: voiceName || 'Aoede' }
                }
              }
            },
            systemInstruction: {
              parts: [{ text: 'You are the voice of Luxury Hotel official AI Concierge. Speak clearly, warmly, and naturally with respectful Indian hospitality voice. Read aloud the exact provided text in Hindi and English. Do not add commentary.' }]
            }
          }
        }));
      });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.setupComplete) {
            ws.send(JSON.stringify({
              clientContent: {
                turns: [{
                  role: 'user',
                  parts: [{ text: 'Read aloud: ' + spokenText }]
                }],
                turnComplete: true
              }
            }));
          }
          if (msg.serverContent?.modelTurn?.parts) {
            for (const part of msg.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                try {
                  const chunkBuf = Buffer.from(part.inlineData.data, 'base64');
                  if (chunkBuf.length > 0) {
                    pcmBuffers.push(chunkBuf);
                  }
                } catch (_) {}
              }
            }
          }
          if (msg.serverContent?.turnComplete) {
            if (!completed) {
              completed = true;
              clearTimeout(timer);
              try { ws.close(); } catch (_) {}
              if (pcmBuffers.length > 0) {
                const combined = Buffer.concat(pcmBuffers);
                resolve(combined.toString('base64'));
              } else {
                resolve(null);
              }
            }
          }
        } catch (_) {}
      });

      ws.on('error', () => {
        if (!completed) {
          completed = true;
          clearTimeout(timer);
          try { ws.close(); } catch (_) {}
          if (pcmBuffers.length > 0) {
            const combined = Buffer.concat(pcmBuffers);
            resolve(combined.toString('base64'));
          } else {
            resolve(null);
          }
        }
      });

      ws.on('close', () => {
        if (!completed) {
          completed = true;
          clearTimeout(timer);
          if (pcmBuffers.length > 0) {
            const combined = Buffer.concat(pcmBuffers);
            resolve(combined.toString('base64'));
          } else {
            resolve(null);
          }
        }
      });
    } catch (_) {
      resolve(null);
    }
  });
}

/**
 * Generates natural voice audio using Gemini Live Audio (Aoede voice, cached for instant replay)
 * Self-contained implementation using the configured Gemini API key
 */
export async function generateVoiceAudio(
  text: string,
  voiceName: string = 'Aoede'
): Promise<AudioResult | null> {
  try {
    const speechSlice = cleanSpeechText(text);
    if (!speechSlice) return null;

    const cacheKey = `${voiceName}::${speechSlice}`;
    if (ttsAudioCache.has(cacheKey)) {
      return ttsAudioCache.get(cacheKey)!;
    }

    // Reuse in-flight Promise if request is already ongoing
    if (inFlightTts.has(cacheKey)) {
      return await inFlightTts.get(cacheKey)!;
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('[VoiceService] No Gemini API key found in environment');
      return null;
    }

    const generatePromise = (async (): Promise<AudioResult | null> => {
      let base64Pcm: string | null = null;

      // Method 1: Live Bidirectional Gemini Live API (models/gemini-3.1-flash-live-preview)
      // Authentic human Aoede voice, warm Indian hospitality cadence, zero daily request quota limits
      try {
        const livePcm = await generateLivePcmViaWs(apiKey, speechSlice, voiceName || 'Aoede');
        if (livePcm && livePcm.length > 1000) {
          base64Pcm = livePcm;
        }
      } catch (wsErr: any) {
        console.info('[Live Audio WS Notice]:', String(wsErr?.message || wsErr).slice(0, 100));
      }

      // Method 2: Gemini TTS fallback
      if (!base64Pcm) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
          for (const model of ttsModels) {
            if (base64Pcm) break;
            try {
              const ttsPromise = ai.models.generateContent({
                model,
                contents: speechSlice,
                config: {
                  responseModalities: ['AUDIO'],
                  speechConfig: {
                    voiceConfig: {
                      prebuiltVoiceConfig: { voiceName: voiceName || 'Aoede' },
                    },
                  },
                },
              });

              const ttsTimeoutPromise = new Promise<null>((resolve) =>
                setTimeout(() => resolve(null), 8000)
              );

              const response = await Promise.race([ttsPromise, ttsTimeoutPromise]);
              const candidateParts = (response as any)?.candidates?.[0]?.content?.parts || [];
              for (const part of candidateParts) {
                if (part?.inlineData?.data) {
                  base64Pcm = part.inlineData.data;
                  break;
                }
              }
            } catch (_) {}
          }
        } catch (_) {}
      }

      if (!base64Pcm) {
        return null;
      }

      let audioUrl: string;
      if (base64Pcm.startsWith('UklGR')) {
        audioUrl = `data:audio/wav;base64,${base64Pcm}`;
      } else {
        const pcmBuffer = Buffer.from(base64Pcm, 'base64');
        const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1, 16);
        audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
      }

      const audioData: AudioResult = { base64Pcm, audioUrl };
      if (ttsAudioCache.size > 500) {
        const firstKey = ttsAudioCache.keys().next().value;
        if (firstKey) ttsAudioCache.delete(firstKey);
      }
      ttsAudioCache.set(cacheKey, audioData);
      return audioData;
    })();

    inFlightTts.set(cacheKey, generatePromise);
    try {
      const result = await generatePromise;
      return result;
    } finally {
      inFlightTts.delete(cacheKey);
    }
  } catch {
    return null;
  }
}
