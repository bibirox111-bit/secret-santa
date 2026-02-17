import { inject, Injectable } from '@angular/core';
import { Database, ref, set, get, query, orderByChild, equalTo, onValue, update } from '@angular/fire/database';
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

  addParticipant(eventId: string, userId: string, email: string, displayName: string): Promise<void> {
    const participantRef = ref(this.db, `events/${eventId}/participants`);
    return get(participantRef).then(snapshot => {
      const participants = snapshot.val() || [];
      participants.push({ userId, email, displayName, joinedAt: Date.now() });
      return set(participantRef, participants);
    });
  }

  removeParticipant(eventId: string, userId: string): Promise<void> {
    const participantRef = ref(this.db, `events/${eventId}/participants`);
    return get(participantRef).then(snapshot => {
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
