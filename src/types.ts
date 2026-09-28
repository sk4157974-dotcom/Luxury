export type MenuCategoryType =
  | 'Starters'
  | 'Main Course'
  | 'Chef Specials'
  | 'Pizza'
  | 'Desserts'
  | 'Beverages'
  | 'Dishes'
  | 'Dessert'
  | 'Drinks'
  | 'Platter'
  | 'Platters'
  | 'Snacks'
  | 'Salads';

export interface MenuItem {
  id: string;
  name: string;
  category: MenuCategoryType;
  price: number;
  description: string;
  rating: number;
  reviewsCount: number;
  image: string;
  isChefRecommendation?: boolean;
  isVegetarian?: boolean;
  isSpicy?: boolean;
  badge?: string;
  calories?: string;
  allergens?: string[];
  ingredients?: string[];
  prepTime?: string;
}

export interface CartItem {
  dish: MenuItem;
  quantity: number;
}

export interface ReservationDetails {
  name: string;
  phone: string;
  date: string;
  time: string;
  guests: number;
  specialRequest?: string;
}

export interface GalleryItem {
  id: string;
  title: string;
  category: 'Dishes' | 'Interior' | 'Ambience' | 'Artistry';
  image: string;
  caption: string;
  description?: string;
}

export interface RestaurantConfig {
  name: string;
  tagline: string;
  subtitle: string;
  description: string;
  story: {
    heading: string;
    subheading: string;
    paragraphs: string[];
    stats: { label: string; value: string }[];
  };
  contact: {
    phone: string;
    phoneFormatted: string;
    whatsapp: string;
    whatsappFormatted: string;
    address: string;
    landmark?: string;
    city?: string;
    googleMapsUrl: string;
    email: string;
    openingHours: {
      days: string;
      hours: string;
    }[];
  };
  hours: {
    lunch: string;
    dinner: string;
    bar: string;
  };
  currency: {
    symbol: string;
    code: string;
  };
  categories: {
    id: MenuCategoryType;
    name: string;
    description: string;
    image: string;
    itemCount: number;
  }[];
  menu: MenuItem[];
  heroSlides: {
    id: string;
    title: string;
    subtitle: string;
    description: string;
    dishName: string;
    dishPrice: number;
    dishRating: number;
    reviewsCount: number;
    image: string;
    badge: string;
  }[];
  gallery: GalleryItem[];
}
