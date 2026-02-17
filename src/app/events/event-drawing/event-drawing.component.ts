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
  templateUrl: './event-drawing.component.html',
  styleUrls: ['./event-drawing.component.css'],
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

  trackByUserId(index: number, participant: any) {
    return participant.userId;
  }

  trackByAssignment(index: number, assignment: any) {
    return assignment.from;
  }
}
