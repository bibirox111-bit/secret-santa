import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Observable } from 'rxjs';
import { SecretSantaEvent } from '../../models/event.model';
import { EventService } from '../../services/event/event.service';

@Component({
  selector: 'app-event-drawing',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatButtonModule, MatIconModule, MatSnackBarModule],
  template: `
    @if (event$ | async; as event) {
      <div class="drawing-container">
        <div class="header">
          <button mat-icon-button (click)="goBack()" class="back-btn">
            <mat-icon>arrow_back</mat-icon>
          </button>
          <div>
            <h1>Secret Santa Drawing</h1>
            <p class="subtitle">{{ event.name }}</p>
          </div>
        </div>

        <mat-card class="drawing-card">
          <mat-card-content>
            <div class="drawing-content">
              @if (currentStep === 'confirm') {
                <div class="confirm-step">
                  <mat-icon class="icon">card_giftcard</mat-icon>
                  <h2>Ready to draw?</h2>
                  <p>You're about to randomly assign {{ event.participants.length }} participants to exchange gifts.</p>
                  
                  <div class="participant-list">
                    <h3>Participants:</h3>
                    <ul>
                      @for (participant of event.participants; track participant.userId) {
                        <li>
                          <mat-icon>person</mat-icon>
                          {{ participant.displayName }}
                        </li>
                      }
                    </ul>
                  </div>

                  <div class="button-group">
                    <button mat-raised-button color="accent" (click)="performDrawing()" [disabled]="isDrawing">
                      @if (isDrawing) {
                        <ng-container>
                          <mat-icon>hourglass_top</mat-icon>
                          Drawing...
                        </ng-container>
                      } @else {
                        <ng-container>
                          <mat-icon>shuffle</mat-icon>
                          Proceed with Drawing
                        </ng-container>
                      }
                    </button>
                    <button mat-stroked-button (click)="goBack()">
                      Cancel
                    </button>
                  </div>
                </div>
              }

              @if (currentStep === 'drawing') {
                <div class="drawing-step">
                  <div class="drawing-animation">
                    <mat-icon class="spinning">shuffle</mat-icon>
                    <p class="animated-text">Drawing in progress...</p>
                  </div>
                </div>
              }

              @if (currentStep === 'complete') {
                <div class="complete-step">
                  <mat-icon class="success-icon">check_circle</mat-icon>
                  <h2>Drawing Complete! 🎉</h2>
                  <p>Everyone has been randomly assigned.</p>
                  
                  <div class="results-preview">
                    <h3>Assignments Preview:</h3>
                    <div class="assignments-list">
                      @for (assignment of assignments; track assignment.from) {
                        <div class="assignment-item">
                          <span class="from">{{ assignment.fromName }}</span>
                          <mat-icon class="arrow">arrow_forward</mat-icon>
                          <span class="to">{{ assignment.toName }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <p class="info-text">
                    <mat-icon>info</mat-icon>
                    Each participant can now see who they're drawing a gift for!
                  </p>

                  <div class="button-group">
                    <button mat-raised-button color="accent" (click)="closeDrawing()">
                      <mat-icon>check</mat-icon>
                      Done
                    </button>
                  </div>
                </div>
              }
            </div>
          </mat-card-content>
        </mat-card>
      </div>
    }
  `,
  styles: [`
    .drawing-container {
      padding: 24px;
      max-width: 700px;
      margin: 0 auto;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
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

    .drawing-card {
      border-radius: 12px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      flex: 1;
    }

    mat-card-content {
      padding: 40px;
    }

    .drawing-content {
      text-align: center;
    }

    .confirm-step,
    .drawing-step,
    .complete-step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 24px;
    }

    .icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #667eea;
      margin-bottom: 16px;
    }

    h2 {
      font-size: 24px;
      font-weight: 600;
      color: #1a237e;
      margin: 0;
    }

    p {
      color: #666;
      font-size: 14px;
      margin: 8px 0;
    }

    .participant-list {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
      text-align: left;
      width: 100%;
      margin: 24px 0;
    }

    .participant-list h3 {
      margin: 0 0 12px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1a237e;
    }

    ul {
      list-style: none;
      padding: 0;
      margin: 0;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    li {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #424242;
      padding: 8px;
      background: white;
      border-radius: 4px;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #667eea;
      }
    }

    .button-group {
      display: flex;
      gap: 12px;
      width: 100%;
      margin-top: 24px;

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
    }

    .drawing-animation {
      padding: 40px 0;
    }

    .spinning {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #667eea;
      animation: spin 2s linear infinite;
    }

    @keyframes spin {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }

    .animated-text {
      font-size: 18px;
      font-weight: 600;
      color: #667eea;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 1;
      }
      50% {
        opacity: 0.5;
      }
    }

    .success-icon {
      font-size: 80px;
      width: 80px;
      height: 80px;
      color: #4caf50;
    }

    .results-preview {
      background: #f5f5f5;
      border-radius: 8px;
      padding: 20px;
      width: 100%;
      margin: 24px 0;
      text-align: left;
    }

    .results-preview h3 {
      margin: 0 0 16px 0;
      font-size: 14px;
      font-weight: 600;
      color: #1a237e;
    }

    .assignments-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .assignment-item {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px;
      background: white;
      border-radius: 4px;
      font-size: 13px;

      .from {
        flex: 1;
        font-weight: 600;
        color: #667eea;
        text-align: right;
      }

      .arrow {
        color: #999;
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .to {
        flex: 1;
        font-weight: 600;
        color: #764ba2;
      }
    }

    .info-text {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px;
      background: #e8f5e9;
      border-radius: 4px;
      color: #2e7d32;
      font-size: 13px;
      margin: 16px 0 24px 0;

      mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
        color: #4caf50;
      }
    }
  `]
})
export class EventDrawingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private auth = inject(Auth);
  private eventService = inject(EventService);
  private snackBar = inject(MatSnackBar);

  event$!: Observable<SecretSantaEvent | null>;
  eventId: string = '';
  currentStep: 'confirm' | 'drawing' | 'complete' = 'confirm';
  isDrawing = false;
  assignments: any[] = [];

  ngOnInit() {
    this.eventId = this.route.snapshot.paramMap.get('id') || '';
    if (!this.eventId) {
      this.router.navigate(['/app/events']);
      return;
    }
    this.event$ = this.eventService.getEvent(this.eventId);
  }

  async performDrawing() {
    this.isDrawing = true;
    this.currentStep = 'drawing';

    // Simulate drawing with animation
    await new Promise(resolve => setTimeout(resolve, 2000));

    this.event$.subscribe((event: SecretSantaEvent | null) => {
      if (event) {
        this.assignments = this.eventService.generateSecretSantaAssignments(event.participants);
        
        this.eventService.performDrawing(this.eventId, this.assignments).then(() => {
          this.currentStep = 'complete';
          this.isDrawing = false;
          this.snackBar.open('Drawing completed successfully!', 'Close', { duration: 3000 });
        }).catch(error => {
          this.currentStep = 'confirm';
          this.isDrawing = false;
          this.snackBar.open('Error during drawing', 'Close', { duration: 3000 });
        });
      }
    }).unsubscribe();
  }

  closeDrawing() {
    this.router.navigate(['/app/events']);
  }

  goBack() {
    if (this.currentStep !== 'drawing') {
      this.router.navigate(['/app/events/manage', this.eventId]);
    }
  }
}
