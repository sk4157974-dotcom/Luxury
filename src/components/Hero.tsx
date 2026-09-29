import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Sparkles, Crown, Star, Check, Plus, ArrowRight, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { RESTAURANT_CONFIG } from '../config/restaurant';
import { MenuItem } from '../types';
import { SteamEffect } from './SteamEffect';
import { ASSET_IMAGES } from '../assets/images';

interface HeroProps {
  onOpenAssistant?: () => void;
  onSelectCategory?: (category: any) => void;
}

export const Hero: React.FC<HeroProps> = ({ onOpenAssistant, onSelectCategory }) => {
  const [activeCategory, setActiveCategory] = useState('Dishes');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [currentDishIndex, setCurrentDishIndex] = useState(0);
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const { totalItems, openCart, addToCart } = useCart();

  // Search filtering logic
  const trimmedQuery = searchQuery.trim().toLowerCase();
  const searchResults: MenuItem[] = trimmedQuery
    ? RESTAURANT_CONFIG.menu.filter((dish) => {
        const matchName = dish.name.toLowerCase().includes(trimmedQuery);
        const matchCat = dish.category.toLowerCase().includes(trimmedQuery);
        const matchDesc = dish.description.toLowerCase().includes(trimmedQuery);
        const matchIng = dish.ingredients?.some((ing) => ing.toLowerCase().includes(trimmedQuery));
        return matchName || matchCat || matchDesc || matchIng;
      })
    : [];

  const handleQuickAdd = (e: React.MouseEvent, dish: MenuItem) => {
    e.stopPropagation();
    addToCart(dish, 1);
    setRecentlyAddedId(dish.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1500);
  };

  // FOOD DISHES ON THE CIRCULAR PLATE (Swaps automatically every 2 seconds)
  const heroDishes = [
    {
      id: 'salmon-salad',
      name: 'Crispy Salmon Salad',
      image: ASSET_IMAGES.heroSalmonSalad,
      category: 'Dishes'
    },
    {
      id: 'filet-mignon',
      name: 'Grilled Steak & Potatoes',
      image: ASSET_IMAGES.heroSteakPlate,
      category: 'Platter'
    },
    {
      id: 'sushi-platter',
      name: 'Artisan Sushi & Nigiri Platter',
      image: ASSET_IMAGES.heroSushiPlate,
      category: 'Platter'
    },
    {
      id: 'truffle-pasta',
      name: 'Handcrafted Truffle Pasta',
      image: ASSET_IMAGES.flavoriaPastaPlate,
      category: 'Dishes'
    }
  ];

  // Auto-rotate dish every 2 seconds ("har 2 second me change hoti rhe")
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDishIndex((prev) => (prev + 1) % heroDishes.length);
    }, 2000);

    return () => clearInterval(interval);
  }, [heroDishes.length]);

  // Close search modal on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsSearchOpen(false);
      }
    };
    if (isSearchOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSearchOpen]);

  const categories = [
    { name: 'Dishes', icon: '🍲' },
    { name: 'Dessert', icon: '🍮' },
    { name: 'Drinks', icon: '🥤' },
    { name: 'Platter', icon: '🍱' },
    { name: 'Snacks', icon: '🍿' },
  ];

  const handleScrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative w-full bg-[#FAF8F5] pt-3 xs:pt-4 sm:pt-6 pb-6 xs:pb-8 sm:pb-12 px-3 xs:px-4 sm:px-6 md:px-10 lg:px-14 overflow-hidden select-none">
      
      {/* TOP BAR: Premium Stylish Luxury Hotel Name + Utility actions */}
      <div className="max-w-7xl mx-auto mb-3 xs:mb-4 sm:mb-6 md:mb-8 flex items-center justify-between gap-2 sm:gap-3">
        {/* Highlighted 5-Star Luxury Hotel Brand Header Plaque (Premium Imperial Aesthetic) */}
        <div
          id="hero-luxury-brand-header"
          className="flex items-center space-x-2 xs:space-x-3 sm:space-x-4 px-2.5 py-1.5 xs:px-3.5 xs:py-2 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-white/95 via-[#FFFDF9] to-[#FBF7F0]/95 backdrop-blur-md border border-[#DFCBB0] shadow-[0_4px_20px_-2px_rgba(196,139,70,0.20),0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-[#E5A645]/30 hover:border-[#C48B46] hover:shadow-[0_6px_26px_rgba(196,139,70,0.28)] transition-all duration-300 pop-forward-sm min-w-0"
        >
          {/* Circular Luxury Crown Medallion with integrated AI seal */}
          <div className="flex flex-col items-center flex-shrink-0">
            <button
              type="button"
              onClick={onOpenAssistant}
              id="hero-logo-btn"
              className="w-9 h-9 xs:w-10 xs:h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-[#F7E1AD] via-[#C48B46] to-[#784B13] p-[2px] shadow-[0_3px_12px_rgba(196,139,70,0.35)] flex items-center justify-center flex-shrink-0 cursor-pointer hover:scale-105 active:scale-95 transition-transform"
              title="Click to ask Luxury Hotel AI Concierge"
            >
              <div className="w-full h-full rounded-full bg-gradient-to-b from-[#FFFDF9] to-[#FAF3E7] flex items-center justify-center shadow-inner">
                <Crown className="w-4 h-4 xs:w-5 xs:h-5 sm:w-6 sm:h-6 text-[#A86F24] drop-shadow-xs" />
              </div>
            </button>
            {/* Elegant AI Seal */}
            <span
              onClick={onOpenAssistant}
              id="hero-logo-ai-label"
              className="px-1.5 xs:px-2 py-0.5 rounded-full bg-gradient-to-r from-[#A86F24] via-[#C48B46] to-[#8C5D19] text-white text-[7.5px] xs:text-[8px] sm:text-[9px] font-black tracking-[0.16em] uppercase -mt-2 z-10 shadow-xs border border-white cursor-pointer hover:brightness-110 transition-all"
              title="Hotel AI Assistant"
            >
              AI
            </span>
          </div>

          <div className="flex flex-col justify-center min-w-0">
            {/* Brand Title & 5 Luminous Stars */}
            <div className="flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 flex-wrap">
              <span className="font-cinzel text-sm xs:text-base sm:text-xl md:text-2xl font-black tracking-[0.12em] sm:tracking-[0.18em] text-[#1F1A17] uppercase leading-none drop-shadow-[0_1px_1px_rgba(255,255,255,0.9)]">
                Luxury Hotel
              </span>
              <span className="text-[#E5A645] text-[11px] xs:text-xs sm:text-sm tracking-wider drop-shadow-[0_0_8px_rgba(229,166,69,0.5)]">
                ★★★★★
              </span>
            </div>

            {/* Subtitle / Prestige Seal */}
            <span className="text-[8px] xs:text-[9px] md:text-[10px] tracking-[0.18em] xs:tracking-[0.22em] sm:tracking-[0.3em] text-[#A86F24] uppercase font-bold font-sans-modern pt-0.5 truncate">
              ✦ GRAND RESORT & GASTRONOMY ✦
            </span>

            {/* Interactive 24/7 AI Concierge Pill */}
            <button
              type="button"
              onClick={onOpenAssistant}
              id="hero-brand-ai-concierge-btn"
              className="hidden xs:inline-flex items-center space-x-1.5 mt-1 px-2.5 xs:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-[#FAF2E1] via-[#FFF9EE] to-[#FAF2E1] border border-[#D9A855] text-[#8C5D19] hover:bg-gradient-to-r hover:from-[#C48B46] hover:to-[#A86F24] hover:text-white transition-all text-[8.5px] sm:text-[9.5px] font-bold tracking-wider w-fit cursor-pointer shadow-2xs group pop-forward-sm"
              title="Open 24/7 Hotel AI Concierge"
            >
              <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-[#C48B46] group-hover:text-white transition-colors" />
              <span>24/7 Luxury AI Concierge</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 xs:space-x-2 sm:space-x-3 flex-shrink-0">
          {/* Quick Search Button in Header */}
          <button
            type="button"
            onClick={() => setIsSearchOpen(true)}
            className="w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#EDE5DA] flex items-center justify-center text-[#1F1A17] hover:bg-[#F3ECE0] hover:text-[#C48B46] transition-colors cursor-pointer pop-forward-sm glow-on-hover"
            title="Search dishes & menu"
            aria-label="Search Menu"
          >
            <Search className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#E5A645]" />
          </button>

          {onOpenAssistant && (
            <button
              onClick={onOpenAssistant}
              className="flex items-center space-x-1.5 px-2.5 py-1.5 xs:px-3 xs:py-1.5 sm:px-3.5 sm:py-2 rounded-full bg-white border border-[#EBE3D7] shadow-sm text-[10.5px] xs:text-[11px] sm:text-xs font-semibold text-[#8C7D73] hover:text-[#C48B46] hover:border-[#E5A645] transition-all cursor-pointer pop-forward-sm glow-on-hover"
              title="Ask AI Concierge"
            >
              <Sparkles className="w-3 h-3 xs:w-3.5 xs:h-3.5 text-[#E5A645]" />
              <span className="hidden sm:inline">AI Concierge</span>
            </button>
          )}

          <button
            onClick={openCart}
            className="relative w-9 h-9 xs:w-10 xs:h-10 sm:w-11 sm:h-11 md:w-12 md:h-12 rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] border border-[#EDE5DA] flex items-center justify-center text-[#1F1A17] hover:bg-[#F3ECE0] transition-colors cursor-pointer pop-forward-sm glow-on-hover"
            title="Open Cart"
            aria-label="Shopping Cart"
          >
            <ShoppingBag className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#1F1A17]" />
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 xs:w-5 xs:h-5 rounded-full bg-[#E5A645] text-white text-[8.5px] xs:text-[9px] sm:text-[10px] font-bold flex items-center justify-center shadow">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 
        MAIN HERO ROW: STRICTLY SIDE-BY-SIDE (Left Text, Right Plate)
        Text is ALWAYS on the LEFT side of the plate, exactly as shown in screenshot!
      */}
      <div className="max-w-7xl mx-auto flex flex-row items-center justify-between gap-2 sm:gap-6 lg:gap-10">
        
        {/* LEFT SIDE: Luxury Hotel Badge + "We Serve The Test You Love 😍" + Subtitle + Explore Food & Search */}
        <div className="w-[46%] sm:w-1/2 lg:w-[48%] flex flex-col items-start text-left z-10 flex-shrink-0">
          
          {/* Ultra-Stylish Luxury Hotel Badge */}
          <div className="inline-flex items-center space-x-1 xs:space-x-1.5 sm:space-x-2 px-2 py-0.5 sm:px-3.5 sm:py-1.5 rounded-full bg-gradient-to-r from-[#F5EAD7] via-[#FFF9F0] to-[#F5EAD7] border border-[#E5A645]/40 shadow-xs mb-1.5 sm:mb-3.5">
            <Crown className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 text-[#C48B46]" />
            <span className="font-cinzel text-[8.5px] xs:text-[9.5px] sm:text-[11px] md:text-xs font-bold tracking-[0.14em] uppercase text-[#2B231D]">
              Luxury Hotel
            </span>
            <span className="text-[#E5A645] text-[7.5px] xs:text-[8px] sm:text-[9px] tracking-widest hidden xs:inline">
              ★★★★★
            </span>
          </div>

          {/* Main Headline (Exact font & emoji from screenshot) */}
          <h1 className="font-poppins text-lg xs:text-xl sm:text-3xl md:text-5xl lg:text-6xl font-extrabold text-[#1F1A17] tracking-tight leading-[1.18] mb-1.5 sm:mb-4">
            We Serve The Test
            <br />
            You Love <span className="inline-block text-lg xs:text-xl sm:text-3xl md:text-5xl align-middle">😍</span>
          </h1>

          {/* Subtitle / Description (Exact text from screenshot) */}
          <p className="text-[#7D736A] text-[9.5px] xs:text-[11px] sm:text-xs md:text-sm leading-relaxed max-w-md mb-2.5 sm:mb-6 lg:mb-8 font-sans-modern line-clamp-3 sm:line-clamp-none">
            This is a type of restaurant which typically serves food and drinks, in addition to light refreshments such as baked goods or snacks. The term comes from the rench word meaning food.
          </p>

          {/* Action Buttons: Explore Food & Search */}
          <div className="flex items-center gap-1.5 sm:gap-3 md:gap-4 flex-wrap">
            <button
              onClick={() => handleScrollTo('popular-dishes')}
              className="px-2.5 py-1.5 xs:px-3.5 xs:py-2 sm:px-6 sm:py-2.5 md:px-8 md:py-3.5 rounded-full bg-[#E5A645] hover:bg-[#D49534] text-white font-semibold text-[10px] xs:text-xs md:text-sm shadow-md shadow-[#E5A645]/25 active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap pop-forward-sm glow-on-hover"
            >
              Explore Food
            </button>

            <button
              type="button"
              onClick={() => setIsSearchOpen(true)}
              className="px-2 py-1.5 xs:px-3 xs:py-2 sm:px-5 sm:py-2.5 md:px-6 md:py-3 rounded-full bg-white hover:bg-[#FFF9EE] text-[#2B231D] border-2 border-[#E5A645] font-semibold text-[10px] xs:text-xs md:text-sm flex items-center space-x-1 sm:space-x-2 shadow-sm active:scale-95 transition-all duration-200 cursor-pointer whitespace-nowrap pop-forward-sm glow-on-hover"
            >
              <Search className="w-3 h-3 sm:w-3.5 sm:h-3.5 md:w-4 md:h-4 text-[#E5A645]" />
              <span>Search Dishes</span>
            </button>
          </div>

        </div>

        {/* 
          RIGHT SIDE: Concentric Ripple Rings + Plate + 5 Floating Category Pills
          Engineered so on mobile, tablet & desktop the plate is 100% visible, fully round,
          spinning smoothly with rising steam, and the category pills sit beside it without covering the plate!
        */}
        <div className="w-[54%] sm:w-[52%] md:w-[52%] lg:w-[52%] relative flex items-center justify-between sm:justify-end sm:gap-3 md:gap-4 lg:gap-8 min-h-[190px] xs:min-h-[210px] sm:min-h-[290px] md:min-h-[370px] lg:min-h-[460px]">
          
          {/* Plate & Concentric Rings Center Anchor */}
          <div className="relative flex items-center justify-center flex-shrink-0">
            
            {/* Concentric Circle Rings Background - centered directly on the plate */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none flex items-center justify-center">
              {/* Outer ring */}
              <div className="w-[130px] h-[130px] xs:w-[150px] xs:h-[150px] sm:w-[230px] sm:h-[230px] md:w-[300px] md:h-[300px] lg:w-[400px] lg:h-[400px] xl:w-[460px] xl:h-[460px] rounded-full border border-[#EDE3D4]/80" />
              {/* Middle ring */}
              <div className="absolute w-[110px] h-[110px] xs:w-[130px] xs:h-[130px] sm:w-[190px] sm:h-[190px] md:w-[250px] md:h-[250px] lg:w-[330px] lg:h-[330px] xl:w-[380px] xl:h-[380px] rounded-full border border-[#E9DEC9]/60" />
              {/* Inner warm glow background */}
              <div className="absolute w-[90px] h-[90px] xs:w-[110px] xs:h-[110px] sm:w-[150px] sm:h-[150px] md:w-[200px] md:h-[200px] lg:w-[260px] lg:h-[260px] xl:w-[320px] xl:h-[320px] rounded-full bg-[#F5ECDC]/50" />
            </div>

            {/* Floating Fresh Salad / Herb Leaf */}
            <div className="absolute -top-3 sm:top-2 -right-1 sm:right-1/4 w-6 h-6 sm:w-12 sm:h-12 md:w-16 md:h-16 pointer-events-none z-20 animate-bounce duration-1000">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                <path d="M20,60 C35,20 65,10 85,25 C80,50 60,75 35,70 Z" fill="#4B7A38" />
                <path d="M25,58 C45,35 65,30 80,28" stroke="#335624" strokeWidth="2.5" strokeLinecap="round" />
                <path d="M38,62 C50,50 65,42 75,38" stroke="#5E9447" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </div>

            {/* 
              CIRCULAR TOP-DOWN CERAMIC PLATE:
              - 100% visible on all devices, completely unobstructed, zero clipping!
              - Continuous 360-degree slow motion rotation
              - Changes dish every 2 seconds
            */}
            <div className="relative z-10 w-[92px] h-[92px] xs:w-[108px] xs:h-[108px] sm:w-[170px] sm:h-[170px] md:w-[220px] md:h-[220px] lg:w-[290px] lg:h-[290px] xl:w-[330px] xl:h-[330px] rounded-full shadow-[0_12px_32px_-8px_rgba(43,35,29,0.28)] border-[3px] xs:border-[4px] sm:border-[5px] md:border-[7px] lg:border-[8px] border-white bg-white hover:scale-105 transition-transform duration-500 flex-shrink-0">
              {/* Slow motion continuous spinning plate container */}
              <div className="w-full h-full rounded-full overflow-hidden relative animate-spin-slow will-change-transform">
                {heroDishes.map((dish, idx) => {
                  const isActive = idx === currentDishIndex;
                  return (
                    <div
                      key={dish.id}
                      className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
                        isActive ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'
                      }`}
                    >
                      <img
                        src={dish.image}
                        alt={dish.name}
                        className="w-full h-full object-cover object-center pointer-events-none select-none"
                        referrerPolicy="no-referrer"
                        loading={idx === 0 ? 'eager' : 'lazy'}
                      />
                    </div>
                  );
                })}
              </div>

              {/* Realistic Rising Steam (Bhap) Effect - Hot freshly served food */}
              <SteamEffect />
            </div>

          </div>

          {/* 
            RIGHT VERTICAL STACK OF 5 CATEGORY PILLS (Enhanced with 5-Star Reviews & larger touch area)
            Dishes, Dessert, Drinks, Platter, Snacks
            Sits neatly beside the plate with zero overlap on phone, tablet & desktop!
          */}
          <div className="flex flex-col space-y-1 xs:space-y-1.5 sm:space-y-2 md:space-y-2.5 lg:space-y-3 z-20 flex-shrink-0 ml-1 sm:ml-0">
            {categories.map((cat) => {
              const isSelected = activeCategory === cat.name;
              return (
                <button
                  key={cat.name}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    handleScrollTo('popular-dishes');
                  }}
                  className={`flex items-center space-x-1 sm:space-x-2 px-1.5 py-1 xs:px-2.5 xs:py-1.5 sm:px-2.5 sm:py-1.5 md:px-3.5 md:py-2 lg:px-4 lg:py-2.5 rounded-full bg-white border border-[#EBE3D7] shadow-xs hover:shadow-md hover:border-[#E5A645] transition-all duration-200 cursor-pointer pop-forward-sm glow-on-hover ${
                    isSelected ? 'ring-2 ring-[#E5A645] shadow-md border-[#E5A645] bg-[#FFFDF9]' : ''
                  }`}
                >
                  <span className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-4.5 sm:h-4.5 md:w-5 md:h-5 lg:w-6 lg:h-6 rounded-full bg-[#FAF5EE] flex items-center justify-center text-[8.5px] xs:text-[9px] sm:text-[10px] md:text-xs lg:text-sm shadow-2xs flex-shrink-0">
                    {cat.icon}
                  </span>
                  <div className="flex flex-col items-start leading-tight">
                    <span className="font-poppins text-[8.5px] xs:text-[9.5px] sm:text-[10px] md:text-[11px] lg:text-xs font-bold text-[#2B231D] tracking-tight whitespace-nowrap">
                      {cat.name}
                    </span>
                    <span className="text-[7.5px] xs:text-[8.5px] sm:text-[8.5px] md:text-[9px] text-[#F5A623] font-black tracking-tighter hidden xs:inline">
                      ★★★★★ 5.0
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Dotted Decorative Pattern on Far Right Edge (Desktop only) */}
          <div className="hidden xl:grid absolute -right-1 sm:right-0 top-1/2 -translate-y-1/2 w-8 sm:w-14 h-16 sm:h-24 opacity-35 pointer-events-none grid-cols-3 gap-1.5 sm:gap-2.5">
            {Array.from({ length: 15 }).map((_, i) => (
              <div key={i} className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#8A8177]" />
            ))}
          </div>

        </div>

      </div>

      {/* 
        CRYSTAL-CLEAR FULL-SCREEN RESPONSIVE SEARCH MODAL
        100% visible on Phone, Tablet, and Desktop — Never clipped!
      */}
      {isSearchOpen && (
        <div
          className="fixed inset-0 z-[9999] bg-black/65 backdrop-blur-sm flex items-start justify-center pt-8 sm:pt-16 md:pt-20 px-3 sm:px-6 animate-in fade-in duration-200"
          onClick={() => setIsSearchOpen(false)}
        >
          <div
            className="w-full max-w-xl bg-white rounded-2xl sm:rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.35)] border-2 border-[#E5A645]/40 overflow-hidden flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search Bar Header */}
            <div className="p-3 sm:p-4 bg-gradient-to-r from-[#FFFDF9] via-white to-[#FAF5EE] border-b border-[#E8DEC8] flex items-center gap-2 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#FAF0E2] border border-[#E5A645]/40 flex items-center justify-center flex-shrink-0">
                <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#C48B46]" />
              </div>

              <div className="flex-1 relative flex items-center">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search pasta, shawarma, fish curry, pizza..."
                  className="w-full bg-[#FAF8F5] border border-[#E8DEC8] focus:border-[#E5A645] rounded-full px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm md:text-base text-[#1F1A17] placeholder-[#8E8379] focus:outline-none transition-colors"
                  autoFocus
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 p-1 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
                    title="Clear text"
                  >
                    <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gray-100 hover:bg-gray-200 text-[#1F1A17] flex items-center justify-center transition-colors flex-shrink-0 cursor-pointer"
                title="Close search"
                aria-label="Close search"
              >
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            {/* Body: Live Results, Empty State, or "Sorry this item is not available for now" */}
            <div className="overflow-y-auto p-3 sm:p-4 divide-y divide-[#F5EFE6]">
              {trimmedQuery.length === 0 ? (
                /* Initial State with Quick Search Suggestions */
                <div className="py-4 px-2 text-center">
                  <p className="text-xs sm:text-sm font-semibold text-[#8C5D19] uppercase tracking-wider mb-2.5">
                    ✦ Popular Menu Searches ✦
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center mb-4">
                    {['Pasta', 'Chicken Shawarma', 'Fish Curry', 'French Fries', 'Wood-Fired Pizza', 'Crispy Salmon', 'Steak', 'Desserts'].map(
                      (item) => (
                        <button
                          key={item}
                          type="button"
                          onClick={() => setSearchQuery(item)}
                          className="px-3 py-1.5 rounded-full bg-[#FAF5EE] hover:bg-[#E5A645] hover:text-white border border-[#E8DEC8] text-[#8C5D19] text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95"
                        >
                          ✦ {item}
                        </button>
                      )
                    )}
                  </div>
                  <p className="text-[11px] sm:text-xs text-[#8E8379]">
                    Type any dish name, category, or ingredient above to instantly search our menu.
                  </p>
                </div>
              ) : searchResults.length > 0 ? (
                /* AVAILABLE ITEMS FOUND */
                <div className="flex flex-col">
                  <div className="pb-2.5 flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#A86F24]">
                      Available on Menu ({searchResults.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        handleScrollTo('menu');
                        setIsSearchOpen(false);
                      }}
                      className="text-xs font-semibold text-[#C48B46] hover:underline flex items-center space-x-1 cursor-pointer"
                    >
                      <span>View in Digital Menu</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="divide-y divide-[#F5EFE6] space-y-1">
                    {searchResults.map((dish) => {
                      const isAdded = recentlyAddedId === dish.id;
                      return (
                        <div
                          key={dish.id}
                          className="p-2.5 sm:p-3 hover:bg-[#FAF7F2] transition-colors flex items-center justify-between gap-3 group rounded-xl"
                        >
                          <div className="flex items-center space-x-3 min-w-0">
                            <img
                              src={dish.image}
                              alt={dish.name}
                              className="w-13 h-13 sm:w-16 sm:h-16 rounded-xl object-cover border border-[#E8DEC8] flex-shrink-0 shadow-xs"
                            />
                            <div className="min-w-0">
                              <div className="flex items-center space-x-2 flex-wrap">
                                <h4 className="text-xs sm:text-sm font-bold text-[#1F1A17] group-hover:text-[#B6732E] transition-colors truncate">
                                  {dish.name}
                                </h4>
                                <span className="px-2 py-0.5 rounded-full bg-[#FAF0E2] text-[9.5px] font-semibold text-[#8C5D19]">
                                  {dish.category}
                                </span>
                              </div>
                              {/* 5-Star Reviews */}
                              <div className="flex items-center space-x-0.5 text-[#F5A623] my-1">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star key={i} className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" />
                                ))}
                                <span className="text-[11px] font-bold text-[#1F1A17] ml-1">5.0</span>
                              </div>
                              <span className="text-xs sm:text-sm font-extrabold text-[#1F1A17] font-poppins">
                                {RESTAURANT_CONFIG.currency.symbol}{dish.price.toFixed(2)}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => handleQuickAdd(e, dish)}
                            className={`px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs font-semibold flex items-center space-x-1.5 transition-all flex-shrink-0 cursor-pointer ${
                              isAdded
                                ? 'bg-emerald-600 text-white'
                                : 'bg-[#E5A645] hover:bg-[#D49534] text-white shadow-sm'
                            }`}
                          >
                            {isAdded ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Added!</span>
                              </>
                            ) : (
                              <>
                                <Plus className="w-3.5 h-3.5" />
                                <span>Add</span>
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                /* EXACT MESSAGE REQUESTED: Sorry, this item is not available for now */
                <div className="py-6 sm:py-8 px-4 text-center bg-white flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FAF0E2] to-[#F5E2C9] border border-[#DFCBB0] flex items-center justify-center text-[#B6732E] mb-3 shadow-sm">
                    <Search className="w-6 h-6 text-[#B6732E]" />
                  </div>

                  <h4 className="font-serif-luxury text-lg sm:text-xl font-bold text-[#1F1A17] mb-1.5">
                    Sorry, this item is not available for now
                  </h4>

                  <p className="text-xs sm:text-sm text-[#786C64] font-sans-modern mb-4 max-w-sm">
                    We could not find &ldquo;<span className="font-semibold text-[#1F1A17]">{searchQuery}</span>&rdquo; in our current menu. You may relish these signature house favorites:
                  </p>

                  <div className="flex flex-wrap gap-2 justify-center max-w-md">
                    {['Pasta', 'Chicken Shawarma', 'Fish Curry', 'French Fries', 'Wood-Fired Pizza', 'Grilled Salmon', 'Gourmet Steak'].map(
                      (suggestion) => (
                        <button
                          key={suggestion}
                          type="button"
                          onClick={() => setSearchQuery(suggestion)}
                          className="px-3 py-1.5 rounded-full bg-[#FAF5EE] hover:bg-[#E5A645] hover:text-white border border-[#E5A645]/40 text-[#8C5D19] text-xs font-semibold transition-all cursor-pointer shadow-2xs active:scale-95"
                        >
                          ✦ {suggestion}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
