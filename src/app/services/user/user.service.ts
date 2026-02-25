import { inject, Injectable } from '@angular/core';
import { Firestore, doc, docData, setDoc, serverTimestamp } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export interface User {
  uid: string;
  email: string;
  name?: string;
  createdAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private firestore = inject(Firestore);

  async saveUser(uid: string, data: any): Promise<void> {
    try {
      const userRef = doc(this.firestore, `users/${uid}`);
      const userData = {
        uid,
        ...data,
        createdAt: serverTimestamp()
      };
      console.log('Saving user to Firestore:', userRef.path, userData);
      await setDoc(userRef, userData, { merge: true });
      console.log('User saved successfully to Firestore');
    } catch (err) {
      console.error('Error saving user to Firestore:', err);
      throw err;
    }
  }

  user$(uid: string): Observable<any> {
    const userRef = doc(this.firestore, `users/${uid}`);
    return docData(userRef).pipe(
      catchError(() => of(null))
    );
  }
}
