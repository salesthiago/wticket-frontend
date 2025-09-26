import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ToastModule } from 'primeng/toast';
import { ThemeService } from '../../services/theme.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch'
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IconField } from "primeng/iconfield";
import { MenubarModule } from 'primeng/menubar'
import { AvatarModule } from 'primeng/avatar';
import { BadgeModule } from 'primeng/badge';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    CardModule,
    ButtonModule,
    ToastModule,
    ToggleSwitchModule,
    FormsModule,
    ReactiveFormsModule,
    MenubarModule,
    AvatarModule,
    BadgeModule,
    MenubarModule,
  ]
})
export class HeaderComponent implements OnInit {
  user: any;
  dark: boolean = false
  items: any = [
    { label: 'Dashboard', icon: 'pi pi-home', routerLink: '/dashboard' },
    { label: 'Tickets', icon: 'pi pi-tags', routerLink: '/tickets' },
    { label: 'Meu Perfil', icon: 'pi pi-user', routerLink: '/my-account' },
    { label: 'Sair', icon: 'pi pi-sign-out', command: () => this.logout()  },
  ]

  constructor(
    private authService: AuthService,
    public themeService: ThemeService
  ) {
    this.user = this.authService.getUser();
  }

  ngOnInit() {
    this.dark = this.themeService.isDarkTheme();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.dark = this.themeService.isDarkTheme()
  }

  logout(): void {
    this.authService.logout();
  }

  avatarUser(): string {
    return this.user.name.substr(0, 1)
  }
}
