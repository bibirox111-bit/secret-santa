import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { EventService } from '../../services/event/event.service';

@Component({
  selector: 'app-event-create',
  standalone: true,
  imports: [CommonModule, FormsModule, MatCardModule, MatFormFieldModule, MatInputModule, MatButtonModule, MatIconModule],
  template: `
    <div class="create-event-container">
      <div class="form-wrapper">
        <div class="header">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <h1>Create Secret Santa Event</h1>
        </div>

        <mat-card class="form-card">
          <mat-card-content>
            <form (ngSubmit)="createEvent()">
              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Event Name</mat-label>
                <input matInput [(ngModel)]="eventName" name="eventName" placeholder="e.g., Christmas 2026" required>
              </mat-form-field>

              <mat-form-field appearance="outline" class="full-width">
                <mat-label>Description</mat-label>
                <textarea matInput [(ngModel)]="eventDescription" name="eventDescription" placeholder="Add event details..." rows="4"></textarea>
              </mat-form-field>

              <div class="info-box">
                <mat-icon>info</mat-icon>
                <div>
                  <strong>Minimum participants:</strong> 3
                  <p>You'll need at least 3 participants before you can start the drawing phase.</p>
                </div>
              </div>

              <div class="button-group">
                <button mat-raised-button color="accent" type="submit" [disabled]="isLoading">
                  @if (isLoading) {
                    <ng-container>
                      <mat-icon>hourglass_top</mat-icon>
                      Creating...
                    </ng-container>
                  } @else {
                    <ng-container>
                      <mat-icon>add_circle</mat-icon>
                      Create Event
                    </ng-container>
                  }
                </button>
                <button mat-stroked-button type="button" (click)="goBack()">
                  Cancel
                </button>
              </div>

              @if (errorMessage) {
                <div class="error-message">
                  <mat-icon>error</mat-icon>
                  {{ errorMessage }}
                </div>
              }
            </form>
          </mat-card-content>
        </mat-card>
      </div>
    </div>
  `,
  styles: [`
    .create-event-container {
      padding: 24px;
      max-width: 600px;
      margin: 0 auto;
    }

    .form-wrapper {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .header {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .back-btn {
      width: 40px;
      height: 40px;
    }

    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      color: #1a237e;
    }

    .form-card {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    mat-card-content {
      padding: 32px;
    }

    form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .full-width {
      width: 100%;
    }

    mat-form-field {
      display: block;
    }

    .info-box {
      display: flex;
      gap: 12px;
      padding: 16px;
      background: #f5f5f5;
      border-radius: 8px;
      border-left: 4px solid #667eea;
      font-size: 14px;
      color: #424242;

      mat-icon {
        color: #667eea;
        flex-shrink: 0;
      }

      strong {
        display: block;
        margin-bottom: 4px;
        color: #1a237e;
      }

      p {
        margin: 0;
        font-size: 13px;
        color: #666;
      }
    }

    .button-group {
      display: flex;
      gap: 12px;
      margin-top: 20px;
    }

    button {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #ffebee;
      border-left: 4px solid #f44336;
      border-radius: 4px;
      color: #c62828;
      font-size: 14px;

      mat-icon {
        color: #f44336;
      }
    }
  `]
})
export class EventCreateComponent implements OnInit {
  private auth = inject(Auth);
  private eventService = inject(EventService);
  private router = inject(Router);

  eventName = '';
  eventDescription = '';
  isLoading = false;
  errorMessage = '';

  ngOnInit() {
    if (!this.auth.currentUser) {
      this.router.navigate(['/auth']);
    }
  }

  async createEvent() {
    if (!this.eventName.trim()) {
      this.errorMessage = 'Event name is required';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    try {
      const userId = this.auth.currentUser!.uid;
      const userName = this.auth.currentUser!.displayName || 'Anonymous';

      const eventId = await this.eventService.createEvent(userId, userName, {
        name: this.eventName,
        description: this.eventDescription,
        minParticipants: 3
      });

      this.router.navigate(['/app/events/manage', eventId]);
    } catch (error: any) {
      this.errorMessage = error.message || 'Failed to create event';
    } finally {
      this.isLoading = false;
    }
  }

  goBack() {
    this.router.navigate(['/app/events']);
  }
}
