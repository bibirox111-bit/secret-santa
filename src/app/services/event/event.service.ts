import { inject, Injectable, runInInjectionContext, Injector } from '@angular/core';
import { Firestore, collection, collectionData, doc, docData, addDoc, query, where, orderBy, updateDoc, setDoc, arrayUnion, arrayRemove, serverTimestamp, getDocs as fsGetDocs, getDoc as fsGetDoc, runTransaction } from '@angular/fire/firestore';
import { Observable, combineLatest } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { SecretSantaEvent, EventAssignment } from '../../models/event.model';
import { InvitationService } from '../invitation/invitation.service';

@Injectable({
  providedIn: 'root'
})
export class EventService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private invitationService = inject(InvitationService);
  private eventsCol = () => collection(this.firestore, 'events');

  async createEvent(organizerId: string, organizerName: string, eventData: Partial<SecretSantaEvent>): Promise<string> {
    const event: Omit<SecretSantaEvent, 'id'> = {
      name: eventData.name || 'Secret Santa Event',
      description: eventData.description || '',
      organizerId,
      organizerName,
      participants: [{ userId: organizerId, email: '', displayName: organizerName, joinedAt: Date.now() }],
      participantIds: [organizerId], // Array of UIDs for Firestore rule checks
      status: 'pending',
      createdAt: serverTimestamp() as any,
      minParticipants: 3,
      ...eventData
    };

    try {
      console.log('Creating event with data:', event);
      const docRef = await addDoc(this.eventsCol(), event);
      console.log('Event created successfully with ID:', docRef.id);
      return docRef.id;
    } catch (err) {
      console.error('Error creating event:', err);
      throw err;
    }
  }

  getEvent(eventId: string): Observable<SecretSantaEvent | null> {
    const eventRef = doc(this.firestore, `events/${eventId}`);
    return docData(eventRef, { idField: 'id' }).pipe(
      map(data => (data ? data as SecretSantaEvent : null)),
      catchError(() => of(null))
    );
  }

  getUserEvents(userId: string): Observable<SecretSantaEvent[]> {
    // Query 1: Events where user is organizer
    const organizedQuery = query(
      this.eventsCol(),
      where('organizerId', '==', userId)
    );

    // Query 2: Events where user is a participant (accepted invite)
    const participatingQuery = query(
      this.eventsCol(),
      where('participantIds', 'array-contains', userId)
    );

    const organized$ = collectionData(organizedQuery, { idField: 'id' }).pipe(
      map(events => events as SecretSantaEvent[]),
      catchError(() => of([]))
    );

    const participating$ = collectionData(participatingQuery, { idField: 'id' }).pipe(
      map(events => events as SecretSantaEvent[]),
      catchError(() => of([]))
    );

    // Combine results and deduplicate by id
    return combineLatest([organized$, participating$]).pipe(
      map(([organized, participating]) => {
        const eventMap = new Map<string, SecretSantaEvent>();
        organized.forEach(event => eventMap.set(event.id, event));
        participating.forEach(event => eventMap.set(event.id, event));
        return Array.from(eventMap.values()).sort((a, b) => 
          (b.createdAt as number - a.createdAt as number)
        );
      })
    );
  }

  /**
   * Add a confirmed participant to the event (called when a user accepts an invite).
   * Uses setDoc with merge to safely handle cases where event exists or needs to be created.
   */
  async addParticipant(eventId: string, userId: string, email: string, displayName: string): Promise<void> {
    const eventRef = doc(this.firestore, `events/${eventId}`);
    const newParticipant = { userId, email, displayName, joinedAt: Date.now() };
    try {
      await setDoc(eventRef, {
        participants: arrayUnion(newParticipant),
        participantIds: arrayUnion(userId) // Also update the IDs array for rule checks
      }, { merge: true });
      console.log('✅ [EventService] Participant added successfully:', { userId, eventId });
    } catch (err) {
      console.error('❌ [EventService] Error adding participant:', err, { userId, eventId });
      throw err;
    }
  }

  /**
   * Invite a user by email or userId. If user is not found, rejects with 'user not found'.
   * Creates a Firestore invite document via InvitationService.
   */
  async inviteParticipant(eventId: string, identifier: string, inviterUserId: string, displayName?: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const isEmail = identifier.includes('@');
      const usersCol = collection(this.firestore, 'users');

      console.log('🔍 Invite search started for:', identifier, '(isEmail:', isEmail, ')');

      if (isEmail) {
        // Search by email
        const email = identifier.trim().toLowerCase();
        console.log('📧 Searching for user by email:', email);
        
        const q = query(usersCol, where('email', '==', email));
        const snap = await fsGetDocs(q);
        
        console.log('📧 Email search result - found:', snap.size, 'user(s)');
        if (snap.empty) {
          console.error('❌ No user found with email:', email);
          throw new Error('user not found');
        }

        const uid = snap.docs[0].id;
        const userData = snap.docs[0].data();
        const userName = userData?.['name'] || userData?.['displayName'] || email.split('@')[0];
        console.log('✅ User found:', { uid, email, userData });

        await this.invitationService.createInvite(eventId, inviterUserId, uid, userName);
        console.log('✅ Invite created for email:', email);
      } else {
        // Try by raw identifier (could be UID or name)
        const idOrName = identifier.trim();
        console.log('👤 Searching for user by ID or name:', idOrName);

        // First, try direct document lookup by ID
        try {
          console.log('🔎 Step 1: Trying direct document fetch with ID:', idOrName);
          const userRef = doc(this.firestore, `users/${idOrName}`);
          const userSnap = await fsGetDoc(userRef);
          
          if (userSnap.exists()) {
            const uid = userSnap.id;
            const userData = userSnap.data();
            const userName = userData?.['name'] || userData?.['displayName'] || uid;
            console.log('✅ User found by ID:', { uid, userData });
            
            await this.invitationService.createInvite(eventId, inviterUserId, uid, userName);
            console.log('✅ Invite created for ID:', uid);
            return;
          }
          console.log('❌ No user document found with ID:', idOrName);
        } catch (err) {
          console.error('Error during direct ID lookup:', err);
        }

        // Then try by name field
        console.log('🔎 Step 2: Trying by name field:', idOrName);
        const nameQ = query(usersCol, where('name', '==', idOrName));
        const nameSnap = await fsGetDocs(nameQ);
        
        console.log('👤 Name search result - found:', nameSnap.size, 'user(s)');
        if (!nameSnap.empty) {
          const uid = nameSnap.docs[0].id;
          const userData = nameSnap.docs[0].data();
          const userName = userData?.['name'] || userData?.['displayName'] || uid;
          console.log('✅ User found by name:', { uid, userData });
          
          await this.invitationService.createInvite(eventId, inviterUserId, uid, userName);
          console.log('✅ Invite created for name:', idOrName);
          return;
        }

        // If all lookups fail
        console.error('❌ User not found by ID:', idOrName, 'or name:', idOrName);
        throw new Error('user not found');
      }
    });
  }

  async removeParticipant(eventId: string, userId: string): Promise<void> {
    return runInInjectionContext(this.injector, async () => {
      const eventRef = doc(this.firestore, `events/${eventId}`);
      try {
        await runTransaction(this.firestore, async (tx) => {
          const snap = await tx.get(eventRef as any);
          if (!snap.exists()) return;
          const event = snap.data() as SecretSantaEvent;
          const newParticipants = (event.participants || []).filter(p => p.userId !== userId);
          const newParticipantIds = (event.participantIds || []).filter((id: string) => id !== userId);
          tx.update(eventRef as any, { participants: newParticipants, participantIds: newParticipantIds });
        });
        console.log('✅ [EventService] Participant removed successfully:', { userId, eventId });
      } catch (err) {
        console.error('❌ [EventService] Error removing participant:', err, { userId, eventId });
        throw err;
      }
    });
  }

  async updateEventStatus(eventId: string, status: 'pending' | 'active' | 'drawing' | 'completed'): Promise<void> {
    const eventRef = doc(this.firestore, `events/${eventId}`);
    await updateDoc(eventRef, { status });
  }

  async performDrawing(eventId: string, assignments: EventAssignment[]): Promise<void> {
    const eventRef = doc(this.firestore, `events/${eventId}`);
    await updateDoc(eventRef, { draws: assignments, status: 'completed' });
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

  async deleteEvent(eventId: string): Promise<void> {
    const eventRef = doc(this.firestore, `events/${eventId}`);
    // In Firestore, use deleteDoc or set to empty object. For safety, we'll set minimal data.
    // Alternatively use: await deleteDoc(eventRef);
    await updateDoc(eventRef, { status: 'deleted' });
  }
}
