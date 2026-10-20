import React, { useState } from 'react';
import {
  X,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  Mail,
  User,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { UserProfile, AuthProvider } from '../types';
import { sfx } from '../audio/sfxPlayer';
import { useTranslation } from '../i18n/LanguageContext';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLogin: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onLogin,
  initialMode = 'login',
}) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeProvider, setActiveProvider] = useState<AuthProvider | null>(null);

  if (!isOpen) return null;

  const handleSocialLogin = (provider: AuthProvider) => {
    sfx.play('select');
    setActiveProvider(provider);
    setIsSubmitting(true);

    // Symulacja autoryzacji OAuth z przekierowaniem i utworzeniem profilu
    setTimeout(() => {
      let mockName = 'Rock Guitarist';
      let mockEmail = 'guitarist@gryf.live';
      let mockAvatar = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&auto=format&fit=crop&q=80';

      if (provider === 'google') {
        mockName = 'Alex Hendrix (Google)';
        mockEmail = 'alex.hendrix@gmail.com';
      } else if (provider === 'x') {
        mockName = '@SlashGuitars (X.com)';
        mockEmail = 'slash@x.com';
      } else if (provider === 'facebook') {
        mockName = 'Marek Jackowski (Meta)';
        mockEmail = 'marek@facebook.com';
      } else if (provider === 'microsoft') {
        mockName = 'Dave Mustaine (Xbox Live)';
        mockEmail = 'dave@outlook.com';
      }

      const user: UserProfile = {
        id: 'usr_' + Date.now(),
        name: mockName,
        email: mockEmail,
        avatarUrl: mockAvatar,
        provider,
        tier: 'free',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('gryf_user_session', JSON.stringify(user));
      setIsSubmitting(false);
      sfx.play('inTune');
      onLogin(user);
      onClose();
    }, 1200);
  };

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    sfx.play('select');
    setIsSubmitting(true);
    setActiveProvider('email');

    setTimeout(() => {
      const user: UserProfile = {
        id: 'usr_' + Date.now(),
        name: email.split('@')[0],
        email: email,
        provider: 'email',
        tier: 'free',
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem('gryf_user_session', JSON.stringify(user));
      setIsSubmitting(false);
      sfx.play('inTune');
      onLogin(user);
      onClose();
    }, 1000);
  };

  const handleGuestLogin = () => {
    sfx.play('click_subtle');
    const guestUser: UserProfile = {
      id: 'guest_' + Date.now(),
      name: 'Guest Player',
      provider: 'guest',
      tier: 'free',
      createdAt: new Date().toISOString(),
    };
    localStorage.setItem('gryf_user_session', JSON.stringify(guestUser));
    onLogin(guestUser);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-[#0b0907]/90 backdrop-blur-xl z-50 flex items-center justify-center p-4 select-none animate-fadeIn">
      <div className="relative w-full max-w-md rounded-sm bg-[#110e0b] border-2 border-[#f2ead8]/15 shadow-[0_25px_60px_rgba(0,0,0,0.95)] overflow-hidden">
        {/* Glow sceniczny w narożniku */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#e0392b]/20 via-[#e2b04a]/10 to-transparent pointer-events-none"></div>

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

        <div className="p-7">
          {/* Header modalu */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#e2b04a]/15 border border-[#e2b04a]/30 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-[#e2b04a]" />
              <span className="text-[11px] font-['Barlow_Condensed'] uppercase tracking-[0.2em] font-bold text-[#e2b04a]">
                Gryf Cloud Account
              </span>
            </div>
            <h2 className="text-3xl font-black font-['Big_Shoulders_Display'] uppercase tracking-tight text-[#f2ead8]">
              {t('auth.title')}
            </h2>
            <p className="text-xs text-[#f2ead8]/60 font-['Barlow'] mt-1">
              {t('auth.subtitle')}
            </p>
          </div>

          {/* Przyciski Logowania Społecznościowego */}
          <div className="space-y-2.5">
            {/* 1. GOOGLE */}
            <button
              onClick={() => handleSocialLogin('google')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-sm bg-[#1c1712] hover:bg-[#241e18] border border-[#f2ead8]/15 hover:border-[#f2ead8]/40 text-[#f2ead8] font-['Barlow_Condensed'] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#EA4335"
                  d="M12 5c1.6 0 3 .6 4.1 1.6l3.1-3.1C17.3 1.7 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                />
                <path
                  fill="#4285F4"
                  d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.3 0-.8.2-1.6.4-2.3L1.9 7.3C.7 9.7 0 12.3 0 15s.7 5.3 1.9 7.7l3.7-2.9z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2-6.4-4.8L1.9 16.4C3.7 20.1 7.5 23 12 23z"
                />
              </svg>
              <span>{isSubmitting && activeProvider === 'google' ? 'Connecting...' : t('auth.google')}</span>
            </button>

            {/* 2. X.COM (TWITTER) */}
            <button
              onClick={() => handleSocialLogin('x')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-sm bg-[#1c1712] hover:bg-[#241e18] border border-[#f2ead8]/15 hover:border-[#f2ead8]/40 text-[#f2ead8] font-['Barlow_Condensed'] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-white" viewBox="0 0 24 24">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
              </svg>
              <span>{isSubmitting && activeProvider === 'x' ? 'Connecting...' : t('auth.x')}</span>
            </button>

            {/* 3. FACEBOOK (META) */}
            <button
              onClick={() => handleSocialLogin('facebook')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-sm bg-[#1c1712] hover:bg-[#241e18] border border-[#f2ead8]/15 hover:border-[#f2ead8]/40 text-[#f2ead8] font-['Barlow_Condensed'] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4 fill-[#1877F2]" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
              <span>{isSubmitting && activeProvider === 'facebook' ? 'Connecting...' : t('auth.facebook')}</span>
            </button>

            {/* 4. MICROSOFT */}
            <button
              onClick={() => handleSocialLogin('microsoft')}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 px-4 py-2.5 rounded-sm bg-[#1c1712] hover:bg-[#241e18] border border-[#f2ead8]/15 hover:border-[#f2ead8]/40 text-[#f2ead8] font-['Barlow_Condensed'] font-bold text-sm uppercase tracking-wider transition-all cursor-pointer shadow-md active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 23 23">
                <path fill="#f35325" d="M1 1h10v10H1z" />
                <path fill="#81bc06" d="M12 1h10v10H12z" />
                <path fill="#05a6f0" d="M1 12h10v10H1z" />
                <path fill="#ffba08" d="M12 12h10v10H12z" />
              </svg>
              <span>{isSubmitting && activeProvider === 'microsoft' ? 'Connecting...' : t('auth.microsoft')}</span>
            </button>
          </div>

          {/* Separator */}
          <div className="flex items-center my-5">
            <div className="flex-1 border-t border-[#f2ead8]/10"></div>
            <span className="px-3 text-[10px] font-['Barlow_Condensed'] uppercase tracking-widest text-[#f2ead8]/40 font-bold">
              {t('auth.emailOr')}
            </span>
            <div className="flex-1 border-t border-[#f2ead8]/10"></div>
          </div>

          {/* Formularz Email */}
          <form onSubmit={handleEmailSubmit} className="space-y-3">
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#f2ead8]/40" />
              <input
                type="email"
                placeholder={t('auth.emailPlaceholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-sm bg-[#080605] border border-[#f2ead8]/15 text-sm text-[#f2ead8] placeholder-[#f2ead8]/30 focus:outline-none focus:border-[#e2b04a] font-['Barlow']"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-sm bg-[#e0392b] hover:bg-[#c93226] text-white font-['Big_Shoulders_Display'] uppercase font-black text-sm tracking-wider transition-all cursor-pointer shadow-[0_0_15px_rgba(224,57,43,0.4)] disabled:opacity-50"
            >
              <span>{isSubmitting && activeProvider === 'email' ? 'SENDING...' : t('auth.sendMagicLink')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          {/* Tryb Gość (Open Source / Offline) */}
          <div className="mt-5 pt-4 border-t border-[#f2ead8]/10 text-center">
            <button
              onClick={handleGuestLogin}
              className="text-xs font-['Barlow_Condensed'] uppercase tracking-wider font-bold text-[#f2ead8]/60 hover:text-[#e2b04a] transition-colors cursor-pointer"
            >
              {t('auth.guestMode')} ({t('auth.guestDesc')})
            </button>
          </div>
        </div>

        {/* Stopka bezpieczeństwa */}
        <div className="px-7 py-3 bg-[#080605] border-t border-[#f2ead8]/8 flex items-center justify-between text-[10px] text-[#f2ead8]/40 font-['Barlow']">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#58c46c]" />
            <span>Szyfrowanie End-to-End • Zero telemetrii</span>
          </div>
          <span>Gryf Open Guitar v1.0</span>
        </div>
      </div>
    </div>
  );
};
