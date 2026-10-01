import { GoogleGenAI } from '@google/genai';
import { RESTAURANT_CONFIG } from '../../src/config/restaurant';
import {
  generateVoiceAudio,
  getGeminiApiKey,
  ttsAudioCache,
  cleanSpeechText,
} from '../../src/server/voiceService';
import { PREWARMED_VOICE_CACHE } from '../../src/server/prewarmedVoiceCache';

const CORS_HEADERS = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

function sanitizeText(str: string): string {
  if (!str) return '';
  return str
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/\.{3,}/g, '')
    .replace(/\s+\.{2,}/g, '')
    .replace(/\$/g, '₹')
    .trim();
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
    q.includes('parichay') || q.includes('about yourself') || q.includes('apne bare') || q.includes('naam kya') ||
    q.includes('kya karte ho') || q.includes('your role') || q.includes('tum kon') || q.includes('aap kon') ||
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
 * 1:1 Word-for-Word Synchronized Deterministic Concierge Responses.
 * What is returned here matches PREWARMED_VOICE_CACHE exactly so speech and text are 100% in sync.
 */
function getSynchronizedConciergeResponse(intentId: string): string {
  switch (intentId) {
    case 'identity':
      return `Namaste ji! Main Luxury Hotel ki official 24/7 AI Concierge Assistant hoon. Mera kaam yahan Luxury Hotel mein aapki har tarah se dil se seva aur madad karna hai! 🏨👑✨ Main hamare royal chef ke signature menu, dish prices, table reservation, hotel timings, Fraser Road location aur WhatsApp order ke bare mein aapki poori madad karne ke liye hazir hoon. Kahiye, aaj main aapki kya seva kar sakti hoon? 😊🙏`;

    case 'timings':
      return `Luxury Hotel Timings & Dining Hours: ⏰🏨✨\n\n☀️ Lunch Hours: 12:00 PM – 03:30 PM (Daily)\n🌙 Dinner Hours: 07:00 PM – 11:30 PM (Daily)\n🍸 Bar & Lounge: 05:00 PM – 01:00 AM (Daily)\n\nHotel saaton din khula rehta hai. Kya aap lunch ya dinner ke liye table reserve karna chahte hain? 🛎️`;

    case 'rates':
      return `Luxury Hotel ke signature dishes ke rates yeh hain: 💰✨\n\n🍝 Artisanal Truffle Pasta – ₹450\n🍟 Crispy French Fries – ₹180\n🌯 Authentic Chicken Shawarma – ₹320\n🍲 Coastal Fish Curry – ₹550\n🍕 Wood-Fired Margherita Pizza – ₹499\n\nPehle digital order par special 20% discount ke liye promo code FLAVORO20 use karein! 🎉`;

    case 'menu':
      return `Luxury Hotel Signature Dining Highlights: 🍽️✨\n\n1. 🍝 Artisanal Truffle Pasta — Handmade fettuccine with shaved Italian black truffle.\n2. 🍟 Crispy French Fries — Double-fried with Himalayan pink salt & garlic aioli.\n3. 🌯 Authentic Chicken Shawarma — Slow-roasted chicken wrapped in fresh pita with toum.\n4. 🍲 Coastal Fish Curry — Fresh sea bass in rich coconut-kokum gravy.\n\nAap website par kisi bhi dish ko Add to Cart karke direct WhatsApp par order kar sakte hain! 🛵💨`;

    case 'address':
      return `Luxury Hotel Location & Address: 📍🏨✨\n\nHamara address hai: Grand Royale Promenade, Fraser Road, Patna.\n\nSabhi dining aur stay guests ke liye 24/7 complimentary chauffeured valet parking available hai! 🚗✨`;

    case 'booking':
      return `Table Reservation at Luxury Hotel: 🛎️👑✨\n\nTable book karna bohot aasan hai:\n1. Website Form: Header mein "BOOK A TABLE" par click karke Date, Time aur Guests select karein.\n2. Direct WhatsApp: Hamare number ${RESTAURANT_CONFIG.contact.whatsappFormatted} par message karein.\n\nAap Open-Air Terrace Garden, VIP Private Suite ya Grand Dining Hall choose kar sakte hain! 🥂✨`;

    case 'welcome':
    default:
      return `Hello ji! Welcome to Luxury Hotel 🏨👑✨. Main Luxury Hotel ki official 24/7 AI Concierge Assistant hoon. Main menu, prices, table reservation, timings ya direct WhatsApp order ke bare mein aapki poori madad karne ke liye hazir hoon! Kahiye, aaj main aapki kya seva kar sakti hoon? 😊🙏`;
  }
}

