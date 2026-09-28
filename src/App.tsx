import React, { useState } from 'react';
import { CartProvider, useCart } from './context/CartContext';
import { Hero } from './components/Hero';
import { ChefRecommendations } from './components/ChefRecommendations';
import { AboutSection } from './components/AboutSection';
import { MenuCategories } from './components/MenuCategories';
import { SpecialOfferBanner } from './components/SpecialOfferBanner';
import { DigitalMenu } from './components/DigitalMenu';
import { GallerySection } from './components/GallerySection';
import { ReservationSection } from './components/ReservationSection';
import { RestaurantInfo } from './components/RestaurantInfo';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { AssistantModal } from './components/AssistantModal';
import { FloatingActions } from './components/FloatingActions';
import { MenuCategoryType } from './types';
import { CheckCircle2 } from 'lucide-react';
import { RESTAURANT_CONFIG } from './config/restaurant';
import { unlockAudio } from './utils/audioUtils';

function MainContent() {
  const [selectedCategory, setSelectedCategory] = useState<MenuCategoryType | 'All'>('All');
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const { lastAddedDish, openCart } = useCart();

  // Unlock AudioContext upon user gesture anywhere on page
  React.useEffect(() => {
    const handleGesture = () => {
      unlockAudio();
    };
    window.addEventListener('click', handleGesture, { passive: true });
    window.addEventListener('touchstart', handleGesture, { passive: true });
    return () => {
      window.removeEventListener('click', handleGesture);
      window.removeEventListener('touchstart', handleGesture);
    };
  }, []);

  const handleSelectCategory = (cat: MenuCategoryType) => {
    setSelectedCategory(cat);
  };

  // Instant 3D Light & Front Pop Section Selection System:
  // - Slightest touch (touch/tap): instantly lights up and pops forward to front.
  // Global 3D Ambient Lighting System:
  // - Tap once on ANY card: lights up IMMEDIATELY with full radiant 3D blue glow on first tap, centers horizontally in screen
  // - Stays lit until another card is tapped or empty space is tapped
  // - Strictly only ONE card glowing at a time across the entire application
  // - Sliding/swiping across cards updates light seamlessly
  React.useEffect(() => {
    let activeCardEl: HTMLElement | null = null;
    let isPointerDown = false;
    let pointerDownCard: HTMLElement | null = null;
    let pointerDownPos = { x: 0, y: 0 };

    const centerCardInScroll = (targetCard: HTMLElement) => {
      const scrollParent = targetCard.closest(
        '[data-scroll-container], .overflow-x-auto'
      ) as HTMLElement | null;
      if (scrollParent) {
        const containerRect = scrollParent.getBoundingClientRect();
        const cardRect = targetCard.getBoundingClientRect();
        const diff = (cardRect.left + cardRect.width / 2) - (containerRect.left + containerRect.width / 2);
        if (Math.abs(diff) > 4) {
          scrollParent.scrollTo({
            left: scrollParent.scrollLeft + diff,
            behavior: 'smooth'
          });
        }
      }
    };

    const activateCard = (card: HTMLElement | null) => {
      // 1. Immediately remove light & pop from EVERY element in the entire document
      // This strictly prevents two boxes from ever having light at the same time
      document.querySelectorAll('.lighting-active, .card-popped-front').forEach((el) => {
        el.classList.remove('lighting-active', 'card-popped-front');
      });

      if (!card) {
        activeCardEl = null;
        return;
      }

      // 2. Always resolve to the single outermost card container
      const targetCard = (card.closest(
        '.pop-card-wrapper, .luxury-lighting-card, .pop-forward-3d, .pop-forward-sm'
      ) || card) as HTMLElement;

      // 3. Strictly apply light only to this single card
      targetCard.classList.add('lighting-active', 'card-popped-front');
      const face = targetCard.querySelector('.card-solid-face') as HTMLElement | null;
      if (face) {
        face.classList.add('lighting-active', 'card-popped-front');
      }
      activeCardEl = targetCard;
    };

    const findCardFromPoint = (clientX: number, clientY: number, fallbackTarget?: HTMLElement | null): HTMLElement | null => {
      const el = document.elementFromPoint(clientX, clientY) as HTMLElement | null;
      const target = el || fallbackTarget;
      if (!target) return null;
      return target.closest(
        '.pop-card-wrapper, .card-solid-face, .luxury-lighting-card, .pop-forward-3d, .pop-forward-sm'
      ) as HTMLElement | null;
    };

    // 1. Instant response on the SLIGHTEST touch on 1st tap (Ek bar tap karo toh turant glow ho)
    const handlePointerDown = (e: PointerEvent) => {
      isPointerDown = true;
      pointerDownPos = { x: e.clientX, y: e.clientY };

      const isButton = (e.target as HTMLElement | null)?.closest('button, a, input, select');
      if (isButton) {
        pointerDownCard = null;
        return;
      }

      const card = findCardFromPoint(e.clientX, e.clientY, e.target as HTMLElement | null);
      if (card) {
        pointerDownCard = card;
        const targetCard = (card.closest(
          '.pop-card-wrapper, .luxury-lighting-card, .pop-forward-3d, .pop-forward-sm'
        ) || card) as HTMLElement;
        // Lights up IMMEDIATELY with full radiant 3D blue glow on 1st tap!
        activateCard(targetCard);
        // Do NOT center on pointerdown: let user swipe/scroll freely without fighting
      } else {
        pointerDownCard = null;
      }
    };

    // 2. Responsive while SLIDING across cards
    const handlePointerMove = (e: PointerEvent) => {
      if (isPointerDown || e.buttons > 0 || e.pointerType === 'touch') {
        const card = findCardFromPoint(e.clientX, e.clientY, e.target as HTMLElement | null);
        if (card) {
          const targetCard = (card.closest(
            '.pop-card-wrapper, .luxury-lighting-card, .pop-forward-3d, .pop-forward-sm'
          ) || card) as HTMLElement;
          if (targetCard !== activeCardEl) {
            activateCard(targetCard);
          }
        }
      }
    };

    // 3. Dedicated TouchMove for mobile browser slide/swipe compatibility
    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches && e.touches.length > 0) {
        const t = e.touches[0];
        const card = findCardFromPoint(t.clientX, t.clientY);
        if (card) {
          const targetCard = (card.closest(
            '.pop-card-wrapper, .luxury-lighting-card, .pop-forward-3d, .pop-forward-sm'
          ) || card) as HTMLElement;
          if (targetCard !== activeCardEl) {
            activateCard(targetCard);
          }
        }
      }
    };

    const handlePointerUp = (e: PointerEvent) => {
      isPointerDown = false;
      const dist = Math.hypot(e.clientX - pointerDownPos.x, e.clientY - pointerDownPos.y);

      // ONLY deactivate if:
      // 1. The touch started on blank background (NOT on any card)
      // 2. It was a quick tap (dist < 12px) and not dragging/scrolling
      // 3. Target is not an interactive button or drawer
      if (!pointerDownCard && dist < 12) {
        const target = (document.elementFromPoint(e.clientX, e.clientY) || e.target) as HTMLElement | null;
        const clickedCard = target?.closest(
          '.pop-card-wrapper, .card-solid-face, .luxury-lighting-card, .pop-forward-3d, .pop-forward-sm'
        );
        const isInteractive = target?.closest(
          'button, a, input, select, textarea, [role="button"], #cart-drawer, .modal, #navbar'
        );
        if (!clickedCard && !isInteractive) {
          // User truly tapped empty background outside any card
          activateCard(null);
        }
      }

      // If the user tapped on a card: NEVER deactivate it on pointerup!
      // Keep it glowing in full radiance!
      pointerDownCard = null;
    };

    const handlePointerCancel = () => {
      isPointerDown = false;
      pointerDownCard = null;
    };

    const handleClick = (e: MouseEvent) => {
      const isButton = (e.target as HTMLElement | null)?.closest('button, a, input, select');
      if (isButton) return;

      const target = e.target as HTMLElement | null;
      const card = target?.closest(
        '.pop-card-wrapper, .card-solid-face, .luxury-lighting-card, .pop-forward-3d, .pop-forward-sm'
      ) as HTMLElement | null;

      if (card) {
        const targetCard = (card.closest(
          '.pop-card-wrapper, .luxury-lighting-card, .pop-forward-3d, .pop-forward-sm'
        ) || card) as HTMLElement;
        activateCard(targetCard);
        centerCardInScroll(targetCard);
      }
    };

    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('pointerup', handlePointerUp, { passive: true });
    window.addEventListener('pointercancel', handlePointerCancel, { passive: true });
    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1F1A17] selection:bg-[#E5A645] selection:text-white font-sans-modern">
      {/* 
        HERO SECTION MATCHING SCREENSHOT EXACTLY:
        - Top-left round back button ←
        - 'We Serve The Test You Love 😍'
        - 'Explore Food' & 'Search' buttons
        - Circular salmon salad plate with concentric rings & 5 category pills
      */}
      <Hero onOpenAssistant={() => setIsAssistantOpen(true)} />

      {/* 
        POPULAR DISHES SECTION MATCHING SCREENSHOT EXACTLY:
        - 'Popular Dishes' with left & right arrow buttons
        - 4 exact cards: Pasta, French Fires, Chicken Shawarma, Fish Curry
      */}
      <ChefRecommendations />

      {/* Dark Forest Green About Us Section with Video Ambience Tour & Stats */}
      <AboutSection />

      {/* Menu Categories Carousel & Visual Highlights */}
      <MenuCategories onSelectCategory={handleSelectCategory} />

      {/* Special Offer 20% Off Banner */}
      <SpecialOfferBanner />

      {/* Complete Digital Restaurant Menu */}
      <DigitalMenu
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      {/* Visual Gallery with Lightbox */}
      <GallerySection />

      {/* Table Reservation Section with WhatsApp Routing */}
      <ReservationSection />

      {/* Location, Contact, Hours & Map Section */}
      <RestaurantInfo />

      {/* Footer */}
      <Footer />

      {/* Cart Drawer Slide-out with WhatsApp Order Generator */}
      <CartDrawer />

      {/* AI Assistant Grounded Fine Dining Concierge */}
      <AssistantModal
        isOpen={isAssistantOpen}
        onClose={() => setIsAssistantOpen(false)}
      />

      {/* Floating Action Buttons: AI Concierge Button (Top) & WhatsApp Button (Bottom) */}
      <FloatingActions
        isAssistantOpen={isAssistantOpen}
        onToggleAssistant={() => setIsAssistantOpen(!isAssistantOpen)}
      />

      {/* Toast Notification when item added to cart */}
      {lastAddedDish && (
        <div
          id="cart-added-toast"
          className="fixed bottom-32 sm:bottom-40 right-3 sm:right-6 max-w-[calc(100vw-1.5rem)] sm:max-w-sm z-50 bg-white border border-[#C48B46]/40 rounded-2xl p-3 sm:p-4 shadow-xl flex items-center space-x-3 animate-in slide-in-from-bottom duration-300"
        >
          <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-600 flex-shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-[#1F1A17] truncate">
              {lastAddedDish.name}
            </p>
            <p className="text-[11px] text-[#C48B46] font-sans-modern font-semibold">
              Added to order • {RESTAURANT_CONFIG.currency.symbol}{lastAddedDish.price.toFixed(2)}
            </p>
          </div>
          <button
            onClick={openCart}
            className="p-2 rounded-lg bg-[#FAF7F2] hover:bg-[#F3ECE0] text-[#B87B32] text-xs font-bold uppercase tracking-wider transition-colors flex items-center space-x-1"
          >
            <span>View Bag</span>
          </button>
        </div>
      )}
    </div>
  );
}

export function App() {
  return (
    <CartProvider>
      <MainContent />
    </CartProvider>
  );
}

export default App;
