import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { SecretSantaEvent } from '../../models/event.model';
import { EventService } from '../../services/event/event.service';

@Component({
  selector: 'app-event-list',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatChipsModule, MatTabsModule],
  template: `
    <div class="event-list-container">
      <div class="header">
        <h1>Secret Santa Events</h1>
        <button mat-raised-button color="accent" (click)="openCreateEvent()" class="create-btn">
          <mat-icon>add</mat-icon>
          Create Event
        </button>
      </div>

      <mat-tab-group>
        <!-- Active Events Tab -->
        <mat-tab label="Active Events">
          @if (activeEvents.length > 0) {
            <div class="events-grid">
              @for (event of activeEvents; track event.id) {
                <mat-card class="event-card">
                  <mat-card-header>
                    <div mat-card-avatar class="event-avatar">
                      {{ event.name.charAt(0) }}
                    </div>
                    <mat-card-title>{{ event.name }}</mat-card-title>
                    <mat-card-subtitle>
                      Organized by {{ event.organizerName }}
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <p class="description">{{ event.description }}</p>
                    <div class="participants-info">
                      <span class="participant-count">
                        <mat-icon>people</mat-icon>
                        {{ event.participants.length }} participants
                      </span>
                      <mat-chip-set>
                        <mat-chip [highlighted]="event.status === 'completed'">
                          {{ event.status | titlecase }}
                        </mat-chip>
                      </mat-chip-set>
                    </div>
                  </mat-card-content>
                  <mat-card-actions>
                    <button mat-button color="primary" (click)="viewEvent(event.id)">
                      <mat-icon>visibility</mat-icon>
                      View Details
                    </button>
                    @if (event.status === 'completed' && event.draws) {
                      <button mat-button color="accent" (click)="viewResults(event)">
                        <mat-icon>card_giftcard</mat-icon>
                        Your Match
                      </button>
                    }
                  </mat-card-actions>
                </mat-card>
              }
            </div>
          }
          @else {
            <div class="empty-state">
              <mat-icon>event</mat-icon>
              <p>No active events yet</p>
            </div>
          }
        </mat-tab>

        <!-- My Events Tab (Organized) -->
        <mat-tab label="My Events">
          @if (myEvents.length > 0) {
            <div class="events-grid">
              @for (event of myEvents; track event.id) {
                <mat-card class="event-card organizer">
                  <mat-card-header>
                    <div mat-card-avatar class="event-avatar organizer-avatar">
                      <mat-icon>manage_accounts</mat-icon>
                    </div>
                    <mat-card-title>{{ event.name }}</mat-card-title>
                    <mat-card-subtitle>
                      {{ event.participants.length }} / {{ event.minParticipants }}+ participants
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <p class="description">{{ event.description }}</p>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill" 
                        [style.width.%]="(event.participants.length / event.minParticipants) * 100"
                      ></div>
                    </div>
                  </mat-card-content>
                  <mat-card-actions>
                    <button mat-button color="primary" (click)="editEvent(event)">
                      <mat-icon>edit</mat-icon>
                      Manage
                    </button>
                    @if (event.status === 'pending' && event.participants.length >= event.minParticipants) {
                      <button mat-button color="accent" (click)="startDrawing(event)">
                        <mat-icon>local_activity</mat-icon>
                        Start Drawing
                      </button>
                    }
                  </mat-card-actions>
                </mat-card>
              }
            </div>
          }
          @else {
            <div class="empty-state">
              <mat-icon>event</mat-icon>
              <p>You haven't organized any events yet</p>
            </div>
          }
        </mat-tab>

        <!-- Past Events Tab -->
        <mat-tab label="Past Events">
          @if (pastEvents.length > 0) {
            <div class="events-grid">
              @for (event of pastEvents; track event.id) {
                <mat-card class="event-card completed">
                  <mat-card-header>
                    <div mat-card-avatar class="event-avatar">
                      <mat-icon>check_circle</mat-icon>
                    </div>
                    <mat-card-title>{{ event.name }}</mat-card-title>
                    <mat-card-subtitle>
                      Completed {{ event.createdAt | date: 'short' }}
                    </mat-card-subtitle>
                  </mat-card-header>
                  <mat-card-content>
                    <p class="description">{{ event.description }}</p>
                  </mat-card-content>
                  <mat-card-actions>
                    @if (event.draws) {
                      <button mat-button color="accent" (click)="viewResults(event)">
                        <mat-icon>card_giftcard</mat-icon>
                        View Match
                      </button>
                    }
                  </mat-card-actions>
                </mat-card>
              }
            </div>
          }
          @else {
            <div class="empty-state">
              <mat-icon>event</mat-icon>
              <p>No completed events</p>
            </div>
          }
        </mat-tab>
      </mat-tab-group>
    </div>
  `,
  styles: [`
    .event-list-container {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 32px;
    }

    .header h1 {
      margin: 0;
      font-size: 32px;
      font-weight: 600;
      color: #1a237e;
    }

    .create-btn {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .events-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 24px;
      padding: 24px 0;
    }

    .event-card {
      transition: all 0.3s ease;
      cursor: pointer;
      height: 100%;
      display: flex;
      flex-direction: column;

      &:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
      }

      &.organizer {
        border-left: 4px solid #ff6f00;
      }

      &.completed {
        border-left: 4px solid #4caf50;
        opacity: 0.9;
      }
    }

    mat-card-header {
      display: flex;
      align-items: flex-start;
      gap: 16px;
      margin-bottom: 16px;
    }

    mat-card-title {
      font-size: 18px;
      font-weight: 600;
      margin: 0;
    }

    mat-card-subtitle {
      font-size: 13px;
      color: #757575;
      margin: 4px 0 0 0;
    }

    .event-avatar {
      width: 48px;
      height: 48px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 600;
      color: white;
      font-size: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);

      &.organizer-avatar {
        background: #ff6f00;
        display: flex;
        align-items: center;
        justify-content: center;

        mat-icon {
          font-size: 24px;
          width: 24px;
          height: 24px;
        }
      }
    }

    mat-card-content {
      flex: 1;
    }

    .description {
      margin: 0 0 16px 0;
      color: #424242;
      font-size: 14px;
      line-height: 1.5;
    }

    .participants-info {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 13px;
    }

    .participant-count {
      display: flex;
      align-items: center;
      gap: 4px;
      color: #666;
    }

    .participant-count mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }

    mat-chip-set {
      margin: 0;
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

    mat-card-actions {
      display: flex;
      gap: 8px;
      padding-top: 16px;
    }

    mat-card-actions button {
      display: flex;
      align-items: center;
      gap: 4px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    }

    .empty-state {
      text-align: center;
      padding: 48px 24px;
      color: #999;

      mat-icon {
        font-size: 64px;
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
      }

      p {
        font-size: 16px;
        margin: 0;
      }
    }

    ::ng-deep .mat-mdc-tab-list {
      border-bottom: 1px solid #e0e0e0;
    }
  `]
})
export class EventListComponent implements OnInit {
  private auth = inject(Auth);
  private eventService = inject(EventService);
  private router = inject(Router);

