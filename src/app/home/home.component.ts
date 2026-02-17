import { Component, inject } from '@angular/core';
import { AuthService } from '../services/auth/auth.service';
import { AsyncPipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [AsyncPipe],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  user$ = this.authService.user$;

  navigateToEvents() {
    this.router.navigate(['/app/events']);
  }

  createNewEvent() {
    this.router.navigate(['/app/events/create']);
  }
}
