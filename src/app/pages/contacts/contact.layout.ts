import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-contact',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './contact.layout.html',
  styleUrl: './contact.layout.scss'
})
export class ContactLayout<T> {



}
