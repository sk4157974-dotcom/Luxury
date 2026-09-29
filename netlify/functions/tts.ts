import { GoogleGenAI } from '@google/genai';
import WebSocket from 'ws';

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Global in-memory cache preserved across warm Netlify function invocations
const ttsAudioCache = new Map<string, { base64Pcm: string; audioUrl: string }>();
const inFlightTts = new Map<string, Promise<{ base64Pcm: string; audioUrl: string } | null>>();

function getGeminiApiKey(): string {
  return (
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.GOOGLE_GENAI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    ''
  ).trim();
}

function cleanSpeechText(text: string): string {
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

  if (/^(?:hello|hi|welcome)\b/i.test(clean) && !/^(?:hello\s+ji|namaste\s+ji)/i.test(clean)) {
    clean = clean.replace(/^(?:hello|hi|welcome)\b[,\s!]*/i, 'Hello ji, ');
  }

  // Never truncate text so long responses (8+ lines) are spoken completely
  return clean;
}

function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  const wavHeader = Buffer.alloc(44);
  wavHeader.write('RIFF', 0);
  wavHeader.writeUInt32LE(36 + pcmBuffer.length, 4);
  wavHeader.write('WAVE', 8);
  wavHeader.write('fmt ', 12);
  wavHeader.writeUInt32LE(16, 16);
  wavHeader.writeUInt16LE(1, 20);
  wavHeader.writeUInt16LE(numChannels, 22);
  wavHeader.writeUInt32LE(sampleRate, 24);
  wavHeader.writeUInt32LE(byteRate, 28);
  wavHeader.writeUInt16LE(blockAlign, 32);
  wavHeader.writeUInt16LE(bitDepth, 34);
  wavHeader.write('data', 36);
  wavHeader.writeUInt32LE(pcmBuffer.length, 40);
  return Buffer.concat([wavHeader, pcmBuffer]);
}

async function streamLivePcmViaWs(
  apiKey: string,
  spokenText: string,
  voiceName: string = 'Aoede',
  onChunk?: (chunkBase64: string) => void
): Promise<{ base64Pcm: string; audioUrl: string } | null> {
  return new Promise((resolve) => {
    try {
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      const ws = new WebSocket(url);
      const pcmBuffers: Buffer[] = [];
      let completed = false;
      let idleTimer: NodeJS.Timeout | null = null;

      const finish = () => {
        if (!completed) {
          completed = true;
          if (idleTimer) clearTimeout(idleTimer);
          if (maxTimer) clearTimeout(maxTimer);
          try { ws.close(); } catch (_) {}
          if (pcmBuffers.length > 0) {
            const combined = Buffer.concat(pcmBuffers);
            const base64Pcm = combined.toString('base64');
            const wavBuffer = pcmToWavBuffer(combined, 24000, 1, 16);
            const audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
            resolve({ base64Pcm, audioUrl });
          } else {
            resolve(null);
          }
        }
      };

      const resetIdleTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
          finish();
        }, 6000);
      };

      // 45-second overall safety limit for long responses (never prematurely truncates at 8.5s)
      const maxTimer = setTimeout(() => {
        finish();
      }, 45000);

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
            resetIdleTimer();
          }
          if (msg.serverContent?.modelTurn?.parts) {
            for (const part of msg.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                try {
                  const chunkBuf = Buffer.from(part.inlineData.data, 'base64');
                  if (chunkBuf.length > 0) {
                    pcmBuffers.push(chunkBuf);
                    if (onChunk) {
                      onChunk(part.inlineData.data);
                    }
                    resetIdleTimer();
                  }
                } catch (_) {}
              }
            }
          }
          if (msg.serverContent?.turnComplete) {
            finish();
          }
        } catch (_) {}
      });

      ws.on('error', () => {
        finish();
      });

      ws.on('close', () => {
        finish();
      });
    } catch (_) {
      resolve(null);
    }
  });
}

async function generateVoiceAudio(
  text: string,
  voiceName: string = 'Aoede',
  onChunk?: (chunkBase64: string) => void
): Promise<{ base64Pcm: string; audioUrl: string } | null> {
  try {
    const speechSlice = cleanSpeechText(text);
    if (!speechSlice) return null;

    const cacheKey = `${voiceName}::${speechSlice}`;
    if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey)!;
      if (onChunk && cached.base64Pcm) {
        onChunk(cached.base64Pcm);
      }
      return cached;
    }

    if (inFlightTts.has(cacheKey)) {
      return await inFlightTts.get(cacheKey)!;
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('[Netlify TTS] No Gemini API key found in environment');
      return null;
    }

    const generatePromise = (async () => {
      // Method 1: Live Bidirectional Gemini Live API (models/gemini-3.1-flash-live-preview)
      // Authentic human Aoede voice, warm Indian hospitality cadence, zero daily request quota limits
      try {
        const liveResult = await streamLivePcmViaWs(apiKey, speechSlice, voiceName || 'Aoede', onChunk);
        if (liveResult && liveResult.base64Pcm && liveResult.base64Pcm.length > 500) {
          if (ttsAudioCache.size > 500) {
            const firstKey = ttsAudioCache.keys().next().value;
            if (firstKey) ttsAudioCache.delete(firstKey);
          }
          ttsAudioCache.set(cacheKey, liveResult);
          return liveResult;
        }
      } catch (wsErr: any) {
        console.info('[Live Audio WS Notice]:', String(wsErr?.message || wsErr).slice(0, 100));
      }

      // Method 2: Gemini TTS fallback
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });
        const ttsModels = ['gemini-3.8-flash-tts', 'gemini-3.8-flash-lite-tts'];
        let base64Pcm: string | null = null;
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
              setTimeout(() => resolve(null), 15000)
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

        if (base64Pcm) {
          if (onChunk) onChunk(base64Pcm);
          let audioUrl: string;
          if (base64Pcm.startsWith('UklGR')) {
            audioUrl = `data:audio/wav;base64,${base64Pcm}`;
          } else {
            const pcmBuffer = Buffer.from(base64Pcm, 'base64');
            const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1, 16);
            audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
          }
          const audioData = { base64Pcm, audioUrl };
          ttsAudioCache.set(cacheKey, audioData);
          return audioData;
        }
      } catch (_) {}

      return null;
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

