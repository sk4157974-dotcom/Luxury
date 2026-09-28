import React, { useState, useRef } from 'react';
import { ArrowLeft, ArrowRight, Star, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { MenuItem } from '../types';
import { useCart } from '../context/CartContext';
import { RESTAURANT_CONFIG } from '../config/restaurant';

export const ChefRecommendations: React.FC = () => {
  const [recentlyAddedId, setRecentlyAddedId] = useState<string | null>(null);
  const [activeTouchCardId, setActiveTouchCardId] = useState<string | null>(null);
  const [activeDishId, setActiveDishId] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const { addToCart } = useCart();

  const centerCardInContainer = (cardElement: HTMLElement) => {
    const container = scrollContainerRef.current;
    if (!container || !cardElement) return;

    const containerRect = container.getBoundingClientRect();
    const cardRect = cardElement.getBoundingClientRect();
    const currentScroll = container.scrollLeft;

    const containerCenter = containerRect.left + containerRect.width / 2;
    const cardCenter = cardRect.left + cardRect.width / 2;
    const diff = cardCenter - containerCenter;

    container.scrollTo({
      left: currentScroll + diff,
      behavior: 'smooth'
    });
  };

  const handleDishClick = (dishId: string, e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setActiveDishId(dishId);
    setActiveTouchCardId(dishId);
    const cardEl = (e.currentTarget.closest('.pop-card-wrapper') || e.currentTarget) as HTMLElement;
    document.querySelectorAll('.lighting-active, .card-popped-front').forEach((el) => {
      el.classList.remove('lighting-active', 'card-popped-front');
    });
    cardEl.classList.add('lighting-active', 'card-popped-front');
    const face = cardEl.querySelector('.card-solid-face');
    if (face) face.classList.add('lighting-active', 'card-popped-front');
    centerCardInContainer(cardEl);
  };

  // Dynamic light tracking on mouse move / touch
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardTouchMove = (e: React.TouchEvent<HTMLDivElement>, dishId?: string) => {
    if (dishId) setActiveTouchCardId(dishId);
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
      e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  // POPULAR DISHES (8 SIGNATURE CHEF RECOMMENDATIONS WITH UNIFIED 3D LIGHT & ANIMATIONS)
  const popularDishes: (MenuItem & { buttonStyle?: 'filled' | 'outline' })[] = [
    {
      id: 'pop-dish-1',
      name: 'Pasta',
      category: 'Main Course',
      price: 35.00,
      description: 'Pasta is a type of food typically made from an unleavened dough.',
      rating: 5,
      reviewsCount: 142,
      image: '/src/assets/images/popular_pasta_1789191067562.jpg',
      buttonStyle: 'outline'
    },
    {
      id: 'pop-dish-2',
      name: 'French Fires',
      category: 'Snacks',
      price: 55.00,
      description: 'Pasta is a type of food typically made from an unleavened dough.',
      rating: 4,
      reviewsCount: 98,
      image: '/src/assets/images/popular_fries_1789191080889.jpg',
      buttonStyle: 'outline'
    },
    {
      id: 'pop-dish-3',
      name: 'Chicken Shawarma',
      category: 'Main Course',
      price: 35.00,
      description: 'Pasta is a type of food typically made from an unleavened dough.',
      rating: 3,
      reviewsCount: 84,
      image: '/src/assets/images/popular_shawarma_1789191094574.jpg',
      buttonStyle: 'filled'
    },
    {
      id: 'pop-dish-4',
      name: 'Fish Curry',
      category: 'Main Course',
      price: 35.00,
      description: 'Pasta is a type of food typically made from an unleavened dough.',
      rating: 5,
      reviewsCount: 165,
      image: '/src/assets/images/popular_fish_curry_1789191110264.jpg',
      buttonStyle: 'outline'
    },
    {
      id: 'pop-dish-5',
      name: 'Crispy Atlantic Salmon',
      category: 'Main Course',
      price: 799.00,
      description: 'Pan-roasted Atlantic salmon fillet with lemon citrus reduction and garden herbs.',
      rating: 5,
      reviewsCount: 195,
      image: '/src/assets/images/flavoria_salmon_dish_1789106035046.jpg',
      buttonStyle: 'filled'
    },
    {
      id: 'pop-dish-6',
      name: 'Wood-Fired Pizza',
      category: 'Pizza',
      price: 499.00,
      description: 'Artisanal stone-hearth pizza with San Marzano tomato reduction and buffalo mozzarella.',
      rating: 5,
      reviewsCount: 148,
      image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=600&q=80',
      buttonStyle: 'outline'
    },
    {
      id: 'pop-dish-7',
      name: 'Gourmet Steak Plate',
      category: 'Platters',
      price: 899.00,
      description: 'Flame-seared tenderloin medallion with rosemary jus and grilled asparagus.',
      rating: 5,
      reviewsCount: 172,
      image: '/src/assets/images/hero_steak_plate_1789191695883.jpg',
      buttonStyle: 'filled'
    },
    {
      id: 'pop-dish-8',
      name: 'Tiger Prawn Pasta',
      category: 'Main Course',
      price: 649.00,
      description: 'Handmade ribbon pasta tossed with succulent garlic butter tiger prawns and parmesan.',
      rating: 5,
      reviewsCount: 136,
      image: '/src/assets/images/flavoria_pasta_plate_1789106011546.jpg',
      buttonStyle: 'outline'
    }
  ];

  const handleAddToCart = (dish: MenuItem) => {
    addToCart(dish, 1);
    setRecentlyAddedId(dish.id);
    setTimeout(() => {
      setRecentlyAddedId(null);
    }, 1500);
  };

  const handlePrev = () => {
    if (scrollContainerRef.current) {
      const card = scrollContainerRef.current.querySelector('.pop-card-wrapper') as HTMLElement | null;
      const step = card ? card.offsetWidth + 20 : 280;
      scrollContainerRef.current.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const handleNext = () => {
    if (scrollContainerRef.current) {
      const card = scrollContainerRef.current.querySelector('.pop-card-wrapper') as HTMLElement | null;
      const step = card ? card.offsetWidth + 20 : 280;
      scrollContainerRef.current.scrollBy({ left: step, behavior: 'smooth' });
    }
  };

  return (
    <motion.section
      id="popular-dishes"
      className="w-full bg-[#FAF8F5] pt-4 sm:pt-6 pb-8 sm:pb-14 px-3 sm:px-6 md:px-10 lg:px-14 overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto">
        
        {/* SECTION HEADER: Popular Dishes + Left/Right Round Navigation Buttons */}
        <div className="flex items-center justify-between mb-4 sm:mb-8 px-1 sm:px-0">
          <div>
            <h2 className="font-poppins text-xl sm:text-3xl md:text-4xl font-extrabold text-[#1F1A17] tracking-tight">
              Popular Dishes
            </h2>
            <p className="text-[11px] sm:text-sm text-[#8E8379] font-sans-modern mt-0.5 sm:mt-1">
              Top curated favorites crafted to perfection
            </p>
          </div>

          {/* Nav arrows matching screenshot (left pale, right golden) */}
          <div className="flex items-center space-x-1.5 sm:space-x-3">
            <button
              type="button"
              onClick={handlePrev}
              aria-label="Previous dishes"
              className="w-8.5 h-8.5 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full bg-[#FAF0E2] hover:bg-[#F2E4D2] text-[#827263] flex items-center justify-center transition-colors cursor-pointer active:scale-95 glow-on-hover"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={handleNext}
              aria-label="Next dishes"
              className="w-8.5 h-8.5 xs:w-9 xs:h-9 sm:w-10 sm:h-10 rounded-full bg-[#E5A645] hover:bg-[#D49534] text-white flex items-center justify-center shadow-md shadow-[#E5A645]/30 transition-colors cursor-pointer active:scale-95 glow-on-hover lighting-beam-sweep"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 
          POPULAR DISH CARDS:
          - Proportionally scaled for Phone & Tablet (never oversized!)
          - 2 cards neatly visible on phones, 3+ on tablets
          - Frictionless silky smooth momentum scrolling with zero stutter
        */}
        <div
          ref={scrollContainerRef}
          data-scroll-container="true"
          className="flex gap-3 sm:gap-5 md:gap-6 overflow-x-auto overscroll-x-contain py-3 sm:py-5 px-3 xs:px-4 sm:px-6 md:px-8 snap-x snap-proximity scrollbar-none"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
        >
          {popularDishes.map((dish, idx) => {
            const isAdded = recentlyAddedId === dish.id;
            const isSelected = activeDishId === dish.id;

            return (
              <motion.div
                key={dish.id}
                id={`popular-card-${dish.id}`}
                onClick={(e) => handleDishClick(dish.id, e)}
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  setActiveDishId(dish.id);
                  setActiveTouchCardId(dish.id);
                  const cardEl = (e.currentTarget.closest('.pop-card-wrapper') || e.currentTarget) as HTMLElement;
                  document.querySelectorAll('.lighting-active, .card-popped-front').forEach((el) => {
                    el.classList.remove('lighting-active', 'card-popped-front');
                  });
                  cardEl.classList.add('lighting-active', 'card-popped-front');
                  const face = cardEl.querySelector('.card-solid-face');
                  if (face) face.classList.add('lighting-active', 'card-popped-front');
                }}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: idx * 0.05, ease: [0.16, 1, 0.3, 1] }}
                className="pop-card-wrapper relative group w-[165px] xs:w-[185px] sm:w-[225px] md:w-[250px] lg:w-[280px] flex-shrink-0 snap-center cursor-pointer transition-transform duration-300 hover:scale-[1.01]"
              >
                {/* Solid 100% Opaque White Card Face */}
                <div className="card-solid-face relative z-10 w-full h-full bg-white rounded-xl sm:rounded-2xl p-2.5 xs:p-3 sm:p-4 md:p-5 border border-[#F2ECE3] shadow-xs hover:shadow-md transition-all duration-300 flex flex-col justify-between text-center">
                  {/* Dish Image Container */}
                  <div className="relative w-full aspect-[4/3] max-h-24 xs:max-h-28 sm:max-h-36 flex items-center justify-center overflow-hidden mb-2 sm:mb-3 bg-white rounded-lg sm:rounded-xl">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-contain group-hover:scale-108 transition-transform duration-500 pointer-events-none"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                    />
                  </div>

                  {/* Dish Info */}
                  <div className="flex flex-col items-center bg-white flex-1 justify-center">
                    <h3 className="font-poppins text-xs xs:text-sm sm:text-base font-bold text-[#1F1A17] tracking-tight mb-0.5 sm:mb-1 group-hover:text-[#B6732E] transition-colors truncate max-w-full">
                      {dish.name}
                    </h3>

                    {/* Star Rating Icons (Exact count per dish) */}
                    <div className="flex items-center space-x-0.5 text-[#F5A623] mb-1 sm:mb-2">
                      {Array.from({ length: 5 }).map((_, starIndex) => (
                        <Star
                          key={starIndex}
                          className={`w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 ${
                            starIndex < Math.round(dish.rating)
                              ? 'fill-[#F5A623] text-[#F5A623]'
                              : 'text-gray-200'
                          }`}
                        />
                      ))}
                    </div>

                    {/* Description */}
                    <p className="text-[10px] xs:text-[11px] sm:text-xs text-[#8E8379] leading-relaxed max-w-full font-sans-modern mb-2 sm:mb-3 line-clamp-2">
                      {dish.description}
                    </p>
                  </div>

                  {/* Bottom Row: Price + Add To Cart Button */}
                  <div className="flex items-center justify-between pt-2 sm:pt-3 border-t border-[#F5EFE6] bg-white gap-1">
                    {/* Price in Indian Rupees */}
                    <span className="font-poppins text-xs xs:text-sm sm:text-base md:text-lg font-extrabold text-[#1F1A17]">
                      {RESTAURANT_CONFIG.currency.symbol}{dish.price.toFixed(2)}
                    </span>

                    {/* Add To Cart Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAddToCart(dish);
                      }}
                      className={`px-2.5 xs:px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-full text-[10px] xs:text-[11px] sm:text-xs font-semibold transition-all duration-200 flex items-center space-x-1 cursor-pointer active:scale-95 lighting-beam-sweep whitespace-nowrap ${
                        isAdded
                          ? 'bg-emerald-600 text-white'
                          : dish.buttonStyle === 'filled'
                          ? 'bg-[#E5A645] hover:bg-[#D49534] text-white shadow-xs glow-on-hover'
                          : 'bg-white hover:bg-[#FAF5EE] text-[#1F1A17] border border-[#E5A645] glow-on-hover'
                      }`}
                    >
                      {isAdded ? (
                        <>
                          <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                          <span>Added!</span>
                        </>
                      ) : (
                        <span>Add To Cart</span>
                      )}
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </motion.section>
  );
};
