import { Component } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.component.html',
  imports: [FormsModule]
})
export class AuthComponent {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  async register() {
    try {
      await this.authService.register(this.email, this.password);
      alert('Registered successfully!');
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  async login() {
    try {
      await this.authService.login(this.email, this.password);
      alert('Logged in successfully!');
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
      alert('Logged in with Google!');
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  logout() {
    this.authService.logout();
  }
}
