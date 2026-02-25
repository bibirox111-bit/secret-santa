import { AsyncPipe } from '@angular/common';
import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import { Auth } from '@angular/fire/auth';
import { AuthService } from '../../services/auth/auth.service';
import { ThemeService } from '../../services/theme/theme.service';
import { InvitationService, Invite } from '../../services/invitation/invitation.service';
import { MatIcon } from "@angular/material/icon";
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';

@Component({
  selector: 'app-top-nav',
  imports: [AsyncPipe, MatIcon, MatMenuModule, MatBadgeModule],
  templateUrl: './top-nav.component.html',
  styleUrl: './top-nav.component.css',
})
export class TopNavComponent implements OnInit {
  authService = inject(AuthService);
  router = inject(Router);
  theme = inject(ThemeService);
  invitationService = inject(InvitationService);

  pendingInvites$!: Observable<Invite[]>;
  invitesCount$!: Observable<number>;

  ngOnInit() {
    // Use authService.user$ to get UID, then switchMap to invitations query
    // This ensures we only query when user is actually authenticated
    this.pendingInvites$ = this.authService.user$.pipe(
      switchMap(user => {
        if (user?.uid) {
          return this.invitationService.getPendingInvitesForUser(user.uid).pipe(
            catchError(() => of([])) // suppress permission errors, return empty
          );
        }
        return of([]);
      })
    );

    this.invitesCount$ = this.pendingInvites$.pipe(
      map(invites => invites.length)
    );
  }

  navigateHome() {
    this.router.navigate(['/app']);
  }

  navigateToEvents() {
    this.router.navigate(['/app/events']);
  }

  navigateToInvitations() {
    this.router.navigate(['/app/invitations']);
  }

  async logout() {
    await this.authService.logout();
    this.router.navigate(['/auth']);
  }
}
