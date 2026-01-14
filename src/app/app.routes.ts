import { Routes } from '@angular/router';
import { Home } from './components/home/home';
import { Report } from './components/report/report';
import { Timesheet } from './components/timesheet/timesheet';
import { Login } from './components/login/login';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: Login},
  { path: 'timesheet', component: Timesheet },
  { path: 'report', component: Report },
];
