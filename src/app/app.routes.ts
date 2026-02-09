import { Routes } from '@angular/router';
import { AuthComponent } from './auth/auth.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { HomeComponent } from './home/home.component';
import { authGuard } from './auth.guard';

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
    ],
  },

  { path: '', redirectTo: 'auth', pathMatch: 'full' },
  { path: '**', redirectTo: 'auth' },
];
