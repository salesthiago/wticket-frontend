import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-appointments',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './appointments.layout.html',
  styleUrl: './appointments.layout.scss'
})
export class AppointmentsLayout<T> {

}
