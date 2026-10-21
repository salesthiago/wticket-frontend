import { Component, OnInit, OnDestroy, ChangeDetectorRef, Input, Renderer2, Inject } from '@angular/core';
import { ThemeService } from '../../services/theme.service';
import { AuthService, ModuleCode, UserRole } from '../../services/auth.service';
import { SidebarService } from '../../services/sidebar.service';
import { Subscription } from 'rxjs';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { TooltipModule } from 'primeng/tooltip';
import { MenuItem } from 'primeng/api';
import { filter } from 'rxjs/operators';

interface NavItem {
  id: number;
  name: string;
  link: string;
  icon: string;
  /** module(s) required to see this item; if empty, always visible to logged-in users */
  modules?: ModuleCode[];
  /** módulos exigidos todos ao mesmo tempo (além de `modules`, que basta um) */
  allModules?: ModuleCode[];
  /** roles allowed; if empty, all roles allowed */
  roles?: UserRole[];
  /** true = visível para acesso de cliente (portal restrito); os demais itens ficam ocultos para esse login */
  visibleForCustomerScope?: boolean;
  panelModel?: MenuItem[];
  /** grupo (panelModel) aberto no acordeão */
  expanded?: boolean;
  /** ativo só com a URL exata (ex.: '/platform' não deve acender em '/platform/leads') */
  exact?: boolean;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.scss'],
  imports: [
    CommonModule,
    RouterModule,
    TooltipModule
  ]
})
export class SidebarComponent implements OnInit, OnDestroy {
  /** Página já possui seu próprio header mobile (ex.: my-account) — evita duplicar a barra. */
  @Input() showMobileBar = true;

  private readonly allItems: NavItem[] = [
    {
      id: 0,
      name: 'Dashboard',
      link: '/dashboard',
      icon: 'pi pi-home'
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
    /*{
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
    },*/
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
      modules: ['attendance'],
      visibleForCustomerScope: true
    },
    {
      id: 5,
      name: 'Projetos',
      link: '/projects',
      icon: 'pi pi-folder-open',
      modules: ['attendance'],
      visibleForCustomerScope: true
    },
    {
      id: 15,
      name: 'Leads',
      link: '/leads',
      icon: 'pi pi-user-plus',
      allModules: ['attendance', 'service_order']
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
      roles: ['administrator', 'company_admin', 'finance', 'super_admin'],
      panelModel: [
        {
          label: 'Financeiro',
          icon: 'pi pi-wallet',
          items: [
            { label: 'Dashboard', routerLink: '/financial/dashboard' },
            { label: 'Contas a Receber', routerLink: '/financial/receivables' },
            { label: 'Novo Lançamento', routerLink: '/financial/receivables/create' },
            { label: 'Cobrança', routerLink: '/financial/charges' },
            { label: 'Configurações', routerLink: '/financial/settings' },
            {
              id: 'itau-group',
              label: 'Integração Itaú',
              icon: 'pi pi-building-columns',
              items: [
                { label: 'Configuração', routerLink: '/financial/itau/config' },
                { label: 'Histórico de Integração', routerLink: '/financial/itau/history' }
              ]
            }
          ]
        }
      ]
    }
  ];

  // Menu exclusivo do super_admin: painel da plataforma, sem as telas das empresas.
  private readonly platformItems: NavItem[] = [
    { id: 200, name: 'Dashboard', link: '/platform', icon: 'pi pi-chart-bar', exact: true },
    { id: 201, name: 'Empresas', link: '/platform/companies', icon: 'pi pi-building' },
    { id: 202, name: 'Leads', link: '/platform/leads', icon: 'pi pi-user-plus' },
    { id: 203, name: 'Financeiro', link: '/platform/finance', icon: 'pi pi-wallet' },
    {
      id: 204,
      name: 'Configurações',
      link: '',
      icon: 'pi pi-cog',
      panelModel: [
        {
          label: 'Configurações',
          icon: 'pi pi-cog',
          items: [
            { label: 'Módulos', routerLink: '/admin/modules' },
            { label: 'Assinaturas', routerLink: '/admin/plans' },
            { label: 'E-mail', routerLink: '/admin/email-config' },
            { label: 'Pagamentos', routerLink: '/admin/billing-config' }
          ]
        }
      ]
    }
  ];

