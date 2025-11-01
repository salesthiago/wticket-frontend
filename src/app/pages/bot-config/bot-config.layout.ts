import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-bot-config',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './bot-config.layout.html',
  styleUrl: './bot-config.layout.scss'
})
export class BotConfigLayout<T> {



}