export const handler = async (event: any, context?: any) => {
  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // GET Health / Informational status
  if (event.httpMethod === 'GET') {
    const hasKey = Boolean(getGeminiApiKey());
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'ok',
        endpoint: '/api/assistant/tts',
        voice: 'Aoede',
        apiKeyConfigured: hasKey,
        supportedMethods: ['POST'],
      }),
    };
  }

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Method Not Allowed' }),
    };
  }

  try {
    let body: any = {};
    if (event.body) {
      try {
        body = typeof event.body === 'string' ? JSON.parse(event.body) : event.body;
      } catch {
        body = {};
      }
    }

    const { text, voice } = body || {};
    if (!text || typeof text !== 'string' || !text.trim()) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Text is required for TTS' }),
      };
    }

    const apiKey = getGeminiApiKey();
    if (!apiKey) {
      console.warn('[Netlify TTS] GEMINI_API_KEY environment variable is not configured');
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: 'GEMINI_API_KEY is not configured on Netlify. Please set GEMINI_API_KEY in Netlify Site Settings > Environment Variables.',
          base64Pcm: null,
          audioUrl: null,
        }),
      };
    }

    const audioData = await generateVoiceAudio(text, voice || 'Aoede');
    if (!audioData || !audioData.base64Pcm) {
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          rateLimited: true,
          error: 'Voice audio generation is currently busy. Tap Listen to try again.',
          base64Pcm: null,
          audioUrl: null,
        }),
      };
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        audioUrl: audioData.audioUrl,
        base64Pcm: audioData.base64Pcm,
      }),
    };
  } catch (err: any) {
    console.error('[Netlify TTS Handler Error]:', err);
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        rateLimited: true,
        error: 'Voice generation encountered a temporary notice. Tap Listen to try again.',
        base64Pcm: null,
        audioUrl: null,
      }),
    };
  }
};

// Default export compatible with both Netlify Functions v1 and v2 runtimes (with streaming support)
export default async function (req: any, context?: any) {
  if (req && typeof req.json === 'function' && typeof req.headers?.get === 'function') {
    if (req.method === 'OPTIONS') {
      return new Response('', { headers: CORS_HEADERS, status: 200 });
    }
    if (req.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'ok',
          endpoint: '/api/assistant/tts',
          voice: 'Aoede',
          apiKeyConfigured: Boolean(getGeminiApiKey()),
        }),
        { headers: CORS_HEADERS, status: 200 }
      );
    }

    const isVoiceStream =
      req.url?.includes('voice-stream') ||
      req.headers.get('accept')?.includes('text/event-stream');

    if (isVoiceStream) {
      try {
        const body = await req.json().catch(() => ({}));
        const { text, voice } = body || {};
        const encoder = new TextEncoder();

        const stream = new ReadableStream({
          async start(controller) {
            try {
              const audioData = await generateVoiceAudio(text, voice || 'Aoede', (chunkBase64) => {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ pcmChunk: chunkBase64 })}\n\n`));
              });
              if (audioData?.base64Pcm) {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ done: true, fullPcm: audioData.base64Pcm, audioUrl: audioData.audioUrl })}\n\n`)
                );
              } else {
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'Failed', done: true })}\n\n`));
              }
            } catch (e: any) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: e?.message, done: true })}\n\n`));
            } finally {
              controller.close();
            }
          }
        });

        return new Response(stream, {
          headers: {
            'Content-Type': 'text/event-stream; charset=utf-8',
            'Cache-Control': 'no-cache, no-transform',
            'Access-Control-Allow-Origin': '*',
          },
          status: 200,
        });
      } catch (e: any) {
        return new Response(JSON.stringify({ success: false, error: e?.message }), {
          headers: CORS_HEADERS,
          status: 200,
        });
      }
    }

    try {
      const body = await req.json().catch(() => ({}));
      const res = await handler({ httpMethod: req.method, body }, context);
      return new Response(res.body, { headers: res.headers as any, status: res.statusCode });
    } catch (e: any) {
      return new Response(JSON.stringify({ success: false, error: e?.message }), {
        headers: CORS_HEADERS,
        status: 200,
      });
    }
  }
  return handler(req, context);
}
