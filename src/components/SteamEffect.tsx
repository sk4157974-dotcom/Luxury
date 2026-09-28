import React from 'react';

export const SteamEffect: React.FC<{ className?: string }> = ({ className = '' }) => {
  return (
    <div
      className={`absolute inset-0 pointer-events-none z-30 flex items-center justify-center overflow-visible select-none ${className}`}
      aria-hidden="true"
      style={{ contain: 'paint' }}
    >
      {/* Anchor container positioned above the food surface */}
      <div className="relative w-full h-full flex items-center justify-center pointer-events-none">
        
        {/* Soft Warm Heat Haze Base right above the food (GPU gradient, 0% CPU blur) */}
        <div
          className="absolute w-24 sm:w-36 h-16 sm:h-24 -top-3 sm:-top-6 rounded-full animate-heat-haze pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.15) 50%, transparent 75%)'
          }}
        />

        {/* STEAM WISP 1 - Central Rising Plume */}
        <div className="absolute -top-8 sm:-top-14 left-1/2 -translate-x-1/2 steam-stream-1 pointer-events-none">
          <svg width="48" height="120" viewBox="0 0 48 120" fill="none" className="overflow-visible w-8 h-20 sm:w-12 sm:h-32 opacity-90">
            <path
              d="M 24 112 C 14 85, 34 60, 22 30 C 15 15, 27 5, 22 0"
              stroke="url(#steam-grad-center)"
              strokeWidth="6"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="steam-grad-center" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.8" />
                <stop offset="45%" stopColor="#FFFFFF" stopOpacity="0.45" />
                <stop offset="85%" stopColor="#FFFFFF" stopOpacity="0.12" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* STEAM WISP 2 - Left Sinuous Stream */}
        <div className="absolute -top-10 sm:-top-16 left-[34%] steam-stream-2 pointer-events-none">
          <svg width="42" height="110" viewBox="0 0 42 110" fill="none" className="overflow-visible w-7 h-18 sm:w-11 sm:h-28 opacity-85">
            <path
              d="M 26 102 C 12 80, 32 52, 17 28 C 9 13, 20 4, 16 0"
              stroke="url(#steam-grad-left)"
              strokeWidth="5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="steam-grad-left" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.35" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* STEAM WISP 3 - Right Dancing Stream */}
        <div className="absolute -top-12 sm:-top-18 left-[58%] steam-stream-3 pointer-events-none">
          <svg width="44" height="125" viewBox="0 0 44 125" fill="none" className="overflow-visible w-8 h-20 sm:w-12 sm:h-32 opacity-85">
            <path
              d="M 18 118 C 32 90, 14 58, 28 32 C 35 16, 23 5, 26 0"
              stroke="url(#steam-grad-right)"
              strokeWidth="5.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="steam-grad-right" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.75" />
                <stop offset="40%" stopColor="#FFFFFF" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* STEAM WISP 4 - Subtle Secondary Left Wisp */}
        <div className="absolute -top-7 sm:-top-12 left-[26%] steam-stream-4 pointer-events-none">
          <svg width="34" height="90" viewBox="0 0 34 90" fill="none" className="overflow-visible w-6 h-14 sm:w-9 sm:h-22 opacity-75">
            <path
              d="M 16 84 C 26 62, 10 42, 20 20 C 24 9, 17 2, 19 0"
              stroke="url(#steam-grad-left-2)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="steam-grad-left-2" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.6" />
                <stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* STEAM WISP 5 - Subtle Secondary Right Wisp */}
        <div className="absolute -top-9 sm:-top-14 left-[68%] steam-stream-5 pointer-events-none">
          <svg width="36" height="100" viewBox="0 0 36 100" fill="none" className="overflow-visible w-6 h-16 sm:w-9 sm:h-24 opacity-75">
            <path
              d="M 16 94 C 8 72, 26 46, 13 24 C 7 11, 19 3, 15 0"
              stroke="url(#steam-grad-right-2)"
              strokeWidth="4.5"
              strokeLinecap="round"
            />
            <defs>
              <linearGradient id="steam-grad-right-2" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.65" />
                <stop offset="55%" stopColor="#FFFFFF" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Soft Volumetric Steam Puffs - Native radial gradients for 120 FPS buttery smoothness */}
        <div
          className="absolute -top-4 sm:-top-6 left-[38%] w-10 sm:w-16 h-10 sm:h-16 rounded-full steam-puff-1 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.15) 45%, transparent 70%)' }}
        />
        <div
          className="absolute -top-6 sm:-top-9 left-[50%] w-12 sm:w-18 h-12 sm:h-18 rounded-full steam-puff-2 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.12) 50%, transparent 70%)' }}
        />
        <div
          className="absolute -top-5 sm:-top-8 left-[44%] w-14 sm:w-20 h-14 sm:h-20 rounded-full steam-puff-3 pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 45%, transparent 70%)' }}
        />

      </div>
    </div>
  );
};
