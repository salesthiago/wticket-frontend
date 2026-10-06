import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

const COLLAPSE_STORAGE_KEY = 'sidebar-collapsed';

@Injectable({
  providedIn: 'root'
})
export class SidebarService {
  private isOpenSubject = new BehaviorSubject<boolean>(false);
  private isCollapsedSubject = new BehaviorSubject<boolean>(this.readStoredCollapsed());

  public get isOpen$(): Observable<boolean> {
    return this.isOpenSubject.asObservable();
  }

  public get isCollapsed$(): Observable<boolean> {
    return this.isCollapsedSubject.asObservable();
  }

  isOpen(): boolean {
    return this.isOpenSubject.value;
  }

  open(): void {
    this.isOpenSubject.next(true);
  }

  close(): void {
    this.isOpenSubject.next(false);
  }

  toggle(): void {
    this.isOpenSubject.next(!this.isOpenSubject.value);
  }

  isCollapsed(): boolean {
    return this.isCollapsedSubject.value;
  }

  // Recolhido = sidebar só com ícones (telas >= sm). Preferência persistida
  // para o usuário não precisar repetir a cada login.
  toggleCollapsed(): void {
    const next = !this.isCollapsedSubject.value;
    this.isCollapsedSubject.next(next);
    this.persistCollapsed(next);
  }

  private readStoredCollapsed(): boolean {
    if (typeof localStorage === 'undefined') return false;
    return localStorage.getItem(COLLAPSE_STORAGE_KEY) === 'true';
  }

  private persistCollapsed(value: boolean): void {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(value));
  }
}
