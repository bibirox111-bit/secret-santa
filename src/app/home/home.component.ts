import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-home',
  imports: [AsyncPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private authService = inject(AuthService);
  user$ = this.authService.user$;
}
