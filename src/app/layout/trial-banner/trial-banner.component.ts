import { Component, Inject, OnDestroy, OnInit, Renderer2 } from '@angular/core';
import { CommonModule, DOCUMENT } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { Subscription, filter } from 'rxjs';
import { AuthService } from '../../services/auth.service';
import { BillingService, BillingStatus } from '../../services/billing.service';

// Classe aplicada no <body> enquanto a faixa está visível — o sidebar fixo
// (posicionado por fora do fluxo normal do documento) reage a ela em
// styles.scss para abrir espaço no topo, do mesmo jeito que o
// SidebarComponent já faz para o recolhimento do menu (body.sidebar-collapsed).
const BODY_CLASS = 'has-trial-banner';

@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './trial-banner.component.html',
  styleUrls: ['./trial-banner.component.scss']
})
export class TrialBannerComponent implements OnInit, OnDestroy {
  status: BillingStatus | null = null;

  private authSub?: Subscription;
  private statusSub?: Subscription;
  private routerSub?: Subscription;

  constructor(
    private authService: AuthService,
    private billingService: BillingService,
    private router: Router,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit(): void {
    this.statusSub = this.billingService.status$.subscribe(status => {
      this.status = status;
      this.applyBodyClass();
    });

    this.authSub = this.authService.getAuthStatus().subscribe(isAuthenticated => {
      if (isAuthenticated) {
        this.refreshIfApplicable();
      } else {
        this.billingService.clear();
      }
    });

    // Refaz a consulta a cada navegação — mantém a faixa em dia sem exigir
    // que cada tela lembre de atualizar o billing status manualmente.
    this.routerSub = this.router.events
      .pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd))
      .subscribe(() => this.refreshIfApplicable());

    if (this.authService.isLoggedIn()) this.refreshIfApplicable();
  }

  ngOnDestroy(): void {
    this.authSub?.unsubscribe();
    this.statusSub?.unsubscribe();
    this.routerSub?.unsubscribe();
    this.renderer.removeClass(this.document.body, BODY_CLASS);
  }

  get message(): string {
    if (this.status?.reason === 'trial_expired') {
      return 'Seu período de teste gratuito expirou.';
    }
    return 'Sua assinatura está com o pagamento pendente.';
  }

  private refreshIfApplicable(): void {
    // Portal de cliente (acesso restrito) não assina a plataforma — a faixa é
    // sobre a assinatura da própria empresa, não faz sentido para esse login.
    if (this.authService.isCustomerScoped()) return;
    this.billingService.refresh().subscribe();
  }

  private applyBodyClass(): void {
    if (this.status?.blocked) {
      this.renderer.addClass(this.document.body, BODY_CLASS);
    } else {
      this.renderer.removeClass(this.document.body, BODY_CLASS);
    }
  }
}
