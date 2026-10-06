import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { FormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';
import { IconFieldModule } from 'primeng/iconfield';
import { CommonModule } from '@angular/common';
import { InputIconModule } from 'primeng/inputicon';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  templateUrl: './forgot-password.component.html',
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
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  sent = false;

  constructor(
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  onSubmit(): void {
    if (!this.email.trim()) return;
    this.loading = true;

    this.authService.forgotPassword(this.email.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        this.sent = true;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: res.message });
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao processar solicitação'
        });
      }
    });
  }
}
