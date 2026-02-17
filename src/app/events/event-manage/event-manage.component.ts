import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { SecretSantaEvent } from '../../models/event.model';
import { EventService } from '../../services/event/event.service';

@Component({
  selector: 'app-event-manage',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatCardModule, MatButtonModule, MatIconModule,
    MatFormFieldModule, MatInputModule, MatListModule, MatDialogModule, MatSnackBarModule
  ],
  template: `
    @if (event$ | async; as event) {
      <div class="manage-event-container">
        <div class="header">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ event.name }}</h1>
            <p class="subtitle">Manage participants and start drawing</p>
          </div>
        </div>

        <div class="content-grid">
          <!-- Event Details Card -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>Event Details</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="detail-item">
                <span class="label">Status</span>
                <span class="value" [ngClass]="'status-' + event.status">{{ event.status | titlecase }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Description</span>
                <span class="value">{{ event.description || 'No description' }}</span>
              </div>
              <div class="detail-item">
                <span class="label">Created</span>
                <span class="value">{{ event.createdAt | date: 'medium' }}</span>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Add Participant Card -->
          <mat-card class="add-participant-card">
            <mat-card-header>
              <mat-card-title>Add Participant</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <form (ngSubmit)="addParticipant()">
                <mat-form-field appearance="outline" class="full-width">
                  <mat-label>Email or User ID</mat-label>
                  <input matInput [(ngModel)]="newParticipantEmail" name="email" placeholder="Enter email">
                </mat-form-field>
                <button mat-raised-button color="accent" type="submit" [disabled]="!newParticipantEmail">
                  <mat-icon>person_add</mat-icon>
                  Add
                </button>
                @if (addErrorMessage) {
                  <div class="error-message">{{ addErrorMessage }}</div>
                }
              </form>
            </mat-card-content>
          </mat-card>

          <!-- Participants Card -->
          <mat-card class="participants-card">
            <mat-card-header>
              <mat-card-title>
                Participants ({{ event.participants.length }}/{{ event.minParticipants }}+)
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="progress-bar">
                <div 
                  class="progress-fill" 
                  [style.width.%]="(event.participants.length / event.minParticipants) * 100"
                ></div>
              </div>
              @if (event.participants.length >= event.minParticipants) {
                <div class="success-message">
                  <mat-icon>check_circle</mat-icon>
                  Ready to start drawing!
                </div>
              }
              <mat-list>
                @for (participant of event.participants; track participant.userId) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>
                      @if (participant.userId === currentUserId) {
                        account_circle
                      } @else {
                        person
                      }
                    </mat-icon>
                    <div matListItemTitle>{{ participant.displayName }}</div>
                    <div matListItemLine>{{ participant.email }}</div>
                    @if (participant.userId !== event.organizerId) {
                      <button mat-icon-button matListItemMeta (click)="removeParticipant(participant.userId)">
                        <mat-icon>close</mat-icon>
                      </button>
                    }
                  </mat-list-item>
                }
              </mat-list>
            </mat-card-content>
          </mat-card>
        </div>

        <!-- Actions Card -->
        <mat-card class="actions-card">
          <mat-card-header>
            <mat-card-title>Actions</mat-card-title>
          </mat-card-header>
          <mat-card-content>
            <div class="action-buttons">
              @if (event.status === 'pending' && event.participants.length >= event.minParticipants) {
                <button mat-raised-button color="accent" (click)="startDrawing()">
                  <mat-icon>local_activity</mat-icon>
                  Start Drawing
                </button>
              } @else if (event.participants.length < event.minParticipants) {
                <p class="disabled-message">
                  <mat-icon>lock</mat-icon>
                  Add at least {{ event.minParticipants - event.participants.length }} more participant(s) to start drawing
                </p>
              }
              <button mat-stroked-button color="warn" (click)="deleteEvent()">
                <mat-icon>delete</mat-icon>
                Delete Event
              </button>
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .manage-event-container {
      padding: 24px;
      max-width: 1000px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 32px;
    }

    .back-btn {
      margin-top: -8px;
    }

    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
      color: #1a237e;
    }

    .subtitle {
      margin: 4px 0 0 0;
      color: #666;
      font-size: 14px;
    }

    .content-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 24px;
      margin-bottom: 24px;
    }

    mat-card {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    mat-card-header {
      padding: 16px 0;
    }

    mat-card-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    }

    mat-card-content {
      padding: 0;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }
    }

    .label {
      font-weight: 500;
      color: #666;
      font-size: 13px;
    }

    .value {
      font-size: 14px;
      color: #1a237e;
      font-weight: 500;

      &.status-pending {
        color: #ff9800;
        background: #fff3e0;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
      }

      &.status-active {
        color: #2196f3;
        background: #e3f2fd;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
      }

      &.status-completed {
        color: #4caf50;
        background: #e8f5e9;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 12px;
      }
    }

    .add-participant-card {
      form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }

      .full-width {
        width: 100%;
      }

      button {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      .error-message {
        color: #f44336;
        font-size: 13px;
        padding: 8px;
        background: #ffebee;
        border-radius: 4px;
        margin-top: 8px;
      }
    }

    .participants-card {
      grid-column: 2;
      grid-row: 1 / 3;
    }

    .progress-bar {
      width: 100%;
      height: 8px;
      background: #e0e0e0;
      border-radius: 4px;
      overflow: hidden;
      margin: 16px 0;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      transition: width 0.3s ease;
    }

    .success-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 4px;
      color: #2e7d32;
      font-size: 13px;
      font-weight: 500;
      margin: 12px 0;

      mat-icon {
        color: #4caf50;
      }
    }

    mat-list {
      max-height: 300px;
      overflow-y: auto;
    }

    mat-list-item {
      font-size: 14px;
    }

    .actions-card {
      margin-top: 24px;
    }

    .action-buttons {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    button {
      display: flex;
      align-items: center;
      gap: 8px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .disabled-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #f5f5f5;
      border-radius: 4px;
      color: #666;
      font-size: 14px;
      margin: 0;

      mat-icon {
        color: #999;
      }
    }

    @media (max-width: 768px) {
      .content-grid {
        grid-template-columns: 1fr;
      }

      .participants-card {
        grid-column: auto;
        grid-row: auto;
      }
    }
  `]
})
export class EventManageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);
  private eventService = inject(EventService);
  private snackBar = inject(MatSnackBar);

  event$!: Observable<SecretSantaEvent | null>;
  eventId: string = '';
  newParticipantEmail = '';
  addErrorMessage = '';
  currentUserId = this.auth.currentUser?.uid || '';

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/app/events']);
      return;
    }
    this.event$ = this.eventService.getEvent(this.eventId);
  }

  addParticipant() {
    this.addErrorMessage = '';
    if (!this.newParticipantEmail.trim()) {
      this.addErrorMessage = 'Please enter an email';
      return;
    }

    this.eventService.addParticipant(
      this.eventId,
      `user_${Date.now()}`,
      this.newParticipantEmail,
      this.newParticipantEmail.split('@')[0]
    ).then(() => {
      this.newParticipantEmail = '';
      this.snackBar.open('Participant added!', 'Close', { duration: 2000 });
    }).catch(error => {
      this.addErrorMessage = 'Failed to add participant';
    });
  }

  removeParticipant(userId: string) {
    if (confirm('Are you sure you want to remove this participant?')) {
      this.eventService.removeParticipant(this.eventId, userId).then(() => {
        this.snackBar.open('Participant removed', 'Close', { duration: 2000 });
      });
    }
  }

  startDrawing() {
    this.router.navigate(['/app/events/drawing', this.eventId]);
  }

  deleteEvent() {
    if (confirm('Are you sure? This action cannot be undone.')) {
      this.eventService.deleteEvent(this.eventId).then(() => {
        this.snackBar.open('Event deleted', 'Close', { duration: 2000 });
        this.router.navigate(['/app/events']);
      });
    }
  }

  goBack() {
    this.router.navigate(['/app/events']);
  }
}
