import { RestaurantConfig, MenuItem, MenuCategoryType } from '../types';
import { ASSET_IMAGES } from '../assets/images';

export const RESTAURANT_CONFIG: RestaurantConfig = {
  name: 'Luxury Hotel',
  tagline: 'Delicious Food, Unforgettable Moments',
  subtitle: 'PREMIUM HOSPITALITY & FINE DINING',
  description:
    'A regal blend of gastronomy, art, and luxury hospitality. Crafted to delight your senses.',
  
  story: {
    heading: 'A Legacy of Taste, Art & Pure Luxury',
    subheading: 'Where Culinary Passion Meets Regal Elegance',
    paragraphs: [
      'At Luxury Hotel, dining is an art form celebrating nature’s freshest bounty, handcrafted recipes, and heartfelt hospitality. Every plate tells a story of culinary heritage harmonized with modern culinary finesse.',
      'From wild-caught salmon and prime aged steaks to organic hand-tossed dough and botanical reductions, our master chefs source only the purest ingredients daily to awaken every nuance of your palate.',
      'Framed by warm ambient glow, intimate candlelit tables, and attentive concierge service, Luxury Hotel welcomes you to create moments you will cherish forever.'
    ],
    stats: [
      { label: 'Michelin Guide Listed', value: '2024' },
      { label: 'Artisanal Dishes', value: '50+' },
      { label: 'Signature Cellar Vintages', value: '180+' },
      { label: 'Guest Satisfaction', value: '99.4%' }
    ]
  },

  contact: {
    phone: '9006513247',
    phoneFormatted: '+91 90065 13247',
    whatsapp: '9006513247',
    whatsappFormatted: '+91 90065 13247',
    address: 'Grand Royale Promenade, 4th Avenue, Fine Dining Boulevard',
    landmark: 'Opposite Royal Opera House',
    city: 'Fine Dining District, New Delhi',
    googleMapsUrl: 'https://maps.google.com/?q=Luxury+Fine+Dining+Restaurant',
    email: 'hello@flavoria.com',
    openingHours: [
      { days: 'Monday – Thursday', hours: '12:00 PM – 11:00 PM' },
      { days: 'Friday – Saturday', hours: '12:00 PM – 12:00 AM' },
      { days: 'Sunday Brunch & Dinner', hours: '11:30 AM – 11:00 PM' }
    ]
  },

  hours: {
    lunch: '12:00 PM – 03:30 PM',
    dinner: '07:00 PM – 11:30 PM',
    bar: '05:00 PM – 01:00 AM'
  },

  currency: {
    symbol: '₹',
    code: 'INR'
  },

  categories: [
    {
      id: 'Starters',
      name: 'Starters',
      description: 'Delicate openers designed to awaken the palate',
      image: 'https://images.unsplash.com/photo-1541529086526-db283c563270?auto=format&fit=crop&w=600&q=80',
      itemCount: 4
    },
    {
      id: 'Main Course',
      name: 'Main Course',
      description: 'Sublime artisanal entrees crafted with heirloom techniques',
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
      itemCount: 6
    },
    {
      id: 'Desserts',
      name: 'Desserts',
      description: 'Poetic sweet conclusions featuring mascarpone and chocolate',
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=600&q=80',
      itemCount: 4
    },
    {
      id: 'Beverages',
      name: 'Beverages',
      description: 'Tropical refreshing drinks, botanical mocktails, and reserve elixirs',
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=600&q=80',
      itemCount: 4
    },
    {
      id: 'Pizza',
      name: 'Pizza',
      description: 'Wood-fired crispy dough with San Marzano tomatoes and mozzarella',
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
      itemCount: 4
    },
    {
      id: 'Chef Specials',
      name: 'Chef Specials',
      description: 'Exclusive seasonal masterpieces curated by our Executive Chef',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=600&q=80',
      itemCount: 4
    },
    {
      id: 'Snacks',
      name: 'Crispy Snacks',
      description: 'Golden fries, gourmet finger foods, and artisanal dipping sauces',
      image: ASSET_IMAGES.popularFries,
      itemCount: 5
    },
    {
      id: 'Platters',
      name: 'Platters & Grills',
      description: 'Prime cut flame-seared steaks, sharing boards, and skewers',
      image: ASSET_IMAGES.heroSteakPlate,
      itemCount: 6
    },
    {
      id: 'Salads',
      name: 'Fresh Salads',
      description: 'Organic garden-picked crisp greens, burrata, and citrus reductions',
      image: ASSET_IMAGES.heroSalmonSalad,
      itemCount: 4
    }
  ],

  heroSlides: [
    {
      id: 'hero-1',
      title: 'Ocean Harvest',
      subtitle: 'SERVED WITH LEMON BUTTER & ASPARAGUS',
      description: 'Pan-roasted Atlantic salmon fillet with citrus emulsion, tender asparagus, and delicate edible petals.',
      dishName: 'Crispy Atlantic Salmon',
      dishPrice: 26.99,
      dishRating: 4.9,
      reviewsCount: 195,
      image: ASSET_IMAGES.flavoriaSalmonDish,
      badge: 'Bestseller'
    },
    {
      id: 'hero-2',
      title: 'Artisanal Gastronomy',
      subtitle: 'SERVED WITH BALSAMIC GLAZE & ASPARAGUS',
      description: 'Tender seared chicken breast medallions with grilled lemon, asparagus, cherry tomatoes, and edible blossoms.',
      dishName: 'Flavoria Signature Gourmet Plate',
      dishPrice: 24.99,
      dishRating: 4.9,
      reviewsCount: 184,
      image: ASSET_IMAGES.flavoriaHeroDish,
      badge: "Chef's Signature"
    },
    {
      id: 'hero-3',
      title: 'Handcrafted Pasta',
      subtitle: 'CREAMY GARLIC HERB SAUCE',
      description: 'Fresh artisan pasta tossed with succulent sautéed tiger prawns, shaved parmesan, and garden herbs.',
      dishName: 'Creamy Tiger Prawn Pasta',
      dishPrice: 21.99,
      dishRating: 4.8,
      reviewsCount: 162,
      image: ASSET_IMAGES.flavoriaPastaPlate,
      badge: 'Popular'
    }
  ],

  menu: [
    // SIGNATURE POPULAR DISHES (Full Search & Discovery)
    {
      id: 'pop-dish-1',
      name: 'Pasta',
      category: 'Main Course',
      price: 35.00,
      description: 'Handcrafted artisan pasta made from unleavened durum dough, tossed in rich herb sauce.',
      rating: 5,
      reviewsCount: 142,
      image: ASSET_IMAGES.popularPasta,
      isVegetarian: true,
      isChefRecommendation: true,
      badge: 'Popular',
      calories: '480 kcal',
      allergens: ['Gluten', 'Dairy'],
      ingredients: ['Durum Wheat Semolina', 'Fresh Herb Pesto', 'Parmigiano Reggiano', 'EVOO']
    },
    {
      id: 'pop-dish-2',
      name: 'French Fries',
      category: 'Snacks',
      price: 55.00,
      description: 'Golden crispy potato batons seasoned with sea salt and served with house smoked aioli.',
      rating: 5,
      reviewsCount: 98,
      image: ASSET_IMAGES.popularFries,
      isVegetarian: true,
      isChefRecommendation: true,
      badge: 'Crunchy',
      calories: '340 kcal',
      allergens: [],
      ingredients: ['Russet Potatoes', 'Sea Salt Flakes', 'Rosemary Dust', 'Smoked Paprika Aioli']
    },
    {
      id: 'pop-dish-3',
      name: 'Chicken Shawarma',
      category: 'Main Course',
      price: 35.00,
      description: 'Slow-roasted spiced chicken wrapped in warm flatbread with pickled vegetables and tahini garlic sauce.',
      rating: 5,
      reviewsCount: 124,
      image: ASSET_IMAGES.popularShawarma,
      isVegetarian: false,
      isChefRecommendation: true,
      badge: 'Bestseller',
      calories: '560 kcal',
      allergens: ['Gluten', 'Sesame'],
      ingredients: ['Farm-Fresh Spiced Chicken', 'Pita Bread', 'Garlic Toum', 'Pickled Turnips']
    },
    {
      id: 'pop-dish-4',
      name: 'Fish Curry',
      category: 'Main Course',
      price: 35.00,
      description: 'Coastal fresh catch simmered in fragrant coconut milk, curry leaves, and toasted whole spices.',
      rating: 5,
      reviewsCount: 165,
      image: ASSET_IMAGES.popularFishCurry,
      isVegetarian: false,
      isChefRecommendation: true,
      badge: 'Chef Special',
      calories: '520 kcal',
      allergens: ['Fish'],
      ingredients: ['Fresh White Fish Fillet', 'Fresh Coconut Milk', 'Kokum', 'Toasted Spices']
    },
    {
      id: 'pop-dish-7',
      name: 'Gourmet Steak Plate',
      category: 'Platters',
      price: 899.00,
      description: 'Flame-seared tenderloin medallion with rosemary jus, herb butter, and roasted asparagus.',
      rating: 5,
      reviewsCount: 172,
      image: ASSET_IMAGES.heroSteakPlate,
      isVegetarian: false,
      isChefRecommendation: true,
      badge: 'Prime',
      calories: '720 kcal',
      allergens: ['Dairy'],
      ingredients: ['Prime Tenderloin', 'Herb Butter', 'Rosemary Demi-Glace', 'Baby Asparagus']
    },
    // 8 EXACT CHEF'S RECOMMENDATIONS MATCHING SCREENSHOT
    {
      id: 'rec-1',
      name: 'Grilled Salmon',
      category: 'Main Course',
      price: 24.99,
      description: 'Served with lemon butter sauce and fresh seasonal greens.',
      rating: 4.8,
      reviewsCount: 184,
      image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?auto=format&fit=crop&w=800&q=85',
      isVegetarian: false,
      isChefRecommendation: true,
      badge: 'Bestseller',
      calories: '540 kcal',
      allergens: ['Fish', 'Dairy'],
      ingredients: ['Norwegian Salmon', 'Lemon Butter Emulsion', 'Asparagus', 'Micro Herbs']
    },
    {
      id: 'rec-2',
      name: 'Creamy Prawn Pasta',
      category: 'Main Course',
      price: 21.99,
      description: 'Penne in creamy garlic sauce with jumbo sautéed tiger prawns.',
      rating: 4.7,
      reviewsCount: 142,
      image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?auto=format&fit=crop&w=800&q=85',
      isVegetarian: false,
      isChefRecommendation: true,
      badge: 'New',
      calories: '620 kcal',
      allergens: ['Crustaceans', 'Gluten', 'Dairy'],
      ingredients: ['Tiger Prawns', 'Artisan Penne', 'Garlic Cream', 'Parmigiano Reggiano']
    },
    {
      id: 'rec-3',
      name: 'Ribeye Steak',
      category: 'Main Course',
      price: 29.99,
      description: 'Grilled to perfection with rosemary compound butter and herb potatoes.',
      rating: 4.9,
      reviewsCount: 210,
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?auto=format&fit=crop&w=800&q=85',
      isVegetarian: false,
      isChefRecommendation: true,
      calories: '760 kcal',
      allergens: ['Dairy'],
      ingredients: ['Prime Angus Ribeye', 'Herb Compound Butter', 'Sea Salt Flakes', 'Rosemary']
    },
    {
      id: 'rec-4',
      name: 'Classic Tiramisu',
      category: 'Desserts',
      price: 8.99,
      description: 'With cocoa & mascarpone, layered over espresso-soaked ladyfingers.',
      rating: 4.6,
      reviewsCount: 95,
      image: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=85',
      isVegetarian: true,
      isChefRecommendation: true,
      calories: '390 kcal',
      allergens: ['Dairy', 'Gluten', 'Egg'],
      ingredients: ['Italian Mascarpone', 'Savoiardi Ladyfingers', 'Espresso', 'Valrhona Cocoa']
    },
    {
      id: 'rec-5',
      name: 'Truffle Mushroom Risotto',
      category: 'Main Course',
      price: 18.99,
      description: 'Creamy arborio rice simmered with wild forest mushrooms and black truffle.',
      rating: 4.8,
      reviewsCount: 167,
      image: 'https://images.unsplash.com/photo-1633964913295-ceb43826e7c9?auto=format&fit=crop&w=800&q=85',
      isVegetarian: true,
      isChefRecommendation: true,
      calories: '510 kcal',
      allergens: ['Dairy'],
      ingredients: ['Arborio Rice', 'Wild Porcini', 'Black Truffle Essence', 'Aged Parmesan']
    },
    {
      id: 'rec-6',
      name: 'Margherita Pizza',
      category: 'Pizza',
      price: 16.99,
      description: 'Fresh basil & mozzarella on a wood-fired crispy sourdough crust.',
      rating: 4.7,
      reviewsCount: 138,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=800&q=85',
      isVegetarian: true,
      isChefRecommendation: true,
      calories: '680 kcal',
      allergens: ['Dairy', 'Gluten'],
      ingredients: ['San Marzano Tomatoes', 'Fior di Latte Mozzarella', 'Fresh Sweet Basil', 'EVOO']
    },
    {
      id: 'rec-7',
      name: 'Mango Passion Mocktail',
      category: 'Beverages',
      price: 7.99,
      description: 'Tropical refreshing drink with ripe Alphonso mango, passionfruit, and mint.',
      rating: 4.9,
      reviewsCount: 88,
      image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&w=800&q=85',
      isVegetarian: true,
      isChefRecommendation: true,
      calories: '140 kcal',
      allergens: [],
      ingredients: ['Alphonso Mango Nectar', 'Passionfruit Pulp', 'Sparkling Spring Water', 'Fresh Mint']
    },
    {
      id: 'rec-8',
      name: 'Chocolate Lava Cake',
      category: 'Desserts',
      price: 9.99,
      description: 'Served with vanilla ice cream and warm molten dark chocolate center.',
      rating: 4.8,
      reviewsCount: 154,
      image: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=85',
      isVegetarian: true,
      isChefRecommendation: true,
      calories: '520 kcal',
      allergens: ['Dairy', 'Gluten', 'Egg'],
      ingredients: ['70% Dark Chocolate', 'Madagascar Vanilla Bean Gelato', 'Berry Coulis']
    },

    // ADDITIONAL MENU ITEMS
    {
      id: 'starter-1',
      name: 'Wild Mushroom Velouté',
      category: 'Starters',
      price: 12.99,
      description: 'Velvety woodland mushrooms scented with shaved Périgord black truffle.',
      rating: 4.9,
      reviewsCount: 89,
      image: 'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      calories: '280 kcal',
      allergens: ['Dairy', 'Gluten'],
      ingredients: ['Wild Porcini', 'Chanterelles', 'Black Winter Truffle', 'Heavy Cream']
    },
    {
      id: 'starter-2',
      name: 'Crispy Calamari Fritti',
      category: 'Starters',
      price: 14.99,
      description: 'Tender squid dusted with semolina, fried golden, with smoked garlic aioli.',
      rating: 4.7,
      reviewsCount: 112,
      image: 'https://images.unsplash.com/photo-1599488615731-7e5c2823ff28?auto=format&fit=crop&w=800&q=80',
      isVegetarian: false,
      calories: '420 kcal',
      allergens: ['Molluscs', 'Egg', 'Gluten'],
      ingredients: ['Fresh Calamari', 'Semolina Crust', 'Garlic Aioli', 'Meyer Lemon']
    },
    {
      id: 'starter-3',
      name: 'Heirloom Burrata Caprese',
      category: 'Starters',
      price: 13.99,
      description: 'Pugliese burrata cheese paired with roasted heirloom tomatoes and balsamic glaze.',
      rating: 4.8,
      reviewsCount: 134,
      image: 'https://images.unsplash.com/photo-1592417817098-8f3d691079d3?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      calories: '340 kcal',
      allergens: ['Dairy'],
      ingredients: ['Artisanal Burrata', 'Heirloom Tomatoes', 'Balsamic Pearls', 'Cold-Pressed EVOO']
    },
    {
      id: 'starter-4',
      name: 'Yellowfin Tuna Tartare',
      category: 'Starters',
      price: 16.99,
      description: 'Sashimi-grade tuna with ripe avocado, yuzu-ponzu vinaigrette, and sesame crisps.',
      rating: 4.9,
      reviewsCount: 96,
      image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80',
      isVegetarian: false,
      calories: '290 kcal',
      allergens: ['Fish', 'Soy', 'Sesame'],
      ingredients: ['Yellowfin Tuna', 'Hass Avocado', 'Yuzu Citrus', 'Sesame Wafers']
    },
    {
      id: 'pizza-diavola',
      name: 'Diavola Piccante Pizza',
      category: 'Pizza',
      price: 18.99,
      description: 'San Marzano tomatoes, artisanal spicy soppressata, and hot honey drizzle.',
      rating: 4.8,
      reviewsCount: 122,
      image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?auto=format&fit=crop&w=800&q=80',
      isVegetarian: false,
      isSpicy: true,
      calories: '860 kcal',
      allergens: ['Dairy', 'Gluten'],
      ingredients: ['Spicy Soppressata', 'Calabrian Chili Honey', 'San Marzano DOP', 'Mozzarella']
    },
    {
      id: 'spec-wagyu',
      name: 'A5 Wagyu Medallion',
      category: 'Chef Specials',
      price: 34.99,
      description: 'Japanese Black cattle tenderloin with bone marrow puree and black truffles.',
      rating: 5.0,
      reviewsCount: 92,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80',
      isVegetarian: false,
      calories: '750 kcal',
      allergens: ['Dairy'],
      ingredients: ['A5 Wagyu', 'Black Winter Truffle', 'Smoked Bone Marrow', 'Fleur de Sel']
    },
    {
      id: 'bev-berry',
      name: 'Wild Berry Botanical Spritz',
      category: 'Beverages',
      price: 6.99,
      description: 'Muddled blackberries, raspberries, elderflower tonic, and rosemary sprig.',
      rating: 4.7,
      reviewsCount: 65,
      image: 'https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&w=800&q=80',
      isVegetarian: true,
      calories: '110 kcal',
      allergens: [],
      ingredients: ['Wild Berries', 'Elderflower Tonic', 'Fresh Rosemary', 'Lemon Twist']
    }
  ],
  gallery: [
    {
      id: 'g-1',
      title: 'Culinary Composition',
      category: 'Dishes',
      image: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=1200&q=85',
      caption: 'Pan-seared Atlantic salmon resting on saffron broth with edible blossoms.'
    },
    {
      id: 'g-2',
      title: 'Grand Dining Hall',
      category: 'Interior',
      image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=85',
      caption: 'Warm ambient lighting, bespoke velvet seating, and acoustic intimacy.'
    },
    {
      id: 'g-3',
      title: 'Wood-Fired Precision',
      category: 'Artistry',
      image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=85',
      caption: 'Handcrafted pizzas fired at 450°C in our custom stone oven.'
    },
    {
      id: 'g-4',
      title: 'Private Cellar Tasting',
      category: 'Ambience',
      image: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&w=1200&q=85',
      caption: 'Exclusive reserve vintages paired with artisanal cheeses.'
    },
    {
      id: 'g-5',
      title: 'Artisanal Dessert Plating',
      category: 'Dishes',
      image: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?auto=format&fit=crop&w=1200&q=85',
      caption: 'Single origin dark chocolate sphere finished table-side.'
    },
    {
      id: 'g-6',
      title: 'The Open Kitchen Theatre',
      category: 'Interior',
      image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=1200&q=85',
      caption: 'Executive chefs orchestrating gastronomy with surgical precision.'
    }
  ]
};

