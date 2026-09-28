import React, { useState, useRef, useEffect } from 'react';
import { X, Send, Sparkles, MessageCircle, Bot, User, Volume2, VolumeX, Mic, MicOff, Square, Zap, Loader2, AlertCircle, RefreshCw, Calendar, Clock, Phone, CheckCircle2 } from 'lucide-react';
import { RESTAURANT_CONFIG, buildQuickWhatsAppUrl, buildReservationWhatsAppUrl } from '../config/restaurant';
import { playPCM, stopAllAudio, unlockAudio } from '../utils/audioUtils';

interface Message {
  id: string;
  sender: 'assistant' | 'user';
  text: string;
  timestamp: string;
  base64Pcm?: string | null;
  audioUrl?: string | null;
  audioError?: string | null;
  hasBookingForm?: boolean;
  bookingSubmitted?: boolean;
}

interface AssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

// Clean helper to remove asterisks (** or *), dot-dot-dots (...), and replace dollar with rupee
const cleanMessageText = (text: string): string => {
  if (!text) return '';
  return text
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/_{1,2}/g, '')
    .replace(/\.{3,}/g, '')
    .replace(/\s+\.{2,}/g, '')
    .replace(/\$/g, '₹')
    .trim();
};

// Convert number to clear spoken English words (e.g. 35 -> "thirty-five", 55 -> "fifty-five", 499 -> "four hundred ninety-nine")
const numberToEnglishWords = (num: number): string => {
  if (isNaN(num)) return '';
  const ones = [
    '', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine',
    'ten', 'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen',
    'seventeen', 'eighteen', 'nineteen'
  ];
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];

  if (num === 0) return 'zero';
  if (num < 20) return ones[num];
  if (num < 100) {
    const rem = num % 10;
    return tens[Math.floor(num / 10)] + (rem !== 0 ? '-' + ones[rem] : '');
  }
  if (num < 1000) {
    const rem = num % 100;
    return ones[Math.floor(num / 100)] + ' hundred' + (rem !== 0 ? ' ' + numberToEnglishWords(rem) : '');
  }
  if (num < 100000) {
    const rem = num % 1000;
    return numberToEnglishWords(Math.floor(num / 1000)) + ' thousand' + (rem !== 0 ? ' ' + numberToEnglishWords(rem) : '');
  }
  return String(num);
};

// Clean text specifically for natural, human-like Indian speech synthesis
// Converts currency to natural Indian "rupaye", adds polite soft pauses, and strips robotic numbering
const prepareSpeechText = (text: string): string => {
  if (!text) return '';

  let cleaned = cleanMessageText(text);

  // 1. Remove markdown hashes, links, stars, and bullet markers
  cleaned = cleaned
    .replace(/#{1,6}\s+/g, '')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .replace(/★+/g, '')
    .replace(/\(?\d+\s*★\s*(rating)?\)?/gi, '')
    .replace(/\(?\d+\s*\/\s*5\s*(star|rating)?\)?/gi, '');

  // 2. Remove robotic numbering at start of lines or bullet points (e.g. "1. ", "2. ", "1) ", "• ")
  cleaned = cleaned
    .replace(/^(\d+)[\.\)\:\-]\s+/gm, '')
    .replace(/\n(\d+)[\.\)\:\-]\s+/g, '\n')
    .replace(/\s+(\d+)[\.\)\:\-]\s+/g, ', ')
    .replace(/^[\-\•\*\–]\s+/gm, '')
    .replace(/\n[\-\•\*\–]\s+/g, ', ');

  // 3. Hospitality phrasing & currency:
  // Format with respectful greeting ("Hello ji, ") and natural Indian "rupaye"
  cleaned = cleaned
    .replace(/\bNamaste\s*ji\s*ji\b/gi, 'Hello ji, ')
    .replace(/\bNamaste\s*ji\b/gi, 'Hello ji, ')
    .replace(/\bNamaste\b/gi, 'Hello, ')
    .replace(/\bji\s+ji\b/gi, 'ji')
    .replace(/\bHello\s+Hello\b/gi, 'Hello')
    .replace(/(?:₹|Rs\.?|INR|\$)\s*(\d+)(?:\.00|\.0)?(?!\d)/gi, ' $1 rupaye, ')
    .replace(/(?:₹|Rs\.?|INR|\$)\s*(\d+)/gi, ' $1 rupaye, ')
    .replace(/\b(\d+)\s*(?:rupees|rupee|rs\.?|\/-)\b/gi, ' $1 rupaye, ')
    .replace(/(\d+)\s*(?:रुपये|रुपए|रु\.)/gi, ' $1 rupaye, ');

  cleaned = cleaned
    .replace(/Rate:\s*/gi, 'Rate, ')
    .replace(/Price:\s*/gi, 'Price, ')
    .replace(/:\s*/g, ', ');

  // 4. Soft pauses and clean spaces for unhurried Indian conversational rhythm
  cleaned = cleaned
    .replace(/\.{2,}/g, '.')
    .replace(/,{2,}/g, ',')
    .replace(/\s*,\s*/g, ', ')
    .replace(/\s*\.\s*/g, '. ')
    .replace(/\n+/g, '. ')
    .replace(/[^\w\s\u0900-\u097F.,!?'"-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Ensure Indian English phonetic cadence:
  // Starting with "Hello ji, " anchors the Aoede voice in the authentic Indian cadence
  if (/^(?:hello|hi|welcome)\b/i.test(cleaned) && !/^(?:hello\s+ji|namaste\s+ji)/i.test(cleaned)) {
    cleaned = cleaned.replace(/^(?:hello|hi|welcome)\b[,\s!]*/i, 'Hello ji, ');
  }

  // 5. Complete, natural length for rich spoken responses: up to 2200 characters so full 5-6 lines are spoken completely
  if (cleaned.length > 2200) {
    const sub = cleaned.slice(0, 2200);
    const lastPunct = Math.max(sub.lastIndexOf('.'), sub.lastIndexOf('!'), sub.lastIndexOf('?'));
    if (lastPunct > 1600) {
      cleaned = sub.slice(0, lastPunct + 1).trim();
    } else {
      cleaned = sub.trim();
    }
  }

  return cleaned;
};

interface SafeFetchResult<T> {
  ok: boolean;
  status: number;
  data: T | null;
  error?: string;
}

/**
 * Safely fetches and parses JSON responses from API endpoints.
 * Explicitly validates content-type and handles HTML/SPA fallbacks gracefully,
 * logging full diagnostic details instead of throwing "Unexpected token '<', "<!doctype "... is not valid JSON".
 */
async function safeFetchJson<T = any>(
  url: string,
  options?: RequestInit & { timeoutMs?: number }
): Promise<SafeFetchResult<T>> {
  const timeoutMs = options?.timeoutMs || 20000;
  const timeoutController = new AbortController();
  const timer = setTimeout(() => {
    timeoutController.abort();
  }, timeoutMs);

  if (options?.signal) {
    if (options.signal.aborted) {
      timeoutController.abort();
    } else {
      options.signal.addEventListener('abort', () => timeoutController.abort(), { once: true });
    }
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      signal: timeoutController.signal,
    });
  } catch (networkErr: any) {
    clearTimeout(timer);
    const wasAborted = networkErr?.name === 'AbortError' || timeoutController.signal.aborted || options?.signal?.aborted;
    if (wasAborted) {
      console.info(`[API Request Aborted/Timeout] ${options?.method || 'GET'} ${url}`);
      return {
        ok: false,
        status: 408,
        data: null,
        error: 'Request timed out. Local concierge response activated.'
      };
    }
    console.info(`[API Network Notice] ${options?.method || 'GET'} ${url}:`, networkErr?.message || networkErr);
    return {
      ok: false,
      status: 0,
      data: null,
      error: networkErr?.message || 'Network request failed'
    };
  } finally {
    clearTimeout(timer);
  }

  const contentType = response.headers.get('content-type') || '';
  let rawText = '';
  try {
    rawText = await response.text();
  } catch (readErr: any) {
    console.info(`[API Read Notice] ${options?.method || 'GET'} ${url}:`, readErr);
    return {
      ok: false,
      status: response.status,
      data: null,
      error: `Could not read response body: ${readErr?.message || 'Read error'}`
    };
  }

  const trimmedText = rawText.trim();
  const isHtml =
    trimmedText.toLowerCase().startsWith('<!doctype') ||
    trimmedText.toLowerCase().startsWith('<html') ||
    contentType.includes('text/html');

  // Try parsing JSON first if not obvious HTML
  if (!isHtml) {
    try {
      const parsedData = JSON.parse(rawText) as T;
      return {
        ok: response.ok,
        status: response.status,
        data: parsedData,
        error: !response.ok
          ? (parsedData as any)?.error || `Server error (HTTP ${response.status})`
          : undefined
      };
    } catch {
      // If parsing fails, inspect format below
    }
  }

  if (
    isHtml ||
    (!contentType.includes('application/json') &&
      !(trimmedText.startsWith('{') && trimmedText.endsWith('}')) &&
      !(trimmedText.startsWith('[') && trimmedText.endsWith(']')))
  ) {
    const previewSnippet = rawText.slice(0, 180).replace(/\s+/g, ' ');
    console.info(`[API Non-JSON Notice]`, {
      requestUrl: url,
      httpStatus: response.status,
      responseContentType: contentType,
      responsePreview: previewSnippet
    });

    return {
      ok: false,
      status: response.status,
      data: null,
      error: `Service temporarily busy (status ${response.status}). Switching to local assistant.`
    };
  }

  try {
    const parsedData = JSON.parse(rawText) as T;
    return {
      ok: response.ok,
      status: response.status,
      data: parsedData,
      error: !response.ok
        ? (parsedData as any)?.error || `Server error (HTTP ${response.status})`
        : undefined
    };
  } catch (parseErr: any) {
    const previewSnippet = rawText.slice(0, 180).replace(/\s+/g, ' ');
    console.info(`[API Malformed JSON Notice]`, {
      requestUrl: url,
      httpStatus: response.status,
      responseContentType: contentType,
      parseError: parseErr?.message,
      responsePreview: previewSnippet
    });
    return {
      ok: false,
      status: response.status,
      data: null,
      error: `Invalid JSON received from ${url} (HTTP ${response.status}): ${parseErr?.message}`
    };
  }
}

