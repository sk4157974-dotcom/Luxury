// Pure Web Audio API Engine for Gemini 24kHz Linear PCM (Aoede Voice)
// Aligned with the Lux reference architecture: genuine Gemini PCM audio only, no robotic fallbacks.

let sharedAudioCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentStreamPlayer: StreamAudioPlayer | null = null;
let isSpeakingActive = false;

/**
 * Get or initialize the persistent singleton AudioContext.
 * Prevents exhausting browser AudioContext instances on mobile/Android.
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedAudioCtx || sharedAudioCtx.state === 'closed') {
    try {
      sharedAudioCtx = new AudioContextClass({ sampleRate: 24000 });
    } catch (_) {
      try {
        sharedAudioCtx = new AudioContextClass();
      } catch (_) {
        sharedAudioCtx = null;
      }
    }
  }
  return sharedAudioCtx;
}

/**
 * Pre-warm and unlock the Web Audio API AudioContext on user interaction gesture.
 * Plays a 1-sample silent buffer to permanently activate audio on iOS Safari and Android Chrome.
 */
export function unlockAudio(): void {
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      try {
        const silentBuffer = ctx.createBuffer(1, 1, 24000);
        const source = ctx.createBufferSource();
        source.buffer = silentBuffer;
        source.connect(ctx.destination);
        source.start(0);
      } catch (_) {}
    }
  } catch (_) {}
}

/**
 * Stops all currently active PCM audio playback cleanly without closing the AudioContext.
 */
export function stopAllAudio(): void {
  isSpeakingActive = false;
  if (currentStreamPlayer) {
    try {
      currentStreamPlayer.stop();
    } catch (_) {}
    currentStreamPlayer = null;
  }
  try {
    if (currentSource) {
      try {
        currentSource.stop();
      } catch (_) {}
      try {
        currentSource.disconnect();
      } catch (_) {}
      currentSource = null;
    }
  } catch (_) {}
}

export function isAudioPlaying(): boolean {
  return isSpeakingActive && currentSource !== null;
}

/**
 * Direct 24kHz Linear 16-bit PCM & WAV Audio Player using the Web Audio API.
 * High-fidelity playback for Gemini Studio audio (Aoede voice).
 * Accurately decodes Base64 -> WAV/PCM -> AudioBuffer with proper error handling.
 */
