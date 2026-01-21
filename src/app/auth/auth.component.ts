import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../services/auth.service';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-auth',
  standalone: true,
  templateUrl: './auth.component.html',
  styleUrls: ['./auth.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule
  ]
})
export class AuthComponent {
  isRegisterMode = false;

  name = '';
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  async login() {
    try {
      await this.authService.login(this.email, this.password);
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  async register() {
    try {
      await this.authService.register(this.email, this.password);
      // name can be stored later in Firestore / DB
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  async loginWithGoogle() {
    try {
      await this.authService.loginWithGoogle();
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  switchMode() {
    this.isRegisterMode = !this.isRegisterMode;
    this.errorMessage = '';
  }
  
  logout() {
    this.authService.logout();
  }
}
