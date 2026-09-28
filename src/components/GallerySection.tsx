import React, { useState } from 'react';
import { Sparkles, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { RESTAURANT_CONFIG } from '../config/restaurant';

export const GallerySection: React.FC = () => {
  const [activeFilter, setActiveFilter] = useState<string>('All');
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const [tapTimestamp, setTapTimestamp] = useState<number>(0);

  const galleryItems = RESTAURANT_CONFIG.gallery;
  const categories = ['All', 'Dishes', 'Interior', 'Ambience', 'Artistry'];

  const filteredItems =
    activeFilter === 'All'
      ? galleryItems
      : galleryItems.filter((item) => item.category === activeFilter);

  // When tapping/clicking any photo: trigger animation & lighting effect instead of opening full photo
  const handlePhotoTap = (id: string) => {
    setActivePhotoId(id);
    setTapTimestamp(Date.now());
  };

  return (
    <motion.section
      id="gallery"
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
            VISUAL SHOWCASE
          </span>

          <h2
            id="gallery-title"
            className="font-serif-luxury text-3xl sm:text-4xl md:text-5xl font-normal text-[#1F1A17] tracking-tight uppercase"
          >
            Atmosphere & Artistry
          </h2>
          <p className="text-sm sm:text-base text-[#685D56] font-sans-modern mt-2">
            A visual ode to architectural stillness, candlelit dining tables, and meticulous culinary craftsmanship.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center justify-center flex-wrap gap-2.5 mb-10">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveFilter(cat)}
              type="button"
              id={`gallery-filter-${cat.toLowerCase()}`}
              className={`px-5 py-2 rounded-full text-xs uppercase tracking-[0.18em] transition-all duration-200 cursor-pointer glow-on-hover ${
                activeFilter === cat
                  ? 'bg-[#C48B46] text-white font-semibold shadow-sm'
                  : 'bg-white text-[#685D56] border border-[#E8DEC8] hover:border-[#C48B46] hover:text-[#1F1A17]'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* 
          Gallery Grid: 
          Tapping/clicking any photo does NOT open a full photo modal.
          Instead, it triggers dynamic 3D pop elevation, glowing ambient backlight radiance,
          a luxury shimmer light beam, and a golden interactive aura!
        */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
          {filteredItems.map((item, idx) => {
            const isActive = activePhotoId === item.id;

            return (
              <motion.div
                key={item.id}
                onClick={() => handlePhotoTap(item.id)}
                id={`gallery-item-${item.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-25px' }}
                transition={{ duration: 0.4, delay: (idx % 6) * 0.07 }}
                className={`pop-card-wrapper group relative aspect-[4/3] rounded-2xl cursor-pointer ${
                  isActive ? 'lighting-active card-popped-front z-30' : ''
                }`}
              >
                {/* Single Solid Card Face with Direct 3D Theme Ambient Light */}
                <div
                  className={`card-solid-face relative w-full h-full rounded-2xl overflow-hidden bg-[#F5EFEB] border transition-all duration-300 ${
                    isActive
                      ? 'border-[#38BDF8] scale-[1.03] -translate-y-2 shadow-[0_0_0_2px_rgba(56,189,248,0.85),0_0_22px_6px_rgba(56,189,248,0.6),0_0_45px_12px_rgba(37,99,235,0.45),0_18px_36px_-6px_rgba(15,23,42,0.2)]'
                      : 'border-[#E8DEC8] hover:border-[#38BDF8] hover:scale-[1.02] hover:-translate-y-1'
                  }`}
                >
                  <img
                    src={item.image}
                    alt={item.title}
                    loading="lazy"
                    className={`w-full h-full object-cover object-center transform transition-transform duration-700 select-none ${
                      isActive ? 'scale-110 brightness-105' : 'group-hover:scale-108'
                    }`}
                  />

                  {/* Active Tap Glowing Ripple Pulse */}
                  {isActive && (
                    <div
                      key={tapTimestamp}
                      className="absolute inset-0 pointer-events-none border-2 border-[#38BDF8] rounded-2xl animate-ping opacity-60"
                    />
                  )}

                  {/* Interactive Shimmer Light Beam Sweep */}
                  <div className="absolute inset-0 lighting-beam-sweep pointer-events-none" />

                  {/* Top-Right Glowing Badge on Tap/Hover */}
                  <div
                    className={`absolute top-3.5 right-3.5 px-3 py-1 rounded-full backdrop-blur-md border transition-all duration-300 flex items-center space-x-1.5 shadow-md ${
                      isActive
                        ? 'bg-gradient-to-r from-[#2563EB] to-[#0284C7] text-white border-white/60 scale-105'
                        : 'bg-black/40 text-white/90 border-white/20 opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#F5E2C9]" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      {isActive ? '✦ Grand Ambience' : 'Luxury'}
                    </span>
                  </div>

                  {/* Overlay with 5-Star Experience & Caption */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent transition-opacity duration-300 flex flex-col justify-end p-5 sm:p-6 text-white ${
                      isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    {/* Category & 5 Golden Stars */}
                    <div className="flex items-center justify-between mb-1.5 flex-wrap">
                      <span className="text-[10px] uppercase tracking-[0.25em] text-[#E8D8B8] font-bold">
                        {item.category}
                      </span>
                      <div className="flex items-center space-x-0.5 text-[#F5A623]">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-[#F5A623] text-[#F5A623]" />
                        ))}
                      </div>
                    </div>

                    <h4 className="font-serif-luxury text-lg sm:text-xl font-bold leading-tight">
                      {item.title}
                    </h4>
                    <p className="text-[11px] sm:text-xs text-white/85 font-light mt-1 line-clamp-2">
                      {item.caption}
                    </p>

                    {/* Interactive glowing tap hint */}
                    <div className="mt-2 flex items-center space-x-1.5 text-[10px] text-[#F7E1AD] font-semibold">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8] animate-pulse" />
                      <span>{isActive ? 'Active Luxury Lighting Effect' : 'Tap to illuminate'}</span>
                    </div>
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
