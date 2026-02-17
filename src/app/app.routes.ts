import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth.guard';
import { EventListComponent } from './events/event-list/event-list.component';
import { EventCreateComponent } from './events/event-create/event-create.component';
import { EventManageComponent } from './events/event-manage/event-manage.component';
import { EventDrawingComponent } from './events/event-drawing/event-drawing.component';
import { EventDetailsComponent } from './events/event-details/event-details.component';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthComponent,
  },

  {
    path: 'app',
    component: DashboardComponent,
    canActivate: [authGuard],
    children: [
      { path: '', component: HomeComponent },
      { path: 'events', component: EventListComponent },
      { path: 'events/create', component: EventCreateComponent },
      { path: 'events/manage/:id', component: EventManageComponent },
      { path: 'events/drawing/:id', component: EventDrawingComponent },
      { path: 'events/details/:id', component: EventDetailsComponent },
    ],
  },

  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
