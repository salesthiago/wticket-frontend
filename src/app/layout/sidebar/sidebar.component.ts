import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { AuthService, ModuleCode, UserRole } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';
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
  /** module(s) required to see this item; if empty, always visible to logged-in users */
  modules?: ModuleCode[];
  /** roles allowed; if empty, all roles allowed */
  roles?: UserRole[];
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
  private readonly allItems: NavItem[] = [
    {
      id: 0,
      name: 'Dashboard',
      link: '/dashboard',
      icon: 'pi pi-home'
    },
    // Super-admin only
    {
      id: 100,
      name: 'Painel Admin',
      link: '',
      icon: 'pi pi-shield',
      roles: ['super_admin'],
      panelModel: [
        {
          label: 'Painel Admin',
          icon: 'pi pi-shield',
          items: [
            { label: 'Empresas', routerLink: '/admin/companies' },
            { label: 'Módulos', routerLink: '/admin/modules' },
            { label: 'Assinaturas', routerLink: '/admin/plans' }
          ]
        }
      ]
    },
    {
      id: 1,
      name: 'Gestor',
      link: '',
      icon: 'pi pi-user',
      panelModel: [
        {
          label: 'Gestor',
          icon: 'pi pi-user',
          items: [
            { label: 'Usuários', routerLink: '/users' },
            { label: 'Minha Empresa', routerLink: '/my-company' }
          ]
        }
      ]
    },
    {
      id: 2,
      name: 'Whatsapp',
      link: '',
      icon: 'pi pi-whatsapp',
      modules: ['attendance'],
      panelModel: [
        {
          label: 'Whatsapp',
          icon: 'pi pi-whatsapp',
          items: [
            { label: 'Sessões', routerLink: '/whatsapp' }
          ]
        }
      ]
    },
    {
      id: 3,
      name: 'Contatos',
      link: '/contacts',
      icon: 'pi pi-address-book',
      modules: ['attendance']
    },
    {
      id: 4,
      name: 'Tickets',
      link: '/tickets',
      icon: 'pi pi-tags',
      modules: ['attendance']
    },
    {
      id: 6,
      name: 'Agendamentos',
      link: '/appointments',
      icon: 'pi pi-calendar',
      modules: ['attendance']
    },
    {
      id: 7,
      name: 'Produtos',
      link: '/products',
      icon: 'pi pi-box',
      modules: ['service_order']
    },
    {
      id: 8,
      name: 'Clientes',
      link: '/customers',
      icon: 'pi pi-users',
      modules: ['service_order']
    },
    {
      id: 10,
      name: 'Ordens de Serviço',
      link: '/service-orders',
      icon: 'pi pi-wrench',
      modules: ['service_order']
    },
    // Atendimento Automático desabilitado — será serviço separado
    // {
    //   id: 9,
    //   name: 'Atendimento Automático',
    //   link: '',
    //   icon: 'pi pi-sparkles',
    //   modules: ['auto_attendance'],
    //   panelModel: [
    //     {
    //       label: 'Atendimento Automático',
    //       icon: 'pi pi-sparkles',
    //       items: [
    //         { label: 'Bots', routerLink: '/bot-config' },
    //         { label: 'Agentes IA', routerLink: '/ai-agents' },
    //         { label: 'Provedores IA', routerLink: '/ai-providers' }
    //       ]
    //     }
    //   ]
    // },
    {
      id: 11,
      name: 'NFS-e',
      link: '',
      icon: 'pi pi-file-edit',
      modules: ['nfse'],
      panelModel: [
        {
          label: 'NFS-e',
          icon: 'pi pi-file-edit',
          items: [
            { label: 'Emissões', routerLink: '/nfse/issuances' },
            { label: 'Nova Emissão', routerLink: '/nfse/issuances/create' },
            { label: 'Códigos de Serviço', routerLink: '/nfse/service-codes' },
            { label: 'Configurações', routerLink: '/nfse/config' }
          ]
        }
      ]
    },
    {
      id: 12,
      name: 'Financeiro',
      link: '',
      icon: 'pi pi-wallet',
      modules: ['financial'],
      roles: ['administrator', 'finance', 'super_admin'],
      panelModel: [
        {
          label: 'Financeiro',
          icon: 'pi pi-wallet',
          items: [
            { label: 'Dashboard', routerLink: '/financial/dashboard' },
            { label: 'Contas a Receber', routerLink: '/financial/receivables' },
            { label: 'Novo Lançamento', routerLink: '/financial/receivables/create' }
          ]
        }
      ]
    }
  ];

  public menuItems: NavItem[] = [];

  isDarkMode = false;
  isMobileOpen = false;
  user: any;
  private themeSubscription!: Subscription;
  private routerSubscription!: Subscription;
  private sidebarSubscription!: Subscription;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private sidebarService: SidebarService,
    private cdRef: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkTheme();
    this.user = this.authService.getUser();

    this.menuItems = this.filterMenuByAccess(this.allItems);

    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkMode = isDark;
      this.cdRef.detectChanges();
    });

    this.sidebarSubscription = this.sidebarService.isOpen$.subscribe(isOpen => {
      this.isMobileOpen = isOpen;
      this.cdRef.detectChanges();
    });

    this.updateExpandedState(this.router.url);

    this.routerSubscription = this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe((event: NavigationEnd) => {
      this.updateExpandedState(event.urlAfterRedirects);
      this.sidebarService.close();
    });
  }

  private filterMenuByAccess(items: NavItem[]): NavItem[] {
    const role = this.authService.getRole();
    return items.filter(item => {
      if (item.roles?.length) {
        if (!role || !item.roles.includes(role)) return false;
      }
      if (item.modules?.length) {
        if (!this.authService.hasAnyModule(...item.modules)) return false;
      }
      return true;
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

  closeSidebar(): void {
    this.sidebarService.close();
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
    if (this.sidebarSubscription) {
      this.sidebarSubscription.unsubscribe();
    }
  }
}
