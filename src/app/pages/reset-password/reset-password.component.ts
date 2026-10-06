import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
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
  selector: 'app-reset-password',
  standalone: true,
  templateUrl: './reset-password.component.html',
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
export class ResetPasswordComponent implements OnInit {
  token = '';
  password = '';
  confirmPassword = '';
  showPassword = false;
  loading = false;
  tokenMissing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token') || '';
    this.tokenMissing = !this.token;
  }

  onSubmit(): void {
    if (!this.password || this.password.length < 6) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'A senha deve ter ao menos 6 caracteres' });
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.messageService.add({ severity: 'warn', summary: 'Atenção', detail: 'As senhas não conferem' });
      return;
    }

    this.loading = true;
    this.authService.resetPassword(this.token, this.password).subscribe({
      next: (res) => {
        this.loading = false;
        this.messageService.add({ severity: 'success', summary: 'OK', detail: res.message });
        setTimeout(() => this.router.navigate(['/login']), 1500);
      },
      error: (error) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error?.error?.message || 'Erro ao redefinir senha'
        });
      }
    });
  }
}
