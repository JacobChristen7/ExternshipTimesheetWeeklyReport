import { Component } from '@angular/core';
import { WeekCard } from './week-card/week-card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  imports: [WeekCard, CommonModule, FormsModule],
  templateUrl: './timesheet.html',
  styleUrl: './timesheet.css',
})
export class Timesheet {
  showAddWeekPopup = false;
  dateInput = '';
  dateError = '';
  
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

  // Add week/calendar logic

  // Helper: Get day name (0=Sunday, 1=Monday, etc.)
  getDayName(dayIndex: number): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayIndex];
  }

  // Helper: Format date as MM/DD/YYYY
  formatDate(date: Date): string {
    return `${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
  }

  // Main function: Generate week from any date
  generateWeekFromDate(selectedDate: Date): DayEntry[] {
    // Get day of week (0=Sunday, 6=Saturday)
    const dayOfWeek = selectedDate.getDay();
    
    // Calculate Monday of this week (go back to Monday)
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() + mondayOffset);
    
    // Generate all 7 days starting from Monday
    const weekDays: DayEntry[] = [];
    
    for (let i = 0; i < 7; i++) {
      const currentDay = new Date(monday);
      currentDay.setDate(monday.getDate() + i);
      
      weekDays.push({
        day: this.getDayName(currentDay.getDay()),
        date: this.formatDate(currentDay),
        hours: 0,
        notes: ''
      });
    }
    
    return weekDays;
  }

  openAddWeekPopup(): void {
    this.showAddWeekPopup = true;
    const today = new Date();
    this.dateInput = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    this.dateError = '';
  }

  closeAddWeekPopup(): void {
    this.showAddWeekPopup = false;
    this.dateError = '';
  }

  // Validate and parse date input
  parseDate(dateString: string): Date | null {
    // Remove extra spaces
    dateString = dateString.trim();
    
    // Try parsing MM/DD/YYYY format
    const parts = dateString.split('/');
    if (parts.length !== 3) {
      return null;
    }

    const month = parseInt(parts[0], 10);
    const day = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    // Validate ranges
    if (isNaN(month) || isNaN(day) || isNaN(year)) {
      return null;
    }
    if (month < 1 || month > 12) {
      return null;
    }
    if (day < 1 || day > 31) {
      return null;
    }
    if (year < 1900 || year > 2100) {
      return null;
    }

    // Create date (JavaScript will validate if day is valid for the month)
    const date = new Date(year, month - 1, day);
    
    // Check if the date is valid (e.g., Feb 30 would be invalid)
    if (date.getMonth() !== month - 1 || date.getDate() !== day) {
      return null;
    }

    return date;
  }

  addWeek(): void {
    const selectedDate = this.parseDate(this.dateInput);
    
    if (!selectedDate) {
      this.dateError = 'Invalid date. Please use format: MM/DD/YYYY';
      return;
    }

    this.addWeekFromDate(selectedDate);
    this.closeAddWeekPopup();
  }

  // Add week based on selected date
  addWeekFromDate(selectedDate: Date): void {
    // Generate week days
    const newWeekDays = this.generateWeekFromDate(selectedDate);
    
    // Get start and end dates
    const startDate = newWeekDays[0].date;  // Monday
    const endDate = newWeekDays[6].date;    // Sunday
    
    // Create new week object
    const newWeek: Week = {
      weekNumber: this.weeks.length + 1,
      startDate: startDate,
      endDate: endDate,
      days: newWeekDays
    };
    
    // Add to weeks array
    this.weeks.push(newWeek);

    // Sort weeks by start date (oldest to newest)
    this.weeks.sort((a, b) => {
      const dateA = new Date(a.startDate);
      const dateB = new Date(b.startDate);
      return dateA.getTime() - dateB.getTime();
    });

    // Update week numbers after sorting
    this.weeks.forEach((week, index) => {
      week.weekNumber = index + 1;
    });
    
    // Navigate to the new week (find its new position after sorting)
    const newWeekIndex = this.weeks.findIndex(w => w.startDate === startDate);
    this.currentPage = newWeekIndex;
  }
}
