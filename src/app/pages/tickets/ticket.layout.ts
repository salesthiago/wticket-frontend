import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-ticket',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './ticket.layout.html',
  styleUrl: './ticket.layout.scss'
})
export class TicketLayout<T> {



}
