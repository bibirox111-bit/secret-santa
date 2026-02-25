import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable, firstValueFrom } from 'rxjs';
import { InvitationService, Invite } from '../../services/invitation/invitation.service';
import { EventService } from '../../services/event/event.service';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../../services/user/user.service';
import { FirestoreTimestampPipe } from '../../shared/firestore-timestamp.pipe';

@Component({
  selector: 'app-inbox',
  standalone: true,
  imports: [CommonModule, MatListModule, MatButtonModule, MatCardModule, MatIconModule, MatSnackBarModule, FirestoreTimestampPipe],
  template: `
    <mat-card>
      <mat-card-header>
        <mat-card-title>Invitations</mat-card-title>
        <mat-card-subtitle>Pending invites to your events</mat-card-subtitle>
      </mat-card-header>
      <mat-card-content>
        <div *ngIf="(invites$ | async) as invites; else noInvites" class="invites-list">
          <div *ngFor="let invite of invites" class="invite-item">
            <div class="invite-details">
              <div><strong>Event:</strong> {{ invite.eventId }}</div>
              <div><strong>From:</strong> {{ invite.inviterUserId }}</div>
              <div><strong>Created:</strong> {{ invite.createdAt | fsTimestamp | date:'short' }}</div>
            </div>
            <div class="invite-actions">
              <button mat-stroked-button color="primary" (click)="accept(invite)" [disabled]="processing[invite.id || '']">Accept</button>
              <button mat-stroked-button color="warn" (click)="decline(invite)" [disabled]="processing[invite.id || '']">Decline</button>
            </div>
          </div>
        </div>
        <ng-template #noInvites>
          <p>No pending invitations</p>
        </ng-template>
      </mat-card-content>
    </mat-card>
  `,
  styles: [`
    .invites-list {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }

    .invite-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      gap: 16px;
    }

    .invite-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .invite-actions {
      display: flex;
      gap: 8px;
      flex-shrink: 0;
    }

    .invite-actions button {
      white-space: nowrap;
    }

    @media (max-width: 600px) {
      .invite-item {
        flex-direction: column;
        align-items: flex-start;
      }

      .invite-actions {
        width: 100%;
      }

      .invite-actions button {
        flex: 1;
      }
    }
  `]
})
export class InboxComponent implements OnInit {
  private invitationService = inject(InvitationService);
  private eventService = inject(EventService);
  private auth = inject(Auth);
  private userService = inject(UserService);
  private snackBar = inject(MatSnackBar);

  invites$!: Observable<Invite[]>;
  processing: Record<string, boolean> = {};

  ngOnInit() {
    const uid = this.auth.currentUser?.uid;
    if (!uid) return;
    this.invites$ = this.invitationService.getPendingInvitesForUser(uid);
  }

  async accept(invite: Invite) {
    const uid = this.auth.currentUser?.uid;
    console.log('uid', uid, 'inviteid', invite.id);
    if (!uid || !invite.id) return;
    this.processing[invite.id] = true;
    try {
      await this.invitationService.acceptInvite(invite.id, uid);
      // after accepting, add participant to the event (client-side). This is not atomic across DBs.
      // Get email/name for current user from users DB
      const user = await firstValueFrom(this.userService.user$(uid));
      const email = user?.email || this.auth.currentUser?.email || '';
      const name = user?.name || this.auth.currentUser?.displayName || email.split('@')[0];
      await this.eventService.addParticipant(invite.eventId, uid, email, name);
      this.snackBar.open('Invite accepted and added to event', 'Close', { duration: 3000 });
    } catch (err: any) {
      this.snackBar.open('Failed to accept invite: ' + (err?.message || err), 'Close', { duration: 3000 });
    } finally {
      this.processing[invite.id] = false;
    }
  }

  async decline(invite: Invite) {
    const uid = this.auth.currentUser?.uid;
    if (!uid || !invite.id) return;
    this.processing[invite.id] = true;
    try {
      await this.invitationService.declineInvite(invite.id, uid);
      this.snackBar.open('Invite declined', 'Close', { duration: 2000 });
    } catch (err: any) {
      this.snackBar.open('Failed to decline invite: ' + (err?.message || err), 'Close', { duration: 3000 });
    } finally {
      this.processing[invite.id] = false;
    }
  }
}
