import React, { useState, useEffect } from 'react';
import { ShoppingBag, Menu as MenuIcon, X, Sparkles, Crown, Calendar } from 'lucide-react';
import { RESTAURANT_CONFIG } from '../config/restaurant';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  onOpenAssistant: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAssistant }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { totalItems, openCart } = useCart();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'HOME', href: '#home' },
    { label: 'MENU', href: '#menu' },
    { label: 'ABOUT US', href: '#about' },
    { label: 'GALLERY', href: '#gallery' },
    { label: 'CONTACT', href: '#contact' },
  ];

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      const navOffset = 80;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - navOffset;
      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <header
      id="main-header"
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
    >
      <div
        className={`w-full transition-all duration-300 ${
          isScrolled
            ? 'bg-[#FAF7F2]/95 backdrop-blur-md border-b border-[#E8DEC8] py-2.5 shadow-sm'
            : 'bg-[#FAF7F2] border-b border-[#EDE5D8] py-3.5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          
          {/* Brand Logo: Crown + Luxury Hotel PALACE & FINE DINING + AI label */}
          <div className="flex items-center space-x-2.5">
            <div className="flex flex-col items-center">
              <button
                type="button"
                onClick={onOpenAssistant}
                id="nav-logo-btn"
                className="w-9 h-9 rounded-full bg-gradient-to-br from-[#E5A645] to-[#8C5D19] p-[1px] shadow-sm flex items-center justify-center hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                title="Click for Luxury Hotel AI"
              >
                <div className="w-full h-full rounded-full bg-[#FAF7F2] flex items-center justify-center">
                  <Crown className="w-4 h-4 text-[#C48B46]" />
                </div>
              </button>
              <span
                onClick={onOpenAssistant}
                id="nav-logo-ai-label"
                className="text-[8px] font-extrabold tracking-[0.2em] text-[#C48B46] uppercase mt-0.5 cursor-pointer hover:text-[#8C5D19] transition-colors leading-none"
              >
                AI
              </span>
            </div>
            <a
              href="#home"
              onClick={(e) => handleLinkClick(e, '#home')}
              id="brand-logo"
              className="flex flex-col group cursor-pointer"
            >
              <span className="font-cinzel text-lg sm:text-xl font-bold tracking-[0.14em] text-[#1F1A17] leading-none group-hover:text-[#C48B46] transition-colors">
                Luxury Hotel
              </span>
              <span className="text-[8px] tracking-[0.25em] text-[#C48B46] uppercase font-sans-modern font-semibold pt-0.5">
                PALACE & FINE DINING
              </span>
            </a>
          </div>

          {/* Desktop Center Navigation Links */}
          <nav className="hidden md:flex items-center space-x-7 lg:space-x-9" aria-label="Main Navigation">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                id={`nav-${link.label.toLowerCase().replace(' ', '-')}`}
                className="text-xs uppercase tracking-[0.16em] font-semibold text-[#1F1A17] hover:text-[#C48B46] transition-colors duration-200 cursor-pointer"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Right Actions: AI Concierge, Cart & BOOK A TABLE pill button */}
          <div className="flex items-center space-x-3 sm:space-x-4">
            
            {/* AI Dining Assistant */}
            <button
              onClick={onOpenAssistant}
              id="nav-assistant-btn"
              type="button"
              className="hidden lg:flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-[11px] tracking-wider uppercase bg-emerald-50 text-emerald-700 border border-emerald-300 hover:bg-emerald-100 hover:border-emerald-400 transition-all duration-200 cursor-pointer shadow-2xs"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>AI Concierge</span>
            </button>

            {/* Shopping Cart Button */}
            <button
              onClick={openCart}
              id="header-cart-button"
              type="button"
              aria-label="Open dining cart"
              className="relative p-2 sm:p-2.5 rounded-full bg-white border border-[#E8DEC8] text-[#1F1A17] hover:text-[#C48B46] hover:border-[#C48B46] shadow-xs hover:shadow transition-all duration-200 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              {totalItems > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#C48B46] text-white font-semibold text-[10px] flex items-center justify-center shadow font-sans-modern">
                  {totalItems}
                </span>
              )}
            </button>

            {/* BOOK A TABLE CTA button matching screenshot */}
            <a
              href="#reservation"
              onClick={(e) => handleLinkClick(e, '#reservation')}
              id="header-book-table-cta"
              className="px-5 py-2.5 rounded-full bg-[#C48B46] hover:bg-[#B6732E] text-white font-medium text-xs uppercase tracking-[0.16em] shadow-sm hover:shadow-md active:scale-95 transition-all duration-200 inline-flex items-center space-x-1.5"
            >
              <span>BOOK A TABLE</span>
            </a>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              id="mobile-menu-toggle"
              type="button"
              aria-label="Toggle navigation menu"
              className="md:hidden p-2 rounded-full bg-white border border-[#E8DEC8] text-[#1F1A17] hover:text-[#C48B46] transition-colors cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#FAF7F2] border-b border-[#E8DEC8] px-4 pt-3 pb-6 shadow-xl animate-in slide-in-from-top duration-200">
          <nav className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="text-sm font-semibold uppercase tracking-wider text-[#1F1A17] hover:text-[#C48B46] py-2 border-b border-[#EDE4D6]"
              >
                {link.label}
              </a>
            ))}

            <button
              type="button"
              onClick={() => {
                setMobileMenuOpen(false);
                onOpenAssistant();
              }}
              className="flex items-center space-x-2 py-2 text-sm font-semibold text-emerald-700 hover:text-emerald-800"
            >
              <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>AI Dining Concierge</span>
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
