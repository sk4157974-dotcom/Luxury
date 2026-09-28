import React from 'react';
import { Phone, MessageCircle, ArrowUp } from 'lucide-react';
import { RESTAURANT_CONFIG, buildQuickWhatsAppUrl } from '../config/restaurant';

export const Footer: React.FC = () => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer
      id="main-footer"
      className="bg-[#1F1A17] border-t border-[#38312B] pt-16 pb-12 text-[#E8DEC8] font-sans-modern relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Col */}
          <div className="lg:col-span-4 space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full border border-[#C48B46] flex items-center justify-center bg-[#2B2420] shadow-sm">
                <span className="font-cinzel text-[#C48B46] text-base font-bold">LH</span>
              </div>
              <div>
                <span className="font-cinzel text-xl sm:text-2xl font-bold tracking-[0.12em] text-[#FAF7F2] block">
                  {RESTAURANT_CONFIG.name}
                </span>
                <span className="text-[10px] tracking-[0.25em] text-[#C48B46] uppercase block font-semibold">
                  LUXURY PALACE & FINE DINING
                </span>
              </div>
            </div>

            <p className="text-xs text-[#E8DEC8]/80 font-light leading-relaxed max-w-sm pt-2">
              An epicurean sanctuary where world-class culinary artistry harmonizes with refined hospitality and timeless ambience.
            </p>

            <div className="flex items-center space-x-3 pt-2">
              <a
                href={buildQuickWhatsAppUrl()}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Concierge WhatsApp"
                className="w-9 h-9 rounded-full bg-[#2B2420] border border-[#C48B46]/40 hover:border-[#C48B46] text-[#C48B46] flex items-center justify-center transition-colors shadow-sm"
              >
                <MessageCircle className="w-4 h-4" />
              </a>
              <a
                href={`tel:${RESTAURANT_CONFIG.contact.phone}`}
                aria-label="Call restaurant"
                className="w-9 h-9 rounded-full bg-[#2B2420] border border-[#C48B46]/40 hover:border-[#C48B46] text-[#C48B46] flex items-center justify-center transition-colors shadow-sm"
              >
                <Phone className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#C48B46] font-semibold mb-4">
              Explore Our House
            </h4>
            <ul className="space-y-2.5 text-xs text-[#FAF7F2]/80">
              <li>
                <a href="#home" className="hover:text-[#C48B46] transition-colors">
                  Welcome & Hero
                </a>
              </li>
              <li>
                <a href="#categories" className="hover:text-[#C48B46] transition-colors">
                  Menu Categories
                </a>
              </li>
              <li>
                <a href="#recommendations" className="hover:text-[#C48B46] transition-colors">
                  Chef's Recommendations
                </a>
              </li>
              <li>
                <a href="#menu" className="hover:text-[#C48B46] transition-colors">
                  Full Digital Menu
                </a>
              </li>
              <li>
                <a href="#about" className="hover:text-[#C48B46] transition-colors">
                  Our Culinary Story
                </a>
              </li>
              <li>
                <a href="#gallery" className="hover:text-[#C48B46] transition-colors">
                  Visual Gallery
                </a>
              </li>
            </ul>
          </div>

          {/* Service Hours */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#C48B46] font-semibold mb-4">
              Dining Hours
            </h4>
            <div className="space-y-2.5 text-xs text-[#FAF7F2]/80">
              <p>
                <span className="text-[#E8DEC8]/60 block text-[11px]">Lunch Seating</span>
                <span className="text-[#FAF7F2] font-medium">{RESTAURANT_CONFIG.hours.lunch}</span>
              </p>
              <p>
                <span className="text-[#E8DEC8]/60 block text-[11px]">Dinner Seating</span>
                <span className="text-[#FAF7F2] font-medium">{RESTAURANT_CONFIG.hours.dinner}</span>
              </p>
              <p>
                <span className="text-[#E8DEC8]/60 block text-[11px]">Private Dining & Events</span>
                <span className="text-[#FAF7F2] font-medium">By Prior Appointment</span>
              </p>
            </div>
          </div>

          {/* Concierge Line */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="text-xs uppercase tracking-[0.2em] text-[#C48B46] font-semibold mb-4">
              Direct Contact
            </h4>
            <div className="space-y-2 text-xs text-[#FAF7F2]/80">
              <p>
                <span className="text-[#E8DEC8]/60 block text-[11px]">Phone & WhatsApp</span>
                <a
                  href={`tel:${RESTAURANT_CONFIG.contact.phone}`}
                  className="text-[#C48B46] font-bold hover:underline block text-sm"
                >
                  {RESTAURANT_CONFIG.contact.phoneFormatted}
                </a>
              </p>
              <p className="pt-2">
                <span className="text-[#E8DEC8]/60 block text-[11px]">Reservations</span>
                <a
                  href="#reservation"
                  className="text-[#FAF7F2] hover:text-[#C48B46] transition-colors block font-medium"
                >
                  Instant Table Booking →
                </a>
              </p>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-[#E8DEC8]/60 font-light gap-4">
          <p className="text-center sm:text-left">© {new Date().getFullYear()} {RESTAURANT_CONFIG.name}. All rights reserved.</p>
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-3 sm:gap-6 text-center">
            <span>Centralized WhatsApp: {RESTAURANT_CONFIG.contact.phoneFormatted}</span>
            <button
              onClick={scrollToTop}
              className="flex items-center space-x-1.5 text-[#E8DEC8] hover:text-[#C48B46] transition-colors cursor-pointer"
            >
              <span>Back to Top</span>
              <ArrowUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
