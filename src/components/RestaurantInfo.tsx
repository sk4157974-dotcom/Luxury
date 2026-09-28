import React, { useState } from 'react';
import { Clock, MapPin, Phone, MessageCircle, Copy, Check, Sparkles, Navigation } from 'lucide-react';
import { motion } from 'motion/react';
import { RESTAURANT_CONFIG, buildQuickWhatsAppUrl } from '../config/restaurant';

export const RestaurantInfo: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const info = RESTAURANT_CONFIG.contact;
  const hours = RESTAURANT_CONFIG.hours;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(`${info.address}, ${info.landmark}, ${info.city}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.section
      id="contact"
      className="py-16 sm:py-24 bg-[#FAF7F2] relative overflow-hidden border-t border-[#E8DEC8]"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-[11px] uppercase font-sans-modern tracking-[0.25em] text-[#C48B46] font-semibold block mb-2">
            VISIT & INQUIRIES
          </span>

          <h2
            id="contact-title"
            className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-normal text-[#1F1A17] tracking-tight uppercase"
          >
            Location & Service Hours
          </h2>
          <p className="text-sm sm:text-base text-[#685D56] font-sans-modern mt-2">
            We invite you to immerse in an unmatched dining sanctuary. Inquiries and reservations are promptly handled by our concierge.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT: Info Cards */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Hours Card */}
            <div
              className="luxury-lighting-card glow-on-hover bg-white rounded-2xl p-6 sm:p-7 border border-[#E8DEC8] shadow-sm hover:border-[#C48B46]/60 transition-all duration-300"
            >
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2.5 rounded-full bg-[#FAF7F2] text-[#C48B46] border border-[#E8DEC8]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-luxury text-xl font-bold text-[#1F1A17]">
                    Dining Service Hours
                  </h3>
                  <span className="text-[11px] text-[#C48B46] tracking-wider uppercase font-sans-modern font-semibold">
                    Open Seven Days A Week
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2 text-sm text-[#685D56] font-sans-modern">
                <div className="flex items-center justify-between py-2 border-b border-[#F0EAE1]">
                  <span>Lunch Seating</span>
                  <span className="font-semibold text-[#1F1A17]">{hours.lunch}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-[#F0EAE1]">
                  <span>Dinner Seating</span>
                  <span className="font-semibold text-[#1F1A17]">{hours.dinner}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span>Sommelier Cellar & Bar</span>
                  <span className="font-semibold text-[#1F1A17]">{hours.bar}</span>
                </div>
              </div>
            </div>

            {/* Address Card */}
            <div
              className="luxury-lighting-card glow-on-hover bg-white rounded-2xl p-6 sm:p-7 border border-[#E8DEC8] shadow-sm hover:border-[#C48B46]/60 transition-all duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-full bg-[#FAF7F2] text-[#C48B46] border border-[#E8DEC8]">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif-luxury text-xl font-bold text-[#1F1A17]">
                      Sanctuary Location
                    </h3>
                    <span className="text-[11px] text-[#C48B46] tracking-wider uppercase font-sans-modern font-semibold">
                      Valet Parking Available
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCopyAddress}
                  aria-label="Copy address to clipboard"
                  className="p-2 rounded-lg bg-[#FAF7F2] text-[#685D56] hover:text-[#C48B46] border border-[#E8DEC8] transition-colors cursor-pointer glow-on-hover"
                  title="Copy address"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <p className="text-sm text-[#1F1A17] font-sans-modern font-medium leading-relaxed mb-1">
                {info.address}
              </p>
              <p className="text-xs text-[#685D56] mb-4">
                {info.landmark}, {info.city}
              </p>

              <a
                href={info.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center space-x-2 text-xs uppercase tracking-widest text-[#C48B46] hover:text-[#B6732E] font-semibold transition-colors glow-on-hover"
              >
                <Navigation className="w-3.5 h-3.5" />
                <span>Get Driving Directions</span>
              </a>
            </div>

            {/* Direct Connect / WhatsApp Card */}
            <div
              className="luxury-lighting-card glow-on-hover bg-white rounded-2xl p-6 sm:p-7 border border-[#E8DEC8] shadow-sm hover:border-[#C48B46]/60 transition-all duration-300 space-y-4"
            >
              <div className="flex items-center space-x-3">
                <div className="p-2.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
                  <MessageCircle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-luxury text-xl font-bold text-[#1F1A17]">
                    Direct WhatsApp & Phone
                  </h3>
                  <span className="text-[11px] text-[#C48B46] tracking-wider uppercase font-sans-modern font-semibold">
                    Centralized Concierge Line
                  </span>
                </div>
              </div>

              <p className="text-xs text-[#685D56]">
                Use our dedicated single line for reservations, dietary requests, wine pairings, and food orders.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <a
                  href={`tel:${info.phone}`}
                  className="py-3 px-3 sm:px-4 rounded-xl bg-[#FAF7F2] border border-[#E8DEC8] hover:border-[#C48B46] text-[11px] xs:text-xs font-semibold uppercase tracking-wider text-[#1F1A17] flex items-center justify-center space-x-2 transition-all glow-on-hover truncate"
                >
                  <Phone className="w-3.5 h-3.5 text-[#C48B46] flex-shrink-0" />
                  <span className="truncate">Call {info.phoneFormatted}</span>
                </a>

                <a
                  href={buildQuickWhatsAppUrl(`Hello ${RESTAURANT_CONFIG.name}, I would like to inquire about dining at your restaurant.`)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-3 sm:px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-[11px] xs:text-xs font-bold uppercase tracking-wider flex items-center justify-center space-x-2 shadow-sm transition-all glow-on-hover lighting-beam-sweep whitespace-nowrap"
                >
                  <MessageCircle className="w-3.5 h-3.5 flex-shrink-0" />
                  <span>Chat on WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

          {/* RIGHT: Map & Visual Preview with luxury 3D lighting */}
          <div 
            id="map-location-card"
            className="lg:col-span-7 pop-card-wrapper !rounded-3xl cursor-pointer"
          >
            <div className="card-solid-face !rounded-3xl bg-white overflow-hidden border border-[#E8DEC8] shadow-sm flex flex-col transition-all duration-300">
              <div className="relative aspect-[16/10] w-full bg-[#EBE5DC]">
                {/* Embedded Google Map iframe */}
                <iframe
                  title="Restaurant Location Map"
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d14392.21327734796!2d85.125!3d25.612!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjXCsDM2JzQzLjIiTiA4NcKwMDcnMzAuMCJF!5e0!3m2!1sen!2sin!4v1620000000000!5m2!1sen!2sin"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen={false}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="w-full h-full"
                />
              </div>

              <div className="p-6 bg-white border-t border-[#E8DEC8] flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#1F1A17] uppercase tracking-wider">
                    Private Valet & Chauffeured Arrival
                  </p>
                  <p className="text-xs text-[#685D56] mt-0.5">
                    Complimentary parking services available at the front portico.
                  </p>
                </div>

                <a
                  href={info.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-5 py-2.5 rounded-full bg-[#C48B46] hover:bg-[#B6732E] text-white text-xs font-semibold uppercase tracking-wider transition-colors shadow-sm whitespace-nowrap glow-on-hover lighting-beam-sweep"
                >
                  Open Google Maps
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>
    </motion.section>
  );
};