  public menuItems: NavItem[] = [];

  isDarkMode = false;
  isMobileOpen = false;
  isCollapsed = false;
  user: any;
  private themeSubscription!: Subscription;
  private routerSubscription!: Subscription;
  private sidebarSubscription!: Subscription;
  private collapseSubscription!: Subscription;

  constructor(
    private themeService: ThemeService,
    private authService: AuthService,
    private sidebarService: SidebarService,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.isDarkMode = this.themeService.isDarkTheme();
    this.user = this.authService.getUser();

    if (this.authService.isSuperAdmin()) {
      this.menuItems = this.platformItems;
    } else {
      this.menuItems = this.filterMenuByAccess(this.allItems);
      this.pruneModuleSubItems();
    }

    this.themeSubscription = this.themeService.isDarkTheme$.subscribe(isDark => {
      this.isDarkMode = isDark;
      this.cdRef.detectChanges();
    });

    this.sidebarSubscription = this.sidebarService.isOpen$.subscribe(isOpen => {
      this.isMobileOpen = isOpen;
      this.cdRef.detectChanges();
    });

    // Classe global no <body>: páginas fora do sidebar (conteúdo com sm:ml-64)
    // reagem ao recolhimento via CSS, sem precisar editar cada tela.
    this.collapseSubscription = this.sidebarService.isCollapsed$.subscribe(isCollapsed => {
      this.isCollapsed = isCollapsed;
      if (isCollapsed) {
        this.renderer.addClass(this.document.body, 'sidebar-collapsed');
      } else {
        this.renderer.removeClass(this.document.body, 'sidebar-collapsed');
      }
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
    const customerScoped = this.authService.isCustomerScoped();
    return items.filter(item => {
      // Acesso de cliente (portal restrito): só vê os itens marcados explicitamente.
      if (customerScoped) return !!item.visibleForCustomerScope;
      if (item.roles?.length) {
        if (!role || !item.roles.includes(role)) return false;
      }
      if (item.modules?.length) {
        if (!this.authService.hasAnyModule(...item.modules)) return false;
      }
      if (item.allModules?.length) {
        if (!item.allModules.every(code => this.authService.hasModule(code))) return false;
      }
      return true;
    });
  }

  /** Remove sub-itens de painel que dependem de um módulo que a empresa não tem. */
  private pruneModuleSubItems(): void {
    const gated: Record<string, ModuleCode> = {};
    this.menuItems.forEach(item => {
      item.panelModel?.forEach(panel => {
        if (!panel.items) return;
        panel.items = panel.items.filter((sub: MenuItem) => {
          const code = gated[sub['id'] as string];
          return !code || this.authService.hasModule(code);
        });
      });
    });
  }

  public toggleGroup(item: NavItem): void {
    item.expanded = !item.expanded;
  }

  private updateExpandedState(currentUrl: string): void {
    this.menuItems.forEach(item => {
      if (item.panelModel) {
        const hasActiveChild = item.panelModel.some(panel =>
          panel.items?.some((sub: MenuItem) =>
            currentUrl.startsWith(sub['routerLink'] as string)
          )
        );
        // Abre o grupo da página atual; não fecha um que o usuário abriu.
        if (hasActiveChild) item.expanded = true;
      }
    });
  }

  getAvatarLabel(): string {
    return this.user?.name ? this.user.name.charAt(0).toUpperCase() : 'U';
  }

  openSidebar(): void {
    this.sidebarService.open();
  }

  closeSidebar(): void {
    this.sidebarService.close();
  }

  toggleCollapse(): void {
    this.sidebarService.toggleCollapsed();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
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
    if (this.collapseSubscription) {
      this.collapseSubscription.unsubscribe();
    }
  }
}
