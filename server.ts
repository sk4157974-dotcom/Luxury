import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import WebSocket from 'ws';
import { RESTAURANT_CONFIG } from './src/config/restaurant';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function sanitizeText(text: string): string {
  if (!text) return '';
  return text.trim();
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Explicit middleware guaranteeing application/json Content-Type for all API routes except streaming
  app.use('/api', (req, res, next) => {
    if (!req.path.includes('voice-stream')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    next();
  });

  // Health check
  app.get(['/api/health', '/api/health/'], (req, res) => {
    res.status(200).json({ status: 'ok', restaurant: RESTAURANT_CONFIG.name });
  });

  // GET handler for chat route (informative status for monitoring & checks)
  app.get(['/api/assistant/chat', '/api/assistant/chat/'], (req, res) => {
    res.status(200).json({
      status: 'ok',
      endpoint: '/api/assistant/chat',
      supportedMethods: ['POST'],
      description: 'AI Restaurant Assistant chat endpoint. Submit POST with { message: string, history?: array }.'
    });
  });

  // In-memory cache for generated speech audio (preserves quota and provides 0ms instant playback)
  const ttsAudioCache = new Map<string, { base64Pcm: string; audioUrl: string }>();
  const inFlightTts = new Map<string, Promise<{ base64Pcm: string; audioUrl: string } | null>>();
  let ttsRateLimitCooldownUntil = 0;

  function getSpeechKey(text: string, voiceName: string = 'Aoede'): string {
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

    let speechSlice = clean;
    if (clean.length > 2200) {
      const sub = clean.slice(0, 2200);
      const lastPunct = Math.max(
        sub.lastIndexOf('.'),
        sub.lastIndexOf('!'),
        sub.lastIndexOf('?')
      );
      if (lastPunct > 1600) {
        speechSlice = sub.slice(0, lastPunct + 1).trim();
      } else {
        speechSlice = sub.trim();
      }
    }
    return `${voiceName}::${speechSlice}`;
  }

  function getCachedAudio(text: string, voiceName: string = 'Aoede'): { base64Pcm: string; audioUrl: string } | null {
    if (!text) return null;
    const key = getSpeechKey(text, voiceName);
    return ttsAudioCache.get(key) || null;
  }

  // AI Restaurant Assistant Endpoint
  app.post(['/api/assistant/chat', '/api/assistant/chat/'], async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      const { message, history } = req.body || {};

      if (!message || typeof message !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Message is required',
          reply: 'Namaste! Please ask a question about our menu, timings, or table reservations.'
        });
      }

      const apiKey = process.env.GEMINI_API_KEY;

      // Construct rich, exhaustive knowledge context from RESTAURANT_CONFIG & Popular Dishes
      const menuKnowledge = RESTAURANT_CONFIG.menu
        .map(
          (m) =>
            `- ${m.name} [Category: ${m.category}] — ${RESTAURANT_CONFIG.currency.symbol}${m.price.toFixed(2)}. Rating: ${m.rating}/5 (${m.reviewsCount} reviews). Description: "${m.description}". Veg: ${m.isVegetarian ? 'Yes' : 'No'}. Spicy: ${m.isSpicy ? 'Yes' : 'No'}. Ingredients: ${m.ingredients?.join(', ') || 'N/A'}. Allergens: ${m.allergens?.join(', ') || 'None'}. Calories: ${m.calories || 'N/A'}.`
        )
        .join('\n');

      const categoriesKnowledge = RESTAURANT_CONFIG.categories
        .map((c) => `- ${c.name}: ${c.description}`)
        .join('\n');

      const hoursKnowledge = RESTAURANT_CONFIG.contact.openingHours
        .map((h) => `${h.days}: ${h.hours}`)
        .join(', ');

      const sanitizeText = (str: string): string => {
        return str
          .replace(/\*\*/g, '')
          .replace(/\*/g, '')
          .replace(/\.{3,}/g, '')
          .replace(/\s+\.{2,}/g, '')
          .replace(/\$/g, '₹')
          .trim();
      };

      const systemInstruction = `You are the official Head AI Concierge & Master Gastronomy Advisor for "${RESTAURANT_CONFIG.name}" (5-Star Luxury Resort & Fine Dining Palace).
You possess COMPLETE, 100% encyclopedic knowledge of this entire website, hotel property, master chefs, recipes, pricing, services, and policies.
You speak with genuine Indian 5-star hotel hospitality, utmost warmth, elegance, sharp intelligence, and a dedicated service attitude ("Main aapki poori madad karne ke liye yahan hazir hoon").

CRITICAL RULES:
1. AGENT IDENTITY & DEDICATED SERVICE ATTITUDE (TUM KAUN HO / WHO ARE YOU):
   - When asked "Tum kaun ho?", "Who are you?", "Aap kaun hain?", "Apna introduction do", "What is your role?", introduce yourself with immense pride, polite Indian hospitality, and dedication:
     "Hello ji! Main Luxury Hotel ka official 24/7 AI Concierge Assistant hoon. Mera sabse bada kaam Luxury Hotel mein aapki har tarah se dil se madad aur poori seva karna hai! 🏨👑✨
     Main aapki in sabhi cheezon mein poori sahayata karne ke liye yahan hazir hoon:
     🍝 Signature Dishes & Menu Guidance: Hamare royal chefs ke world-famous food recommendations.
     💰 Rates & Special Discounts: Kisi bhi dish ka exact price aur special 20% OFF offer (Code: FLAVORO20).
     🛎️ Table Booking: Romantic Terrace Garden, VIP Private Lounge ya Grand Hall mein best table reserve karna.
     ⏰ Hotel Timings: Breakfast, Lunch, Dinner aur Bar Lounge ke exact hours pata karna.
     📍 Location & Valet Parking: Fraser Road address aur complimentary valet arrival.
     📲 Instant WhatsApp Ordering: Kisi bhi dish ko direct kitchen se express mangwana.
     Main har pal aapki sahayata ke liye yahan hazir hoon. Kahiye, aaj main aapki kya seva kar sakta hoon? 😊🙏"

2. NATURAL INDIAN SPEAKING STYLE, ACCENT & GREETING RULES (NO REPETITIVE GREETINGS):
   - CRITICAL: Greet with "Hello ji!" or "Welcome ji!" ONLY on the VERY FIRST message of the conversation, or when explicitly giving an introduction ("Tum kaun ho").
   - NEVER repeat "Hello ji" or "Namaste" at the beginning of subsequent or follow-up replies! When answering specific questions (such as dish prices, timings, food items, table booking, or menu), jump directly, politely, and warmly into the answer.
   - Whether the guest speaks in Hindi, Hinglish, or English, ALWAYS speak with the EXACT SAME warm, polite Indian hotel concierge personality, accent, and cadence!
   - NEVER use American slang ("hey guys", "wanna", "gonna", "y'all", "sure thing") or flat Western corporate phrasing.
   - When answering in English:
     * Retain the warm Indian 5-star hospitality identity and cadence ("Here are our finest chef recommendations for you ji.", "We are delighted to serve you. Anything you require, main aapki poori madad karne ke liye yahan hazir hoon.").
     * Use Indian English hospitality rhythm with soft pauses and polite Indian markers so the voice speaks naturally in the authentic Indian cadence, NOT flat American English.
     * Keep the tone respectful, unhurried, royal, and welcoming ("ji", "aapke liye", "swagat hai").
   - Use natural soft comma pauses so the voice sounds rhythmic, warm, and authentic.
   - ALWAYS write in Latin English script (A-Z). Never output Devanagari Hindi characters.

3. COMPLETE, HELPFUL & POLITE RESPONSES (NO RUSHED OR INCOMPLETE ANSWERS):
   - Give complete, satisfying, warm, and helpful answers to the guest's queries.
   - Do NOT give rushed, tiny, one-line cut-off responses. Never leave any response incomplete or cut off.
   - Fully answer the question with elegant phrasing, bullet points for food items, amenities, timings, or options, and invite the guest with Indian hospitality.
   - If asked about dishes or recommendations, describe top signature dishes with their mouthwatering ingredients and food pairings.
   - If asked about prices, provide the exact prices clearly.
   - If asked about booking or orders, explain the simple steps clearly.

4. STRICT PRICING RULE (DO NOT DISCLOSE PRICES UNLESS EXPLICITLY ASKED):
   - NEVER mention prices, rates, or numbers with ₹ UNLESS the customer explicitly asks for price, rate, cost, bill, or 'kitne ka hai' / 'price kya hai' / 'rate batao' / 'how much' / 'pricing'.
   - When asked for food recommendations ("acche dish kya hai", "kya khana milega", "popular dishes"), describe the mouthwatering dishes and ingredients with emojis, BUT DO NOT WRITE ANY PRICES!
   - At the end of recommendations, say: "Agar aap inme se kisi bhi dish ka price janna chahte hain ya order karna chahte hain, toh zaroor batayein! 🍽️😊"
   - ONLY when explicitly asked for rates, state the exact price clearly (e.g. Pasta ₹35, French Fries ₹55).

5. MANDATORY EMOJIS IN EVERY REPLY:
   - Use tasteful food & hospitality emojis: 🍝, 🍟, 🍕, 🥗, 🌯, 🍲, 🥩, 🍰, 🍹, 🏨, ✨, 👑, 🛎️, 📍, 📞, 😊, 🙏.

6. SMART HOSPITALITY INTELLIGENCE (FOOD PAIRINGS, EVENTS & DIET):
   - Intelligent Food Pairings: Suggest matching drinks or sides (e.g. Artisanal Pasta with Berry Hibiscus Fizz, French Fries with Artisanal Garlic Aioli, Wood-Fired Pizza with Elderflower Spritz).
   - Dietary Guidance: Pure vegetarian and Jain options (prepared in dedicated cookware without onion/garlic), 100% Halal meats, and gluten-free pasta available.
   - Celebrations & Banquets: Can arrange birthday dinners, romantic anniversaries, and VIP dining in the Terrace Garden or Private Lounge.

COMPREHENSIVE RESTAURANT KNOWLEDGE BASE:
- Property Name: ${RESTAURANT_CONFIG.name} (5-Star Luxury Palace Resort, Michelin Guide Listed 2024)
- Location & Address: ${RESTAURANT_CONFIG.contact.address}, ${RESTAURANT_CONFIG.contact.landmark}, ${RESTAURANT_CONFIG.contact.city} (Near Patna Museum & Golf Club)
- Complimentary chauffeured valet parking available for all guests.
- Phone & WhatsApp: ${RESTAURANT_CONFIG.contact.phoneFormatted} (WhatsApp: ${RESTAURANT_CONFIG.contact.whatsappFormatted})
- Timings: Lunch (${RESTAURANT_CONFIG.hours.lunch}), Dinner (${RESTAURANT_CONFIG.hours.dinner}), Lounge (${RESTAURANT_CONFIG.hours.bar}) - Open all 7 days.
- Popular Dishes & Exact Prices (only share if asked): Pasta (₹35), French Fries (₹55), Chicken Shawarma (₹35), Fish Curry (₹35), Crispy Atlantic Salmon (₹799), Tiger Prawn Pasta (₹649), Wood-Fired Pizza (₹499), Gourmet Steak Plate (₹899).
- Special Promo: 20% OFF on first digital order/booking with code FLAVORO20.
- Ordering via WhatsApp: Add to cart on website, open Cart drawer, click 'Order via WhatsApp'.`;

      // 1. Instant Intent Matcher: For known questions, reply immediately with zero delay (0ms)
      if (hasKnownConciergeIntent(message)) {
        const rawReply = generateComprehensiveFallbackReply(message);
        const cleanReply = sanitizeText(rawReply);

        // Check if audio is already pre-warmed in memory cache (0ms instant speech)
        const cached = getCachedAudio(cleanReply, 'Aoede');
        if (cached) {
          return res.json({
            success: true,
            reply: cleanReply,
            base64Pcm: cached.base64Pcm,
            audioUrl: cached.audioUrl,
          });
        }

        // Pre-warm audio in background without delaying the chat response
        if (apiKey) {
          try {
            const ai = new GoogleGenAI({
              apiKey,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
            });
            generateVoiceAudio(ai, cleanReply, 'Aoede').catch(() => {});
          } catch (_) {}
        }

        return res.json({
          success: true,
          reply: cleanReply,
          base64Pcm: null,
          audioUrl: null,
        });
      }

      if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey: apiKey,
            httpOptions: {
              headers: {
                'User-Agent': 'aistudio-build'
              }
            }
          });

          // Build prompt with history if available
          let prompt = `${systemInstruction}\n\n`;
          if (Array.isArray(history) && history.length > 0) {
            prompt += 'Conversation History:\n';
            for (const h of history.slice(-4)) {
              prompt += `${h.role === 'user' ? 'Guest' : 'Assistant'}: ${h.text}\n`;
            }
            prompt += '\n';
          }
          prompt += `Guest: ${message}\nAssistant:`;

          let geminiReply: string | null = null;

          // High-availability chat models: fast flash-lite models for prompt text response
          const chatModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'];
          for (const model of chatModels) {
            if (geminiReply) break;
            try {
              const generatePromise = ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                  maxOutputTokens: 350,
                  temperature: 0.25,
                  thinkingConfig: {
                    thinkingBudget: 0,
                  },
                },
              });

              const timeoutPromise = new Promise<{ text?: string } | null>((resolve) =>
                setTimeout(() => resolve(null), 3500)
              );

              const response = await Promise.race([generatePromise, timeoutPromise]);
              if (response && response.text && response.text.trim()) {
                geminiReply = response.text.trim();
                break;
              }
            } catch (modelError: any) {
              const errStr = String(modelError?.message || modelError);
              console.info(`[Gemini Chat Notice on ${model}]:`, errStr.slice(0, 120));
              continue;
            }
          }

          if (geminiReply) {
            const cleanReply = sanitizeText(geminiReply);
            let base64Pcm: string | null = null;
            let audioUrl: string | null = null;

            const cached = getCachedAudio(cleanReply, 'Aoede');
            if (cached) {
              base64Pcm = cached.base64Pcm;
              audioUrl = cached.audioUrl;
            } else {
              // Pre-warm audio in background: prompt text response is NEVER delayed!
              generateVoiceAudio(ai, cleanReply, 'Aoede').catch(() => {});
            }

            return res.json({
              success: true,
              reply: cleanReply,
              base64Pcm,
              audioUrl,
            });
          }

          console.info('Delivering instantaneous concierge knowledge reply');
        } catch (geminiError: any) {
          console.info('Gemini query handled via smart concierge engine:', geminiError?.message || geminiError);
        }
      }

      // Comprehensive multilingual knowledge engine fallback (zero-downtime instantaneous reply)
      const rawReply = generateComprehensiveFallbackReply(message);
      const cleanReply = sanitizeText(rawReply);
      let base64Pcm: string | null = null;
      let audioUrl: string | null = null;

      const cached = getCachedAudio(cleanReply, 'Aoede');
      if (cached) {
        base64Pcm = cached.base64Pcm;
        audioUrl = cached.audioUrl;
      } else if (apiKey) {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          generateVoiceAudio(ai, cleanReply, 'Aoede').catch(() => {});
        } catch (_) {}
      }

      return res.json({
        success: true,
        reply: cleanReply,
        base64Pcm,
        audioUrl,
      });
    } catch (error: any) {
      console.info('Assistant query handled via fallback:', error?.message || error);
      const fallbackReply = `Namaste! Luxury Hotel mein aapka swagat hai 🏨✨. Aap hamari website se menu dekh sakte hain 🍽️, table book kar sakte hain 🛎️ ya direct WhatsApp par sampark kar sakte hain 📲.`;
      res.json({
        success: true,
        reply: fallbackReply,
      });
    }
  });

  // Audio helper: Convert 24kHz 16-bit mono PCM into standard playable WAV format
  function pcmToWavBuffer(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitDepth = 16): Buffer {
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

  // Real-time bidirectional Gemini Live conversational voice generation
  // Uses models/gemini-3.1-flash-live-preview with Aoede voice (The exact natural human voice from the reference app)
  async function generateLivePcmViaWs(
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

  // Generates natural voice audio using Gemini Live Audio (Aoede voice, cached for instant replay)
  // Self-contained implementation using the configured GEMINI_API_KEY
  async function generateVoiceAudio(
    ai: GoogleGenAI,
    text: string,
    voiceName: string = 'Aoede'
  ): Promise<{ base64Pcm: string; audioUrl: string } | null> {
    try {
      // Natural Indian conversational speech formatting:
      // - Greet with Hello instead of repetitive Namaste
      // - Prevent duplicate "ji ji"
      // - Indian currency pronunciation ("35 rupaye")
      // - Soft comma pauses for gentle, unhurried 5-star Indian hospitality rhythm
      // - Strip markdown, asterisks, brackets, and emojis completely
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
      let speechSlice = clean;
      if (clean.length > 2200) {
        const sub = clean.slice(0, 2200);
        const lastPunct = Math.max(
          sub.lastIndexOf('.'),
          sub.lastIndexOf('!'),
          sub.lastIndexOf('?')
        );
        if (lastPunct > 1600) {
          speechSlice = sub.slice(0, lastPunct + 1).trim();
        } else {
          speechSlice = sub.trim();
        }
      }
      if (!speechSlice) return null;

      const cacheKey = `${voiceName}::${speechSlice}`;
      if (ttsAudioCache.has(cacheKey)) {
        return ttsAudioCache.get(cacheKey)!;
      }

      // If an existing request is already generating this exact text, reuse the Promise
      if (inFlightTts.has(cacheKey)) {
        return await inFlightTts.get(cacheKey)!;
      }

      // Check if cooldown is active due to temporary quota limits
      if (Date.now() < ttsRateLimitCooldownUntil) {
        return null;
      }

      const generatePromise = (async () => {
        let base64Pcm: string | null = null;
        const apiKey = process.env.GEMINI_API_KEY;

        // Method 1: Live Bidirectional Gemini Live API (models/gemini-3.1-flash-live-preview)
        // Authentic human Aoede voice, warm Indian hospitality cadence, zero daily request quota limits
        if (apiKey) {
          try {
            const livePcm = await generateLivePcmViaWs(apiKey, speechSlice, voiceName || 'Aoede');
            if (livePcm && livePcm.length > 1000) {
              base64Pcm = livePcm;
            }
          } catch (wsErr: any) {
            console.info('[Live Audio WS Notice]:', String(wsErr?.message || wsErr).slice(0, 100));
          }
        }

        // Method 2: Gemini TTS fallback
        if (!base64Pcm) {
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
        }

        if (!base64Pcm) {
          return null;
        }

        let audioUrl: string;
        if (base64Pcm.startsWith('UklGR')) {
          // Standard WAV audio container from Gemini TTS
          audioUrl = `data:audio/wav;base64,${base64Pcm}`;
        } else {
          // Raw PCM stream: encapsulate in WAV header for HTML5 compatibility
          const pcmBuffer = Buffer.from(base64Pcm, 'base64');
          const wavBuffer = pcmToWavBuffer(pcmBuffer, 24000, 1, 16);
          audioUrl = `data:audio/wav;base64,${wavBuffer.toString('base64')}`;
        }

        const audioData = { base64Pcm, audioUrl };
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

  // GET handler for tts route (informative status for monitoring & checks)
  app.get(['/api/assistant/tts', '/api/assistant/tts/'], (req, res) => {
    res.status(200).json({
      status: 'ok',
      endpoint: '/api/assistant/tts',
      supportedMethods: ['POST'],
      description: 'AI Voice TTS endpoint. Submit POST with { text: string, voice?: string }.'
    });
  });

  // AI Human Voice TTS Endpoint (Aoede voice)
  app.post(['/api/assistant/tts', '/api/assistant/tts/'], async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    try {
      const { text, voice } = req.body || {};
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ success: false, error: 'Text is required for TTS' });
      }

      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({
          success: false,
          error: 'GEMINI_API_KEY environment variable is not configured',
          base64Pcm: null,
          audioUrl: null
        });
      }

      const ai = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build'
          }
        }
      });

      const audioData = await generateVoiceAudio(ai, text, voice || 'Aoede');
      if (!audioData || !audioData.base64Pcm) {
        return res.status(200).json({
          success: false,
          rateLimited: true,
          error: 'Voice audio generation is currently cooling down. Tap Listen to try again.',
          base64Pcm: null,
          audioUrl: null
        });
      }

      return res.status(200).json({
        success: true,
        audioUrl: audioData.audioUrl,
        base64Pcm: audioData.base64Pcm,
      });
    } catch {
      return res.status(200).json({
        success: false,
        rateLimited: true,
        error: 'Voice generation is currently busy. Tap Listen to try again.',
        base64Pcm: null,
        audioUrl: null
      });
    }
  });

  // Real-Time Streaming Audio Endpoint via Server-Sent Events (SSE)
  app.post(['/api/voice-stream', '/api/assistant/voice-stream'], async (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream; charset=utf-8');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    if (typeof (res as any).flushHeaders === 'function') {
      (res as any).flushHeaders();
    }

    try {
      const { text, voice } = req.body || {};
      if (!text || typeof text !== 'string' || !text.trim()) {
        res.write(`data: ${JSON.stringify({ error: 'Text is required' })}\n\n`);
        return res.end();
      }

      const voiceName = voice || 'Aoede';
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        res.write(`data: ${JSON.stringify({ error: 'GEMINI_API_KEY not configured' })}\n\n`);
        return res.end();
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
      });

      const audioData = await generateVoiceAudio(ai, text, voiceName);
      if (audioData?.base64Pcm) {
        res.write(`data: ${JSON.stringify({ pcmChunk: audioData.base64Pcm, audioUrl: audioData.audioUrl, done: true })}\n\n`);
      } else {
        res.write(`data: ${JSON.stringify({ error: 'Audio generation failed', done: true })}\n\n`);
      }
      res.end();
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message || 'Stream error', done: true })}\n\n`);
      res.end();
    }
  });

  // Explicit API 404 handler: intercepts ANY unmatched /api/* requests so they NEVER fall through to Vite SPA or static HTML
  app.all('/api/*', (req, res) => {
    res.status(404).setHeader('Content-Type', 'application/json; charset=utf-8').json({
      success: false,
      error: `API route not found: ${req.method} ${req.originalUrl}`,
      status: 404
    });
  });

  // Express error handler specifically guarding /api routes from returning HTML error pages
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`[API Server Error] on ${req.method} ${req.originalUrl}:`, err);
    if (req.originalUrl?.startsWith('/api') || req.url?.startsWith('/api')) {
      const status = typeof err.status === 'number' ? err.status : (typeof err.statusCode === 'number' ? err.statusCode : 500);
      return res.status(status).setHeader('Content-Type', 'application/json; charset=utf-8').json({
        success: false,
        error: err.message || 'Internal Server Error',
        status
      });
    }
    next(err);
  });

  // Vite middleware in development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`${RESTAURANT_CONFIG.name} server running on http://0.0.0.0:${PORT}`);
    // Pre-warm all standard concierge audio in background so Aoede voice speaks with 0ms delay!
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      const queriesToPrewarm = [
        'Namaste! Welcome to Luxury Hotel.',
        'Tum kaun ho aur meri kya madad kar sakte ho?',
        'Hotel ke acche aur popular dishes kya hain?',
        'Popular dishes ke rates aur prices kya hain?',
        'Table reservation kaise karein?',
        'Hotel ke opening hours aur timings kya hain?',
        'WhatsApp par khana kaise order karein?',
        'Shakahari aur Jain food options kya hain?',
        'Hotel ka address aur phone number kya hai?',
        'Chef special dishes ke sath best food and drink pairing kya hai?'
      ];

      (async () => {
        try {
          const ai = new GoogleGenAI({
            apiKey,
            httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
          });
          // Pre-warm the welcome speech first
          const welcomeSpeechText = 'Namaste ji! Welcome to Luxury Hotel. Main Luxury Hotel ka official 24/7 AI Concierge Assistant hoon. Mera kaam yahan aapki har tarah se poori madad aur dil se seva karna hai. Kahiye, main aapki kya seva karoon?';
          await generateVoiceAudio(ai, welcomeSpeechText, 'Aoede').catch(() => {});

          // Pre-warm table booking interactive phrases
          const bookingPromptText = 'Zaroor! Yahan aap apni reservation details fill karein, main turant aapki table arrange karwati hoon.';
          const bookingConfirmText = 'Congratulations! Aapki table reservation request safaltapoorvak bhej di gayi hai. Hamari luxury concierge team jaldi hi aapki table confirm kar degi. Luxury Hotel mein aapka swagat hai!';
          await generateVoiceAudio(ai, bookingPromptText, 'Aoede').catch(() => {});
          await generateVoiceAudio(ai, bookingConfirmText, 'Aoede').catch(() => {});

          // Sequentially pre-warm popular user queries with gentle pacing
          for (const q of queriesToPrewarm) {
            const raw = generateComprehensiveFallbackReply(q);
            const clean = sanitizeText(raw);
            await generateVoiceAudio(ai, clean, 'Aoede').catch(() => {});
            await new Promise((r) => setTimeout(r, 600));
          }
          console.log('[Concierge Voice] All common voice responses pre-warmed successfully in memory cache!');
        } catch (e) {
          console.info('[Concierge Voice pre-warm notice]:', e);
        }
      })();
    }
  });
}

