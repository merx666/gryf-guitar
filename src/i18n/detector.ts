import { SupportedLang } from './types';

const STORAGE_KEY = 'gryf_lang';
const MANUAL_KEY = 'gryf_lang_manual';

/**
 * Normalizuje kod języka przeglądarki na wspierany język Gryf
 */
function normalizeLangCode(code: string): SupportedLang | null {
  const lower = code.toLowerCase();
  if (lower.startsWith('pl')) return 'pl';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('ja')) return 'ja';
  if (lower.startsWith('pt')) return 'pt';
  if (lower.startsWith('en')) return 'en';
  return null;
}

/**
 * Heurystyka strefy czasowej
 */
function detectFromTimezone(): SupportedLang | null {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    if (tz.includes('Warsaw')) return 'pl';
    if (
      tz.includes('Madrid') ||
      tz.includes('Buenos_Aires') ||
      tz.includes('Santiago') ||
      tz.includes('Bogota') ||
      tz.includes('Mexico') ||
      tz.includes('Lima') ||
      tz.includes('Caracas') ||
      tz.includes('Montevideo')
    ) {
      return 'es';
    }
    if (tz.includes('Berlin') || tz.includes('Vienna') || tz.includes('Zurich')) {
      return 'de';
    }
    if (tz.includes('Paris') || tz.includes('Brussels')) {
      return 'fr';
    }
    if (tz.includes('Tokyo')) {
      return 'ja';
    }
    if (
      tz.includes('Sao_Paulo') ||
      tz.includes('Lisbon') ||
      tz.includes('Fortaleza') ||
      tz.includes('Manaus') ||
      tz.includes('Recife')
    ) {
      return 'pt';
    }
  } catch (e) {
    // ignoruj błąd odczytu strefy czasowej
  }
  return null;
}

/**
 * Synchroniczne wstępne wykrycie (bez blokowania ładowania strony)
 */
export function detectInitialLanguage(): SupportedLang {
  // 1. Zapisany wybór w localStorage
  try {
    const saved = localStorage.getItem(STORAGE_KEY) as SupportedLang | null;
    if (saved && ['en', 'pl', 'es', 'de', 'fr', 'ja', 'pt'].includes(saved)) {
      return saved;
    }
  } catch (e) {}

  // 2. Języki przeglądarki (navigator.languages)
  if (typeof navigator !== 'undefined') {
    const langs = navigator.languages || [navigator.language];
    for (const l of langs) {
      if (l) {
        const matched = normalizeLangCode(l);
        if (matched) return matched;
      }
    }
  }

  // 3. Strefa czasowa
  const tzMatch = detectFromTimezone();
  if (tzMatch) return tzMatch;

  // Domyślny międzynarodowy język
  return 'en';
}

/**
 * Mapowanie kodu kraju ISO (z IP Geolocation) na język
 */
function mapCountryToLang(country: string): SupportedLang | null {
  const c = country.toUpperCase();
  if (c === 'PL') return 'pl';
  if (['ES', 'MX', 'AR', 'CO', 'CL', 'PE', 'VE', 'EC', 'GT', 'CU', 'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'UY'].includes(c)) return 'es';
  if (['DE', 'AT', 'CH'].includes(c)) return 'de';
  if (['FR', 'BE', 'MC', 'SN', 'CI', 'CM'].includes(c)) return 'fr';
  if (c === 'JP') return 'ja';
  if (['BR', 'PT', 'AO', 'MZ'].includes(c)) return 'pt';
  if (['US', 'GB', 'CA', 'AU', 'NZ', 'IE'].includes(c)) return 'en';
  return null;
}

/**
 * Asynchroniczne wykrywanie geolokalizacji po IP (nie blokuje renderowania UI).
 * Wywoływane w tle po starcie aplikacji, jeśli użytkownik nie zmienił języka ręcznie.
 */
export async function detectLanguageFromIp(): Promise<SupportedLang | null> {
  // Jeśli użytkownik ręcznie ustawił język, nie nadpisujemy go po IP
  try {
    if (localStorage.getItem(MANUAL_KEY) === 'true') {
      return null;
    }
  } catch (e) {}

  try {
    // Próba 1: szybkie i ultra-lekkie api.country.is
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch('https://api.country.is/', {
      signal: controller.signal,
      cache: 'default',
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.country) {
        const lang = mapCountryToLang(data.country);
        if (lang) return lang;
      }
    }
  } catch (e) {
    // Próba 2: fallback do ipwho.is
    try {
      const controller2 = new AbortController();
      const timeoutId2 = setTimeout(() => controller2.abort(), 3500);
      const res2 = await fetch('https://ipwho.is/', {
        signal: controller2.signal,
      });
      clearTimeout(timeoutId2);
      if (res2.ok) {
        const data2 = await res2.json();
        if (data2 && data2.country_code) {
          const lang = mapCountryToLang(data2.country_code);
          if (lang) return lang;
        }
      }
    } catch (e2) {
      // Oba serwisy IP offline / brak internetu - pozostajemy przy synchronicznej detekcji
    }
  }

  return null;
}

/**
 * Ręczne ustawienie języka przez użytkownika
 */
export function setStoredLanguage(lang: SupportedLang, isManual = true) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
    if (isManual) {
      localStorage.setItem(MANUAL_KEY, 'true');
    }
  } catch (e) {}
}
