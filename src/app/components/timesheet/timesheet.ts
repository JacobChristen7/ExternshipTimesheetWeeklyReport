import { Component, inject, OnInit } from '@angular/core';
import { WeekCard } from './week-card/week-card';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Timesheet as TimesheetService } from '../../services/timesheet';
import { Authentication } from '../../services/auth';

export interface DayEntry {
  day: string;
  date: string;
  hours: number;
  notes: string;
}

interface Week {
  id?: string;  // Firestore document ID
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
export class Timesheet implements OnInit {
  private timesheetService = inject(TimesheetService);
  private authService = inject(Authentication);
  
  showAddWeekPopup = false;
  dateInput = '';
  dateError = '';
  
  weeks: Week[] = [];  // Start with empty array - will load from Firestore
  currentPage = 0;
  isLoading = false;

  private readonly CURRENT_PAGE_KEY = 'timesheet-current-page';

  // Load weeks from Firestore when component initializes
  async ngOnInit() {
    
    // Wait for auth to be ready
    this.authService.user$.subscribe(async (user) => {
      console.log('Auth state changed, user:', user?.uid || 'null');
      if (user) {
        // User is logged in, load weeks
        await this.loadWeeks();
      } else {
        // No user, clear weeks
        this.weeks = [];
      }
    });
  }

  // Load all weeks for current user from Firestore
  async loadWeeks() {
    this.isLoading = true;
    try {
      const firestoreWeeks = await this.timesheetService.getUserWeeks();
      
      // Weeks are already sorted by weekStartDate in the service

      // Convert to component Week format
      this.weeks = firestoreWeeks.map((week, index) => ({
        id: week.id,
        weekNumber: index + 1,
        startDate: week.weekStartDate,
        endDate: week.weekEndDate,
        days: week.days.map(day => ({
          day: this.getDayNameFromDate(day.date),
          date: day.date,
          hours: day.hours,
          notes: day.notes
        }))
      }));

      // Restore saved page from localStorage
      this.restoreCurrentPage();
    } catch (error) {
      console.error('Error loading weeks:', error);
    } finally {
      this.isLoading = false;
    }
  }

  // Restore current page from localStorage
  private restoreCurrentPage(): void {
    const savedPage = localStorage.getItem(this.CURRENT_PAGE_KEY);
    if (savedPage !== null) {
      const pageNumber = parseInt(savedPage, 10);
      // Make sure the page number is valid
      if (!isNaN(pageNumber) && pageNumber >= 0 && pageNumber < this.weeks.length) {
        this.currentPage = pageNumber;
      }
    }
  }

  // Save current page to localStorage
  private saveCurrentPage(): void {
    localStorage.setItem(this.CURRENT_PAGE_KEY, this.currentPage.toString());
  }

  // Called when user clicks out of hours field
  async onHoursChange(week: Week, dayIndex: number) {
    if (!week.id) return;  // Skip if no Firestore ID

    try {
      // Convert days to Firestore format (without 'day' field)
      const daysForFirestore = week.days.map(day => ({
        date: day.date,
        hours: day.hours,
        notes: day.notes
      }));

      await this.timesheetService.updateDay(
        week.id, 
        dayIndex, 
        daysForFirestore[dayIndex], 
        daysForFirestore
      );
    } catch (error) {
      console.error('Error updating day:', error);
    }
  }

  // Helper: Get day name from date string
  getDayNameFromDate(dateString: string): string {
    const date = new Date(dateString);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  get currentWeek(): Week {
    return this.weeks[this.currentPage];
  }

  previousWeek(): void {
    if (this.currentPage > 0) {
      this.currentPage--;
      this.saveCurrentPage();
    }
  }

  nextWeek(): void {
    if (this.currentPage < this.weeks.length - 1) {
      this.currentPage++;
      this.saveCurrentPage();
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

  async addWeek(): Promise<void> {
    const selectedDate = this.parseDate(this.dateInput);
    
    if (!selectedDate) {
      this.dateError = 'Invalid date. Please use format: MM/DD/YYYY';
      return;
    }

    await this.addWeekFromDate(selectedDate);
  }

  // Add week based on selected date
  async addWeekFromDate(selectedDate: Date): Promise<void> {
    // Generate week days
    const newWeekDays = this.generateWeekFromDate(selectedDate);
    
    // Get start and end dates
    const startDate = newWeekDays[0].date;  // Monday
    const endDate = newWeekDays[6].date;    // Sunday

    // Check if this week already exists
    const weekExists = this.weeks.some(week => 
      week.startDate === startDate && week.endDate === endDate
    );
    
    if (weekExists) {
      this.dateError = 'This week already exists!';
      return;
    }

    try {
      // Convert to Firestore format (without 'day' field)
      const daysForFirestore = newWeekDays.map(day => ({
        date: day.date,
        hours: day.hours,
        notes: day.notes
      }));

      // Save to Firestore
      const docId = await this.timesheetService.createWeek(startDate, endDate, daysForFirestore);

      // Reload all weeks from Firestore
      await this.loadWeeks();
      
      // Navigate to the newly created week
      const newWeekIndex = this.weeks.findIndex(w => w.id === docId);
      if (newWeekIndex >= 0) {
        this.currentPage = newWeekIndex;
      }
      
      // Close popup on success
      this.closeAddWeekPopup();
    } catch (error) {
      console.error('Error adding week:', error);
      this.dateError = 'Failed to add week. Please try again.';
    }
  }
}
