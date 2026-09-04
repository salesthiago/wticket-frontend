import { Component } from '@angular/core';
import { MessageService } from 'primeng/api';
import { ToastModule } from 'primeng/toast';
import { ButtonModule } from 'primeng/button';
import { RouterOutlet } from '@angular/router';
import { TrialBannerComponent } from './layout/trial-banner/trial-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  providers: [MessageService],
  imports: [
    ToastModule,
    ButtonModule,
    RouterOutlet,
    TrialBannerComponent
  ]
})
export class App {
  title = 'frontend';
}
