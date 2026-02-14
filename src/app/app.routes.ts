import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Report } from './components/report/report';
import { Timesheet } from './components/timesheet/timesheet';
import { Login } from './components/login/login';
import { Profile } from './components/profile/profile';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login},
  { path: 'timesheet', component: Timesheet, canActivate: [authGuard] },
  { path: 'report', component: Report, canActivate: [authGuard] },
  { path: 'profile', component: Profile, canActivate: [authGuard] },
];
