import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { AuthService } from '../../services/auth.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { PanelMenuModule } from 'primeng/panelmenu';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs/operators';

interface NavItem {
  id: number;
  name: string;
  link: string;
  icon: string;
  permissions: string[];
  panelModel?: MenuItem[];
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    PanelMenuModule
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  public menuItems: NavItem[] = [
    {
      id: 0,
      name: 'Dashboard',
      link: '/dashboard',
      icon: 'pi pi-home',
      permissions: []
    },
    {
      id: 1,
      name: 'Gestor',
      link: '',
      icon: 'pi pi-user',
      permissions: [],
      panelModel: [
        {
          label: 'Gestor',
          icon: 'pi pi-user',
          items: [
            { label: 'Usuários', routerLink: '/users' }
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Whatsapp',
      link: '',
      icon: 'pi pi-whatsapp',
      permissions: [],
      panelModel: [
        {
          label: 'Whatsapp',
          icon: 'pi pi-whatsapp',
          items: [
            { label: 'Sessões', routerLink: '/whatsapp' },
            { label: 'Bot', routerLink: '/bot-config' },
            { label: 'Gemini', routerLink: '/gemini' }
          ]
        }
      ]
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
    },
    {
      id: 6,
      name: 'Agendamentos',
      link: '/appointments',
      icon: 'pi pi-calendar',
      permissions: []
    },
    {
      id: 7,
      name: 'Produtos',
      link: '/products',
      icon: 'pi pi-box',
      permissions: []
    },
    {
      id: 8,
      name: 'Clientes',
      link: '/customers',
      icon: 'pi pi-users',
      permissions: []
    },
    {
      id: 10,
      name: 'Ordens de Serviço',
      link: '/service-orders',
      icon: 'pi pi-wrench',
      permissions: []
    },
    {
      id: 9,
      name: 'Inteligência Artificial',
      link: '',
      icon: 'pi pi-sparkles',
      permissions: [],
      panelModel: [
        {
          label: 'Inteligência Artificial',
          icon: 'pi pi-sparkles',
          items: [
            { label: 'Agentes IA', routerLink: '/ai-agents' },
            { label: 'Configurar', routerLink: '/ai-providers' }
          ]
        }
      ]
    }
  ];

  isDarkMode = false;
  user: any;
  private themeSubscription!: Subscription;
  private routerSubscription!: Subscription;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private cdRef: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkTheme();
    this.user = this.authService.getUser();

    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkMode = isDark;
      this.cdRef.detectChanges();
    });

    this.updateExpandedState(this.router.url);

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateExpandedState(event.urlAfterRedirects);
    });
  }

  private updateExpandedState(currentUrl: string): void {
    this.menuItems.forEach(item => {
      if (item.panelModel) {
        const hasActiveChild = item.panelModel.some(panel =>
          panel.items?.some((sub: MenuItem) =>
            currentUrl.startsWith(sub['routerLink'] as string)
          )
        );
        item.panelModel.forEach(panel => {
          panel.expanded = hasActiveChild;
        });
      }
    });
  }

  getAvatarLabel(): string {
    return this.user?.name ? this.user.name.charAt(0).toUpperCase() : 'U';
  }

  logout(): void {
    this.authService.logout();
  }

  ngOnDestroy(): void {
    if (this.themeSubscription) {
      this.themeSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }
}