  activeEvents: SecretSantaEvent[] = [];
  myEvents: SecretSantaEvent[] = [];
  pastEvents: SecretSantaEvent[] = [];

  ngOnInit() {
    if (this.auth.currentUser) {
      this.loadEvents(this.auth.currentUser.uid);
    }
  }

  loadEvents(userId: string) {
    this.eventService.getUserEvents(userId).subscribe(events => {
      this.activeEvents = events.filter(e => e.status !== 'completed' && e.organizerId !== userId);
      this.myEvents = events.filter(e => e.organizerId === userId);
      this.pastEvents = events.filter(e => e.status === 'completed');
    });
  }

  openCreateEvent() {
    this.router.navigate(['/app/events/create']);
  }

  editEvent(event: SecretSantaEvent) {
    this.router.navigate(['/app/events/manage', event.id]);
  }

  viewEvent(eventId: string) {
    this.router.navigate(['/app/events/details', eventId]);
  }

  startDrawing(event: SecretSantaEvent) {
    this.router.navigate(['/app/events/drawing', event.id]);
  }

  viewResults(event: SecretSantaEvent) {
    if (event.draws) {
      const currentUserId = this.auth.currentUser?.uid;
      const assignment = event.draws.find(d => d.from === currentUserId);
      if (assignment) {
        alert(`You are drawing a gift for: ${assignment.toName} 🎁`);
      }
    }
  }
}
