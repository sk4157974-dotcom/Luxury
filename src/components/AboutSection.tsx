import React, { useState } from 'react';
import { Play, ChefHat, Utensils, Award, X } from 'lucide-react';
import { motion } from 'motion/react';

export const AboutSection: React.FC = () => {
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
    e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
  };

  const handleCardTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length > 0) {
      const touch = e.touches[0];
      const rect = e.currentTarget.getBoundingClientRect();
      const x = touch.clientX - rect.left;
      const y = touch.clientY - rect.top;
      e.currentTarget.style.setProperty('--mouse-x', `${x}px`);
      e.currentTarget.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  return (
    <motion.section
      id="about"
      className="py-12 sm:py-16 bg-[#FAF7F2] relative"
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Dark Forest Green Bento Card matching Pinterest Screenshot */}
        <div className="relative group pop-card-wrapper !rounded-3xl sm:!rounded-[36px]">
          <div
            className="card-solid-face !bg-[#132E20] relative z-10 !rounded-3xl sm:!rounded-[36px] text-white overflow-hidden p-5 sm:p-10 lg:p-12 shadow-2xl border border-sky-500/40 hover:border-[#38BDF8] cursor-pointer"
          >
          
          {/* Subtle leaves decoration in corner */}
          <div className="absolute top-0 right-0 w-48 h-48 pointer-events-none opacity-15">
            <svg viewBox="0 0 100 100" fill="#4B633C" className="w-full h-full">
              <path d="M50,10 C45,25 35,40 20,45 C35,45 45,55 50,70 C55,55 65,45 80,45 C65,40 55,25 50,10 Z" />
            </svg>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
            
            {/* LEFT: Cozy Restaurant Ambience Photo with Play Button */}
            <div className="lg:col-span-5 relative">
              <div className="relative aspect-[4/3] rounded-2xl overflow-hidden border border-[#2B543D] shadow-lg group/img">
                <img
                  src="https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=800&q=85"
                  alt="Cozy restaurant dining atmosphere"
                  className="w-full h-full object-cover group-hover/img:scale-105 transition-transform duration-500"
                />
                
                {/* Play Button Overlay */}
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  aria-label="Play restaurant tour video"
                  className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-white/20 backdrop-blur-md border border-white/40 flex items-center justify-center text-white hover:scale-110 hover:bg-[#C48B46] active:scale-95 transition-all duration-300 shadow-2xl cursor-pointer glow-on-hover lighting-beam-sweep"
                >
                  <Play className="w-6 h-6 fill-current ml-1" />
                </button>
              </div>
            </div>

            {/* RIGHT: About Us Editorial Narrative & Stats */}
            <div className="lg:col-span-7 flex flex-col justify-between">
              <div>
                <div className="inline-flex items-center space-x-2 text-[#C48B46] mb-3">
                  <span className="text-xs uppercase tracking-[0.22em] font-semibold font-sans-modern">
                    ABOUT US
                  </span>
                  <div className="w-8 h-[1px] bg-[#C48B46]" />
                </div>

                <h2 className="font-serif-luxury text-3xl sm:text-4xl lg:text-5xl font-normal leading-tight text-[#FAF7F2] mb-4">
                  A Place Where Good Food & Good Times Come Together
                </h2>

                <p className="text-sm sm:text-base text-[#D0DEC8] font-sans-modern leading-relaxed mb-6 font-normal max-w-xl">
                  At Luxury Hotel, we believe that great food brings people together. From our cozy ambiance to our delicious dishes, we're here to make your moments unforgettable.
                </p>

                {/* Elegant Cursive Catchphrase */}
                <div className="font-serif-luxury italic text-2xl sm:text-3xl text-[#C48B46] mb-6">
                  Taste. Love. Repeat.
                </div>
              </div>

              {/* 3 Stats with Icons */}
              <div className="grid grid-cols-1 xs:grid-cols-3 gap-3 sm:gap-6 pt-6 border-t border-[#234A34]">
                <div className="flex flex-row xs:flex-col items-center xs:items-start space-x-3 xs:space-x-0 p-2 rounded-xl transition-all duration-200 hover:bg-white/5 cursor-pointer glow-on-hover">
                  <div className="w-10 h-10 rounded-full bg-[#1F4531] border border-[#346248] flex items-center justify-center text-[#C48B46] mb-0 xs:mb-2 flex-shrink-0">
                    <ChefHat className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-serif-luxury text-xl sm:text-2xl font-bold text-white block">
                      10+
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#A2B8A4] uppercase tracking-wider font-medium">
                      Years of Experience
                    </span>
                  </div>
                </div>

                <div className="flex flex-row xs:flex-col items-center xs:items-start space-x-3 xs:space-x-0 p-2 rounded-xl transition-all duration-200 hover:bg-white/5 cursor-pointer glow-on-hover">
                  <div className="w-10 h-10 rounded-full bg-[#1F4531] border border-[#346248] flex items-center justify-center text-[#C48B46] mb-0 xs:mb-2 flex-shrink-0">
                    <Utensils className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-serif-luxury text-xl sm:text-2xl font-bold text-white block">
                      50+
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#A2B8A4] uppercase tracking-wider font-medium">
                      Delicious Dishes
                    </span>
                  </div>
                </div>

                <div className="flex flex-row xs:flex-col items-center xs:items-start space-x-3 xs:space-x-0 p-2 rounded-xl transition-all duration-200 hover:bg-white/5 cursor-pointer glow-on-hover">
                  <div className="w-10 h-10 rounded-full bg-[#1F4531] border border-[#346248] flex items-center justify-center text-[#C48B46] mb-0 xs:mb-2 flex-shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="font-serif-luxury text-xl sm:text-2xl font-bold text-white block">
                      100%
                    </span>
                    <span className="text-[11px] sm:text-xs text-[#A2B8A4] uppercase tracking-wider font-medium">
                      Customer Satisfaction
                    </span>
                  </div>
                </div>
              </div>

            </div>

          </div>

        </div>

      </div>

      </div>

      {/* Video Modal */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-3xl bg-[#1F1A17] rounded-3xl overflow-hidden border border-[#C48B46]/40 shadow-2xl p-4">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/40 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative aspect-video rounded-2xl overflow-hidden">
              <iframe
                className="w-full h-full"
                src="https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ?autoplay=1"
                title="Restaurant Ambience Tour"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </motion.section>
  );
};
