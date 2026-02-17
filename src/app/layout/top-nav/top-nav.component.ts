import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { ThemeService } from '../../services/theme/theme.service';
import { MatIcon } from "@angular/material/icon";
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-top-nav',
  imports: [AsyncPipe, MatIcon, MatMenuModule],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.css',
})
export class TopNavComponent {
  authService = inject(AuthService);
  router = inject(Router);
  theme = inject(ThemeService);

  navigateHome() {
    this.router.navigate(['/app']);
  }

  navigateToEvents() {
    this.router.navigate(['/app/events']);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
