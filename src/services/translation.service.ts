import { Injectable, signal, effect } from '@angular/core';
import { en } from '../assets/i18n/en';
import { fr } from '../assets/i18n/fr';
import { ar } from '../assets/i18n/ar';

@Injectable({ providedIn: 'root' })
export class TranslationService {
  private languages = { en, fr, ar };
  
  currentLang = signal<'en' | 'fr' | 'ar'>((localStorage.getItem('lang') as any) || 'en');
  translations = signal<any>(this.languages[this.currentLang()]);

  constructor() {
    effect(() => {
      const lang = this.currentLang();
      localStorage.setItem('lang', lang);
      this.translations.set(this.languages[lang]);
      if (lang === 'ar') {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', lang);
      }
    });
  }

  setLanguage(lang: 'en' | 'fr' | 'ar') {
    this.currentLang.set(lang);
  }

  get(key: string): string {
    const keys = key.split('.');
    let result = this.translations();
    for(const k of keys) {
      result = result?.[k];
      if(!result) {
        return key;
      }
    }
    return result || key;
  }
}
