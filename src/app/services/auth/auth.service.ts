import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, authState, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { Observable } from 'rxjs';
import { updateProfile, User } from 'firebase/auth';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  user$: Observable<User | null>;

  constructor(private auth: Auth) {
    this.user$ = authState(this.auth);
  }

  // Rejestracja
  async register(email: string, password: string, name: string) {
    const cred = await createUserWithEmailAndPassword(
      this.auth,
      email,
      password
    );

    // ✅ set displayName on Firebase Auth user
    await updateProfile(cred.user, {
      displayName: name,
    });

    return cred;
  }

  // Logowanie
  login(email: string, password: string) {
    return signInWithEmailAndPassword(this.auth, email, password);
  }

  // Wylogowanie
  logout() {
    return signOut(this.auth);
  }

  // Logowanie przez Google
  loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(this.auth, provider);
  }
}