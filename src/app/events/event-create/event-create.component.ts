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
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.css'],
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
