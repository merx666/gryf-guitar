import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from '../i18n/LanguageContext';
import { SUPPORTED_LANGUAGES, SupportedLang } from '../i18n/types';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { sfx } from '../audio/sfxPlayer';

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage, currentLanguageInfo } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Zamykanie po kliknięciu poza dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (code: SupportedLang) => {
    sfx.play('select');
    setLanguage(code);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => {
          sfx.play('select');
          setIsOpen((prev) => !prev);
        }}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-[#14110e] border border-[#f2ead821] hover:border-[#e2b04a] text-xs font-bold text-[#f2ead8] transition-all cursor-pointer group"
        title="Switch language / Zmień język"
        aria-label="Language selector"
      >
        <Globe className="w-3.5 h-3.5 text-[#e2b04a] group-hover:rotate-12 transition-transform" />
        <span className="text-sm leading-none">{currentLanguageInfo.flag}</span>
        <span className="font-['Barlow_Condensed'] font-black uppercase tracking-wider text-[11px] text-[#f2ead8]">
          {currentLanguageInfo.code}
        </span>
        <ChevronDown
          className={`w-3 h-3 text-[#f2ead8]/50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-md bg-[#120f0c] border border-[#e2b04a]/30 shadow-2xl shadow-black/90 py-1.5 z-50 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3 py-1 text-[10px] font-['Barlow_Condensed'] font-black uppercase tracking-widest text-[#e2b04a] border-b border-[#f2ead8]/10 mb-1">
            Global Language / Język
          </div>
          {SUPPORTED_LANGUAGES.map((lang) => {
            const isActive = lang.code === language;
            return (
              <button
                key={lang.code}
                onClick={() => handleSelect(lang.code)}
                className={`w-full flex items-center justify-between px-3 py-2 text-xs text-left transition-colors cursor-pointer ${
                  isActive
                    ? 'bg-[#e2b04a]/15 text-[#e2b04a] font-bold'
                    : 'text-[#f2ead8] hover:bg-[#1f1a14] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span className="text-base leading-none">{lang.flag}</span>
                  <div>
                    <span className="block font-['Barlow'] leading-none">{lang.nativeName}</span>
                    <span className="text-[10px] text-[#f2ead8]/50 block mt-0.5 font-['Barlow_Condensed'] uppercase tracking-wider">
                      {lang.name}
                    </span>
                  </div>
                </div>
                {isActive && <Check className="w-3.5 h-3.5 text-[#e2b04a]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
