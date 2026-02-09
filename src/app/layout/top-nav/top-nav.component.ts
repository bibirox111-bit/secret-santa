import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { ThemeService } from '../../services/theme/theme.service';
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-top-nav',
  imports: [AsyncPipe, MatIcon],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.css',
})
export class TopNavComponent {
  authService = inject(AuthService);
  router = inject(Router);
  theme = inject(ThemeService);

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
