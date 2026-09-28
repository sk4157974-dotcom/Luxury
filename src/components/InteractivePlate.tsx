import React, { useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, Star, Plus, Move } from 'lucide-react';
import { RESTAURANT_CONFIG } from '../config/restaurant';
import { useCart } from '../context/CartContext';

interface InteractivePlateProps {
  currentIndex: number;
  onIndexChange: (index: number) => void;
}

export const InteractivePlate: React.FC<InteractivePlateProps> = ({
  currentIndex,
  onIndexChange
}) => {
  const slides = RESTAURANT_CONFIG.heroSlides;
  const { addToCart } = useCart();

  // Animation references for smooth 60fps 3D motion
  const containerRef = useRef<HTMLDivElement>(null);
  const cardWrapperRef = useRef<HTMLDivElement>(null);

  // Target and current values for smooth lerp interpolation
  const targetX = useRef(0);
  const targetY = useRef(0);
  const currentX = useRef(0);
  const currentY = useRef(0);

  // Dragging states
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartY = useRef(0);
  const dragOffsetX = useRef(0);
  const dragOffsetY = useRef(0);

  // Harmonic floating time accumulator
  const timeRef = useRef(0);
  const animFrameId = useRef<number | null>(null);

  // 2-second autoplay timer ("moves every 2s")
  const autoplayTimerRef = useRef<NodeJS.Timeout | null>(null);

  const startAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) clearInterval(autoplayTimerRef.current);
    autoplayTimerRef.current = setInterval(() => {
      if (!isDragging.current) {
        onIndexChange((currentIndex + 1) % slides.length);
      }
    }, 2000); // 2-second auto-rotation
  }, [currentIndex, onIndexChange, slides.length]);

  const stopAutoplay = useCallback(() => {
    if (autoplayTimerRef.current) {
      clearInterval(autoplayTimerRef.current);
      autoplayTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => stopAutoplay();
  }, [startAutoplay, stopAutoplay]);

  // Main 60fps animation loop: harmonic float + 3D cursor tilt + touch drag
  useEffect(() => {
    let lastTimestamp = performance.now();

    const animate = (now: number) => {
      const delta = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      timeRef.current += delta;
      const t = timeRef.current;

      // Gentle floating oscillation
      const floatY = Math.sin(t * 1.3) * 3;
      const floatX = Math.cos(t * 1.0) * 1.5;
      const floatRotZ = Math.sin(t * 0.8) * 0.5;
      const floatRotX = Math.cos(t * 1.1) * 0.8;
      const floatRotY = Math.sin(t * 0.9) * 0.8;

      // Smooth lerp
      const lerpFactor = isDragging.current ? 0.35 : 0.08;
      currentX.current += (targetX.current - currentX.current) * lerpFactor;
      currentY.current += (targetY.current - currentY.current) * lerpFactor;

      const totalX = currentX.current + dragOffsetX.current + floatX;
      const totalY = currentY.current + dragOffsetY.current + floatY;
      const tiltX = -(totalY * 0.04) + floatRotX;
      const tiltY = (totalX * 0.04) + floatRotY;
      const rotZ = floatRotZ + (dragOffsetX.current * 0.01);
      const scale = isDragging.current ? 1.015 : 1.0;

      if (cardWrapperRef.current) {
        cardWrapperRef.current.style.transform = `perspective(1000px) translate3d(${totalX.toFixed(2)}px, ${totalY.toFixed(2)}px, 0px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg) rotateZ(${rotZ.toFixed(2)}deg) scale(${scale})`;
      }

      animFrameId.current = requestAnimationFrame(animate);
    };

    animFrameId.current = requestAnimationFrame(animate);
    return () => {
      if (animFrameId.current) cancelAnimationFrame(animFrameId.current);
    };
  }, []);

  // Desktop hover tracking
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (e.clientX - centerX) / (rect.width / 2);
    const normY = (e.clientY - centerY) / (rect.height / 2);

    targetX.current = Math.max(-1.2, Math.min(1.2, normX)) * 14;
    targetY.current = Math.max(-1.2, Math.min(1.2, normY)) * 12;
  };

  const handleMouseLeave = () => {
    if (!isDragging.current) {
      targetX.current = 0;
      targetY.current = 0;
      startAutoplay();
    }
  };

  // Pointer drag events for both mouse and touch
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button, a')) return;

    isDragging.current = true;
    dragStartX.current = e.clientX;
    dragStartY.current = e.clientY;
    stopAutoplay();

    if (cardWrapperRef.current) {
      cardWrapperRef.current.setPointerCapture(e.pointerId);
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const diffX = e.clientX - dragStartX.current;
    const diffY = e.clientY - dragStartY.current;

    dragOffsetX.current = diffX * 0.75;
    dragOffsetY.current = diffY * 0.55;
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;

    // Slide swipe threshold
    const threshold = 40;
    if (dragOffsetX.current > threshold) {
      onIndexChange(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
    } else if (dragOffsetX.current < -threshold) {
      onIndexChange((currentIndex + 1) % slides.length);
    }

    // Spring back smoothly
    const releaseDuration = 280;
    const startX = dragOffsetX.current;
    const startY = dragOffsetY.current;
    const startTime = performance.now();

    const returnAnim = (time: number) => {
      const elapsed = time - startTime;
      const progress = Math.min(elapsed / releaseDuration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);

      dragOffsetX.current = startX * (1 - ease);
      dragOffsetY.current = startY * (1 - ease);

      if (progress < 1) {
        requestAnimationFrame(returnAnim);
      } else {
        dragOffsetX.current = 0;
        dragOffsetY.current = 0;
        startAutoplay();
      }
    };

    requestAnimationFrame(returnAnim);

    if (cardWrapperRef.current && cardWrapperRef.current.hasPointerCapture(e.pointerId)) {
      cardWrapperRef.current.releasePointerCapture(e.pointerId);
    }
  };

  const currentSlide = slides[currentIndex];

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const menuItem = RESTAURANT_CONFIG.menu.find(
      (m) => m.name.toLowerCase() === currentSlide.dishName.toLowerCase()
    ) || {
      id: `hero-dish-${currentSlide.id}`,
      name: currentSlide.dishName,
      category: 'Main Course' as const,
      price: currentSlide.dishPrice,
      description: currentSlide.description,
      rating: currentSlide.dishRating,
      reviewsCount: currentSlide.reviewsCount,
      image: currentSlide.image
    };

    addToCart(menuItem, 1);
  };

  return (
    <div
      ref={containerRef}
      id="hero-interactive-stage"
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full h-full min-h-[460px] sm:min-h-[500px] lg:min-h-[560px] flex items-stretch justify-stretch select-none overflow-hidden"
      style={{ touchAction: 'none' }}
    >
      {/* 
        FULL-BLEED FOOD SHOWCASE FRAME:
        - Covers 100% of the area marked by the user in red
        - Zero empty beige space on left, right, top, or bottom
        - Works seamlessly on both Phone and PC
        - High-resolution dish photography filling the full rectangle
      */}
      <div
        ref={cardWrapperRef}
        id="interactive-square-food-card"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        className="relative w-full h-full overflow-hidden bg-[#1F1A17] cursor-grab active:cursor-grabbing will-change-transform flex flex-col justify-end"
        style={{ transformStyle: 'preserve-3d' }}
        title="Touch or drag to move in 3D!"
      >
        {/* Dish Images - Fills 100% of the entire frame */}
        {slides.map((slide, idx) => {
          const isActive = idx === currentIndex;
          return (
            <div
              key={slide.id}
              className={`absolute inset-0 transition-all duration-700 ease-out ${
                isActive
                  ? 'opacity-100 scale-100'
                  : 'opacity-0 scale-105 pointer-events-none'
              }`}
            >
              <img
                src={slide.image}
                alt={slide.dishName}
                loading={idx === 0 ? 'eager' : 'lazy'}
                draggable={false}
                className="w-full h-full object-cover object-center pointer-events-none"
              />
              
              {/* Subtle luxury gradient overlay for badge & text contrast */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/15 to-black/40 pointer-events-none" />
            </div>
          );
        })}

        {/* Decorative Golden Corner Fillets (Fine Dining Frame) */}
        <div className="absolute top-4 left-4 w-6 h-6 border-t-2 border-l-2 border-[#C48B46] rounded-tl-sm pointer-events-none drop-shadow-md z-10" />
        <div className="absolute top-4 right-4 w-6 h-6 border-t-2 border-r-2 border-[#C48B46] rounded-tr-sm pointer-events-none drop-shadow-md z-10" />
        <div className="absolute bottom-4 left-4 w-6 h-6 border-b-2 border-l-2 border-[#C48B46] rounded-bl-sm pointer-events-none drop-shadow-md z-10" />
        <div className="absolute bottom-4 right-4 w-6 h-6 border-b-2 border-r-2 border-[#C48B46] rounded-br-sm pointer-events-none drop-shadow-md z-10" />

        {/* Top-Left: Chef's Signature / Bestseller Badge */}
        <div className="absolute top-4 left-4 sm:top-5 sm:left-5 ml-4 sm:ml-5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-[#C48B46] text-white text-[10px] sm:text-xs font-semibold uppercase tracking-[0.16em] shadow-xl pointer-events-none z-20">
          {currentSlide.badge}
        </div>

        {/* Top-Right: 2-Second Motion Indicator Pill */}
        <div className="absolute top-4 right-4 sm:top-5 sm:right-5 mr-4 sm:mr-5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-black/70 backdrop-blur-md border border-white/25 text-[10px] sm:text-xs text-[#FAF7F2] font-medium tracking-wider uppercase flex items-center space-x-1.5 shadow-xl pointer-events-none z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-[#C48B46] animate-ping" />
          <span>Moves every 2s</span>
          <Move className="w-3 h-3 text-[#C48B46] ml-0.5" />
        </div>

        {/* 
          BOTTOM OVERLAY DOCK (Inside the Frame):
          Dish Name, Rating, Price, Slide Dots & +ADD Button
          Cleanly docked at the bottom of the photo
        */}
        <div
          id="hero-dish-square-card"
          className="relative z-20 mx-3.5 mb-3.5 sm:mx-6 sm:mb-6 bg-white/95 backdrop-blur-md border border-[#E2D8C7] rounded-2xl p-3.5 sm:p-4 shadow-2xl pointer-events-auto transition-all duration-300"
        >
          {/* Top Row: Title + Star Rating */}
          <div className="flex items-center justify-between mb-1.5">
            <h4 className="font-serif-luxury text-base sm:text-lg font-bold text-[#1F1A17] leading-tight truncate mr-2">
              {currentSlide.dishName}
            </h4>
            <div className="flex items-center space-x-1 text-[#C48B46] flex-shrink-0">
              <Star className="w-3.5 h-3.5 fill-current" />
              <span className="text-xs sm:text-sm font-bold text-[#1F1A17]">{currentSlide.dishRating}</span>
              <span className="text-[10px] sm:text-xs text-[#8C7D73]">({currentSlide.reviewsCount})</span>
            </div>
          </div>

          {/* Bottom Row: Price + Slide Controls + ADD Button */}
          <div className="flex items-center justify-between pt-2 border-t border-[#EDE4D5]">
            <div>
              <span className="text-[9px] sm:text-[10px] text-[#8C7D73] uppercase tracking-wider block font-sans-modern font-semibold">
                PRICE
              </span>
              <span className="font-serif-luxury text-lg sm:text-xl font-bold text-[#C48B46] leading-none">
                {RESTAURANT_CONFIG.currency.symbol}{currentSlide.dishPrice.toFixed(2)}
              </span>
            </div>

            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Previous / Next buttons & Slide Indicators */}
              <div className="flex items-center space-x-1 bg-[#FAF7F2] rounded-full p-0.5 border border-[#E0D5C7]">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIndexChange(currentIndex === 0 ? slides.length - 1 : currentIndex - 1);
                  }}
                  aria-label="Previous dish"
                  className="p-1 rounded-full hover:bg-white text-[#1F1A17] transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>

                {/* 3 Clickable Slide Dots */}
                <div className="flex items-center space-x-1 px-1">
                  {slides.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onIndexChange(dotIdx);
                      }}
                      aria-label={`Go to slide ${dotIdx + 1}`}
                      className={`rounded-full transition-all duration-300 cursor-pointer ${
                        dotIdx === currentIndex
                          ? 'w-4 h-1.5 bg-[#C48B46]'
                          : 'w-1.5 h-1.5 bg-[#2B231D]/25 hover:bg-[#C48B46]/60'
                      }`}
                    />
                  ))}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onIndexChange((currentIndex + 1) % slides.length);
                  }}
                  aria-label="Next dish"
                  className="p-1 rounded-full hover:bg-white text-[#1F1A17] transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Instant +ADD to Order Button */}
              <button
                onClick={handleQuickAdd}
                id="hero-quick-add-btn"
                type="button"
                className="flex items-center space-x-1 px-4 py-2 rounded-full bg-[#C48B46] hover:bg-[#B6732E] text-white text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer active:scale-95 shadow-md shadow-[#C48B46]/25"
                title="Add this dish to your order"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ ADD</span>
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