export const handler = async (event: any, context?: any) => {
  if (context) {
    context.callbackWaitsForEmptyEventLoop = false;
  }

  // CORS Preflight
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: '',
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

    const { message } = body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Message is required' }),
      };
    }

    const apiKey = getGeminiApiKey();
    let replyText = '';
    let intentId: string | null = null;

    // Fast-path: Check deterministic concierge intents matching Preview server.ts (<5ms)
    if (hasKnownConciergeIntent(message)) {
      const q = message.toLowerCase().trim();
      if (
        q.includes('kaun ho') || q.includes('kaun hai') || q.includes('kon ho') || q.includes('kon hai') ||
        q.includes('who are you') || q.includes('what are you') || q.includes('who r u') || q.includes('parichay') ||
        q.includes('about yourself') || q.includes('apne bare') || q.includes('naam kya') || q.includes('kya karte ho') ||
        q.includes('introduction') || q.includes('intro') || q.includes('identity') || q.includes('who you are') ||
        q.includes('your role') || q.includes('tum kon') || q.includes('aap kon')
      ) {
        intentId = 'identity';
      } else if (q.includes('timing') || q.includes('time') || q.includes('hour') || q.includes('open') || q.includes('close') || q.includes('kab')) {
        intentId = 'timings';
      } else if (q.includes('rate') || q.includes('price') || q.includes('cost') || q.includes('kitne ka') || q.includes('daam')) {
        intentId = 'rates';
      } else if (q.includes('book') || q.includes('reservation') || q.includes('table') || q.includes('seat')) {
        intentId = 'booking';
      } else if (q.includes('address') || q.includes('location') || q.includes('kahan') || q.includes('kaha') || q.includes('rasta')) {
        intentId = 'address';
      } else if (q.includes('popular') || q.includes('menu') || q.includes('dish') || q.includes('khana')) {
        intentId = 'menu';
      } else {
        intentId = 'welcome';
      }

      replyText = getSynchronizedConciergeResponse(intentId);
    }

    // Dynamic AI Path for open-ended or unique questions
    if (!replyText && apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
        });

        const prompt = `You are the official Head AI Concierge & Master Gastronomy Advisor for "${RESTAURANT_CONFIG.name}".
You represent a world-class 5-star luxury heritage hotel in Patna.
Your personality is polite, elegant, warm, respectful, and dedicated to 5-star Indian hospitality (use respectful Hindi/Hinglish honorifics like "ji", "aap", "swagat hai").
You possess complete knowledge of the entire hotel, its menus, and this website:
- Official Name: Luxury Hotel (Haute Gastronomy & Suites)
- Address: ${RESTAURANT_CONFIG.contact.address}, ${RESTAURANT_CONFIG.contact.city}
- Timings: Lunch ${RESTAURANT_CONFIG.hours.lunch}, Dinner ${RESTAURANT_CONFIG.hours.dinner}, Bar & Lounge ${RESTAURANT_CONFIG.hours.bar} (Open 7 days a week)
- Valet Parking: 24/7 complimentary chauffeured valet parking for all dining & stay guests
- Contact / WhatsApp: ${RESTAURANT_CONFIG.contact.whatsappFormatted}
- Dining Zones: Open-Air Romantic Terrace Garden (candlelight dinner), VIP Private Suites (birthdays, family gatherings), Grand Dining Hall (corporate events)
- Signature Dishes & Prices:
  * Artisanal Truffle Pasta (₹450)
  * Crispy Golden French Fries with Garlic Aioli (₹180)
  * Authentic Chicken Shawarma in Pita (₹320)
  * Coastal Fish Curry in coconut-kokum gravy (₹550)
  * Wood-Fired Margherita Pizza (₹499)
  * Gourmet Tenderloin Steak Plate (₹899)
  * Atlantic Salmon Salad (₹799)
- Offers & Discounts: Special 20% discount on first reservation / digital order with promo code FLAVORO20
- Ordering: Guests can tap 'Add to Cart' on any dish and tap 'Order via WhatsApp' to order directly from the kitchen
- Reservations: Guests can use the 'Book a Table' button or tell you their date, time, and guest count
- Vegetarian / Dietary: Dedicated vegetarian cookware, fresh organic produce, wide vegetarian pasta, pizza, and soup options

Guest: ${message}
Concierge Assistant (respond warmly in 2-4 sentences with appropriate emojis):`;

        const chatModels = ['gemini-3.5-flash-lite', 'gemini-3.1-flash-lite', 'gemini-3.5-flash'];
        for (const model of chatModels) {
          if (replyText) break;
          try {
            const resp = await Promise.race([
              ai.models.generateContent({
                model,
                contents: prompt,
                config: {
                  maxOutputTokens: 280,
                  temperature: 0.25,
                  thinkingConfig: {
                    thinkingBudget: 0,
                  },
                },
              }),
              new Promise<null>((r) => setTimeout(() => r(null), 3500)),
            ]);
            if (resp && (resp as any).text && (resp as any).text.trim()) {
              replyText = (resp as any).text.trim();
              break;
            }
          } catch (_) {}
        }
      } catch (_) {}
    }

    if (!replyText) {
      replyText = getSynchronizedConciergeResponse('welcome');
    }

    const cleanReply = sanitizeText(replyText);

    // Audio generation pipeline: Check exact prewarmed cache first
    let base64Pcm: string | null = null;
    let audioUrl: string | null = null;

    const speechSlice = cleanSpeechText(cleanReply);
    const cacheKey = `Aoede::${speechSlice}`;

    if (intentId && PREWARMED_VOICE_CACHE[intentId]) {
      base64Pcm = PREWARMED_VOICE_CACHE[intentId];
    } else if (PREWARMED_VOICE_CACHE[cacheKey]) {
      base64Pcm = PREWARMED_VOICE_CACHE[cacheKey];
    } else if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey)!;
      base64Pcm = cached.base64Pcm;
      audioUrl = cached.audioUrl;
    } else if (apiKey) {
      // For dynamic responses, race fast voice generation with 3.5s timeout
      try {
        const audioPromise = generateVoiceAudio(cleanReply, 'Aoede');
        const timeoutPromise = new Promise<null>((r) => setTimeout(() => r(null), 3500));
        const audioData = await Promise.race([audioPromise, timeoutPromise]);
        if (audioData?.base64Pcm) {
          base64Pcm = audioData.base64Pcm;
          audioUrl = audioData.audioUrl;
        }
      } catch (_) {}
    }

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        reply: cleanReply,
        base64Pcm,
        audioUrl,
      }),
    };
  } catch (err: any) {
    console.error('[Netlify Chat Error]:', err);
    const fallback = getSynchronizedConciergeResponse('welcome');
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        reply: fallback,
        base64Pcm: PREWARMED_VOICE_CACHE['welcome'] || null,
        audioUrl: null,
      }),
    };
  }
};

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