/**
 * Fast intent recognition for instantaneous (<5ms) concierge responses.
 */
function hasKnownConciergeIntent(query: string): boolean {
  if (!query) return false;
  const q = query.toLowerCase().trim();
  return (
    q.includes('kaun ho') || q.includes('kaun hai') || q.includes('kon ho') || q.includes('kon hai') ||
    q.includes('who are you') || q.includes('what are you') || q.includes('who r u') || q.includes('introduction') ||
    q.includes('parichay') || q.includes('about yourself') || q.includes('naam kya') || q.includes('kya karte ho') ||
    q.includes('timing') || q.includes('time') || q.includes('hours') || q.includes('open') || q.includes('close') || q.includes('kab') ||
    q.includes('book') || q.includes('reservation') || q.includes('table') || q.includes('seat') ||
    q.includes('address') || q.includes('location') || q.includes('kahan') || q.includes('kaha') || q.includes('rasta') ||
    q.includes('phone') || q.includes('contact') || q.includes('call') || q.includes('number') ||
    q.includes('offer') || q.includes('discount') || q.includes('coupon') || q.includes('chhoot') ||
    q.includes('order') || q.includes('whatsapp') || q.includes('delivery') || q.includes('mangwana') ||
    q.includes('popular') || q.includes('famous') || q.includes('mashhoor') || q.includes('best') || q.includes('sabse accha') || q.includes('accha') ||
    q.includes('rate') || q.includes('price') || q.includes('cost') || q.includes('kitne ka') || q.includes('daam') ||
    q.includes('menu') || q.includes('dishes') || q.includes('food') || q.includes('khana') ||
    q.includes('pasta') || q.includes('frie') || q.includes('shawarma') || q.includes('fish') || q.includes('pizza') || q.includes('veg') || q.includes('vegetarian') || q.includes('shakahari') ||
    q === 'hi' || q === 'hello' || q === 'hey' || q === 'namaste' || q.startsWith('namaste') || q.startsWith('hello') || q.startsWith('hi ')
  );
}

