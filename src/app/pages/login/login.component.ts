import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService, LoginRequest } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { CommonModule } from '@angular/common';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-login',
  standalone: true,
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
  providers: [MessageService],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    ToastModule
  ]
})
export class LoginComponent implements OnInit {
  credentials: LoginRequest = {
    email: '',
    password: ''
  };

  loading = false;
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private messageService: MessageService
  ) { }

  ngOnInit(): void {
    if (this.route.snapshot.queryParamMap.get('registered') === '1') {
      this.messageService.add({
        severity: 'success',
        summary: 'Cadastro recebido',
        detail: 'Sua empresa foi cadastrada. O acesso será liberado após a confirmação do pagamento.',
        life: 6000
      });
    }
  }

  onSubmit(): void {
    this.loading = true;

    this.authService.login(this.credentials).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Login realizado com sucesso!'
        });
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.loading = false;
        const status = error?.status;
        const detail = error?.error?.message || 'Erro ao fazer login';

        if (status === 403 && error?.error?.companyStatus === 'pending_payment') {
          this.messageService.add({
            severity: 'warn',
            summary: 'Aguardando pagamento',
            detail: 'Seu cadastro está aguardando confirmação do pagamento.',
            life: 6000
          });
        } else if (status === 403) {
          this.messageService.add({
            severity: 'warn',
            summary: 'Acesso bloqueado',
            detail: detail,
            life: 6000
          });
        } else {
          this.messageService.add({
            severity: 'error',
            summary: 'Erro',
            detail
          });
        }
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
