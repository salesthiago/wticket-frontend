import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService, RegisterRequest } from '../../services/auth.service';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
//import { InputComponent } from '../../components/input/input.component'

@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [
    ButtonModule,
    CardModule,
    ReactiveFormsModule,
    FormsModule
  ]
})
export class RegisterComponent {
  public credentials: RegisterRequest = {
    email: '',
    password: '',
    name: ''
  };
  public confirmPassword: string = ''
  public loading = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService
  ) {}

  onSubmit(): void {
    this.loading = true;

    this.authService.register(this.credentials).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Login realizado com sucesso!'
        });
        this.router.navigate(['/dashboard']);
      },
      error: (error: any) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.error?.message || 'Erro ao fazer login'
        });
      },
      complete: () => {
        this.loading = false;
      }
    });
  }
}
