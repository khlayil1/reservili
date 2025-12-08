import { Injectable, signal, effect } from '@angular/core';

export type Theme = 'light' | 'dark' | 'system';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  theme = signal<Theme>((localStorage.getItem('theme') as Theme) || 'system');

  constructor() {
    effect(() => {
      const currentTheme = this.theme();
      localStorage.setItem('theme', currentTheme);

      if (currentTheme === 'system') {
        this.setSystemTheme();
      } else {
        this.setTheme(currentTheme);
      }
    });

    // Listen for system theme changes if 'system' is selected
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
      if (this.theme() === 'system') {
        this.setSystemTheme();
      }
    });
  }
  
  private setSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      this.setTheme('dark');
    } else {
      this.setTheme('light');
    }
  }

  private setTheme(theme: 'light' | 'dark') {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  toggleTheme() {
    const current = this.theme();
    if (current === 'light') {
      this.theme.set('dark');
    } else if (current === 'dark') {
      this.theme.set('system');
    } else {
      this.theme.set('light');
    }
  }
}
