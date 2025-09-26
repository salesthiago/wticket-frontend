import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-users',
  imports: [RouterOutlet, ToastModule],
  templateUrl: './users.layout.html',
  styleUrl: './users.layout.scss'
})
export class UsersLayout<T> {



}
