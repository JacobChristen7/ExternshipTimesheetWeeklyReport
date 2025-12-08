import { Component } from '@angular/core';
import { WeekCard } from './week-card/week-card';
import { CommonModule } from '@angular/common';

interface Week {
  weekNumber: number;
  startDate: string;
  endDate: string;
}

@Component({
  selector: 'app-timesheet',
  standalone: true,
  imports: [WeekCard, CommonModule],
  templateUrl: './timesheet.html',
  styleUrl: './timesheet.css',
})
export class Timesheet {
  weeks: Week[] = [
    { weekNumber: 1, startDate: '12/1/2025', endDate: '12/7/2025' },
    { weekNumber: 2, startDate: '12/8/2025', endDate: '12/14/2025' },
    { weekNumber: 3, startDate: '12/15/2025', endDate: '12/21/2025' },
    { weekNumber: 4, startDate: '12/22/2025', endDate: '12/28/2025' },
    { weekNumber: 5, startDate: '12/29/2025', endDate: '1/4/2026' }
  ];

  currentPage = 0;

  get currentWeek(): Week {
    return this.weeks[this.currentPage];
  }

  previousWeek(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  nextWeek(): void {
    if (this.currentPage < this.weeks.length - 1) {
      this.currentPage++;
    }
  }

  get canGoBack(): boolean {
    return this.currentPage > 0;
  }

  get canGoNext(): boolean {
    return this.currentPage < this.weeks.length - 1;
  }
}
