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
 * Fast intent recognition matching Preview server.ts for instantaneous (<5ms) concierge responses.
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
 * Intelligent deterministic fallback concierge matching Preview server.ts with rich 5-star hospitality.
 */
function generateComprehensiveFallbackReply(query: string): string {
  const q = query.toLowerCase().trim();

  // 0. Agent Identity & Helpful Mission
  if (
    q.includes('kaun ho') || q.includes('kaun hai') || q.includes('kon ho') || q.includes('kon hai') ||
    q.includes('who are you') || q.includes('what are you') || q.includes('who r u') || q.includes('kya karte ho') ||
    q.includes('naam kya') || q.includes('introduction') || q.includes('parichay') || q.includes('about yourself') ||
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

  // 1. Explicit Pricing Inquiry
  const isAskingPrice =
    q.includes('price') || q.includes('rate') || q.includes('cost') || q.includes('kitne ka') ||
    q.includes('kitna rate') || q.includes('paisa') || q.includes('karcha') || q.includes('bill');

  if (isAskingPrice) {
    if (q.includes('pasta')) {
      return `Artisanal Truffle Pasta ka rate ₹450 hai. 🍝✨ Yeh handmade fettuccine rich black truffle sauce aur aged parmesan ke sath serve kiya jata hai. Aap direct website se cart mein add karke WhatsApp par order kar sakte hain! 📦📲`;
    }
    if (q.includes('frie') || q.includes('potato')) {
      return `Crispy Golden French Fries ka rate ₹180 hai. 🍟✨ Yeh double-fried crispy potatoes hain jo Himalayan pink salt aur house-made garlic aioli dip ke sath aate hain! 😋`;
    }
    if (q.includes('shawarma')) {
      return `Authentic Chicken Shawarma ka rate ₹320 hai. 🌯✨ Isme juicy marinated roasted chicken aur garlic toum artisanal wrap mein roll kiya jata hai! 🍽️`;
    }
    if (q.includes('fish') || q.includes('curry')) {
      return `Coastal Fish Curry ka rate ₹550 hai. 🍲✨ Yeh fresh sea bass aur aromatic coconut milk kokum gravy ke sath banti hai! 🌊`;
    }
    return `Luxury Hotel ke signature dishes ke rates yeh hain: 💰✨\n\n` +
      `🍝 Artisanal Truffle Pasta – ₹450\n` +
      `🍟 Crispy French Fries – ₹180\n` +
      `🌯 Authentic Chicken Shawarma – ₹320\n` +
      `🍲 Coastal Fish Curry – ₹550\n` +
      `🍕 Wood-Fired Margherita Pizza – ₹499\n` +
      `🥩 Gourmet Tenderloin Steak – ₹899\n\n` +
      `Special Discount: Pehle digital order ya reservation par 20% OFF bhi mil raha hai (Promo Code: FLAVORO20)! 🎉 Aap direct WhatsApp par order kar sakte hain. 📲`;
  }

  // 2. Timings & Opening Hours
  if (
    q.includes('hour') || q.includes('time') || q.includes('timing') || q.includes('open') ||
    q.includes('close') || q.includes('kab khulta') || q.includes('kab band') || q.includes('kab')
  ) {
    return `Luxury Hotel Timings & Dining Hours: ⏰🏨✨\n\n` +
      `☀️ Lunch Hours: ${RESTAURANT_CONFIG.hours.lunch} (Daily)\n` +
      `🌙 Dinner Hours: ${RESTAURANT_CONFIG.hours.dinner} (Daily)\n` +
      `🍸 Bar & Lounge: ${RESTAURANT_CONFIG.hours.bar} (Daily)\n\n` +
      `Hotel saaton din khula rehta hai (Monday to Sunday). Kya aap lunch ya dinner ke liye table reserve karna chahte hain? 🛎️`;
  }

  // 3. Table Reservation
  if (q.includes('book') || q.includes('reservation') || q.includes('table') || q.includes('seat')) {
    return `Table Reservation at Luxury Hotel: 🛎️👑✨\n\n` +
      `Table book karna bohot aasan hai:\n` +
      `1. Website Form: Header mein "BOOK A TABLE" par click karke Date, Time aur Guests select karein.\n` +
      `2. Direct WhatsApp: Hamare number ${RESTAURANT_CONFIG.contact.whatsappFormatted} par message karein.\n\n` +
      `Aap Open-Air Terrace Garden, VIP Private Suite ya Grand Dining Hall choose kar sakte hain! 🥂✨`;
  }

  // 4. Address & Location
  if (q.includes('address') || q.includes('location') || q.includes('kahan') || q.includes('kaha') || q.includes('rasta') || q.includes('map')) {
    return `Luxury Hotel Location & Address: 📍🏨✨\n\n` +
      `Hamara address hai: ${RESTAURANT_CONFIG.contact.address}, ${RESTAURANT_CONFIG.contact.city}.\n\n` +
      `Sabhi dining aur stay guests ke liye 24/7 complimentary chauffeured valet parking available hai! 🚗✨`;
  }

  // 5. Popular Dishes
  if (q.includes('popular') || q.includes('famous') || q.includes('special') || q.includes('best') || q.includes('accha')) {
    return `Luxury Hotel Signature Dining Highlights: 🍽️✨\n\n` +
      `1. 🍝 Artisanal Truffle Pasta — Handmade fettuccine with shaved Italian black truffle.\n` +
      `2. 🍟 Crispy French Fries — Double-fried potatoes seasoned with Himalayan pink salt & garlic aioli.\n` +
      `3. 🌯 Authentic Chicken Shawarma — Slow-roasted chicken wrapped in fresh pita with toum.\n` +
      `4. 🍲 Coastal Fish Curry — Fresh sea bass in rich coconut-kokum gravy.\n\n` +
      `Aap kisi bhi dish ko 'Add to Cart' karke direct WhatsApp par kitchen se express order kar sakte hain! 🛵💨`;
  }

  // 6. Complete Menu
  if (q.includes('menu') || q.includes('food') || q.includes('khana') || q.includes('dish')) {
    return `Luxury Hotel Royal Dining Menu Highlights: 🍽️✨\n\n` +
      `🍝 Pastas & Mains: Artisanal Truffle Pasta (₹450), Coastal Fish Curry (₹550), Chicken Shawarma (₹320).\n` +
      `🍟 Starters: Crispy French Fries (₹180), Wild Mushroom Soup, Heirloom Burrata.\n` +
      `🍕 Wood-Fired Pizzas: Classic Margherita DOP (₹499), Diavola Piccante.\n` +
      `🍹 Mocktails: Berry Hibiscus Fizz, Elderflower Spritz.\n\n` +
      `Kahiye, main aapke liye inme se koi dish order karne mein madad karoon? 😊`;
  }

  // 7. General Welcome Greeting
  return `Hello ji! Welcome to ${RESTAURANT_CONFIG.name} 🏨👑✨. Main Luxury Hotel ka official 24/7 AI Concierge Assistant hoon. Main hamare signature dishes 🍝, prices 💰, table reservation 🛎️, timings ⏰ ya direct WhatsApp order ke bare mein aapki poori madad karne ke liye hazir hoon! Kahiye, aaj main aapki kya seva karoon? 😊🙏`;
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
      if (q.includes('kaun ho') || q.includes('who are you') || q.includes('who r u') || q.includes('parichay')) {
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

      replyText = generateComprehensiveFallbackReply(message);
    }

    // Dynamic AI Path for open-ended or unique questions
    if (!replyText && apiKey) {
      try {
        const ai = new GoogleGenAI({
          apiKey,
          httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
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
      replyText = generateComprehensiveFallbackReply(message);
    }

    const cleanReply = sanitizeText(replyText);

    // Audio generation pipeline: Check cache or generate fast voice audio (<3s)
    let base64Pcm: string | null = null;
    let audioUrl: string | null = null;

    const speechSlice = cleanSpeechText(cleanReply);
    const cacheKey = `Aoede::${speechSlice}`;

    if (intentId && PREWARMED_VOICE_CACHE[intentId]) {
      base64Pcm = PREWARMED_VOICE_CACHE[intentId];
    } else if (ttsAudioCache.has(cacheKey)) {
      const cached = ttsAudioCache.get(cacheKey)!;
      base64Pcm = cached.base64Pcm;
      audioUrl = cached.audioUrl;
    } else if (apiKey) {
      // Race voice generation with 3.5s timeout:
      // If voice completes in <3.5s, include base64Pcm directly in the chat payload!
      // This grants 0ms speech start delay on the frontend!
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
    const fallback = generateComprehensiveFallbackReply('');
    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        reply: fallback,
        base64Pcm: null,
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
