import { Component, OnInit, inject, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { ChartModule } from 'primeng/chart';
import { HeaderComponent } from "../../layout/header/header.component";
import { SidebarComponent } from "../../layout/sidebar/sidebar.component";
import { MyAccountService } from './services/my-account.service';
import { CommonModule, DatePipe } from '@angular/common';
import { SkeletonModule } from 'primeng/skeleton';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { AuthService } from 'src/app/services/auth.service';
import { UserModel } from '../users/user.interface';
import { PasswordModule } from 'primeng/password'
import { SelectModule } from 'primeng/select'
import { ToggleSwitchModule } from 'primeng/toggleswitch'
import { TextareaModule } from 'primeng/textarea'
import { TagModule } from 'primeng/tag';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { InputTextModule } from 'primeng/inputtext';

@Component({
  selector: 'app-my-account',
  standalone: true,
  templateUrl: './my-account.component.html',
  styleUrls: ['./my-account.component.scss'],
  imports: [
    CommonModule,
    CardModule,
    ButtonModule,
    ChartModule,
    HeaderComponent,
    SidebarComponent,
    SkeletonModule,
    ToastModule,
    SelectModule,
    PasswordModule,
    ToggleSwitchModule,
    TextareaModule,
    TagModule,
    DatePipe,
    ReactiveFormsModule,
    FormsModule,
    InputTextModule
  ],
  providers: [MessageService]
})
export class MyAccountComponent implements OnInit, OnDestroy {
  private service = inject(MyAccountService);
  private messageService = inject(MessageService);
  user: any
  loading = true;
  password: string = ''
  newPassword: string = ''

  constructor(private authService: AuthService, private serviceToast: MessageService) {
    this.user = this.authService.getUser()
  }
  ngOnInit(): void {
     this.user = {
      name: this.user.name || '',
      email: this.user.email || '',
      phone: this.user.phone || '',
      company: this.user.company || '',
      role: this.user.role || '',
      emailNotifications: this.user.emailNotifications !== false,
      pushNotifications: this.user.pushNotifications !== false,
      darkTheme: this.user.darkTheme || false,
      ...this.user
    };
  }

  ngOnDestroy(): void {
    // Cleanup se necessário
  }

  saveMyProfile() {
    this.service.updateProfile(this.user).pipe().subscribe({
      next: (resp: any) => {
        this.authService.updateUser(resp)
        this.serviceToast.add({ text: 'Perfil atualizado com sucesso !!', icon: 'pi pi-check', severity: 'success' })
      }
    })
  }

  changePassword() {
    this.service.changePassword({password: this.password, newPassword: this.newPassword }).pipe().subscribe({
      next: (resp: any) => {
        this.authService.updateUser(resp)
        this.serviceToast.add({ text: 'Perfil atualizado com sucesso !!', icon: 'pi pi-check', severity: 'success' })
      }
    })
  }


   hasUpperCase(): boolean {
    return /[A-Z]/.test(this.newPassword);
  }

  hasNumber(): boolean {
    return /[0-9]/.test(this.newPassword);
  }

  isPasswordValid(): boolean {
    return this.password.length >= 6 &&
           this.newPassword.length >= 6 &&
           this.newPassword !== this.password;
  }

  resetForm(): void {
    // Recarrega os dados originais do usuário
    this.user = this.authService.getUser();
    this.password = '';
    this.newPassword = '';
  }

  validatePassword(): void {
    if (this.password.length < 6) {
      this.serviceToast.add({
        summary: 'Senha Inválida',
        detail: 'Informe uma senha de pelo menos 6 dígitos',
        severity: 'error'
      });
      return;
    }

    if (this.newPassword.length < 6) {
      this.serviceToast.add({
        summary: 'Nova Senha Inválida',
        detail: 'Informe uma nova senha de pelo menos 6 dígitos',
        severity: 'error'
      });
      return;
    }

    if (this.newPassword === this.password) {
      this.serviceToast.add({
        summary: 'Senhas Iguais',
        detail: 'As senhas são iguais. Digite uma senha diferente.',
        severity: 'error'
      });
      return;
    }

    this.serviceToast.add({
      summary: 'Senha Válida',
      detail: 'A senha atende todos os requisitos de segurança!',
      severity: 'success'
    });
  }
}

