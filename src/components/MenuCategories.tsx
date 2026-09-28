import React, { useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { RESTAURANT_CONFIG } from '../config/restaurant';
import { MenuCategoryType } from '../types';

interface MenuCategoriesProps {
  onSelectCategory: (category: MenuCategoryType) => void;
}

export const MenuCategories: React.FC<MenuCategoriesProps> = ({ onSelectCategory }) => {
  const categories = RESTAURANT_CONFIG.categories;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

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

  const handleClick = (catId: MenuCategoryType, e: React.MouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button')) return;
    setActiveCategoryId(catId);
    onSelectCategory(catId);
    const cardEl = (e.currentTarget.closest('.pop-card-wrapper') || e.currentTarget) as HTMLElement;
    document.querySelectorAll('.lighting-active, .card-popped-front').forEach((el) => {
      el.classList.remove('lighting-active', 'card-popped-front');
    });
    cardEl.classList.add('lighting-active', 'card-popped-front');
    const face = cardEl.querySelector('.card-solid-face');
    if (face) face.classList.add('lighting-active', 'card-popped-front');
    centerCardInContainer(cardEl);
  };

  const handleScrollToMenu = (e: React.MouseEvent, catId: MenuCategoryType) => {
    e.stopPropagation();
    setActiveCategoryId(catId);
    onSelectCategory(catId);
    const card = (e.currentTarget as HTMLElement).closest('.pop-card-wrapper') as HTMLElement | null;
    if (card) {
      centerCardInContainer(card);
    }
    const menuSection = document.querySelector('#menu');
    if (menuSection) {
      const offset = 80;
      const pos = menuSection.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top: pos, behavior: 'smooth' });
    }
  };

  const scrollLeft = () => {
    if (scrollContainerRef.current) {
      const card = scrollContainerRef.current.querySelector('.pop-card-wrapper') as HTMLElement | null;
      const step = card ? card.offsetWidth + 20 : 250;
      scrollContainerRef.current.scrollBy({ left: -step, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollContainerRef.current) {
      const card = scrollContainerRef.current.querySelector('.pop-card-wrapper') as HTMLElement | null;
      const step = card ? card.offsetWidth + 20 : 250;
      scrollContainerRef.current.scrollBy({ left: step, behavior: 'smooth' });
    }
  };

  return (
    <motion.section
      id="categories"
      className="py-8 sm:py-14 md:py-20 bg-[#FAF7F2] relative border-y border-[#EBE5DC] overflow-hidden"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        
        {/* Section Header with Left-Right Carousel Arrows matching screenshot */}
        <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between mb-6 sm:mb-10">
          <div>
            <div className="flex items-center space-x-2 mb-1 sm:mb-2">
              <span className="text-[10px] sm:text-[11px] uppercase font-sans-modern tracking-[0.25em] text-[#C48B46] font-semibold block">
                CULINARY COURSES
              </span>
              <span className="text-[#E5A645] text-[11px] sm:text-xs tracking-wider">★★★★★ 5.0</span>
            </div>
            <h2
              id="categories-title"
              className="font-serif-luxury text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-normal text-[#1F1A17] tracking-tight uppercase"
            >
              Our Menu Categories
            </h2>
            <p className="text-xs sm:text-sm md:text-base text-[#685D56] font-sans-modern mt-1 sm:mt-2 max-w-xl">
              Explore Our Diverse Selection Of Handcrafted Dishes, Freshly Prepared Daily
            </p>
          </div>

          {/* Carousel Arrows */}
          <div className="flex items-center space-x-2 sm:space-x-3 mt-3 sm:mt-0">
            <button
              onClick={scrollLeft}
              type="button"
              aria-label="Scroll categories left"
              className="p-2.5 sm:p-3 rounded-full bg-white border border-[#E8DEC8] text-[#1F1A17] hover:text-[#C48B46] hover:border-[#C48B46] shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-95 glow-on-hover"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={scrollRight}
              type="button"
              aria-label="Scroll categories right"
              className="p-2.5 sm:p-3 rounded-full bg-white border border-[#E8DEC8] text-[#1F1A17] hover:text-[#C48B46] hover:border-[#C48B46] shadow-sm hover:shadow transition-all duration-200 cursor-pointer active:scale-95 glow-on-hover"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        </div>

        {/* 
          Categories Carousel:
          - Proportionally scaled for Phone & Tablet (never oversized!)
          - 2 cards neatly visible on phones, 3+ on tablets
          - Prominent 5-Star Reviews maintained
          - Frictionless silky smooth momentum scrolling with zero stutter
        */}
        <div
          ref={scrollContainerRef}
          id="categories-container"
          data-scroll-container="true"
          className="flex gap-3 sm:gap-5 md:gap-6 overflow-x-auto overscroll-x-contain py-3 sm:py-5 px-3 xs:px-4 sm:px-6 md:px-8 scrollbar-none snap-x snap-proximity"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch', touchAction: 'pan-x pan-y' }}
        >
          {categories.map((category, idx) => {
            const isSelected = activeCategoryId === category.id;

            return (
              <motion.div
                key={category.id}
                onClick={(e) => handleClick(category.id, e)}
                onPointerDown={(e) => {
                  if ((e.target as HTMLElement).closest('button')) return;
                  setActiveCategoryId(category.id);
                  onSelectCategory(category.id);
                  const cardEl = (e.currentTarget.closest('.pop-card-wrapper') || e.currentTarget) as HTMLElement;
                  document.querySelectorAll('.lighting-active, .card-popped-front').forEach((el) => {
                    el.classList.remove('lighting-active', 'card-popped-front');
                  });
                  cardEl.classList.add('lighting-active', 'card-popped-front');
                  const face = cardEl.querySelector('.card-solid-face');
                  if (face) face.classList.add('lighting-active', 'card-popped-front');
                }}
                id={`category-card-${category.id.toLowerCase().replace(/\s+/g, '-')}`}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-20px' }}
                transition={{ duration: 0.4, delay: idx * 0.05 }}
                className="flex-shrink-0 w-[165px] xs:w-[185px] sm:w-[225px] md:w-[250px] lg:w-[285px] snap-center pop-card-wrapper group cursor-pointer relative transition-transform duration-300 hover:scale-[1.01]"
              >
                {/* Solid White Card Face with direct 3D 4-corner enhanced blue light on its own square */}
                <div className="card-solid-face relative z-10 w-full h-full bg-white border border-[#E8DEC8] rounded-2xl sm:rounded-3xl p-3 xs:p-3.5 sm:p-4 md:p-5 flex flex-col items-center text-center transition-all duration-300 shadow-xs hover:shadow-lg hover:border-[#38BDF8]">
                  
                  {/* Circular Card Image with Luxury Dual Ring */}
                  <div className="relative w-20 h-20 xs:w-24 xs:h-24 sm:w-32 sm:h-32 md:w-38 md:h-38 rounded-full p-1.5 sm:p-2 bg-gradient-to-br from-white via-[#FFFDF9] to-[#FAF5EE] border-2 border-[#E8DEC8] shadow-sm group-hover:border-[#38BDF8] group-hover:shadow-md transition-all duration-300 mb-2 sm:mb-3 lighting-beam-sweep">
                    
                    {/* Inner Image Wrapper */}
                    <div className="w-full h-full rounded-full overflow-hidden relative shadow-inner">
                      <img
                        src={category.image}
                        alt={category.name}
                        loading="lazy"
                        className="w-full h-full object-cover object-center transform transition-transform duration-700 group-hover:scale-110"
                      />
                      {/* Subtle darkening on hover */}
                      <div className="absolute inset-0 bg-black/5 group-hover:bg-transparent transition-colors duration-300" />
                    </div>

                    {/* Item count badge */}
                    <span className="absolute -bottom-1 right-1 sm:right-2 px-2 py-0.5 rounded-full bg-white border border-[#38BDF8]/60 text-[9px] xs:text-[10px] sm:text-xs text-[#0284C7] font-bold font-sans-modern shadow-xs">
                      {category.itemCount} items
                    </span>
                  </div>

                  {/* Category Name */}
                  <h3 className="font-serif-luxury text-sm xs:text-base sm:text-lg md:text-xl font-bold text-[#1F1A17] group-hover:text-[#2563EB] transition-colors duration-200 tracking-wide mt-0.5 truncate max-w-full">
                    {category.name}
                  </h3>

                  {/* 5-Star Reviews */}
                  <div className="flex items-center justify-center space-x-0.5 text-[#F5A623] my-1 sm:my-1.5 flex-wrap">
                    {Array.from({ length: 5 }).map((_, starIndex) => (
                      <Star
                        key={starIndex}
                        className="w-2.5 h-2.5 xs:w-3 xs:h-3 sm:w-3.5 sm:h-3.5 fill-[#F5A623] text-[#F5A623] drop-shadow-[0_1px_2px_rgba(245,166,35,0.4)]"
                      />
                    ))}
                    <span className="text-[10px] xs:text-[11px] sm:text-xs font-bold text-[#1F1A17] ml-1 font-sans-modern">
                      5.0
                    </span>
                    <span className="text-[9px] xs:text-[10px] sm:text-[10.5px] text-[#8C7D73] font-medium hidden xs:inline ml-0.5">
                      ({category.itemCount * 32}+)
                    </span>
                  </div>

                  {/* Category Description */}
                  <p className="text-[10px] xs:text-[11px] sm:text-xs text-[#736860] leading-relaxed line-clamp-2 max-w-full mb-2 sm:mb-3 font-sans-modern">
                    {category.description}
                  </p>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={(e) => handleScrollToMenu(e, category.id)}
                    className="px-3 xs:px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full bg-[#FAF5EE] hover:bg-[#2563EB] text-[#1F1A17] hover:text-white border border-[#E8DEC8] hover:border-[#2563EB] text-[10px] xs:text-[10.5px] sm:text-xs font-bold uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-2xs glow-on-hover whitespace-nowrap mt-auto"
                  >
                    Explore →
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </motion.section>
  );
};
