import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    CommonModule,
    RouterModule
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  public items = [
    {
      id: 0,
      name: 'Dashboard',
      link: '/dashboard',
      icon: 'pi pi-home',
      permissions: []
    },
    {
      id: 1,
      name: 'Usuários',
      link: '/users',
      icon: 'pi pi-user',
      permissions: []
    },
    {
      id: 2,
      name: 'Whatsapp',
      link: '/whatsapp',
      icon: 'pi pi-whatsapp',
      permissions: []
    },
    {
      id: 3,
      name: 'Contatos',
      link: '/contacts',
      icon: 'pi pi-address-book',
      permissions: []
    },
    {
      id: 4,
      name: 'Tickets',
      link: '/tickets',
      icon: 'pi pi-tags',
      permissions: []
    }
  ];

  isDarkMode = false;
  private themeSubscription!: Subscription;

  constructor(
    private themeService: ThemeService,
    private cdRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    // Define o valor inicial
    this.isDarkMode = this.themeService.isDarkTheme();

    // Inscreve-se nas mudanças do tema
    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(isDark => {
      console.log('Sidebar received theme change:', isDark);
      this.isDarkMode = isDark;

      // Força a detecção de mudanças
      this.cdRef.detectChanges();
    });
  }

  // Método helper para debug
  logThemeChange(): void {
    console.log('Current theme in sidebar:', this.isDarkMode);
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
  }
}
