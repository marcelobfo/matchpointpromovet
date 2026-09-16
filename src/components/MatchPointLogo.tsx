import React from 'react';

interface MatchPointLogoProps {
  variant?: 'full' | 'symbol' | 'horizontal';
  theme?: 'dark' | 'light';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showContacts?: boolean;
  className?: string;
}

export const MatchPointLogo: React.FC<MatchPointLogoProps> = ({
  variant = 'full',
  theme = 'dark',
  size = 'md',
  showContacts = false,
  className = ''
}) => {
  const isDark = theme === 'dark';

  // Dimension scaling
  const symbolSizes = {
    sm: 'w-8 h-8',
    md: 'w-11 h-11',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-sm tracking-widest',
    md: 'text-lg tracking-[0.2em]',
    lg: 'text-2xl tracking-[0.25em]',
    xl: 'text-4xl tracking-[0.28em]'
  };

  const subTextSizes = {
    sm: 'text-[8px] tracking-[0.3em]',
    md: 'text-[10px] tracking-[0.4em]',
    lg: 'text-xs tracking-[0.45em]',
    xl: 'text-sm tracking-[0.5em]'
  };

  // The Iconic Match Point Target + Dart + Segmented Ring SVG
  const SymbolSVG = (
    <div className={`relative flex items-center justify-center shrink-0 ${symbolSizes[size]}`}>
      <svg
        viewBox="0 0 100 100"
        className="w-full h-full drop-shadow-sm select-none"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Dynamic Segmented Outer Ring (Motion & Speed) */}
        {/* Segment 1: Red / Impulso (#D90000) */}
        <path
          d="M 50 6 A 44 44 0 0 1 88 28"
          stroke="#D90000"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Segment 2: Deep Ruby / Rubi Profundo (#AC1921) */}
        <path
          d="M 12 30 A 44 44 0 0 1 48 6"
          stroke="#AC1921"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Segment 3: Orange / Laranja Match (#FF530D) */}
        <path
          d="M 92 42 A 44 44 0 0 1 76 86"
          stroke="#FF530D"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Segment 4: Gold / Dourado Conexão (#FBBF3D) */}
        <path
          d="M 68 90 A 44 44 0 0 1 24 82"
          stroke="#FBBF3D"
          strokeWidth="7"
          strokeLinecap="round"
        />
        {/* Segment 5: Lower-left accent tick */}
        <path
          d="M 16 72 A 44 44 0 0 1 8 48"
          stroke="#FF530D"
          strokeWidth="7"
          strokeLinecap="round"
        />

        {/* Dynamic Speed Rays (Diagonals) */}
        <line x1="84" y1="16" x2="96" y2="8" stroke="#D90000" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="92" y1="36" x2="99" y2="30" stroke="#FF530D" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="78" y1="88" x2="88" y2="96" stroke="#FBBF3D" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="20" y1="84" x2="10" y2="92" stroke="#FF530D" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="12" y1="32" x2="4" y2="24" stroke="#AC1921" strokeWidth="2.5" strokeLinecap="round" />

        {/* Solid White Inner Disc for Contrast */}
        <circle cx="50" cy="50" r="33" fill="#FFFFFF" />

        {/* Outer Target Ring - Laranja Match */}
        <circle cx="50" cy="50" r="26" stroke="#FF530D" strokeWidth="4.5" fill="none" />

        {/* Middle Target Ring - Laranja Match with gap for dart */}
        <path
          d="M 33 50 A 17 17 0 1 0 50 33"
          stroke="#FF530D"
          strokeWidth="4.5"
          fill="none"
          strokeLinecap="round"
        />

        {/* Center Target Bullseye (Small Dot) */}
        <circle cx="50" cy="50" r="3.8" fill="#FF530D" />

        {/* Target Dart in Precision Flight - Hitting Bullseye from top right */}
        {/* Dart Shaft */}
        <line x1="68" y1="32" x2="54" y2="46" stroke="#FF530D" strokeWidth="4.5" strokeLinecap="round" />
        {/* Dart Flights / Flight Fin */}
        <path
          d="M 66 22 L 78 34 L 73 39 L 61 27 Z"
          fill="#FF530D"
        />
      </svg>
    </div>
  );

  if (variant === 'symbol') {
    return SymbolSVG;
  }

  return (
    <div className={`flex flex-col items-center select-none ${className}`}>
      {variant === 'horizontal' ? (
        <div className="flex items-center gap-3">
          {SymbolSVG}
          <div className="flex flex-col">
            <span
              className={`font-black uppercase tracking-[0.18em] ${
                isDark ? 'text-[#FF530D]' : 'text-[#FF530D]'
              } ${textSizes[size]}`}
              style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
            >
              MATCH POINT
            </span>
            <span
              className={`font-bold uppercase tracking-[0.38em] text-center ${
                isDark ? 'text-[#FBBF3D]' : 'text-[#111111]'
              } ${subTextSizes[size]}`}
            >
              PROMOVE
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center text-center">
          {SymbolSVG}
          <span
            className={`font-black uppercase mt-1.5 ${
              isDark ? 'text-[#FF530D]' : 'text-[#FF530D]'
            } ${textSizes[size]}`}
            style={{ fontFamily: 'Inter, system-ui, sans-serif' }}
          >
            MATCH POINT
          </span>
          <span
            className={`font-bold uppercase ${
              isDark ? 'text-[#FBBF3D]' : 'text-[#111111]'
            } ${subTextSizes[size]}`}
          >
            PROMOVE
          </span>
        </div>
      )}

      {showContacts && (
        <div className="flex flex-wrap items-center justify-center gap-4 mt-3 pt-2 border-t border-[#FF530D]/30 text-xs text-slate-300">
          <span className="flex items-center gap-1 text-[#FBBF3D]">
            📞 27 99273-5244
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-[#FF530D]">
            📷 @matchpoint.promove
          </span>
          <span className="text-slate-600">•</span>
          <span className="flex items-center gap-1 text-slate-300">
            ✉️ matchpointpromove@gmail.com
          </span>
        </div>
      )}
    </div>
  );
};