interface ChatBookingFormProps {
  messageId: string;
  isSubmitted?: boolean;
  onSubmit: (details: {
    name: string;
    phone: string;
    date: string;
    time: string;
    guests: number;
    specialRequest: string;
  }) => void;
}

const ChatBookingForm: React.FC<ChatBookingFormProps> = ({ isSubmitted, onSubmit }) => {
  const [bName, setBName] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bDate, setBDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [bTime, setBTime] = useState('07:30 PM');
  const [bGuests, setBGuests] = useState(2);
  const [bSpecial, setBSpecial] = useState('');
  const [formErr, setFormErr] = useState('');

  const timeOptions = [
    '12:30 PM', '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '07:00 PM', '07:30 PM', '08:00 PM', '08:30 PM', '09:00 PM', '09:30 PM'
  ];

  const guestOptions = [1, 2, 3, 4, 5, 6, 8, 10];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName.trim()) {
      setFormErr('Kripya apna Full Name enter karein.');
      return;
    }
    if (!bPhone.trim()) {
      setFormErr('Kripya apna Number enter karein.');
      return;
    }
    setFormErr('');
    onSubmit({
      name: bName.trim(),
      phone: bPhone.trim(),
      date: bDate,
      time: bTime,
      guests: bGuests,
      specialRequest: bSpecial.trim()
    });
  };

  if (isSubmitted) {
    return (
      <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs flex items-center space-x-2 shadow-xs">
        <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
        <span className="font-semibold">WhatsApp reservation dispatched! Table confirmation in progress.</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 p-3.5 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] space-y-3 text-[#1F1A17] shadow-xs">
      <div className="flex items-center space-x-1.5 pb-1.5 border-b border-[#E8DEC8]">
        <Calendar className="w-3.5 h-3.5 text-[#C48B46]" />
        <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5D19]">
          Book a Table Reservation
        </span>
      </div>

      {formErr && (
        <p className="text-[10.5px] text-rose-600 font-medium bg-rose-50 px-2 py-1 rounded border border-rose-200">
          {formErr}
        </p>
      )}

      {/* Name Input */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-[#8C5D19] mb-1">
          Full Name *
        </label>
        <div className="relative">
          <User className="w-3.5 h-3.5 text-[#C48B46] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            required
            placeholder="Full Name"
            value={bName}
            onChange={(e) => setBName(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E8DEC8] text-xs text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:border-[#C48B46] transition-colors"
          />
        </div>
      </div>

      {/* Phone Number Input */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-[#8C5D19] mb-1">
          Phone / WhatsApp Number *
        </label>
        <div className="relative">
          <Phone className="w-3.5 h-3.5 text-[#C48B46] absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="tel"
            required
            placeholder="Number"
            value={bPhone}
            onChange={(e) => setBPhone(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#E8DEC8] text-xs text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:border-[#C48B46] transition-colors"
          />
        </div>
      </div>

      {/* Date & Time Row */}
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8C5D19] mb-1">
            Date
          </label>
          <input
            type="date"
            required
            value={bDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => setBDate(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#E8DEC8] text-xs text-[#1F1A17] focus:outline-none focus:border-[#C48B46]"
          />
        </div>
        <div>
          <label className="block text-[10px] uppercase font-bold text-[#8C5D19] mb-1">
            Time
          </label>
          <select
            value={bTime}
            onChange={(e) => setBTime(e.target.value)}
            className="w-full px-2 py-1.5 rounded-lg bg-white border border-[#E8DEC8] text-xs text-[#1F1A17] focus:outline-none focus:border-[#C48B46]"
          >
            {timeOptions.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Guests Selector */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-[#8C5D19] mb-1">
          Guests: {bGuests} {bGuests === 1 ? 'Guest' : 'Guests'}
        </label>
        <div className="flex flex-wrap gap-1">
          {guestOptions.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setBGuests(g)}
              className={`px-2 py-0.5 rounded text-[10.5px] font-semibold transition-all cursor-pointer ${
                bGuests === g
                  ? 'bg-[#C48B46] text-white shadow-2xs'
                  : 'bg-white text-[#685D56] border border-[#E8DEC8] hover:border-[#C48B46]'
              }`}
            >
              {g}
            </button>
          ))}
        </div>
      </div>

      {/* Special Request */}
      <div>
        <label className="block text-[10px] uppercase font-bold text-[#8C5D19] mb-1">
          Special Request (Optional)
        </label>
        <input
          type="text"
          placeholder="e.g. Window booth, anniversary celebration"
          value={bSpecial}
          onChange={(e) => setBSpecial(e.target.value)}
          className="w-full px-2.5 py-1.5 rounded-lg bg-white border border-[#E8DEC8] text-xs text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:border-[#C48B46]"
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] hover:from-[#1ebd56] hover:to-[#0f7a6e] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-md cursor-pointer transition-all active:scale-[0.98]"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        <span>Book Table via WhatsApp</span>
      </button>
    </form>
  );
};

export const AssistantModal: React.FC<AssistantModalProps> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: 'Hello! Welcome to Luxury Hotel 🏨👑✨ Main Luxury Hotel ka official 24/7 AI Concierge Assistant hoon. Mera kaam yahan aapki har tarah se poori madad aur dil se seva karna hai! Aap hamare royal signature dishes 🍝, exact rates 💰, table reservation 🛎️, timings ⏰ ya direct WhatsApp order ke bare mein kuch bhi pooch sakte hain. Kahiye, main aapki kya seva karoon? 😊🙏',
      timestamp: 'Just now'
    }
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto Voice state - toggleable option
  const [autoVoice, setAutoVoice] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('luxury_hotel_auto_voice');
      return saved !== null ? saved === 'true' : true;
    } catch {
      return true;
    }
  });

  const [speakingMessageId, setSpeakingMessageId] = useState<string | null>(null);
  const [audioLoadingId, setAudioLoadingId] = useState<string | null>(null);
  const [audioErrorMessage, setAudioErrorMessage] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ttsAbortControllerRef = useRef<AbortController | null>(null);

  // Toggle Auto Voice & persist
  const handleToggleAutoVoice = () => {
    const next = !autoVoice;
    setAutoVoice(next);
    try {
      localStorage.setItem('luxury_hotel_auto_voice', String(next));
    } catch {
      // ignore
    }
    if (!next) {
      stopSpeaking();
    }
  };

  const stopSpeaking = () => {
    // 1. Abort pending TTS fetch if any
    if (ttsAbortControllerRef.current) {
      ttsAbortControllerRef.current.abort();
      ttsAbortControllerRef.current = null;
    }
    // 2. Stop PCM audio & Web Audio API AudioContext
    stopAllAudio();
    // 3. Stop HTML5 audio fallback if playing
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    setSpeakingMessageId(null);
    setAudioLoadingId(null);
  };

  // Direct PCM & WAV Audio Player using Web Audio API (Aoede voice)
  const playAudio = async (base64Pcm?: string | null, audioUrl?: string | null, messageId?: string) => {
    stopSpeaking();

    // Primary: Web Audio API direct PCM/WAV playback
    if (base64Pcm && base64Pcm.trim().length > 0) {
      setSpeakingMessageId(messageId || 'active');
      try {
        await playPCM(base64Pcm, () => {
          setSpeakingMessageId(null);
        });
        return;
      } catch (err: any) {
        console.error('Web Audio API playback error, trying HTML5 audio fallback:', err);
        if (audioUrl) {
          try {
            const audio = new Audio(audioUrl);
            audioRef.current = audio;
            audio.onended = () => {
              setSpeakingMessageId(null);
              audioRef.current = null;
            };
            audio.onerror = () => {
              setSpeakingMessageId(null);
              audioRef.current = null;
            };
            await audio.play();
            return;
          } catch (_) {}
        }
        setSpeakingMessageId(null);
      }
      return;
    }

    // Secondary fallback: HTML5 Audio if wav URL provided
    if (audioUrl) {
      setSpeakingMessageId(messageId || 'active');
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.onended = () => {
        setSpeakingMessageId(null);
        audioRef.current = null;
      };
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setSpeakingMessageId(null);
        audioRef.current = null;
      };
      try {
        await audio.play();
      } catch (err) {
        console.error('Audio play error:', err);
        setSpeakingMessageId(null);
        audioRef.current = null;
      }
      return;
    }

    setSpeakingMessageId(null);
  };

  // Main Gemini Studio Voice Text-To-Speech function:
  // Plays pure genuine Gemini Aoede Studio voice via Web Audio API.
  // Never uses robotic browser synthesizers or American robotic voices.
  const speakText = async (text: string, messageId?: string, cachedPcm?: string | null) => {
    const activeId = messageId || 'active';

    // If user clicks Stop on the currently playing message
    if (messageId && speakingMessageId === messageId) {
      stopSpeaking();
      return;
    }

    stopSpeaking();
    unlockAudio();
    setAudioErrorMessage(null);

    // If audio PCM is already cached in memory, play immediately with zero delay
    if (cachedPcm && cachedPcm.trim().length > 0) {
      console.log('[DEBUG] TTS_AUDIO_LENGTH:', { base64Length: cachedPcm.length, source: 'cache' });
      await playAudio(cachedPcm, null, messageId);
      return;
    }

    const cleanSpokenText = prepareSpeechText(text);
    if (!cleanSpokenText) return;

    setAudioLoadingId(activeId);
    console.log('[DEBUG] TTS_REQUEST_STARTED:', { messageId: activeId, textLength: cleanSpokenText.length });

    const controller = new AbortController();
    ttsAbortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort(), 25000);

    try {
      const result = await safeFetchJson<{
        success?: boolean;
        base64Pcm?: string | null;
        audioUrl?: string | null;
        error?: string;
      }>('/api/assistant/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        timeoutMs: 25000,
        body: JSON.stringify({ text: cleanSpokenText, voice: 'Aoede' }),
      });

      console.log('[DEBUG] TTS_RESPONSE_RECEIVED:', {
        status: result.status,
        ok: result.ok,
        hasPcm: Boolean(result.data?.base64Pcm),
        pcmLength: result.data?.base64Pcm?.length
      });

      const data = result.data;
      if (result.ok && data?.success && data?.base64Pcm) {
        if (messageId) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === messageId
                ? { ...m, base64Pcm: data.base64Pcm, audioUrl: data.audioUrl, audioError: null }
                : m
            )
          );
        }
        await playAudio(data.base64Pcm, data.audioUrl, messageId);
        return;
      }

      setSpeakingMessageId(null);
      if (messageId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, audioError: 'Voice is busy. Tap to retry.' } : m))
        );
      }
    } catch (err: any) {
      console.error('[DEBUG] TTS_FETCH_ERROR:', err);
      setSpeakingMessageId(null);
      if (messageId) {
        setMessages((prev) =>
          prev.map((m) => (m.id === messageId ? { ...m, audioError: 'Voice is busy. Tap to retry.' } : m))
        );
      }
    } finally {
      clearTimeout(timeoutId);
      if (ttsAbortControllerRef.current === controller) {
        ttsAbortControllerRef.current = null;
      }
      setAudioLoadingId(null);
    }
  };

  // Speech Recognition (Mic to speak question)
  const toggleSpeechRecognition = () => {
    const windowWithSpeech = window as any;
    const SpeechRecognition =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice input is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    // Stop speaking when user wants to talk into mic
    stopSpeaking();
    unlockAudio();

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'hi-IN'; // accepts Hindi & English
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setInputQuery(transcript);
          setTimeout(() => {
            handleSend(transcript);
          }, 300);
        }
      };

      recognition.onerror = (event: any) => {
        console.info('Speech recognition event:', event?.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (e) {
      console.info('Speech recognition notice:', e);
      setIsListening(false);
    }
  };

  // Clean up speech on modal close
  useEffect(() => {
    if (!isOpen) {
      stopSpeaking();
      if (isListening && recognitionRef.current) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  }, [isOpen]);

  // Welcome greeting & prelude voice: pre-cache and play via Web Audio API when autoVoice is active
  useEffect(() => {
    if (isOpen) {
      const welcomeMsg = messages.find((m) => m.id === 'welcome');
      if (welcomeMsg) {
        if (welcomeMsg.base64Pcm) {
          if (autoVoice) {
            playAudio(welcomeMsg.base64Pcm, welcomeMsg.audioUrl, 'welcome');
          }
        } else if (autoVoice) {
          speakText(welcomeMsg.text, 'welcome');
        }
      }
    }
  }, [isOpen]);

  // Suggested quick prompts that user can tap
  const quickSuggestions = [
    { label: '📅 Book Table', text: 'Book Table' },
    { label: '🤖 Tum Kaun Ho?', text: 'Tum kaun ho aur meri kya madad kar sakte ho?' },
    { label: '👋 Namaste', text: 'Namaste! Luxury Hotel ke bare mein batao.' },
    { label: '⭐ Popular Dishes', text: 'Hotel ke acche aur popular dishes kya hain?' },
    { label: '💰 Dish Prices', text: 'Popular dishes ke rates aur prices kya hain?' },
    { label: '🍷 Food Combos', text: 'Chef special dishes ke sath best food and drink pairing kya hai?' },
    { label: '⏰ Hotel Timings', text: 'Hotel ke opening hours aur timings kya hain?' },
    { label: '📦 WhatsApp Order', text: 'WhatsApp par khana kaise order karein?' },
    { label: '🌱 Veg & Jain Food', text: 'Shakahari aur Jain food options kya hain?' },
    { label: '📍 Hotel Address', text: 'Hotel ka address aur phone number kya hai?' }
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  const handleBookingSubmit = (
    messageId: string,
    details: {
      name: string;
      phone: string;
      date: string;
      time: string;
      guests: number;
      specialRequest: string;
    }
  ) => {
    // 1. Mark form as submitted
    setMessages((prev) =>
      prev.map((m) => (m.id === messageId ? { ...m, bookingSubmitted: true } : m))
    );

    // 2. Open WhatsApp with formatted reservation message
    const whatsappUrl = buildReservationWhatsAppUrl(details);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');

    // 3. Post confirmation assistant message
    const confirmMessageId = `assistant-confirm-${Date.now()}`;
    const confirmText =
      'Congratulations! Aapki table reservation request safaltapoorvak bhej di gayi hai. 🎉 Hamari luxury concierge team jaldi hi aapki table confirm kar degi. Luxury Hotel mein aapka swagat hai! 🏨✨';

    const confirmMsg: Message = {
      id: confirmMessageId,
      sender: 'assistant',
      text: confirmText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, confirmMsg]);

    // 4. Agent speaks the congratulations message aloud with Aoede voice!
    if (autoVoice) {
      speakText(
        'Congratulations! Aapki table reservation request safaltapoorvak bhej di gayi hai. Hamari luxury concierge team jaldi hi aapki table confirm kar degi. Luxury Hotel mein aapka swagat hai!',
        confirmMessageId
      );
    }
  };

  if (!isOpen) return null;

  const handleSend = async (queryText?: string) => {
    const textToSend = (queryText || inputQuery).trim();
    if (!textToSend || loading) return;

    // Blur input field so the mobile keyboard stays closed when tapping suggestions or sending
    inputRef.current?.blur();

    // Unmute and pre-warm audio context during user action
    unlockAudio();

    // Stop and cancel only previous voice/TTS when a new query is submitted
    stopSpeaking();

    console.log('[DEBUG] CHAT_REQUEST_STARTED:', { query: textToSend });

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const lower = textToSend.toLowerCase();
    const isBookTableRequest =
      lower === 'book table' ||
      lower.includes('book table') ||
      lower.includes('table book') ||
      lower.includes('table reservation') ||
      lower.includes('table reserve') ||
      lower.includes('seat book');

    if (isBookTableRequest) {
      setMessages((prev) => [...prev, userMessage]);
      setInputQuery('');
      setLoading(false);

      const formText =
        'Zaroor! Yahan aap apni reservation details fill karein, main turant aapki table arrange karwati hoon. 📅👑✨';
      const assistantMessageId = `assistant-booking-${Date.now()}`;
      const assistantMessage: Message = {
        id: assistantMessageId,
        sender: 'assistant',
        text: formText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        hasBookingForm: true
      };

      setMessages((prev) => [...prev, assistantMessage]);

      if (autoVoice) {
        speakText(
          'Zaroor! Yahan aap apni reservation details fill karein, main turant aapki table arrange karwati hoon.',
          assistantMessageId
        );
      }
      return;
    }

    setMessages((prev) => [...prev, userMessage]);
    setInputQuery('');
    setLoading(true);

    let replyText = '';
    const assistantMessageId = `assistant-${Date.now()}`;

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const result = await safeFetchJson<{
        success?: boolean;
        reply?: string;
        base64Pcm?: string | null;
        audioUrl?: string | null;
        error?: string;
      }>('/api/assistant/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        timeoutMs: 5000,
        body: JSON.stringify({
          message: textToSend,
          history: messages.slice(-4).map((m) => ({
            role: m.sender === 'user' ? 'user' : 'model',
            text: m.text
          }))
        })
      });
      clearTimeout(timeoutId);

      console.log('[DEBUG] CHAT_RESPONSE_RECEIVED:', {
        status: result.status,
        ok: result.ok,
        hasReply: Boolean(result.data?.reply),
        hasPcm: Boolean(result.data?.base64Pcm)
      });

      if (!result.ok || !result.data || !result.data.reply) {
        throw new Error(result.data?.error || result.error || `HTTP ${result.status}`);
      }

      replyText = cleanMessageText(result.data.reply);

      const assistantMessage: Message = {
        id: assistantMessageId,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        base64Pcm: result.data.base64Pcm,
        audioUrl: result.data.audioUrl,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);

      // Instant speech playback: If audio is already included in the chat payload, play with 0ms delay!
      if (autoVoice && result.data.base64Pcm) {
        playAudio(result.data.base64Pcm, result.data.audioUrl, assistantMessageId);
      } else if (autoVoice && replyText) {
        // Fallback: fetch voice audio via /api/assistant/tts
        speakText(replyText, assistantMessageId);
      }
    } catch (err: any) {
      console.info('Chat request notice, providing reliable concierge response:', err?.message || err);
      replyText = cleanMessageText(getClientFallbackResponse(textToSend));

      const assistantMessage: Message = {
        id: assistantMessageId,
        sender: 'assistant',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setLoading(false);

      if (autoVoice && replyText) {
        speakText(replyText, assistantMessageId);
      }
    } finally {
      setLoading(false);
    }
  };

  const getClientFallbackResponse = (query: string): string => {
    const q = query.toLowerCase().trim();

    // 0. Agent Identity & Dedicated Helpful Attitude ("Tum kaun ho", "Who are you", "Aap kaun hain", "Apna parichay", "Madad")
    if (
      q.includes('kaun ho') ||
      q.includes('kaun hai') ||
      q.includes('who are you') ||
      q.includes('what are you') ||
      q.includes('who r u') ||
      q.includes('kya karte ho') ||
      q.includes('naam kya') ||
      q.includes('introduction') ||
      q.includes('parichay') ||
      q.includes('about yourself') ||
      q.includes('your role')
    ) {
      return `Hello ji! Main Luxury Hotel ka official 24/7 AI Concierge Assistant hoon. Mera sabse bada kaam Luxury Hotel mein aapki har tarah se dil se madad aur poori seva karna hai! 🏨👑✨\n\n` +
        `Main aapki in sabhi cheezon mein poori sahayata karne ke liye yahan hazir hoon:\n` +
        `🍝 Signature Dishes & Menu Guidance: Hamare royal chefs ke world-famous food recommendations.\n` +
        `💰 Rates & Special Discounts: Kisi bhi dish ka exact price aur special 20% OFF offer (Code: FLAVORO20).\n` +
        `🛎️ Table Booking: Romantic Terrace Garden, VIP Private Lounge ya Grand Hall mein best table reserve karna.\n` +
        `⏰ Hotel Timings: Breakfast, Lunch, Dinner aur Bar Lounge ke exact hours pata karna.\n` +
        `📍 Location & Valet Parking: Fraser Road address aur complimentary chauffeured valet arrival.\n` +
        `📲 Instant WhatsApp Ordering: Apni manpasand dish direct kitchen se WhatsApp par express mangwana.\n\n` +
        `Main har pal aapki madad ke liye yahan hazir hoon. Kahiye, aaj main aapki kya seva kar sakta hoon? 😊🙏`;
    }

    const isHindi =
      /[\u0900-\u097F]/.test(query) ||
      q.includes('kya') ||
      q.includes('batao') ||
      q.includes('kitna') ||
      q.includes('kitne') ||
      q.includes('namaste') ||
      q.includes('kaise') ||
      q.includes('kahan') ||
      q.includes('kaha') ||
      q.includes('khana') ||
      q.includes('shakahari') ||
      q.includes('kab') ||
      q.includes('chahiye') ||
      q.includes('acche') ||
      q.includes('accha');

    const isAskingPrice =
      q.includes('price') ||
      q.includes('rate') ||
      q.includes('cost') ||
      q.includes('kitne ka') ||
      q.includes('kitna rate') ||
      q.includes('paisa') ||
      q.includes('bill') ||
      q.includes('karcha');

    // 1. Explicit Price Inquiry
    if (isAskingPrice) {
      if (q.includes('pasta')) {
        return isHindi
          ? `Hello! 🍝✨ Artisanal Pasta ka rate ₹35 hai. Yeh slow-cooked herb tomato sauce aur fresh parmesan ke sath serve kiya jata hai!`
          : `Hello! 🍝✨ Handcrafted Artisanal Pasta is ₹35, served with slow-simmered herb tomato emulsion and fresh parmesan.`;
      }
      if (q.includes('frie') || q.includes('potato') || q.includes('french')) {
        return isHindi
          ? `Hello! 🍟✨ Crispy French Fries ka rate ₹55 hai. Yeh double-fried crispy potatoes hain jo house-made garlic aioli ke sath aate hain!`
          : `Hello! 🍟✨ Crispy Golden French Fries are ₹55, served with artisanal garlic aioli dip.`;
      }
      if (q.includes('shawarma')) {
        return isHindi
          ? `Hello! 🌯✨ Chicken Shawarma ka rate ₹35 hai. Yeh tender roasted chicken aur garlic toum ke sath banti hai!`
          : `Hello! 🌯✨ Chicken Shawarma is ₹35, rolled in soft artisanal wrap with garlic toum.`;
      }
      if (q.includes('fish') || q.includes('curry')) {
        return isHindi
          ? `Hello! 🍲✨ Signature Coastal Fish Curry ka rate ₹35 hai. Daily fresh coastal catch coconut milk gravy mein simmer ki jaati hai!`
          : `Hello! 🍲✨ Coastal Fish Curry is ₹35, cooked with fresh catch fish in rich coconut-tamarind gravy.`;
      }
      return isHindi
        ? `Hello! Luxury Hotel ke popular dishes ke rates yeh hain: 💰✨\n\n` +
            `🍝 Artisanal Pasta – ₹35\n` +
            `🍟 Crispy French Fries – ₹55\n` +
            `🌯 Chicken Shawarma – ₹35\n` +
            `🍲 Coastal Fish Curry – ₹35\n` +
            `🍕 Wood-Fired Margherita Pizza – ₹499\n` +
            `🥩 Tenderloin Steak Plate – ₹899\n` +
            `🥗 Atlantic Salmon Salad – ₹799\n\n` +
            `Aap direct website se 'Add to Cart' karke WhatsApp par order kar sakte hain! 📦📲`
        : `Hello! Here is the pricing for our popular dishes: 💰✨\n\n` +
            `🍝 Artisanal Pasta – ₹35\n` +
            `🍟 Crispy French Fries – ₹55\n` +
            `🌯 Chicken Shawarma – ₹35\n` +
            `🍲 Coastal Fish Curry – ₹35\n` +
            `🍕 Margherita Pizza – ₹499\n` +
            `🥩 Steak Plate – ₹899\n` +
            `🥗 Salmon Salad – ₹799\n\n` +
            `You can add any dish to your cart and place an instant order via WhatsApp! 📦📲`;
    }

    // 2. Greetings
    if (q.includes('hello') || q.includes('hi') || q.includes('hey') || q.includes('namaste')) {
      if (isHindi) {
        return `Hello & Welcome to Luxury Hotel! 🏨✨\n\nMain aapka personal concierge advisor hoon. Main aapko hamare signature dishes 🍝, table reservation 🛎️, hotel timings ⏰ ya WhatsApp online order 📦 ke bare mein bata sakta hoon. Aap kya janna chahte hain? 😊`;
      }
      return `Hello & Welcome to ${RESTAURANT_CONFIG.name}! 🏨✨\n\nHow may I assist you today? Feel free to ask about our signature dishes 🍝, table bookings 🛎️, timings ⏰, or express WhatsApp ordering 📦!`;
    }

    // 3. Popular & Best Dishes (NO UNSOLICITED PRICING)
    if (
      q.includes('popular') ||
      q.includes('famous') ||
      q.includes('mashhoor') ||
      q.includes('best') ||
      q.includes('sabse accha') ||
      q.includes('acche dish') ||
      q.includes('accha dish') ||
      q.includes('special')
    ) {
      if (isHindi) {
        return `Hello! Luxury Hotel ke sabse acche aur popular signature dishes yeh hain: 🏨✨\n\n` +
          `🍝 Artisanal Pasta – Fresh handmade dough se bana pasta, slow-cooked herb tomato sauce aur aged parmesan ke sath.\n` +
          `🍟 Crispy French Fries – Golden hand-cut double-fried potatoes, signature garlic aioli dip ke sath.\n` +
          `🌯 Chicken Shawarma – Soft flatbread wrap mein juicy marinated roasted chicken aur garlic toum.\n` +
          `🍲 Coastal Fish Curry – Daily fresh coastal fish, rich aromatic coconut milk aur roasted spices ki gravy mein.\n` +
          `🍕 Wood-Fired Pizza – 48-hour slow fermented dough, San Marzano tomatoes aur melted buffalo mozzarella.\n` +
          `🥩 Gourmet Steak Plate – Flame-seared prime tenderloin medallion, rosemary jus aur grilled asparagus ke sath.\n\n` +
          `Agar aap inme se kisi bhi dish ka price janna chahte hain ya order karna chahte hain, toh zaroor batayein! 🍽️😊`;
      }
      return `Welcome to ${RESTAURANT_CONFIG.name}! Here are our most beloved signature dishes: 🏨✨\n\n` +
        `🍝 Artisanal Pasta – Freshly rolled dough tossed in slow-simmered herb tomato emulsion and aged parmesan.\n` +
        `🍟 Crispy French Fries – Golden hand-cut double-fried potatoes served with house-made garlic aioli.\n` +
        `🌯 Chicken Shawarma – Tender marinated roasted chicken rolled in artisanal flatbread with garlic toum.\n` +
        `🍲 Coastal Fish Curry – Fresh catch simmered in fragrant coconut milk and roasted spices.\n` +
        `🍕 Wood-Fired Pizza – Slow-fermented crust topped with San Marzano tomatoes and buffalo mozzarella.\n` +
        `🥩 Gourmet Steak Plate – Flame-seared prime tenderloin with rosemary jus and grilled garden asparagus.\n\n` +
        `Please let me know if you would like to know pricing for any dish or place an order! 🍽️😊`;
    }

    // 4. Specific Dishes (NO PRICING UNLESS ASKED)
    if (q.includes('frie') || q.includes('potato') || q.includes('french')) {
      if (isHindi) {
        return `Crispy French Fries at Luxury Hotel: 🍟✨\n\nYeh fresh hand-cut potatoes se double-fried karke golden banaye jaate hain aur hamare signature garlic aioli dip ke sath serve hote hain. Agar aap iska price janna chahte hain ya order karna chahte hain, toh batayein! 😋`;
      }
      return `Crispy French Fries at ${RESTAURANT_CONFIG.name}: 🍟✨\n\nFreshly hand-cut and double-fried to golden perfection, served with house-made garlic aioli. Let me know if you'd like pricing or wish to place an order!`;
    }

    if (q.includes('pasta')) {
      if (isHindi) {
        return `Artisanal Pasta at Luxury Hotel: 🍝✨\n\nYeh handmade unleavened fresh dough aur slow-simmered Italian herb tomato sauce se banaya jata hai aur aged parmesan cheese se garnish hota hai. Agar aap iska price janna chahte hain ya order karna chahte hain, toh batayein! 🍽️`;
      }
      return `Artisanal Pasta at ${RESTAURANT_CONFIG.name}: 🍝✨\n\nHandcrafted daily from fresh unleavened dough with slow-simmered herb tomato emulsion. Let me know if you would like to know the price or add it to your order!`;
    }

    if (q.includes('shawarma') || q.includes('wrap')) {
      if (isHindi) {
        return `Chicken Shawarma at Luxury Hotel: 🌯✨\n\nIsme 24-hour marinated tender roasted chicken, authentic garlic toum sauce aur pickled veggies ko warm artisanal wrap mein roll kiya jata hai. Agar aap price janna chahte hain toh batayein! 🍽️`;
      }
      return `Chicken Shawarma at ${RESTAURANT_CONFIG.name}: 🌯✨\n\nSucculent spiced roasted chicken wrapped in artisanal flatbread with creamy garlic toum. Let me know if you would like pricing or to order!`;
    }

    if (q.includes('fish') || q.includes('curry') || q.includes('seafood')) {
      if (isHindi) {
        return `Coastal Fish Curry at Luxury Hotel: 🍲🌊✨\n\nYeh daily fresh coastal catch fish aur slow-cooked coconut milk, tamarind aur roasted spices ke sath banayi jaati hai. Agar aap iska price janna chahte hain toh batayein! 🐟`;
      }
      return `Coastal Fish Curry at ${RESTAURANT_CONFIG.name}: 🍲🌊✨\n\nDaily fresh coastal catch simmered in rich coconut milk and aromatic roasted spices. Let me know if you'd like pricing or order details!`;
    }

    if (q.includes('pizza')) {
      if (isHindi) {
        return `Wood-Fired Neapolitan Pizzas at Luxury Hotel: 🍕🔥✨\n\nHamare pizzas 48-hour fermented slow-rise dough aur Italian wood-fired stone oven mein bake hote hain. Margherita DOP, Diavola Piccante aur Tartufo Funghi available hain. Price janna ho toh batayein! 🍽️`;
      }
      return `Wood-Fired Pizzas at ${RESTAURANT_CONFIG.name}: 🍕🔥✨\n\nBaked in authentic wood-fired ovens with slow-fermented crust. Varieties include Margherita DOP, Diavola Piccante, and Truffle Funghi. Let me know if you'd like pricing!`;
    }

    if (q.includes('dessert') || q.includes('sweet') || q.includes('cake')) {
      if (isHindi) {
        return `Signature Desserts at Luxury Hotel: 🍰🍮✨\n\nWarm Chocolate Lava Cake, Classic Italian Tiramisu aur Vanilla Bean Panna Cotta available hain. Agar aap price janna chahte hain toh batayein! 🍨`;
      }
      return `Signature Desserts at ${RESTAURANT_CONFIG.name}: 🍰🍮✨\n\nWarm Chocolate Lava Cake, Classic Tiramisu, and Vanilla Bean Panna Cotta. Let me know if you'd like pricing!`;
    }

    if (q.includes('veg') || q.includes('vegetarian') || q.includes('shakahari')) {
      if (isHindi) {
        return `Pure Vegetarian & Shakahari Delicacies: 🥗🌱✨\n\nHamare kitchen mein vegetarian guests ke liye dedicated cookware mein fresh khana banta hai:\n\n🍟 Golden Crispy French Fries\n🍝 Handcrafted Artisanal Pasta\n🍕 Wood-Fired Margherita Pizza\n🍲 Wild Woodland Mushroom Soup\n🍰 Warm Chocolate Lava Cake\n\nPrice janna chahein toh zaroor batayein! 😊`;
      }
      return `Vegetarian Selections at ${RESTAURANT_CONFIG.name}: 🥗🌱✨\n\nPrepared in dedicated cookware:\n\n🍟 Crispy French Fries\n🍝 Artisanal Fresh Pasta\n🍕 Margherita DOP Pizza\n🍲 Wild Mushroom Soup\n🍰 Warm Chocolate Lava Cake\n\nLet me know if you would like pricing!`;
    }

    // 5. Timings
    if (q.includes('hour') || q.includes('time') || q.includes('open') || q.includes('close') || q.includes('timing') || q.includes('kab')) {
      if (isHindi) {
        return `Luxury Hotel Timings & Hours: ⏰🏨✨\n\n☀️ Lunch: ${RESTAURANT_CONFIG.hours.lunch}\n🌙 Dinner: ${RESTAURANT_CONFIG.hours.dinner}\n🍸 Bar & Lounge: ${RESTAURANT_CONFIG.hours.bar}\n\nHotel saaton din open rehta hai (Monday to Sunday). Kya aap table book karna chahte hain? 🛎️`;
      }
      return `Operating Hours at ${RESTAURANT_CONFIG.name}: ⏰🏨✨\n\n☀️ Lunch: ${RESTAURANT_CONFIG.hours.lunch}\n🌙 Dinner: ${RESTAURANT_CONFIG.hours.dinner}\n🍸 Bar & Lounge: ${RESTAURANT_CONFIG.hours.bar}\n\nOpen all 7 days a week. Would you like to reserve a table? 🛎️`;
    }

    // 6. Table Booking
    if (q.includes('book') || q.includes('reservation') || q.includes('table') || q.includes('seat')) {
      if (isHindi) {
        return `Table Reservation at Luxury Hotel: 🛎️👑✨\n\nTable book karne ke liye website ke 'Book a Table' section par Date, Time aur Guests chunein, ya direct hamare official WhatsApp (${RESTAURANT_CONFIG.contact.whatsappFormatted}) par message karein! 🍷🤝`;
      }
      return `Table Reservation at ${RESTAURANT_CONFIG.name}: 🛎️👑✨\n\nReserve a table easily using the 'Book a Table' section on our website or message us directly on WhatsApp (${RESTAURANT_CONFIG.contact.whatsappFormatted})! 🍷🤝`;
    }

    // 7. WhatsApp Ordering
    if (q.includes('order') || q.includes('whatsapp') || q.includes('delivery') || q.includes('cart') || q.includes('mangwana')) {
      if (isHindi) {
        return `WhatsApp Food Order at Luxury Hotel: 📦📲✨\n\n1. Website par apni pasandida dish par 'Add to Cart' click karein 🛒.\n2. Header mein Cart drawer open karein 🧾.\n3. 'Order via WhatsApp' button dabayein 🟢.\nAapka order aur itemized bill turant WhatsApp par bhej diya jayega! 🛵💨`;
      }
      return `WhatsApp Ordering at ${RESTAURANT_CONFIG.name}: 📦📲✨\n\n1. Click 'Add to Cart' on any dish 🛒.\n2. Open your Cart drawer 🧾.\n3. Tap 'Order via WhatsApp' 🟢.\nYour itemized order will be transmitted directly to our kitchen! 🛵💨`;
    }

    // 8. Offers & Discounts
    if (q.includes('offer') || q.includes('discount') || q.includes('coupon') || q.includes('code') || q.includes('chhoot')) {
      if (isHindi) {
        return `Special Discount Offer: 🎉🎁✨\n\nAapko apne pehle digital order ya table reservation par 20% flat discount mil raha hai! Promo code FLAVORO20 use karein! 🍽️`;
      }
      return `Special Exclusive Offer: 🎉🎁✨\n\nEnjoy 20% off your first digital order or reservation with promo code FLAVORO20! 🍽️`;
    }

    // 9. Parking & Valet
    if (q.includes('park') || q.includes('valet') || q.includes('car') || q.includes('gadi')) {
      if (isHindi) {
        return `Complimentary Valet Parking: 🚗✨\n\nJi haan! Luxury Hotel par sabhi guests ke liye 100% complimentary private valet aur chauffeured parking portico par available hai. 🤝`;
      }
      return `Valet & Parking: 🚗✨\n\nYes! 100% complimentary private valet parking and chauffeured arrival are provided at our front portico for all guests. 🤝`;
    }

    // 10. Address & Location
    if (q.includes('address') || q.includes('location') || q.includes('kahan') || q.includes('kaha') || q.includes('phone') || q.includes('contact') || q.includes('map')) {
      if (isHindi) {
        return `Luxury Hotel Location & Contact: 📍🏨✨\n\n📌 Address: ${RESTAURANT_CONFIG.contact.address}, ${RESTAURANT_CONFIG.contact.landmark}, ${RESTAURANT_CONFIG.contact.city}\n📞 Phone & WhatsApp: ${RESTAURANT_CONFIG.contact.phoneFormatted}\n\nWebsite ke footer par interactive Google Map bhi available hai! 🚗💨`;
      }
      return `Location & Contact at ${RESTAURANT_CONFIG.name}: 📍🏨✨\n\n📌 Address: ${RESTAURANT_CONFIG.contact.address}, ${RESTAURANT_CONFIG.contact.landmark}, ${RESTAURANT_CONFIG.contact.city}\n📞 Phone & WhatsApp: ${RESTAURANT_CONFIG.contact.phoneFormatted}\n\nInteractive Google Maps directions are also available in the footer! 🚗💨`;
    }

    // Default Fallback
    if (isHindi) {
      return `Namaste! Luxury Hotel mein aapka swagat hai 🏨✨.\n\nHamare popular dishes mein Artisanal Pasta 🍝, Crispy French Fries 🍟, Chicken Shawarma 🌯 aur Coastal Fish Curry 🍲 hain. Kya aap inka price janna chahte hain ya table book karna chahte hain? 🍽️😊`;
    }
    return `Hello! Welcome to ${RESTAURANT_CONFIG.name} 🏨✨.\n\nOur popular signature dishes include Artisanal Pasta 🍝, Crispy French Fries 🍟, Chicken Shawarma 🌯, and Coastal Fish Curry 🍲. Would you like to know dish prices or reserve a table? 🍽️😊`;
  };

  const handleWhatsAppHandoff = () => {
    const lastUserQuery = messages.filter((m) => m.sender === 'user').pop()?.text || 'Hello';
    const whatsappUrl = buildQuickWhatsAppUrl(
      `Hello ${RESTAURANT_CONFIG.name}, I was chatting with your website AI assistant regarding: "${lastUserQuery}". Could you please assist me further?`
    );
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <>
      {/* Semi-transparent Backdrop overlay on small screens */}
      <div
        id="assistant-backdrop"
        className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px] sm:hidden animate-in fade-in"
        onClick={onClose}
      />

      {/* Floating Chat Window positioned on bottom-right, right above the floating buttons */}
      <div
        id="assistant-chat-panel"
        className="fixed inset-x-3 bottom-3 top-16 sm:inset-auto sm:bottom-28 sm:right-6 sm:w-[430px] sm:h-[620px] sm:max-h-[calc(100vh-8rem)] z-50 bg-white rounded-2xl sm:rounded-3xl border-2 border-[#C48B46]/35 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-4 duration-200 text-[#1F1A17]"
      >
        {/* Header */}
        <div className="px-3.5 py-2.5 sm:px-5 sm:py-3 border-b border-[#E8DEC8] flex items-center justify-between bg-gradient-to-r from-[#FAF7F2] via-[#F5EFE4] to-[#FAF7F2] flex-shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="flex flex-col items-center">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-br from-[#E5A645] via-[#C48B46] to-[#8C5D19] p-[1.5px] shadow-sm flex items-center justify-center text-white">
                <div className="w-full h-full rounded-full bg-[#FAF7F2] flex items-center justify-center">
                  <Sparkles className="w-3.5 h-3.5 text-[#C48B46]" />
                </div>
              </div>
              <span className="text-[7px] sm:text-[7.5px] font-extrabold text-[#C48B46] tracking-wider uppercase mt-0.5 leading-none">
                AI
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <h3 className="font-cinzel text-sm sm:text-base font-bold text-[#1F1A17] tracking-wider leading-none">
                  Luxury Hotel AI
                </h3>
                <span className="px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[8.5px] font-bold tracking-wide flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>ONLINE</span>
                </span>
              </div>
              <p className="text-[9px] sm:text-[9.5px] text-[#8C5D19] font-medium font-sans-modern tracking-wide mt-0.5">
                Fast Concierge • 24/7 Support
              </p>
            </div>
          </div>

          {/* Right Action Controls: Auto Voice Toggle + Close Button */}
          <div className="flex items-center space-x-1.5 sm:space-x-2">
            {/* Auto Voice / Photo Voice Toggle Button */}
            <button
              type="button"
              id="auto-voice-toggle-btn"
              onClick={handleToggleAutoVoice}
              title={
                autoVoice
                  ? 'Auto Voice ON - AI reply bolkar sunayega (Click to turn OFF)'
                  : 'Auto Voice OFF - Click to turn ON'
              }
              className={`flex items-center space-x-1 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-[11px] font-bold transition-all cursor-pointer border ${
                autoVoice
                  ? 'bg-[#E5A645]/15 border-[#C48B46] text-[#8C5D19] shadow-xs glow-on-hover'
                  : 'bg-white/80 border-[#D8C9B4] text-gray-500 hover:text-gray-800'
              }`}
            >
              {autoVoice ? (
                <>
                  <Volume2 className="w-3.5 h-3.5 text-[#B87B32] animate-pulse" />
                  <span>Voice ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-gray-400" />
                  <span>Voice OFF</span>
                </>
              )}
            </button>

            {speakingMessageId && (
              <button
                type="button"
                onClick={stopSpeaking}
                title="Stop speaking voice"
                className="p-1 sm:p-1.5 rounded-full bg-red-100 hover:bg-red-200 text-red-600 transition-colors cursor-pointer flex items-center space-x-0.5"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            )}

            <button
              onClick={onClose}
              id="close-assistant-btn"
              aria-label="Close assistant"
              className="p-1 sm:p-1.5 text-[#685D56] hover:text-[#1F1A17] hover:bg-black/5 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* Chat History Area (Scrollable with min-h-0 so input is NEVER pushed out) */}
        <div className="flex-1 min-h-0 overflow-y-auto p-3.5 sm:p-4 space-y-3 bg-[#FAF8F5]/60">
          {messages.map((msg) => {
            const isUser = msg.sender === 'user';
            const isThisMsgSpeaking = speakingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`flex items-start space-x-2 ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                {!isUser && (
                  <div className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E8DEC8] flex items-center justify-center text-[#C48B46] flex-shrink-0 mt-1 shadow-2xs">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-2xl p-3 sm:p-3.5 text-xs sm:text-[13px] leading-relaxed shadow-xs ${
                    isUser
                      ? 'bg-gradient-to-r from-[#C48B46] to-[#B6732E] text-white font-medium rounded-tr-none'
                      : 'bg-white border border-[#E8DEC8] text-[#1F1A17] rounded-tl-none font-light'
                  }`}
                >
                  <p className="whitespace-pre-line">{cleanMessageText(msg.text)}</p>

                  {msg.hasBookingForm && (
                    <ChatBookingForm
                      messageId={msg.id}
                      isSubmitted={msg.bookingSubmitted}
                      onSubmit={(details) => handleBookingSubmit(msg.id, details)}
                    />
                  )}
                  
                  <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-black/5">
                    <span
                      className={`text-[9px] font-sans-modern ${
                        isUser ? 'text-white/80' : 'text-[#8C7D73]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>

                    {!isUser && (
                      <button
                        type="button"
                        onClick={() => {
                          unlockAudio();
                          if (isThisMsgSpeaking) {
                            stopSpeaking();
                          } else {
                            speakText(msg.text, msg.id, msg.base64Pcm);
                          }
                        }}
                        disabled={audioLoadingId === msg.id}
                        className={`px-1.5 py-0.5 rounded text-[9.5px] font-medium flex items-center space-x-1 cursor-pointer transition-colors ${
                          isThisMsgSpeaking
                            ? 'bg-[#E5A645] text-white font-bold animate-pulse'
                            : audioLoadingId === msg.id
                            ? 'bg-[#FAF7F2] text-[#8C5D19] cursor-wait'
                            : 'text-[#8C5D19] hover:bg-[#FAF7F2]'
                        }`}
                        title={
                          isThisMsgSpeaking
                            ? 'Stop speaking'
                            : audioLoadingId === msg.id
                            ? 'Generating studio audio...'
                            : 'Listen to this reply'
                        }
                      >
                        {isThisMsgSpeaking ? (
                          <>
                            <Square className="w-2.5 h-2.5 fill-current" />
                            <span>Stop</span>
                          </>
                        ) : audioLoadingId === msg.id ? (
                          <>
                            <Loader2 className="w-2.5 h-2.5 animate-spin" />
                            <span>Loading Voice...</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-2.5 h-2.5" />
                            <span>Listen</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {isUser && (
                  <div className="w-6 h-6 rounded-full bg-[#C48B46]/20 border border-[#C48B46] flex items-center justify-center text-[#C48B46] flex-shrink-0 mt-1">
                    <User className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>
            );
          })}

          {loading && (
            <div className="flex items-start space-x-2">
              <div className="w-6 h-6 rounded-full bg-[#FAF7F2] border border-[#E8DEC8] flex items-center justify-center text-[#C48B46] flex-shrink-0">
                <Bot className="w-3.5 h-3.5" />
              </div>
              <div className="bg-white border border-[#E8DEC8] rounded-2xl rounded-tl-none p-3 text-xs text-[#C48B46] flex items-center space-x-2 shadow-xs">
                <span className="w-2 h-2 rounded-full bg-[#C48B46] animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-[#C48B46] animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-[#C48B46] animate-bounce [animation-delay:0.4s]" />
                <span className="ml-1 text-[11px] text-[#685D56] font-medium">Thinking...</span>
              </div>
            </div>
          )}

          {audioErrorMessage && (
            <div className="p-2.5 rounded-xl bg-amber-50/95 border border-amber-300/80 text-amber-900 text-xs flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 text-amber-700 flex-shrink-0" />
                <span className="font-medium text-[11px]">{audioErrorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => setAudioErrorMessage(null)}
                className="ml-2 text-amber-700 hover:text-amber-900 font-bold px-1.5 py-0.5 rounded text-xs cursor-pointer"
                title="Dismiss message"
              >
                ✕
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions Carousel (Tap to ask instantly) */}
        <div className="px-3 py-2 border-t border-[#E8DEC8] bg-[#FAF7F2] flex-shrink-0">
          <div className="flex items-center justify-between mb-1 px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5D19]">
              💡 Quick Suggestions (Tap to Ask):
            </span>
          </div>
          <div className="flex space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
            {quickSuggestions.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  inputRef.current?.blur();
                  handleSend(item.text);
                }}
                className="px-2.5 py-1 rounded-full bg-white hover:bg-[#F0E6D6] active:bg-[#E5D7C2] border border-[#E8DEC8] hover:border-[#C48B46] text-[11px] font-medium text-[#2B231D] whitespace-nowrap transition-colors flex-shrink-0 cursor-pointer shadow-2xs"
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Prominent Always-Visible Typing & Voice Input Container */}
        <div className="p-3 sm:p-3.5 border-t-2 border-[#E8DEC8] bg-white flex-shrink-0 space-y-2">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-1.5 sm:space-x-2"
          >
            {/* Voice input mic button */}
            <button
              type="button"
              onClick={toggleSpeechRecognition}
              title={isListening ? 'Sun raha hai... tap to stop' : 'Bolkar poochhein (Voice input mic)'}
              className={`p-2.5 sm:p-3 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex items-center justify-center flex-shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white border-red-600 animate-pulse ring-2 ring-red-300'
                  : 'bg-[#FAF8F5] border-[#E5D7C2] text-[#8C5D19] hover:border-[#C48B46] hover:bg-[#F5EDE1]'
              }`}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            <div className="relative flex-1">
              <input
                ref={inputRef}
                type="text"
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                placeholder="Yahan type karein ya mic se bole..."
                id="assistant-chat-input"
                className="w-full pl-3.5 pr-8 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl bg-[#FAF8F5] border-2 border-[#E5D7C2] focus:border-[#C48B46] text-xs sm:text-sm text-[#1F1A17] placeholder-[#8C7D73] focus:outline-none focus:ring-2 focus:ring-[#C48B46]/20 transition-all font-sans-modern"
              />
              {inputQuery.trim() && (
                <button
                  type="button"
                  onClick={() => setInputQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs p-1"
                >
                  ✕
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={!inputQuery.trim() || loading}
              id="assistant-submit-btn"
              aria-label="Send message"
              className="px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl sm:rounded-2xl bg-gradient-to-r from-[#C48B46] to-[#B6732E] hover:from-[#B6732E] hover:to-[#965A20] disabled:opacity-40 disabled:pointer-events-none text-white font-semibold transition-all shadow-md cursor-pointer flex items-center space-x-1 flex-shrink-0"
              title="Send (Enter)"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-bold uppercase tracking-wider">
                Send
              </span>
            </button>
          </form>

          {/* Quick WhatsApp Support Link */}
          <div className="flex items-center justify-between pt-0.5 text-[10.5px] text-[#685D56] px-1">
            <span className="text-[10px] text-[#8C7D73]">Need human help?</span>
            <button
              type="button"
              onClick={handleWhatsAppHandoff}
              className="text-[#25D366] hover:text-[#1ebd56] font-bold flex items-center space-x-1 cursor-pointer transition-colors"
            >
              <MessageCircle className="w-3 h-3" />
              <span>Direct WhatsApp (+91 {RESTAURANT_CONFIG.contact.phone})</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