/**
 * Generates WhatsApp URL for table reservations
 * Centralized logic using the configured WhatsApp number (9006513247)
 */
export function buildReservationWhatsAppUrl(details: {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequest?: string;
}): string {
  const phone = RESTAURANT_CONFIG.contact.whatsapp;

  let formattedDate = details.date;
  try {
    const d = new Date(details.date + 'T00:00:00');
    if (!isNaN(d.getTime())) {
      formattedDate = d.toLocaleDateString('en-IN', {
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    }
  } catch (_) {}

  const message = [
    `✨ *TABLE RESERVATION REQUEST* ✨`,
    `*${RESTAURANT_CONFIG.name} — Fine Dining & Lounge*`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `Respected Concierge Team,`,
    `I would like to reserve a table at Luxury Hotel. Kindly find my reservation details below:`,
    ``,
    `👤 *Guest Name:* ${details.name}`,
    `📞 *Contact Number:* ${details.phone}`,
    `📅 *Reservation Date:* ${formattedDate}`,
    `⏰ *Preferred Time:* ${details.time}`,
    `👥 *Number of Guests:* ${details.guests} ${details.guests === 1 ? 'Guest' : 'Guests'}`,
    `📝 *Special Request / Occasion:* ${details.specialRequest?.trim() || 'None (Standard Fine Dining)'}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🛎️ *Preferred Seating:* VIP Dining / Terrace Garden`,
    `Kindly confirm table availability and send my reservation confirmation. Thank you! 🙏`
  ].join('\n');

  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates WhatsApp URL for food ordering from cart
 * Centralized logic matching the exact requested format:
 *
 * Hello Luxury Restaurant,
 * I would like to check/place this order:
 * 1 × Truffle Pasta — ₹599
 * 2 × Signature Pizza — ₹799
 * Total: ₹2,197
 * Please confirm availability.
 */
export function buildOrderWhatsAppUrl(
  items: { name: string; quantity: number; price: number }[],
  total: number
): string {
  const phone = RESTAURANT_CONFIG.contact.whatsapp;
  const sym = RESTAURANT_CONFIG.currency.symbol;
  
  const orderLines = items
    .map(
      (item) =>
        `${item.quantity} × ${item.name} — ${sym}${(item.price * item.quantity).toLocaleString('en-IN')}`
    )
    .join('\n');

  const message = [
    `Hello ${RESTAURANT_CONFIG.name},`,
    '',
    'I would like to check/place this order:',
    '',
    orderLines,
    '',
    `Total: ${sym}${total.toLocaleString('en-IN')}`,
    '',
    'Please confirm availability.'
  ].join('\n');

  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates quick WhatsApp contact or inquiry URL
 */
export function buildQuickWhatsAppUrl(contextMessage?: string): string {
  const phone = RESTAURANT_CONFIG.contact.whatsapp;
  const defaultMsg = `Hello ${RESTAURANT_CONFIG.name}, I would like to inquire about table availability and fine dining reservations.`;
  const message = contextMessage || defaultMsg;
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}

/**
 * Generates WhatsApp URL for AI Assistant handoff
 */
export function buildAssistantHandoffWhatsAppUrl(context: string): string {
  const phone = RESTAURANT_CONFIG.contact.whatsapp;
  const message = [
    `Hello ${RESTAURANT_CONFIG.name},`,
    'I was chatting with your website Assistant and would like help with:',
    '',
    context
  ].join('\n');
  return `https://wa.me/91${phone}?text=${encodeURIComponent(message)}`;
}
