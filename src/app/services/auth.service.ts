import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/enviroment';

export type UserRole = 'super_admin' | 'company_admin' | 'administrator' | 'finance' | 'default';
export type ModuleCode = 'attendance' | 'service_order' | 'auto_attendance' | 'nfse' | 'financial';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
  modules: ModuleCode[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private tokenKey = 'authToken';
  private userKey = 'userData';
  private modulesKey = 'userModules';
  private isAuthenticated = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private http: HttpClient, private router: Router) {}

  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => {
          this.setSession(response);
          this.isAuthenticated.next(true);
        })
      );
  }

  private setSession(authResult: LoginResponse): void {
    localStorage.setItem(this.tokenKey, authResult.token);
    localStorage.setItem(this.userKey, JSON.stringify(authResult.user));
    localStorage.setItem(this.modulesKey, JSON.stringify(authResult.modules || []));
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    localStorage.removeItem(this.modulesKey);
    this.isAuthenticated.next(false);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  updateUser(user: AuthUser): void {
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }

  getUser(): AuthUser | null {
    const user = localStorage.getItem(this.userKey);
    return user ? JSON.parse(user) : null;
  }

  getModules(): ModuleCode[] {
    const raw = localStorage.getItem(this.modulesKey);
    return raw ? JSON.parse(raw) : [];
  }

  hasModule(code: ModuleCode): boolean {
    if (this.isSuperAdmin()) return true;
    return this.getModules().includes(code);
  }

  hasAnyModule(...codes: ModuleCode[]): boolean {
    if (this.isSuperAdmin()) return true;
    const active = this.getModules();
    return codes.some(c => active.includes(c));
  }

  getRole(): UserRole | null {
    return this.getUser()?.role ?? null;
  }

  isSuperAdmin(): boolean {
    return this.getRole() === 'super_admin';
  }

  isCompanyAdmin(): boolean {
    const role = this.getRole();
    return role === 'company_admin' || role === 'super_admin';
  }

  hasAnyRole(...roles: UserRole[]): boolean {
    if (this.isSuperAdmin()) return true; // super_admin sempre liberado
    const r = this.getRole();
    return r ? roles.includes(r) : false;
  }

  getCompanyId(): string | null {
    return this.getUser()?.companyId ?? null;
  }

  isLoggedIn(): boolean {
    return this.hasToken();
  }

  private hasToken(): boolean {
    return !!this.getToken();
  }

  getAuthStatus(): Observable<boolean> {
    return this.isAuthenticated.asObservable();
  }
}
