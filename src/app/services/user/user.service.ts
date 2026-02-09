import { inject, Injectable } from '@angular/core';
import { Database, off, onValue, ref, set } from '@angular/fire/database';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private db = inject(Database);

  saveUser(uid: string, data: any) {
    return set(ref(this.db, `users/${uid}`), data);
  }

  user$(uid: string): Observable<any> {
    return new Observable(sub => {
      const userRef = ref(this.db, `users/${uid}`);

      const unsubscribe = onValue(userRef, snapshot => {
        sub.next(snapshot.val());
      });

      return unsubscribe;
    });
  }
}
