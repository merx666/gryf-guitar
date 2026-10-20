import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Check,
  Crown,
  Zap,
  Layers,
  Wand2,
  Radio,
  ShieldCheck,
  ArrowRight,
  Flame,
} from 'lucide-react';
import { sfx } from '../audio/sfxPlayer';

interface ProUpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgradeSuccess: (tier: 'pro' | 'lifetime') => void;
}

export const ProUpgradeModal: React.FC<ProUpgradeModalProps> = ({
  isOpen,
  onClose,
  onUpgradeSuccess,
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly' | 'lifetime'>('yearly');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handleCheckout = () => {
    sfx.play('select');
    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      sfx.play('inTune');
      onUpgradeSuccess(selectedPlan === 'lifetime' ? 'lifetime' : 'pro');
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 bg-[#0b0907]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-sm bg-[#110e0b] border-2 border-[#e2b04a]/40 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden text-[#f2ead8]">
        {/* Glow złoty w tle */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-[#e2b04a]/15 via-[#e0392b]/10 to-transparent pointer-events-none"></div>

        {/* Przycisk zamknięcia */}
        <button
          onClick={() => {
            sfx.play('click_subtle');
            onClose();
          }}
          className="absolute top-4 right-4 text-[#f2ead8]/50 hover:text-white p-1 rounded-sm hover:bg-[#1a1612] transition-colors cursor-pointer z-20"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#e2b04a]/20 border border-[#e2b04a]/50 mb-3 shadow-[0_0_15px_rgba(226,176,74,0.3)]">
              <Crown className="w-4 h-4 text-[#e2b04a]" />
              <span className="text-xs font-['Barlow_Condensed'] uppercase tracking-[0.2em] font-bold text-[#e2b04a]">
                OFICJALNY PAKIET PRO
              </span>
            </div>
            <h2 className="text-3xl md:text-4xl font-black font-['Big_Shoulders_Display'] uppercase tracking-tight text-[#f2ead8]">
              ODBLOKUJ PEŁNĄ MOC GRYF PRO
            </h2>
            <p className="text-xs text-[#f2ead8]/70 font-['Barlow'] max-w-lg mx-auto mt-1">
              Rdzeń gry pozostaje <span className="text-[#58c46c] font-bold">100% darmowy & Open Source</span>.
              Plan PRO finansuje serwery klastra GPU dla modelu Demucs v4 i nielimitowanej chmury tabulatur.
            </p>
          </div>

          {/* Wybór planu */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
            {/* 1. MIESIĘCZNY */}
            <div
              onClick={() => {
                sfx.play('tap');
                setSelectedPlan('monthly');
              }}
              className={`p-4 rounded-sm border transition-all cursor-pointer relative ${
                selectedPlan === 'monthly'
                  ? 'bg-[#1a1612] border-[#e2b04a] shadow-[0_0_15px_rgba(226,176,74,0.3)]'
                  : 'bg-[#080605] border-[#f2ead8]/12 hover:border-[#f2ead8]/30'
              }`}
            >
              <div className="text-xs font-['Barlow_Condensed'] uppercase font-bold text-[#f2ead8]/60">
                Plan Miesięczny
              </div>
              <div className="text-2xl font-black font-['Big_Shoulders_Display'] text-[#f2ead8] mt-1">
                $4.99 <span className="text-xs font-['Barlow'] font-normal text-[#f2ead8]/60">/ msc</span>
              </div>
              <p className="text-[10px] text-[#f2ead8]/50 mt-1 font-['Barlow']">Płatność odnawiana co miesiąc</p>
            </div>

            {/* 2. ROCZNY (POPULARNY) */}
            <div
              onClick={() => {
                sfx.play('tap');
                setSelectedPlan('yearly');
              }}
              className={`p-4 rounded-sm border transition-all cursor-pointer relative ${
                selectedPlan === 'yearly'
                  ? 'bg-[#1a1612] border-[#e2b04a] shadow-[0_0_25px_rgba(226,176,74,0.4)] scale-105 z-10'
                  : 'bg-[#080605] border-[#f2ead8]/12 hover:border-[#f2ead8]/30'
              }`}
            >
              <div className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-sm bg-[#e0392b] text-white font-['Barlow_Condensed'] font-black text-[10px] uppercase tracking-wider shadow-sm">
                OSZCZĘDZASZ 35%
              </div>
              <div className="text-xs font-['Barlow_Condensed'] uppercase font-bold text-[#e2b04a]">
                Plan Roczny (Rekomendowany)
              </div>
              <div className="text-2xl font-black font-['Big_Shoulders_Display'] text-[#f2ead8] mt-1">
                $3.25 <span className="text-xs font-['Barlow'] font-normal text-[#f2ead8]/60">/ msc</span>
              </div>
              <p className="text-[10px] text-[#e2b04a] mt-1 font-['Barlow']">$39 rozliczane rocznie</p>
            </div>

            {/* 3. LIFETIME BACKER */}
            <div
              onClick={() => {
                sfx.play('tap');
                setSelectedPlan('lifetime');
              }}
              className={`p-4 rounded-sm border transition-all cursor-pointer relative ${
                selectedPlan === 'lifetime'
                  ? 'bg-[#1a1612] border-[#e2b04a] shadow-[0_0_15px_rgba(226,176,74,0.3)]'
                  : 'bg-[#080605] border-[#f2ead8]/12 hover:border-[#f2ead8]/30'
              }`}
            >
              <div className="text-xs font-['Barlow_Condensed'] uppercase font-bold text-[#f2ead8]/60">
                Lifetime Backer
              </div>
              <div className="text-2xl font-black font-['Big_Shoulders_Display'] text-[#f2ead8] mt-1">
                $79 <span className="text-xs font-['Barlow'] font-normal text-[#f2ead8]/60">jednorazowo</span>
              </div>
              <p className="text-[10px] text-[#f2ead8]/50 mt-1 font-['Barlow']">Dostęp dożywotni + Złoty Badge</p>
            </div>
          </div>

          {/* Lista Korzyści Gryf PRO */}
          <div className="space-y-2.5 bg-[#080605] p-5 rounded-sm border border-[#f2ead8]/10 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-1 rounded-sm bg-[#e2b04a]/20 text-[#e2b04a] mt-0.5">
                <Wand2 className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#f2ead8]">
                  Nielimitowane przetwarzanie Demucs v4 AI w chmurze
                </div>
                <div className="text-[11px] text-[#f2ead8]/60 font-['Barlow']">
                  Wklejasz MP3 lub YouTube — nasz klaster GPU separuje gitarę i generuje tabulaturę w 10 sekund.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 rounded-sm bg-[#e2b04a]/20 text-[#e2b04a] mt-0.5">
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#f2ead8]">
                  Nieograniczony Sejf Tabulatur w Chmurze
                </div>
                <div className="text-[11px] text-[#f2ead8]/60 font-['Barlow']">
                  Zapisuj tysiące własnych zsynchronizowanych utworów i otwieraj na laptopie, telefonie lub tablecie.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 rounded-sm bg-[#e2b04a]/20 text-[#e2b04a] mt-0.5">
                <Radio className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#f2ead8]">
                  Wasm Neural Amp Modeler (NAM) Cloud IR Library
                </div>
                <div className="text-[11px] text-[#f2ead8]/60 font-['Barlow']">
                  Dostęp do 500+ legendarnych profili studyjnych (Mesa Boogie, Dumble, Friedman, Marshall JCM800).
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="p-1 rounded-sm bg-[#e2b04a]/20 text-[#e2b04a] mt-0.5">
                <Crown className="w-3.5 h-3.5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#f2ead8]">
                  Złota Odznaka "Founding Backer" w profilu i rankingach
                </div>
                <div className="text-[11px] text-[#f2ead8]/60 font-['Barlow']">
                  Wspierasz rozwój najszybciej rosnącego darmowego projektu gitarowego na świecie.
                </div>
              </div>
            </div>
          </div>

          {/* Przycisk aktywacji */}
          <button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-sm bg-[#e2b04a] hover:bg-[#d6a53e] text-[#0b0907] font-['Big_Shoulders_Display'] uppercase font-black text-lg tracking-wider transition-all cursor-pointer shadow-[0_0_25px_rgba(226,176,74,0.5)] active:scale-[0.99] disabled:opacity-50"
          >
            <span>{isProcessing ? 'AKTYWACJA SUBSKRYPCJI...' : 'ODBLOKUJ PAKIET PRO TERAZ'}</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          {/* Gwarancja satysfakcji */}
          <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-[#f2ead8]/50 font-['Barlow']">
            <ShieldCheck className="w-4 h-4 text-[#58c46c]" />
            <span>14 dni gwarancji zwrotu pieniędzy • Bezpieczne płatności Stripe / LemonSqueezy</span>
          </div>
        </div>
      </div>
    </div>
  );
};
