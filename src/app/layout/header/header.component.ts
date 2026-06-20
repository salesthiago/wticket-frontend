import { Component, OnInit } from '@angular/core';
import { ToastModule } from 'primeng/toast';
import { ThemeService } from '../../services/theme.service';
import { SidebarService } from '../../services/sidebar.service';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-header',
  standalone: true,
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  imports: [
    ToastModule,
    ToggleSwitchModule,
    FormsModule,
  ]
})
export class HeaderComponent implements OnInit {
  dark: boolean = false;

  constructor(
    public themeService: ThemeService,
    private sidebarService: SidebarService
  ) {}

  ngOnInit() {
    this.dark = this.themeService.isDarkTheme();
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
    this.dark = this.themeService.isDarkTheme();
  }

  openSidebar(): void {
    this.sidebarService.open();
  }
}
