import { Component } from '@angular/core';
import { WeekCard } from './week-card/week-card';
import { CommonModule } from '@angular/common';

export interface DayEntry {
  day: string;
  date: string;
  hours: number;
  notes: string;
}

interface Week {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: DayEntry[];
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
    { weekNumber: 1, startDate: '12/1/2025', endDate: '12/7/2025', 
      days: [
      { day: 'Monday', date: '12/1/2025', hours: 0, notes: '' },
      { day: 'Tuesday', date: '12/2/2025', hours: 0, notes: '' },
      { day: 'Wednesday', date: '12/3/2025', hours: 0, notes: '' },
      { day: 'Thursday', date: '12/4/2025', hours: 0, notes: '' },
      { day: 'Friday', date: '12/5/2025', hours: 0, notes: '' },
      { day: 'Saturday', date: '12/6/2025', hours: 0, notes: '' },
      { day: 'Sunday', date: '12/7/2025', hours: 0, notes: '' }
    ]
    },
    { weekNumber: 2, startDate: '12/8/2025', endDate: '12/14/2025', 
      days: [
      { day: 'Monday', date: '12/8/2025', hours: 0, notes: '' },
      { day: 'Tuesday', date: '12/9/2025', hours: 0, notes: '' },
      { day: 'Wednesday', date: '12/10/2025', hours: 0, notes: '' },
      { day: 'Thursday', date: '12/11/2025', hours: 0, notes: '' },
      { day: 'Friday', date: '12/12/2025', hours: 0, notes: '' },
      { day: 'Saturday', date: '12/13/2025', hours: 0, notes: '' },
      { day: 'Sunday', date: '12/14/2025', hours: 0, notes: '' }
    ]
    },
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

  get totalAllWeeks(): number {
    return this.weeks.reduce((sum, week) => {
      const weekTotal = week.days.reduce((s, day) => s + (day.hours || 0), 0);
      return sum + weekTotal;
    }, 0);
  }
}
