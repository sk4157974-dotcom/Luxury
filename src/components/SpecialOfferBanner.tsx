import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useCart } from '../context/CartContext';

export const SpecialOfferBanner: React.FC = () => {
  const { openCart } = useCart();

  return (
    <motion.div
      className="w-full bg-[#FAF7F2] pb-12 sm:pb-16"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-20px' }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Special Offer Banner with enhanced luminous blue lighting and hover effects */}
        <div className="relative group pop-card-wrapper !rounded-3xl">
          <div
            className="card-solid-face relative z-10 !rounded-3xl overflow-hidden bg-gradient-to-r from-[#1F1A17] via-[#2B2420] to-[#1F1A17] text-white p-8 sm:p-10 lg:p-12 shadow-2xl border border-sky-500/40 hover:border-[#38BDF8] flex flex-col md:flex-row items-center justify-between gap-6 cursor-pointer"
          >
            {/* Offer Content */}
            <div className="relative z-10 max-w-xl text-center md:text-left">
              <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-900/40 border border-blue-500/50 mb-3 shadow-[0_0_12px_rgba(56,189,248,0.25)]">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span className="text-[11px] font-sans-modern font-bold uppercase tracking-[0.2em] text-sky-200">
                  SPECIAL OFFER
                </span>
              </div>

              <h3 className="font-serif-luxury text-2xl sm:text-3xl md:text-4xl font-normal leading-tight mb-2">
                Get <span className="text-sky-400 font-semibold italic">20% Off</span> On Your First Order
              </h3>

              <p className="text-xs sm:text-sm text-[#FAF7F2]/80 font-sans-modern leading-relaxed">
                Use code <span className="font-bold text-sky-200 tracking-widest px-2 py-0.5 bg-white/10 rounded border border-white/20">FLAVORO20</span> at checkout or mention it during reservation.
              </p>
            </div>

            {/* Action Button */}
            <div className="relative z-10 flex-shrink-0">
              <button
                onClick={openCart}
                id="offer-order-now-btn"
                type="button"
                className="px-7 py-3 rounded-full bg-gradient-to-r from-blue-600 via-sky-500 to-blue-600 hover:from-blue-500 hover:to-sky-400 text-white font-semibold text-xs uppercase tracking-[0.18em] flex items-center space-x-2 shadow-lg shadow-blue-900/40 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer lighting-beam-sweep pop-forward-sm glow-on-hover"
              >
                <span>Order Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
