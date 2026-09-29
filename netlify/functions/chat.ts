import { GoogleGenAI } from '@google/genai';
import { RESTAURANT_CONFIG } from '../../src/config/restaurant';
import { generateVoiceAudio, getGeminiApiKey, ttsAudioCache, cleanSpeechText } from '../../src/server/voiceService';

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

function generateConciergeReply(message: string): string {
  const q = (message || '').toLowerCase();
  const isHindi =
    q.includes('hai') ||
    q.includes('kya') ||
    q.includes('kaise') ||
    q.includes('kitna') ||
    q.includes('batao') ||
    q.includes('chahiye') ||
    q.includes('mein') ||
    q.includes('kahan') ||
    q.includes('namaste');

  if (q.includes('menu') || q.includes('dish') || q.includes('food') || q.includes('khana')) {
    if (isHindi) {
      return `Luxury Hotel Royal Dining Menu Highlights: 🍽️✨\n\n1. Artisanal Truffle Pasta (₹450) — Handmade fettuccine with Italian black truffle.\n2. Crispy French Fries (₹180) — Golden potatoes seasoned with Himalayan pink salt.\n3. Authentic Chicken Shawarma (₹320) — Slow-roasted chicken wrapped in fresh pita.\n4. Coastal Fish Curry (₹550) — Fresh sea bass in rich coconut-kokum gravy.\n\nAap website par kisi bhi dish ko 'Add to Cart' karke direct WhatsApp par kitchen se order kar sakte hain! 🛵💨`;
    }
    return `Luxury Hotel Signature Dining Highlights: 🍽️✨\n\n1. Artisanal Truffle Pasta (₹450) — Fresh fettuccine with shaved Italian black truffle.\n2. Crispy French Fries (₹180) — Golden potatoes with aromatic herbs & pink salt.\n3. Authentic Chicken Shawarma (₹320) — Slow-roasted succulent chicken in fresh pita.\n4. Coastal Fish Curry (₹550) — Fresh sea bass simmered in coconut gravy.\n\nYou can tap 'Add to Cart' on any dish to order directly to your table or room via WhatsApp! 🛎️`;
  }

  if (q.includes('time') || q.includes('timing') || q.includes('hour') || q.includes('open') || q.includes('khula') || q.includes('kab')) {
    if (isHindi) {
      return `Luxury Hotel Timings & Dining Hours: ⏰🏨✨\n\n☀️ Lunch Hours: 12:00 PM – 03:30 PM (Daily)\n🌙 Dinner Hours: 07:00 PM – 11:30 PM (Daily)\n🍸 Bar & Lounge: 05:00 PM – 01:00 AM (Daily)\n\nHotel saaton din khula rehta hai (Monday to Sunday). Kya aap dinner ke liye table reserve karna chahte hain? 🛎️`;
    }
    return `Luxury Hotel Dining & Operational Hours: ⏰🏨✨\n\n☀️ Lunch: 12:00 PM – 03:30 PM (Daily)\n🌙 Dinner: 07:00 PM – 11:30 PM (Daily)\n🍸 Bar & Lounge: 05:00 PM – 01:00 AM (Daily)\n\nOpen 7 days a week. Would you like to reserve a table for lunch or dinner? 🛎️`;
  }

  if (q.includes('table') || q.includes('book') || q.includes('reserve') || q.includes('seat')) {
    if (isHindi) {
      return `Table Reservation at Luxury Hotel: 🛎️🥂✨\n\nJi haan! Aap hamare Terrace Garden, Private VIP Dining Hall ya Romantic Candlelight Corner mein table reserve kar sakte hain.\n\nWebsite ke 'BOOK A TABLE' button par click karein ya apna naam, date aur guest count bataiye, main turant WhatsApp booking confirmation generate kar dunga! 🤝`;
    }
    return `Table Reservation at Luxury Hotel: 🛎️🥂✨\n\nWe would be honored to host you! Reservations are available for our Open-Air Terrace Garden, VIP Private Suite, and Grand Dining Hall.\n\nSimply tap 'BOOK A TABLE' in the header or share your date, time, and party size for instant confirmation! 🤝`;
  }

  if (isHindi) {
    return `Hello ji! Main Luxury Hotel ka official 24/7 AI Concierge Assistant hoon. Mera kaam yahan aapki har tarah se dil se madad aur poori seva karna hai! 🏨👑✨\n\nAap hamare royal signature dishes 🍝, exact prices 💰, table reservation 🛎️, timings ⏰ ya direct WhatsApp order ke bare mein kuch bhi pooch sakte hain. Kahiye, main aapki kya seva karoon? 😊🙏`;
  }
  return `Hello & Welcome to ${RESTAURANT_CONFIG.name}! 🏨👑✨\n\nI am your official 24/7 AI Concierge. I am delighted to assist you with our chef's signature menus 🍝, dish prices 💰, table reservations 🛎️, hotel timings ⏰, and complimentary valet parking. How may I be of service to you today? 😊🙏`;
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

    const { message, history } = body || {};
    if (!message || typeof message !== 'string' || !message.trim()) {
      return {
        statusCode: 400,
        headers: CORS_HEADERS,
        body: JSON.stringify({ success: false, error: 'Message is required' }),
      };
    }

    const apiKey = getGeminiApiKey();
    let replyText = '';

    if (apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } }
        });

        const prompt = `You are the official Head AI Concierge & Master Gastronomy Advisor for "${RESTAURANT_CONFIG.name}".
Respond with genuine Indian 5-star hospitality, utmost warmth, elegance, and dedication.
Support both English and Hindi/Hinglish naturally.
Address: ${RESTAURANT_CONFIG.contact.address}, ${RESTAURANT_CONFIG.contact.city}.
Timings: Lunch 12:00 PM – 03:30 PM, Dinner 07:00 PM – 11:30 PM.
Dishes: Artisanal Truffle Pasta (₹450), Crispy French Fries (₹180), Chicken Shawarma (₹320), Coastal Fish Curry (₹550).
Discount: 20% off with promo code FLAVORO20.
Answer concisely in 3-5 sentences with helpful emojis.

Guest: ${message}
Assistant:`;

        const chatModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-3.5-flash'];
        for (const model of chatModels) {
          if (replyText) break;
          try {
            const resp = await Promise.race([
              ai.models.generateContent({
                model,
                contents: prompt,
                config: { maxOutputTokens: 350, temperature: 0.25 }
              }),
              new Promise<null>((r) => setTimeout(() => r(null), 3000))
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
      replyText = generateConciergeReply(message);
    }

    const cleanReply = sanitizeText(replyText);

    // Check cache for instant voice
    const speechSlice = cleanSpeechText(cleanReply);
    const cached = ttsAudioCache.get(`Aoede::${speechSlice}`);
    const base64Pcm = cached?.base64Pcm || null;
    const audioUrl = cached?.audioUrl || null;

    // Pre-warm audio generation in background (never delays chat response!)
    if (!cached && apiKey) {
      generateVoiceAudio(cleanReply, 'Aoede').catch(() => {});
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
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        reply: `Hello ji! Welcome to ${RESTAURANT_CONFIG.name} 🏨✨. Main aapki poori madad karne ke liye hazir hoon. Aap menu, timings ya table booking ke bare mein kuch bhi pooch sakte hain!`,
        base64Pcm: null,
        audioUrl: null,
      }),
    };
  }
};

export default async function (req: any, context?: any) {
  if (req && typeof req.json === 'function' && typeof req.headers?.get === 'function') {
    if (req.method === 'OPTIONS') {
      return new Response('', { headers: CORS_HEADERS, status: 200 });
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
