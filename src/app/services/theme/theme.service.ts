import { Injectable } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly key = 'theme';

  init() {
    const saved = (localStorage.getItem(this.key) as ThemeMode) ?? 'dark';
    this.set(saved);
  }

  toggle() {
    const next = this.current === 'dark' ? 'light' : 'dark';
    this.set(next);
  }

  get current(): ThemeMode {
    return document.documentElement.classList.contains('dark')
      ? 'dark'
      : 'light';
  }

  private set(mode: ThemeMode) {
    const html = document.documentElement;
    html.classList.remove('light', 'dark');
    html.classList.add(mode);
    localStorage.setItem(this.key, mode);
  }
}