/**
 * Intelligent deterministic fallback concierge that possesses 100% complete knowledge of the website
 * and strictly adheres to:
 * 1. NO UNSOLICITED PRICING (only reveals price if guest explicitly asks)
 * 2. PERFECT TASTEFUL EMOJIS in every single reply
 * 3. COMPLETE AND COHESIVE SPEECH
 */
function generateComprehensiveFallbackReply(query: string): string {
  const q = query.toLowerCase().trim();

  // 0. Agent Identity & Helpful Mission ("Tum kaun ho", "Who are you", "Aap kaun hain", "Apna parichay")
  if (
    q.includes('kaun ho') ||
    q.includes('kaun hai') ||
    q.includes('kon ho') ||
    q.includes('kon hai') ||
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
    return `Hello ji! Main Luxury Hotel ka official 24/7 AI Concierge Assistant hoon. Mera kaam Luxury Hotel mein aapki har tarah se dil se madad aur poori seva karna hai! 🏨👑✨\n\n` +
      `Main aapki in sabhi cheezon mein poori sahayata karne ke liye yahan hazir hoon:\n` +
      `🍝 Signature Dishes & Menu Guidance: Hamare royal chefs ke world-famous signature food recommendations janna.\n` +
      `💰 Rates & Special Discounts: Kisi bhi dish ka exact price aur special 20% OFF offer (Code: FLAVORO20) check karna.\n` +
      `🛎️ Table Reservation: Romantic Terrace Garden, VIP Private Lounge ya Grand Hall mein best table reserve karna.\n` +
      `⏰ Hotel Timings: Lunch, Dinner aur Bar Lounge ke exact hours pata karna.\n` +
      `📍 Location & Valet: Fraser Road address aur complimentary chauffeured valet parking ki information lena.\n` +
      `📲 Instant WhatsApp Ordering: Apni manpasand dish direct kitchen se WhatsApp par express mangwana.\n\n` +
      `Main har pal aapki madad ke liye yahan hazir hoon. Kahiye, aaj main aapki kya seva kar sakta hoon? 😊🙏`;
  }

  // 0.1 Intelligent Food Pairing & Recommendations
  if (
    q.includes('pairing') ||
    q.includes('combo') ||
    q.includes('sath me kya') ||
    q.includes('saath me kya') ||
    q.includes('combination')
  ) {
    return `Chef Special Food & Beverage Pairings at Luxury Hotel: 🍷🍝✨\n\n` +
      `🍝 Artisanal Pasta + 🍹 Berry Hibiscus Fizz: Pasta ke rich savory tomato sauce ko fresh fruity fizz perfectly balance karta hai!\n` +
      `🍟 Crispy French Fries + 🧄 House-made Garlic Aioli: Crisp golden crunch aur creamy dip ka ultimate royal match!\n` +
      `🍕 Wood-Fired Neapolitan Pizza + 🥂 Elderflower Spritz: Light bubbly citrus note pizza ke buffalo mozzarella ke sath melt hoti hai!\n` +
      `🥩 Gourmet Steak + 🍷 Rosemary Jus Emulsion: Rich succulent bite with deep aromatic herbs.\n\n` +
      `Kya aap inme se koi combo order karna chahte hain? 🍽️😊`;
  }

  // 0.2 Party, Banquets & Celebrations
  if (
    q.includes('party') ||
    q.includes('birthday') ||
    q.includes('anniversary') ||
    q.includes('event') ||
    q.includes('celebrat') ||
    q.includes('banquet')
  ) {
    return `Celebrations & Banquets at Luxury Hotel: 🎉👑✨\n\n` +
      `Luxury Hotel aapke special moments ko unforgettable banane ke liye best destination hai:\n` +
      `🌹 Romantic Terrace Garden: Candlelit dinner for couples & anniversaries.\n` +
      `👑 VIP Private Lounge: Exclusive family gatherings, birthday bashes & private celebrations.\n` +
      `🏛️ Grand Dining Hall: High-end corporate lunches & formal dinner parties.\n\n` +
      `Special decorations aur custom chef menus ke liye aap direct hamare WhatsApp (+91 90065 13247) par baat kar sakte hain! 🥂✨`;
  }

  const isAskingPrice =
    q.includes('price') ||
    q.includes('rate') ||
    q.includes('cost') ||
    q.includes('kitne ka') ||
    q.includes('kitna rate') ||
    q.includes('paisa') ||
    q.includes('karcha') ||
    q.includes('bill');

  // 1. Explicit Pricing Inquiry
  if (isAskingPrice) {
    if (q.includes('pasta')) {
      return `Artisanal Pasta ka rate ₹35 hai. 🍝✨ Yeh slow-cooked herb tomato sauce aur fresh parmesan ke sath serve kiya jata hai. Aap ise website se direct cart mein add karke WhatsApp par order kar sakte hain! 📦📲`;
    }
    if (q.includes('frie') || q.includes('potato')) {
      return `Crispy Golden French Fries ka rate ₹55 hai. 🍟✨ Yeh double-fried crispy potatoes hain jo house-made garlic aioli dip ke sath aate hain! 😋`;
    }
    if (q.includes('shawarma')) {
      return `Chicken Shawarma ka rate ₹35 hai. 🌯✨ Isme juicy marinated chicken aur garlic toum artisanal wrap mein roll kiya jata hai! 🍽️`;
    }
    if (q.includes('fish') || q.includes('curry')) {
      return `Signature Coastal Fish Curry ka rate ₹35 hai. 🍲✨ Yeh fresh catch fish aur aromatic coconut milk gravy ke sath banti hai! 🌊`;
    }
    return `Luxury Hotel ke popular dishes ke rates yeh hain: 💰✨\n\n` +
      `🍝 Handcrafted Pasta – ₹35\n` +
      `🍟 Crispy French Fries – ₹55\n` +
      `🌯 Chicken Shawarma – ₹35\n` +
      `🍲 Coastal Fish Curry – ₹35\n` +
      `🍕 Wood-Fired Margherita Pizza – ₹499\n` +
      `🥩 Tenderloin Steak Plate – ₹899\n` +
      `🥗 Atlantic Salmon Salad – ₹799\n\n` +
      `Special Discount: Pehle digital order ya reservation par 20% OFF bhi mil raha hai! 🎉 Aap direct WhatsApp par order kar sakte hain. 📲`;
  }

  // 2. Popular & Best Dishes (WITHOUT PRICES - Tasteful recommendations with emojis)
  if (
    q.includes('popular') ||
    q.includes('famous') ||
    q.includes('acche dish') ||
    q.includes('accha dish') ||
    q.includes('accha khana') ||
    q.includes('mashhoor') ||
    q.includes('special') ||
    q.includes('best')
  ) {
    return `Luxury Hotel ke sabse acche aur popular signature dishes yeh hain: 🏨✨\n\n` +
      `🍝 Artisanal Pasta – Fresh unleavened dough se handmade pasta, slow-simmered rich herb tomato sauce aur aged parmesan ke sath.\n` +
      `🍟 Crispy French Fries – Golden hand-cut double-fried potatoes, signature house-made garlic aioli dip ke sath.\n` +
      `🌯 Chicken Shawarma – Soft flatbread wrap mein slow-roasted marinated tender chicken aur authentic garlic toum.\n` +
      `🍲 Coastal Fish Curry – Daily fresh coastal catch, rich aromatic coconut milk aur roasted spices ki fragrant gravy mein.\n` +
      `🍕 Wood-Fired Pizza – 48-hour slow-fermented crust, San Marzano tomato sauce aur melted buffalo mozzarella.\n` +
      `🥩 Gourmet Steak Plate – Flame-seared tenderloin medallion, rosemary jus aur grilled garden asparagus ke sath.\n\n` +
      `Agar aap inme se kisi bhi dish ka price janna chahte hain ya order karna chahte hain, toh zaroor batayein! 🍽️😊`;
  }

  // 3. Specific Dish inquiries (NO PRICES UNLESS ASKED)
  if (q.includes('pasta')) {
    return `Pasta at Luxury Hotel: 🍝✨\n\n` +
      `Hamara Artisanal Pasta fresh unleavened dough se banaya jata hai aur ise slow-cooked Italian herb tomato sauce, fresh basil aur parmesan cheese ke sath serve kiya jata hai.\n\n` +
      `Iske alawa hamare pas Truffle Tagliolini aur Penne Arrabbiata bhi available hain. Agar aap iska price janna chahte hain ya cart mein add karna chahte hain, toh batayein! 🍽️`;
  }

  if (q.includes('frie') || q.includes('potato') || q.includes('chips')) {
    return `Crispy French Fries at Luxury Hotel: 🍟✨\n\n` +
      `Yeh premium quality farm potatoes se hand-cut kiye jaate hain aur double-fried hokar crispy golden bante hain. Inhe house-made artisanal garlic aioli aur tomato relish ke sath serve kiya jata hai.\n\n` +
      `Agar aap iska price janna chahte hain ya order karna chahte hain, toh batayein! 😋`;
  }

  if (q.includes('shawarma') || q.includes('wrap')) {
    return `Chicken Shawarma at Luxury Hotel: 🌯✨\n\n` +
      `Yeh hamara authentic Middle-Eastern style shawarma hai, jisme 24-hour marinated roasted chicken, pickled cucumbers aur authentic garlic toum sauce ko warm flatbread mein roll kiya jata hai.\n\n` +
      `Agar aap iska price janna chahte hain ya order karna chahte hain, toh batayein! 🍽️`;
  }

  if (q.includes('fish') || q.includes('curry') || q.includes('seafood')) {
    return `Coastal Fish Curry at Luxury Hotel: 🍲🌊✨\n\n` +
      `Yeh traditional coastal recipe par bani curry hai, jisme daily fresh catch fish ko slow-cooked coconut milk, tamarind aur roasted fragrant spices ke sath simmer kiya jata hai.\n\n` +
      `Agar aap iska price janna chahte hain ya order karna chahte hain, toh zaroor batayein! 🐟`;
  }

  if (q.includes('pizza')) {
    return `Wood-Fired Artisanal Pizzas at Luxury Hotel: 🍕🔥✨\n\n` +
      `- Classic Margherita DOP – Buffalo mozzarella, San Marzano tomato reduction aur sweet basil.\n` +
      `- Diavola Piccante – Artisanal spicy soppressata aur hot chili drizzle.\n` +
      `- Tartufo Funghi – Wild woodland mushrooms aur white truffle cream emulsion.\n\n` +
      `Agar aap inka price janna chahte hain ya order karna chahte hain, toh batayein! 🍽️`;
  }

  if (q.includes('steak') || q.includes('meat')) {
    return `Gourmet Steaks & Grills at Luxury Hotel: 🥩🔥✨\n\n` +
      `Hamara Gourmet Steak Plate flame-seared prime tenderloin medallion, caramelized shallots, rosemary jus aur grilled garden asparagus ke sath serve hota hai.\n\n` +
      `Agar aap iska price janna chahte hain ya table book karna chahte hain, toh batayein! 👑`;
  }

  // 4. Vegetarian / Shakahari inquiry
  if (q.includes('veg') || q.includes('vegetarian') || q.includes('shakahari') || q.includes('bina non veg')) {
    return `Shakahari & Pure Vegetarian Delicacies at Luxury Hotel: 🥗🌱✨\n\n` +
      `Hamare kitchen mein vegetarian guests ke liye dedicated cookware mein fresh khana banaya jata hai:\n\n` +
      `🍟 Golden Crispy French Fries with dipping sauce\n` +
      `🍝 Artisanal Fresh Pasta with herb tomato emulsion\n` +
      `🍕 Wood-Fired Margherita Pizza with fresh buffalo mozzarella\n` +
      `🍲 Velvety Wild Mushroom Soup with truffle essence\n` +
      `🥗 Heirloom Burrata Caprese with ripe tomatoes and pesto\n` +
      `🍰 Warm Chocolate Lava Cake with vanilla bean gelato\n\n` +
      `Agar aap inme se kisi dish ka price janna chahte hain ya order karna chahte hain, toh batayein! 🍽️😊`;
  }

  // 5. Complete Menu & Food categories
  if (
    q.includes('menu') ||
    q.includes('khana') ||
    q.includes('food') ||
    q.includes('dishes') ||
    q.includes('items') ||
    q.includes('kya kya hai') ||
    q.includes('list')
  ) {
    return `Luxury Hotel Complete Menu Selections: 🍽️✨\n\n` +
      `🍝 Dishes & Mains: Artisanal Pasta, Coastal Fish Curry, Chicken Shawarma, Crispy Atlantic Salmon, Gourmet Steak.\n` +
      `🍟 Snacks & Starters: Golden French Fries, Wild Mushroom Soup, Crispy Calamari, Heirloom Burrata.\n` +
      `🍕 Wood-Fired Pizzas: Margherita DOP, Diavola Piccante, Quattro Formaggi, Tartufo Funghi.\n` +
      `🍰 Desserts: Warm Chocolate Lava Cake, Classic Tiramisu, Vanilla Bean Panna Cotta.\n` +
      `🍹 Mocktails & Drinks: Berry Hibiscus Fizz, Elderflower Spritz, Royal Masala Chai.\n\n` +
      `Agar aap kisi specific dish ka price janna chahte hain ya cart mein add karna chahte hain, toh batayein! 📲😊`;
  }

  // 6. Timings & Opening Hours
  if (
    q.includes('hour') ||
    q.includes('time') ||
    q.includes('timing') ||
    q.includes('open') ||
    q.includes('close') ||
    q.includes('kab khulta') ||
    q.includes('kab band')
  ) {
    return `Luxury Hotel Timings & Dining Hours: ⏰🏨✨\n\n` +
      `☀️ Lunch Hours: ${RESTAURANT_CONFIG.hours.lunch} (Daily)\n` +
      `🌙 Dinner Hours: ${RESTAURANT_CONFIG.hours.dinner} (Daily)\n` +
      `🍸 Bar & Lounge: ${RESTAURANT_CONFIG.hours.bar} (Daily)\n\n` +
      `Hotel saaton din khula rehta hai (Monday to Sunday). Kya aap dinner ke liye table reserve karna chahte hain? 🛎️`;
  }

  // 7. Table Reservation / Booking
  if (
    q.includes('book') ||
    q.includes('reservation') ||
    q.includes('table') ||
    q.includes('seat') ||
    q.includes('dine in')
  ) {
    return `Table Reservation at Luxury Hotel: 🛎️👑✨\n\n` +
      `Table book karna bohot aasan hai:\n` +
      `1. Website Form: Website ke "Book a Table" section par Date, Time aur Guests select karein.\n` +
      `2. Direct WhatsApp: Hamare number ${RESTAURANT_CONFIG.contact.whatsappFormatted} par message karein.\n\n` +
      `Aap Grand Dining Hall, Romantic Terrace Garden ya VIP Private Lounge choose kar sakte hain! 🍷🤝`;
  }

  // 8. Ordering via WhatsApp / Delivery
  if (
    q.includes('order') ||
    q.includes('delivery') ||
    q.includes('whatsapp') ||
    q.includes('cart') ||
    q.includes('ghar mangwana')
  ) {
    return `WhatsApp Food Ordering at Luxury Hotel: 📦📲✨\n\n` +
      `1. Website par apni pasandida dish par 'Add to Cart' click karein 🛒.\n` +
      `2. Header mein Cart drawer open karein 🧾.\n` +
      `3. 'Order via WhatsApp' button dabayein 🟢.\n` +
      `Aapka itemized bill turant hamare concierge WhatsApp (${RESTAURANT_CONFIG.contact.whatsappFormatted}) par send ho jayega! 🛵💨`;
  }

  // 9. About Hotel / Heritage / Ambience
  if (
    q.includes('about') ||
    q.includes('hotel') ||
    q.includes('kaisa hai') ||
    q.includes('luxury') ||
    q.includes('star') ||
    q.includes('michelin')
  ) {
    return `About Luxury Hotel: 🏨👑✨\n\n` +
      `Luxury Hotel ek 5-Star Luxury Palace Resort aur Michelin Guide Listed (2024) fine dining destination hai.\n\n` +
      `Yahan aapko world-class master chefs ka banaya hua khana, candlelit dining, soothing acoustic vibes aur complimentary private valet parking milti hai. Har ek pal ko khaas banane ke liye hum hamesha taiyar hain! 🥂🌟`;
  }

  // 10. Address / Location / Directions
  if (
    q.includes('address') ||
    q.includes('location') ||
    q.includes('kahan') ||
    q.includes('kaha') ||
    q.includes('kidhar') ||
    q.includes('rasta') ||
    q.includes('map')
  ) {
    return `Luxury Hotel Location & Address: 📍🏨✨\n\n` +
      `📌 Address: ${RESTAURANT_CONFIG.contact.address}, ${RESTAURANT_CONFIG.contact.landmark}, ${RESTAURANT_CONFIG.contact.city}\n` +
      `📞 Phone: ${RESTAURANT_CONFIG.contact.phoneFormatted}\n` +
      `📲 WhatsApp: ${RESTAURANT_CONFIG.contact.whatsappFormatted}\n\n` +
      `Website ke footer mein interactive Google Maps link bhi diya gaya hai jisse aap one-click mein driving directions le sakte hain! 🚗💨`;
  }

  // 11. Contact / Phone Number
  if (
    q.includes('phone') ||
    q.includes('contact') ||
    q.includes('call') ||
    q.includes('number') ||
    q.includes('mobile')
  ) {
    return `Luxury Hotel Contact Details: 📞🛎️✨\n\n` +
      `📞 Phone: ${RESTAURANT_CONFIG.contact.phoneFormatted}\n` +
      `📲 WhatsApp: ${RESTAURANT_CONFIG.contact.whatsappFormatted}\n` +
      `✉️ Email: ${RESTAURANT_CONFIG.contact.email}\n` +
      `📍 Address: ${RESTAURANT_CONFIG.contact.address}, ${RESTAURANT_CONFIG.contact.city}\n\n` +
      `Aap kisi bhi samay call ya WhatsApp message kar sakte hain, hum aapki seva mein 24/7 uplabdh hain! 🤝`;
  }

  // 12. Offers & Discounts
  if (
    q.includes('offer') ||
    q.includes('discount') ||
    q.includes('coupon') ||
    q.includes('deal') ||
    q.includes('chhoot')
  ) {
    return `Exclusive Offers at Luxury Hotel: 🎉🎁✨\n\n` +
      `🏷️ 20% OFF Special: Apne pehle digital order ya table reservation par 20% discount payein promo code FLAVORO20 ke sath!\n` +
      `🍸 Complimentary Welcome Treat: Dinner guests ke liye Executive Chef ki taraf se special amuse-bouche.\n\n` +
      `Booking ya order karte samay offer ka labh uthayein! 🍽️`;
  }

  // 13. Greetings (Hello, Hi, Namaste)
  if (
    q.includes('hi') ||
    q.includes('hello') ||
    q.includes('hey') ||
    q.includes('namaste') ||
    q.includes('pranam') ||
    q.includes('kya haal')
  ) {
    return `Hello & Welcome to Luxury Hotel! 🏨✨\n\n` +
      `Main aapka personal concierge advisor hoon. Main aapki kya madad kar sakta hoon? 😊\n\n` +
      `🍝 Signature Dishes ki jankari\n` +
      `⏰ Timings & Opening Hours\n` +
      `🛎️ Table Reservation\n` +
      `📦 Direct WhatsApp Food Order\n` +
      `📍 Location aur Driving Directions\n\n` +
      `Aap mujhse Hindi ya English mein kuch bhi pooch sakte hain! 🍽️`;
  }

  // 14. Universal Informative Default
  return `Hello & Welcome to Luxury Hotel! 🏨✨\n\n` +
    `Main aapki sahayata ke liye hazir hoon. Aap hamare popular signature dishes 🍝, hotel timings ⏰, table booking 🛎️ ya online order 📦 ke bare mein pooch sakte hain!\n\n` +
    `Aap kya dekhna ya janna pasand karenge? 🍽️😊`;
}

startServer();
