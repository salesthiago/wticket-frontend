import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-whatsapp',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './whatsapp.layout.html',
  styleUrl: './whatsapp.layout.scss'
})
export class WhatsappLayout<T> {



}
