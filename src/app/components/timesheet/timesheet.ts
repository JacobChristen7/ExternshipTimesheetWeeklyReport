import { Component } from '@angular/core';
import { WeekCard } from './week-card/week-card';

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [WeekCard],
  templateUrl: './timesheet.html',
  styleUrl: './timesheet.css',
})
export class Timesheet {

}
