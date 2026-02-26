import { inject, Injectable, Injector, runInInjectionContext } from '@angular/core';
import { FirebaseError } from '@angular/fire/app';
import { Firestore, collection, collectionData, doc, docData, query, where, getDocs as fsGetDocs, addDoc as fsAddDoc, serverTimestamp, runTransaction } from '@angular/fire/firestore';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Invite {
  id?: string;
  eventId: string;
  inviterUserId: string;
  invitedUserId: string;
  invitedUserName?: string; // Name of invited user for display
  status: 'pending' | 'accepted' | 'declined' | 'cancelled';
  createdAt?: any;
}

@Injectable({ providedIn: 'root' })
export class InvitationService {
  private firestore = inject(Firestore);
  private injector = inject(Injector);
  private invitesCol = () => collection(this.firestore, 'invites');

  // Create an invite document. Prevent duplicates for same event+invitedUserId.
  async createInvite(eventId: string, inviterUserId: string, invitedUserId: string, invitedUserName?: string): Promise<string> {
    return runInInjectionContext(this.injector, async () => {
      console.log('🎫 [InviteService] Creating invite - eventId:', eventId, 'inviter:', inviterUserId, 'invited:', invitedUserId, 'name:', invitedUserName);

      try {
        // Check for existing invite
        // todo: now when there was a invite and it was cancelled and we create new one, then new invite will be created
        // but maybe we should update status from cancelled to pending and update createdAt timestamp?
        const q = query(
          this.invitesCol(),
          where('eventId', '==', eventId),
          where('invitedUserId', '==', invitedUserId),
          where('status', '==', 'pending') // Only consider pending invites as duplicates
        );

        let snap;
        try {
          snap = await fsGetDocs(q);
        } 
        catch (err) {
          if (err instanceof FirebaseError) {
              throw err;
          }
          console.warn('⚠️ Could not query invites (collection might not exist yet):', err);
          snap = null; // treat as empty
        }

        if (snap && !snap.empty) {
          const existingId = snap.docs[0].id;
          console.log('⚠️ [InviteService] Invite already exists:', existingId);
          const e: any = new Error('invite-exists');
          e.inviteId = existingId;
          throw e;
        }

        console.log('✍️ [InviteService] No existing invite found, creating new one');

        // Create invite with user name
        const docRef = await fsAddDoc(this.invitesCol(), {
          eventId,
          inviterUserId,
          invitedUserId,
          invitedUserName: invitedUserName || invitedUserId,
          status: 'pending',
          createdAt: serverTimestamp()
        });

        console.log('✅ [InviteService] Invite created successfully:', docRef.id);
        return docRef.id;

      } catch (err: any) {
        console.error('❌ [InviteService] Error creating invite:', err.message || err);
        throw err;
      }
    });
  }

  // Allow inviter to cancel a pending invite
  async cancelInvite(inviteId: string, currentUserId: string): Promise<void> {
    try {
      const inviteRef = doc(this.firestore, `invites/${inviteId}`);
      await runTransaction(this.firestore, async (tx) => {
        const snap = await tx.get(inviteRef as any);
        if (!snap.exists()) throw new Error('invite-not-found');
        const data = snap.data() as Invite;
        if (data.inviterUserId !== currentUserId) throw new Error('not-authorized');
        if (data.status !== 'pending') throw new Error('invalid-state');
        tx.update(inviteRef as any, { status: 'cancelled' });
      });
      console.log('Invite cancelled:', inviteId);
    } catch (err) {
      console.error('Error cancelling invite:', err);
      throw err;
    }
  }

  // Realtime Observable for pending invites for the current user (in-app inbox)
  getPendingInvitesForUser(userId: string): Observable<Invite[]> {
    const q = query(this.invitesCol(), where('invitedUserId', '==', userId), where('status', '==', 'pending'));
    return collectionData(q, { idField: 'id' }).pipe(
      map(invites => {
        console.log('[InviteService] Fetched pending invites for user:', userId, 'Count:', invites.length);
        return invites as Invite[];
      })
    );
  }

  // Realtime Observable for invites created by inviter (so inviter sees status updates)
  getInvitesByInviter(inviterUserId: string): Observable<Invite[]> {
    console.log('[InviteService] Getting invites for inviter:', inviterUserId);
    const q = query(this.invitesCol(), where('inviterUserId', '==', inviterUserId));
    return collectionData(q, { idField: 'id' }).pipe(
      map(invites => {
        console.log('[InviteService] Fetched invites for inviter:', invites);
        return invites as Invite[];
      })
    );
  }

  // Watch a single invite (realtime)
  watchInvite(inviteId: string): Observable<Invite | null> {
    const d = doc(this.firestore, `invites/${inviteId}`);
    return docData(d, { idField: 'id' }) as Observable<Invite | null>;
  }

  // Accept invite: only the invited user should call this. Uses transaction to ensure atomic state change.
  async acceptInvite(inviteId: string, currentUserId: string): Promise<void> {
    try {
        
      const inviteRef = doc(this.firestore, `invites/${inviteId}`);
      console.log(inviteRef)
      await runTransaction(this.firestore, async (tx) => {
        const snap = await tx.get(inviteRef as any);
        if (!snap.exists()) throw new Error('invite-not-found');
        const data = snap.data() as Invite;
        if (data.invitedUserId !== currentUserId) throw new Error('not-authorized');
        if (data.status !== 'pending') throw new Error('invalid-state');
        tx.update(inviteRef as any, { status: 'accepted' });
      });
      console.log('Invite accepted:', inviteId);
    } catch (err) {
      console.error('Error accepting invite:', err);
      throw err;
    }
  }

  // Decline invite: only the invited user should call this.
  async declineInvite(inviteId: string, currentUserId: string): Promise<void> {
    try {
      const inviteRef = doc(this.firestore, `invites/${inviteId}`);
      await runTransaction(this.firestore, async (tx) => {
        const snap = await tx.get(inviteRef as any);
        if (!snap.exists()) throw new Error('invite-not-found');
        const data = snap.data() as Invite;
        if (data.invitedUserId !== currentUserId) throw new Error('not-authorized');
        if (data.status !== 'pending') throw new Error('invalid-state');
        tx.update(inviteRef as any, { status: 'declined' });
      });
      console.log('Invite declined:', inviteId);
    } catch (err) {
      console.error('Error declining invite:', err);
      throw err;
    }
  }
}
