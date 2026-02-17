import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Observable } from 'rxjs';
import { SecretSantaEvent } from '../../models/event.model';
import { EventService } from '../../services/event/event.service';

@Component({
  selector: 'app-event-details',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatListModule],
  template: `
    @if (event$ | async; as event) {
      <div class="details-container">
        <div class="header">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>{{ event.name }}</h1>
            <p class="subtitle">Organized by {{ event.organizerName }}</p>
          </div>
        </div>

        <div class="details-grid">
          <!-- Event Info -->
          <mat-card class="info-card">
            <mat-card-header>
              <mat-card-title>About This Event</mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <div class="detail-section">
                <h3>Description</h3>
                <p>{{ event.description || 'No description provided' }}</p>
              </div>
              <div class="detail-section">
                <h3>Status</h3>
                <span class="status-badge" [ngClass]="'status-' + event.status">
                  {{ event.status | titlecase }}
                </span>
              </div>
              <div class="detail-section">
                <h3>Created</h3>
                <p>{{ event.createdAt | date: 'long' }}</p>
              </div>
            </mat-card-content>
          </mat-card>

          <!-- Participants -->
          <mat-card class="participants-card">
            <mat-card-header>
              <mat-card-title>
                Participants ({{ event.participants.length }})
              </mat-card-title>
            </mat-card-header>
            <mat-card-content>
              <mat-list>
                @for (participant of event.participants; track participant.userId) {
                  <mat-list-item>
                    <mat-icon matListItemIcon>person</mat-icon>
                    <div matListItemTitle>{{ participant.displayName }}</div>
                    <div matListItemLine>{{ participant.email }}</div>
                    @if (participant.userId === event.organizerId) {
                      <span class="organizer-badge" matListItemMeta>
                        <mat-icon>shield</mat-icon>
                        Organizer
                      </span>
                    }
                  </mat-list-item>
                }
              </mat-list>
            </mat-card-content>
          </mat-card>

          <!-- Your Assignment -->
          @if (event.status === 'completed' && event.draws && userAssignment) {
            <mat-card class="assignment-card">
              <mat-card-header>
                <mat-card-title>
                  <mat-icon>card_giftcard</mat-icon>
                  Your Match
                </mat-card-title>
              </mat-card-header>
              <mat-card-content>
                <div class="assignment-display">
                  <div class="you">You</div>
                  <mat-icon class="arrow">arrow_forward</mat-icon>
                  <div class="target">{{ userAssignment.toName }}</div>
                </div>
                <p class="assignment-message">
                  You're responsible for buying a gift for <strong>{{ userAssignment.toName }}</strong>! 🎁
                </p>
              </mat-card-content>
            </mat-card>
          }
        </div>
      </div>
    }
  `,
  styles: [`
    .details-container {
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

    .details-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
      gap: 24px;
    }

    mat-card {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
    }

    mat-card-header {
      padding: 16px 0;
    }

    mat-card-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 16px;
      font-weight: 600;
      margin: 0;

      mat-icon {
        font-size: 20px;
        width: 20px;
        height: 20px;
      }
    }

    mat-card-content {
      padding: 0;
    }

    .detail-section {
      padding: 16px 0;
      border-bottom: 1px solid #f0f0f0;

      &:last-child {
        border-bottom: none;
      }

      h3 {
        margin: 0 0 8px 0;
        font-size: 12px;
        font-weight: 600;
        color: #999;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      p {
        margin: 0;
        color: #424242;
        font-size: 14px;
        line-height: 1.5;
      }
    }

    .status-badge {
      display: inline-block;
      padding: 4px 12px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 600;

      &.status-pending {
        background: #fff3e0;
        color: #e65100;
      }

      &.status-active {
        background: #e3f2fd;
        color: #1565c0;
      }

      &.status-completed {
        background: #e8f5e9;
        color: #2e7d32;
      }
    }

    mat-list {
      max-height: 400px;
      overflow-y: auto;
    }

    mat-list-item {
      font-size: 13px;
    }

    .organizer-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: #fff3e0;
      color: #e65100;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;

      mat-icon {
        font-size: 14px;
        width: 14px;
        height: 14px;
      }
    }

    .assignment-card {
      grid-column: 1 / -1;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;

      mat-card-title {
        color: white;
        gap: 12px;

        mat-icon {
          color: #ffd700;
        }
      }
    }

    .assignment-display {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 20px;
      padding: 24px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      margin-bottom: 16px;
    }

    .you,
    .target {
      font-size: 18px;
      font-weight: 600;
      padding: 12px 24px;
      background: rgba(255, 255, 255, 0.2);
      border-radius: 8px;
    }

    .arrow {
      color: #ffd700;
      font-size: 24px;
      width: 24px;
      height: 24px;
    }

    .assignment-message {
      margin: 0;
      font-size: 14px;
      text-align: center;
      opacity: 0.9;
    }

    ::ng-deep .mat-mdc-card.assignment-card .mat-mdc-card-content {
      color: white;
    }
  `]
})
export class EventDetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);
  private eventService = inject(EventService);

  event$!: Observable<SecretSantaEvent | null>;
  eventId: string = '';
  userAssignment: any = null;

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/app/events']);
      return;
    }
    this.event$ = this.eventService.getEvent(this.eventId);

    this.event$.subscribe((event: SecretSantaEvent | null) => {
      if (event?.draws && this.auth.currentUser) {
        this.userAssignment = event.draws.find(d => d.from === this.auth.currentUser!.uid);
      }
    });
  }

  goBack() {
    this.router.navigate(['/app/events']);
  }
}