export async function playPCM(base64Data: string, onEnded?: () => void): Promise<void> {
  // Stop previous playback to prevent overlapping / duplicate audio
  stopAllAudio();

  if (!base64Data || typeof base64Data !== 'string' || base64Data.trim().length === 0) {
    console.log('[DEBUG] AUDIO_DECODE_ERROR:', { error: 'Audio payload is empty or invalid' });
    throw new Error('Audio payload is empty or invalid');
  }

  if (typeof window === 'undefined') {
    if (onEnded) onEnded();
    return;
  }

  const audioCtx = getAudioContext();
  if (!audioCtx) {
    console.log('[DEBUG] AUDIO_DECODE_ERROR:', { error: 'Web Audio API is not supported in this browser' });
    throw new Error('Web Audio API is not supported in this browser');
  }

  console.log('[DEBUG] AUDIO_CONTEXT_STATE:', { state: audioCtx.state, context: 'playPCM_start' });

  // Browser gesture resumption: ensure AudioContext is not suspended
  if (audioCtx.state === 'suspended') {
    try {
      await audioCtx.resume();
      console.log('[DEBUG] AUDIO_CONTEXT_STATE:', { state: audioCtx.state, context: 'after_resume' });
    } catch (resumeErr: any) {
      console.log('[DEBUG] AUDIO_DECODE_ERROR:', { error: 'AudioContext resume failed: ' + resumeErr?.message });
    }
  }

  isSpeakingActive = true;

  // Base64 cleaning: strip any data URL prefix, whitespace, URL-safe characters, or misplaced padding
  let cleanB64 = (base64Data || '').trim();
  const commaIdx = cleanB64.indexOf(',');
  if (commaIdx !== -1 && cleanB64.slice(0, commaIdx).includes('base64')) {
    cleanB64 = cleanB64.slice(commaIdx + 1);
  }
  cleanB64 = cleanB64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');

  let binaryString: string;
  try {
    binaryString = atob(cleanB64);
  } catch (decodeErr: any) {
    // If there was internal '=' padding from chunk concatenation, strip and re-pad
    try {
      const stripped = cleanB64.replace(/=/g, '');
      const padded = stripped + '='.repeat((4 - (stripped.length % 4)) % 4);
      binaryString = atob(padded);
    } catch (retryErr: any) {
      isSpeakingActive = false;
      console.log('[DEBUG] AUDIO_DECODE_ERROR:', { error: 'Malformed base64: ' + (retryErr?.message || decodeErr?.message) });
      throw new Error('Malformed base64 audio data');
    }
  }

  const len = binaryString.length;
  if (len === 0) {
    isSpeakingActive = false;
    console.log('[DEBUG] AUDIO_DECODE_ERROR:', { error: 'Decoded audio stream has zero bytes' });
    throw new Error('Decoded audio stream has zero bytes');
  }

  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // Check if standard WAV container (starts with 'RIFF' ... 'WAVE')
  const isWav = len >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x41 && bytes[10] === 0x56 && bytes[11] === 0x45;

  let audioBuffer: AudioBuffer;

  if (isWav) {
    try {
      const arrayBufferCopy = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      audioBuffer = await audioCtx.decodeAudioData(arrayBufferCopy);
    } catch (_) {
      // Fallback: strip standard 44-byte WAV header and decode PCM samples
      const pcmOffset = 44;
      const sampleCount = Math.max(0, Math.floor((bytes.byteLength - pcmOffset) / 2));
      const dataView = new DataView(bytes.buffer, bytes.byteOffset + pcmOffset, bytes.byteLength - pcmOffset);
      audioBuffer = audioCtx.createBuffer(1, sampleCount, 24000);
      const channelData = audioBuffer.getChannelData(0);
      for (let i = 0; i < sampleCount; i++) {
        channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
      }
    }
  } else {
    // Pure raw 16-bit PCM little-endian
    const sampleCount = Math.floor(bytes.byteLength / 2);
    if (sampleCount === 0) {
      isSpeakingActive = false;
      throw new Error('PCM sample count is 0');
    }
    const dataView = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
    audioBuffer = audioCtx.createBuffer(1, sampleCount, 24000);
    const channelData = audioBuffer.getChannelData(0);
    for (let i = 0; i < sampleCount; i++) {
      channelData[i] = dataView.getInt16(i * 2, true) / 32768.0;
    }
  }

  const source = audioCtx.createBufferSource();
  currentSource = source;
  source.buffer = audioBuffer;
  source.connect(audioCtx.destination);

  console.log('[DEBUG] AUDIO_PLAYBACK_STARTED:', {
    durationSeconds: Number(audioBuffer.duration.toFixed(2))
  });

  source.start(0);

  return new Promise<void>((resolve) => {
    source.onended = () => {
      console.log('[DEBUG] AUDIO_PLAYBACK_ENDED');
      if (currentSource === source) {
        currentSource = null;
      }
      isSpeakingActive = false;
      if (onEnded) onEnded();
      resolve();
    };
  });
}

/**
 * Clean spoken text: converts currency symbols to words, removes Markdown, cleans emojis.
 */
