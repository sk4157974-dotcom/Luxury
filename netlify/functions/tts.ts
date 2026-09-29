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

/**
 * Real-time bidirectional Gemini Live conversational voice generation with streaming chunk support.
 * Uses models/gemini-3.1-flash-live-preview with Aoede voice (The exact natural human voice)
 * Accurately accumulates ALL chunks until turnComplete before finalizing the complete audio.
 */
async function streamLivePcmViaWs(
  apiKey: string,
  spokenText: string,
  voiceName: string = 'Aoede',
  timeoutMs: number = 22000
): Promise<{ base64Pcm: string; audioUrl: string } | null> {
  return new Promise((resolve) => {
    let completed = false;
    let ws: WebSocket | null = null;
    let idleTimer: NodeJS.Timeout | null = null;
    let maxTimer: NodeJS.Timeout | null = null;

    const finish = (result: { base64Pcm: string; audioUrl: string } | null) => {
      if (!completed) {
        completed = true;
        if (idleTimer) clearTimeout(idleTimer);
        if (maxTimer) clearTimeout(maxTimer);
        if (ws) {
          try {
            ws.removeAllListeners();
            ws.terminate();
          } catch (_) {}
          ws = null;
        }
        resolve(result);
      }
    };

    try {
      const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${apiKey}`;
      ws = new WebSocket(url, { handshakeTimeout: 5000 });
      const pcmBuffers: Buffer[] = [];

      maxTimer = setTimeout(() => {
        if (pcmBuffers.length > 0) {
          const combined = Buffer.concat(pcmBuffers);
          const base64Pcm = combined.toString('base64');
          const wavBuffer = pcmToWavBuffer(combined, 24000, 1, 16);
          const audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
          finish({ base64Pcm, audioUrl });
        } else {
          finish(null);
        }
      }, timeoutMs);

      const resetIdleTimer = () => {
        if (idleTimer) clearTimeout(idleTimer);
        // Only trigger finish if idle for 3.5s after receiving speech chunks
        idleTimer = setTimeout(() => {
          if (pcmBuffers.length > 0) {
            const combined = Buffer.concat(pcmBuffers);
            const base64Pcm = combined.toString('base64');
            const wavBuffer = pcmToWavBuffer(combined, 24000, 1, 16);
            const audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
            finish({ base64Pcm, audioUrl });
          } else {
            finish(null);
          }
        }, 3500);
      };

      ws.on('open', () => {
        ws?.send(
          JSON.stringify({
            setup: {
              model: 'models/gemini-3.1-flash-live-preview',
              generationConfig: {
                responseModalities: ['AUDIO'],
                speechConfig: {
                  voiceConfig: {
                    prebuiltVoiceConfig: { voiceName: voiceName || 'Aoede' },
                  },
                },
              },
              systemInstruction: {
                parts: [
                  {
                    text: 'You are the voice of Luxury Hotel official AI Concierge. Speak clearly, warmly, and naturally with respectful Indian hospitality voice. Read aloud the exact provided text in Hindi and English. Do not add commentary.',
                  },
                ],
              },
            },
          })
        );
      });

      ws.on('message', (raw) => {
        try {
          const msg = JSON.parse(raw.toString());
          if (msg.setupComplete) {
            ws?.send(
              JSON.stringify({
                clientContent: {
                  turns: [{ role: 'user', parts: [{ text: 'Read aloud: ' + spokenText }] }],
                  turnComplete: true,
                },
              })
            );
            resetIdleTimer();
          }

          if (msg.serverContent?.modelTurn?.parts) {
            for (const part of msg.serverContent.modelTurn.parts) {
              if (part.inlineData?.data) {
                try {
                  const chunkBuf = Buffer.from(part.inlineData.data, 'base64');
                  if (chunkBuf.length > 0) {
                    pcmBuffers.push(chunkBuf);
                    resetIdleTimer();
                  }
                } catch (_) {}
              }
            }
          }

          // Complete turn received from model
          if (msg.serverContent?.turnComplete) {
            if (pcmBuffers.length > 0) {
              const combined = Buffer.concat(pcmBuffers);
              const base64Pcm = combined.toString('base64');
              const wavBuffer = pcmToWavBuffer(combined, 24000, 1, 16);
              const audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
              finish({ base64Pcm, audioUrl });
            } else {
              finish(null);
            }
          }
        } catch (_) {}
      });

      ws.on('error', () => {
        if (pcmBuffers.length > 0) {
          const combined = Buffer.concat(pcmBuffers);
          const base64Pcm = combined.toString('base64');
          const wavBuffer = pcmToWavBuffer(combined, 24000, 1, 16);
          const audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
          finish({ base64Pcm, audioUrl });
        } else {
          finish(null);
        }
      });

      ws.on('close', () => {
        if (pcmBuffers.length > 0) {
          const combined = Buffer.concat(pcmBuffers);
          const base64Pcm = combined.toString('base64');
          const wavBuffer = pcmToWavBuffer(combined, 24000, 1, 16);
          const audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
          finish({ base64Pcm, audioUrl });
        } else {
          finish(null);
        }
      });
    } catch (_) {
      finish(null);
    }
  });
}

/**
 * Serverless voice generation optimized for Netlify Production.
 * Uses genuine models/gemini-3.1-flash-live-preview with Aoede voice (matching Preview).
 */
async function generateVoiceAudio(
  text: string,
  voiceName: string = 'Aoede'
): Promise<{ base64Pcm: string; audioUrl: string } | null> {
  const speechSlice = cleanSpeechText(text);
  if (!speechSlice) return null;

  const cacheKey = `${voiceName}::${speechSlice}`;
  if (ttsAudioCache.has(cacheKey)) {
    return ttsAudioCache.get(cacheKey)!;
  }

  if (inFlightTts.has(cacheKey)) {
    return await inFlightTts.get(cacheKey)!;
  }

  const apiKey = getGeminiApiKey();
  if (!apiKey) {
    return null;
  }

  const generatePromise = (async () => {
    // Generate complete audio via Live API with Aoede voice
    const liveResult = await streamLivePcmViaWs(apiKey, speechSlice, voiceName || 'Aoede', 22000);
    if (liveResult && liveResult.base64Pcm && liveResult.base64Pcm.length > 500) {
      if (ttsAudioCache.size > 500) {
        const firstKey = ttsAudioCache.keys().next().value;
        if (firstKey) ttsAudioCache.delete(firstKey);
      }
      ttsAudioCache.set(cacheKey, liveResult);
      return liveResult;
    }

    return null;
  })();

  inFlightTts.set(cacheKey, generatePromise);
  try {
    return await generatePromise;
  } finally {
    inFlightTts.delete(cacheKey);
  }
}

export const handler = async (event: any, context?: any) => {
  // CRITICAL: Prevent AWS Lambda from waiting for background sockets or event loop
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  // Handle CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
    };
  }

  // Informational GET check
  if (event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        status: 'ok',
        endpoint: '/api/assistant/tts',
        voice: 'Aoede',
        apiKeyConfigured: Boolean(getGeminiApiKey()),
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
      return {
        statusCode: 200,
        headers: CORS_HEADERS,
        body: JSON.stringify({
          success: false,
          error: 'GEMINI_API_KEY environment variable is not configured.',
          base64Pcm: null,
          audioUrl: null,
        }),
      };
    }

    // 24s safety timeout for Netlify function limit (26s)
    const timeoutPromise = new Promise<null>((resolve) => setTimeout(() => resolve(null), 24000));
    const audioData = await Promise.race([generateVoiceAudio(text, voice || 'Aoede'), timeoutPromise]);

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

// Default export supporting Fetch API / Netlify Functions v2 runtime
export default async function (req: any, context?: any) {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  if (req && typeof req.json === 'function' && typeof req.headers?.get === 'function') {
    if (req.method === 'OPTIONS') {
      return new Response('', { headers: CORS_HEADERS, status: 200 });
    }
    try {
      const body = await req.json().catch(() => ({}));
      const res = await handler({ httpMethod: req.method, body }, context);
      return new Response(res.body, { headers: res.headers as any, status: res.statusCode });
    } catch (e: any) {
      return new Response(
        JSON.stringify({ success: false, error: e?.message }),
        { headers: CORS_HEADERS, status: 200 }
      );
    }
  }

  return handler(req, context);
}
