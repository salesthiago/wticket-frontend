import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly DARK_THEME = 'dark';
  private readonly LIGHT_THEME = 'light';
  private readonly THEME_KEY = 'theme';

  private isDarkThemeSubject: BehaviorSubject<boolean>;

  constructor() {
    // Inicializa com o tema atual
    const initialTheme = this.getInitialTheme();
    this.isDarkThemeSubject = new BehaviorSubject<boolean>(initialTheme === this.DARK_THEME);
    this.applyTheme(initialTheme);
  }

  private getInitialTheme(): string {
    const storedTheme = localStorage.getItem(this.THEME_KEY);
    if (storedTheme) {
      return storedTheme;
    }

    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? this.DARK_THEME : this.LIGHT_THEME;
  }

  public get isDarkTheme$(): Observable<boolean> {
    return this.isDarkThemeSubject.asObservable();
  }

  private applyTheme(theme: string): void {
    if (theme === this.DARK_THEME) {
      document.documentElement.classList.add(this.DARK_THEME);
    } else {
      document.documentElement.classList.remove(this.DARK_THEME);
    }
    localStorage.setItem(this.THEME_KEY, theme);
  }

  toggleTheme(): void {
    const currentIsDark = this.isDarkThemeSubject.value;
    const newTheme = currentIsDark ? this.LIGHT_THEME : this.DARK_THEME;

    this.applyTheme(newTheme);
    this.isDarkThemeSubject.next(!currentIsDark);
    console.log('Theme toggled to:', newTheme, 'isDark:', !currentIsDark);
  }

  isDarkTheme(): boolean {
    return this.isDarkThemeSubject.value;
  }

  setDarkTheme(isDark: boolean): void {
    const theme = isDark ? this.DARK_THEME : this.LIGHT_THEME;
    this.applyTheme(theme);
    this.isDarkThemeSubject.next(isDark);
  }
}
