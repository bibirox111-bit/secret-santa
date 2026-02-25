import { inject, Injectable } from '@angular/core';
import { Database, ref, set, query, orderByChild, equalTo, onValue, update } from '@angular/fire/database';
import { get as firebaseGet } from 'firebase/database';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, switchMap, startWith } from 'rxjs/operators';
import { SecretSantaEvent, EventAssignment } from '../../models/event.model';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private db = inject(Database);
  private eventCache$ = new BehaviorSubject<SecretSantaEvent[]>([]);

  createEvent(organizerId: string, organizerName: string, eventData: Partial<SecretSantaEvent>): Promise<string> {
    const eventId = `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const event: SecretSantaEvent = {
      id: eventId,
      name: eventData.name || 'Secret Santa Event',
      description: eventData.description || '',
      organizerId,
      organizerName,
      participants: [{ userId: organizerId, email: '', displayName: organizerName, joinedAt: Date.now() }],
      invites: [],
      status: 'pending',
      createdAt: Date.now(),
      minParticipants: 3,
      ...eventData
    };

    return set(ref(this.db, `events/${eventId}`), event).then(() => eventId);
  }

  getEvent(eventId: string): Observable<SecretSantaEvent | null> {
    return new Observable(sub => {
      const eventRef = ref(this.db, `events/${eventId}`);
      const unsubscribe = onValue(eventRef, snapshot => {
        sub.next(snapshot.val());
      });
      return unsubscribe;
    });
  }

  getUserEvents(userId: string): Observable<SecretSantaEvent[]> {
    return new Observable(sub => {
      const eventsRef = ref(this.db, 'events');
      const unsubscribe = onValue(eventsRef, snapshot => {
        const events: SecretSantaEvent[] = [];
        snapshot.forEach(childSnapshot => {
          const event = childSnapshot.val() as SecretSantaEvent;
          const isParticipant = event.participants.some((p: any) => p.userId === userId);
          const isOrganizer = event.organizerId === userId;
          if (isParticipant || isOrganizer) {
            events.push(event);
          }
        });
        sub.next(events);
      });
      return unsubscribe;
    });
  }

  /**
   * Add a confirmed participant to the event (called when a user accepts an invite).
   */
  addParticipant(eventId: string, userId: string, email: string, displayName: string): Promise<void> {
    const participantRef = ref(this.db, `events/${eventId}/participants`);
    return firebaseGet(participantRef).then(snapshot => {
      const participants = snapshot.val() || [];
      // avoid duplicates
      const exists = participants.some((p: any) => p.userId === userId || p.email === email);
      if (!exists) {
        participants.push({ userId, email, displayName, joinedAt: Date.now() });
      }
      return set(participantRef, participants);
    });
  }

  /**
   * Invite a user by email or userId. If user is not found, rejects with 'user not found'.
   * Otherwise stores an invite record (status 'pending') under the event and under the user.
   */
  inviteParticipant(eventId: string, identifier: string, displayName?: string): Promise<void> {
    const isEmail = identifier.includes('@');
    const usersRef = ref(this.db, `users`);

    // Read all users once and search in-memory to avoid realtime listeners (onValue) being used
    const findAllUsers = () => {
      return firebaseGet(ref(this.db, `users`)).then(snapshot => {
        if (!snapshot.exists()) return {};
        return snapshot.val();
      });
    };

    const findUserByEmail = (email: string) => {
      return findAllUsers().then(all => {
        const lower = email.toLowerCase();
        for (const k of Object.keys(all)) {
          const u = all[k];
          if (u?.email && (u.email.toLowerCase() === lower)) {
            return { uid: k, data: u };
          }
        }
        return null;
      });
    };

    const findUserById = (uid: string) => {
      return firebaseGet(ref(this.db, `users/${uid}`)).then(snapshot => {
        if (!snapshot.exists()) return null;
        return { uid, data: snapshot.val() };
      });
    };

    const findUserByName = (name: string) => {
      return findAllUsers().then(all => {
        for (const k of Object.keys(all)) {
          const u = all[k];
          if (u?.name && (u.name === name || u.name.toLowerCase() === name.toLowerCase())) {
            return { uid: k, data: u };
          }
        }
        return null;
      });
    };

    const inviteRef = ref(this.db, `events/${eventId}/invites`);

    const createInvite = (userId: string | undefined, email: string, name?: string) => {
      return firebaseGet(inviteRef).then(snapshot => {
        const invites = snapshot.val() || [];
        const already = invites.some((i: any) => (userId && i.userId === userId) || i.email === email);
        if (!already) {
          invites.push({ userId, email, displayName: name, invitedAt: Date.now(), status: 'pending' });
        }
        return set(inviteRef, invites).then(() => {
          // also write a lightweight invitation under the user for tracking (optional)
          if (userId) {
            return set(ref(this.db, `users/${userId}/invitations/${eventId}`), {
              eventId,
              email,
              displayName: name,
              invitedAt: Date.now(),
              status: 'pending'
            });
          }
          return Promise.resolve();
        });
      });
    };

    if (isEmail) {
      const email = identifier.trim().toLowerCase();
      return findUserByEmail(email).then(found => {
        if (!found) {
          return Promise.reject(new Error('user not found'));
        }
        const uid = found.uid;
        const name = found.data?.name || displayName || email.split('@')[0];
        return createInvite(uid, email, name);
      });
    } else {
      const idOrName = identifier.trim();
      // try by id first
      return findUserById(idOrName).then(foundById => {
        if (foundById) {
          const email = foundById.data?.email || '';
          const name = foundById.data?.name || displayName || email.split('@')[0];
          return createInvite(foundById.uid, email, name);
        }
        // then try by display name
        return findUserByName(idOrName).then(foundByName => {
          if (foundByName) {
            const email = foundByName.data?.email || '';
            const name = foundByName.data?.name || displayName || email.split('@')[0];
            return createInvite(foundByName.uid, email, name);
          }
          return Promise.reject(new Error('user not found'));
        });
      });
    }
  }

  removeParticipant(eventId: string, userId: string): Promise<void> {
    const participantRef = ref(this.db, `events/${eventId}/participants`);
    return firebaseGet(participantRef).then(snapshot => {
      const participants = snapshot.val() || [];
      const filtered = participants.filter((p: any) => p.userId !== userId);
      return set(participantRef, filtered);
    });
  }

  updateEventStatus(eventId: string, status: 'pending' | 'active' | 'drawing' | 'completed'): Promise<void> {
    return update(ref(this.db, `events/${eventId}`), { status });
  }

  performDrawing(eventId: string, assignments: EventAssignment[]): Promise<void> {
    return Promise.all([
      set(ref(this.db, `events/${eventId}/draws`), assignments),
      update(ref(this.db, `events/${eventId}`), { status: 'completed' })
    ]).then(() => {});
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  generateSecretSantaAssignments(participants: any[]): EventAssignment[] {
    const shuffled = this.shuffleArray(participants);
    const assignments: EventAssignment[] = [];

    for (let i = 0; i < shuffled.length; i++) {
      const from = shuffled[i];
      const to = shuffled[(i + 1) % shuffled.length];
      assignments.push({
        from: from.userId,
        fromName: from.displayName,
        to: to.userId,
        toName: to.displayName
      });
    }

    return assignments;
  }

  deleteEvent(eventId: string): Promise<void> {
    return set(ref(this.db, `events/${eventId}`), null);
  }
}