export function cleanSpeechText(text: string): string {
  if (!text) return '';
  return text
    .replace(/₹\s?(\d+)/g, ' $1 rupaye ')
    .replace(/Rs\.?\s?(\d+)/gi, ' $1 rupaye ')
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{1F600}-\u{1F64F}\u{1F680}-\u{1F6FF}\u{1F900}-\u{1F9FF}\u{1FA70}-\u{1FAFF}]/gu, ' ')
    .replace(/[*#_~`•]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Decodes a base64 16-bit PCM chunk into Float32Array audio samples.
 */
export function base64ToFloat32Array(base64: string): Float32Array {
  if (!base64) return new Float32Array(0);
  let cleanB64 = base64.trim();
  const commaIdx = cleanB64.indexOf(',');
  if (commaIdx !== -1 && cleanB64.slice(0, commaIdx).includes('base64')) {
    cleanB64 = cleanB64.slice(commaIdx + 1);
  }
  cleanB64 = cleanB64.replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/');
  let binaryString: string;
  try {
    binaryString = atob(cleanB64);
  } catch (_) {
    try {
      const stripped = cleanB64.replace(/=/g, '');
      const padded = stripped + '='.repeat((4 - (stripped.length % 4)) % 4);
      binaryString = atob(padded);
    } catch {
      return new Float32Array(0);
    }
  }

  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const sampleCount = Math.floor(len / 2);
  const int16 = new Int16Array(bytes.buffer, bytes.byteOffset, sampleCount);
  const float32 = new Float32Array(sampleCount);
  for (let i = 0; i < sampleCount; i++) {
    float32[i] = int16[i] / 32768.0;
  }
  return float32;
}

/**
 * Real-time Streaming Audio Player for Gemini Live PCM audio chunks.
 * Plays the first audio chunk within ~700ms and schedules all subsequent
 * chunks sequentially on the AudioContext timeline without any gaps.
 */
export class StreamAudioPlayer {
  private nextPlayTime = 0;
  private activeSources: AudioBufferSourceNode[] = [];
  private isStopped = false;
  private hasStarted = false;
  private streamFinished = false;
  private chunksScheduled = 0;
  private chunksFinished = 0;
  private audioCtx: AudioContext | null = null;
  private onStart?: () => void;
  private onEnded?: () => void;
  private onError?: (err: any) => void;

  constructor(options?: {
    onStart?: () => void;
    onEnded?: () => void;
    onError?: (err: any) => void;
  }) {
    this.audioCtx = getAudioContext();
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    this.onStart = options?.onStart;
    this.onEnded = options?.onEnded;
    this.onError = options?.onError;
    currentStreamPlayer = this;
    isSpeakingActive = true;
  }

  isActive(): boolean {
    return !this.isStopped && (this.activeSources.length > 0 || !this.streamFinished);
  }

  pushChunk(base64Chunk: string) {
    if (this.isStopped || !base64Chunk || !this.audioCtx) return;
    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume().catch(() => {});
      }
      const samples = base64ToFloat32Array(base64Chunk);
      if (samples.length === 0) return;

      const buffer = this.audioCtx.createBuffer(1, samples.length, 24000);
      buffer.getChannelData(0).set(samples);

      const source = this.audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(this.audioCtx.destination);

      const startTime = Math.max(this.audioCtx.currentTime, this.nextPlayTime);
      source.start(startTime);
      this.nextPlayTime = startTime + buffer.duration;
      this.chunksScheduled++;
      this.activeSources.push(source);

      if (!this.hasStarted) {
        this.hasStarted = true;
        isSpeakingActive = true;
        this.onStart?.();
      }

      source.onended = () => {
        this.chunksFinished++;
        const idx = this.activeSources.indexOf(source);
        if (idx !== -1) {
          this.activeSources.splice(idx, 1);
        }
        if (this.streamFinished && this.chunksFinished >= this.chunksScheduled && !this.isStopped) {
          this.stop();
          this.onEnded?.();
        }
      };
    } catch (err) {
      console.warn('[StreamAudioPlayer] Error scheduling chunk:', err);
      this.onError?.(err);
    }
  }

  finishStream() {
    this.streamFinished = true;
    if (this.chunksScheduled === 0) {
      this.stop();
      this.onError?.(new Error('Empty audio stream received'));
      return;
    }
    if (this.chunksFinished >= this.chunksScheduled && !this.isStopped) {
      this.stop();
      this.onEnded?.();
    }
  }

  stop() {
    this.isStopped = true;
    isSpeakingActive = false;
    if (currentStreamPlayer === this) {
      currentStreamPlayer = null;
    }
    for (const src of this.activeSources) {
      try {
        src.stop();
        src.disconnect();
      } catch (_) {}
    }
    this.activeSources = [];
  }
}


