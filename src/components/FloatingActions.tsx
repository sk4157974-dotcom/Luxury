import React from 'react';
import { MessageCircle, Sparkles, Crown, X } from 'lucide-react';
import { RESTAURANT_CONFIG, buildQuickWhatsAppUrl } from '../config/restaurant';
import { unlockAudio } from '../utils/audioUtils';

interface FloatingActionsProps {
  isAssistantOpen: boolean;
  onToggleAssistant: () => void;
}

export const FloatingActions: React.FC<FloatingActionsProps> = ({
  isAssistantOpen,
  onToggleAssistant
}) => {
  const whatsappUrl = buildQuickWhatsAppUrl(
    `Hello ${RESTAURANT_CONFIG.name}, I would like to inquire about reservations and dining availability.`
  );

  return (
    <div
      id="floating-actions-container"
      className="fixed bottom-4 right-3 xs:bottom-5 xs:right-4 sm:bottom-6 sm:right-6 z-40 flex flex-col items-end space-y-2.5 sm:space-y-3"
    >
      {/* Top Button: AI Concierge Logo Button (Right above WhatsApp button) */}
      <div className="flex items-center group relative">
        {/* Tooltip Label */}
        <div className="mr-3 px-3.5 py-1.5 rounded-full bg-white border border-[#E8DEC8] text-[#1F1A17] text-xs font-semibold tracking-wide shadow-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none hidden sm:flex items-center space-x-1.5 whitespace-nowrap">
          <Sparkles className="w-3.5 h-3.5 text-[#C48B46]" />
          <span>Ask Luxury Hotel AI Concierge</span>
        </div>

        <button
          type="button"
          onClick={() => {
            unlockAudio();
            onToggleAssistant();
          }}
          id="floating-ai-btn"
          aria-label="Open Luxury Hotel AI Assistant"
          className={`relative w-12 h-12 xs:w-13 xs:h-13 sm:w-14 sm:h-14 rounded-full flex flex-col items-center justify-center text-white shadow-xl hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer border-2 ${
            isAssistantOpen
              ? 'bg-[#1F1A17] border-[#C48B46] shadow-[#C48B46]/40'
              : 'bg-gradient-to-br from-[#E5A645] via-[#C48B46] to-[#8C5D19] border-white/40 shadow-[#C48B46]/45'
          }`}
          title="Ask Hotel AI"
        >
          {isAssistantOpen ? (
            <X className="w-5 h-5 sm:w-6 sm:h-6 text-[#E5A645]" />
          ) : (
            <>
              {/* Crown + AI Logo */}
              <div className="flex flex-col items-center justify-center leading-none">
                <Crown className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-white drop-shadow-sm" />
                <span className="text-[8.5px] xs:text-[9px] sm:text-[10px] font-black tracking-wider text-white mt-0.5 leading-none">
                  AI
                </span>
              </div>
              {/* Pulsing indicator */}
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-white flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
              </span>
            </>
          )}
        </button>
      </div>

      {/* Bottom Button: WhatsApp Button */}
      <div className="flex items-center group relative">
        {/* Tooltip Label */}
        <div className="mr-3 px-3.5 py-1.5 rounded-full bg-white border border-[#E8DEC8] text-[#1F1A17] text-xs font-semibold tracking-wide shadow-lg opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 pointer-events-none hidden sm:flex items-center space-x-1.5 whitespace-nowrap">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Chat on WhatsApp</span>
        </div>

        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          id="floating-whatsapp-btn"
          aria-label="Chat with concierge on WhatsApp"
          className="relative w-12 h-12 xs:w-13 xs:h-13 sm:w-14 sm:h-14 rounded-full bg-[#25D366] hover:bg-[#20bd5a] flex items-center justify-center text-white shadow-xl shadow-[#25D366]/30 hover:scale-110 active:scale-95 transition-all duration-300 group cursor-pointer"
        >
          <span className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping opacity-30 pointer-events-none" />
          <MessageCircle className="w-6 h-6 sm:w-7 sm:h-7 fill-current transition-transform duration-300 group-hover:rotate-12" />
        </a>
      </div>
    </div>
  );
};
