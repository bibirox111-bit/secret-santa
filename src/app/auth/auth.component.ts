import { Component, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Angular Material
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

// Services
import { UserService } from '../services/user/user.service';
import { AuthService } from '../services/auth/auth.service';
import { Router } from '@angular/router';

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

  constructor(private authService: AuthService, private userService: UserService, private router: Router) {}
  

  ngOnInit() {
    this.authService.user$.subscribe(user => {
      if (user) {
        this.router.navigate(['/app']);
      }
    });
  }

  async login() {
    try {
      await this.authService.login(this.email, this.password);
    } catch (error: any) {
      this.errorMessage = error.message;
    }
  }

  async register() {
    try {
      const cred = await this.authService.register(this.email, this.password, this.name);
      const uid = cred.user.uid;
      console.log('User created with UID:', uid);
      
      try {
        await this.userService.saveUser(uid, { name: this.name, email: this.email });
        console.log('User profile saved to Firestore');
      } catch (firestoreError: any) {
        console.error('Failed to save user profile:', firestoreError.message, firestoreError);
        this.errorMessage = 'User created but profile save failed: ' + firestoreError.message;
        throw firestoreError;
      }
    } catch (error: any) {
      console.error('Registration error:', error.message || error);
      this.errorMessage = error.message || 'Registration failed';
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
