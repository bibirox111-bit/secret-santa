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
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.css'],
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

  trackByUserId(index: number, participant: any) {
    return participant.userId;
  }
}
