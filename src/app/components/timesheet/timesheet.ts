import { Component, inject, OnInit, HostListener } from '@angular/core';
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
  
  // Calendar-related properties
  currentCalendarDate = new Date();
  calendarDays: (Date | null)[] = [];
  selectedWeekStart: Date | null = null;
  hoveredDate: Date | null = null;
  
  // Delete confirmation modal
  showDeleteModal = false;
  weekToDelete: Week | null = null;
  
  weeks: Week[] = [];  // Start with empty array - will load from Firestore
  currentPage = 0;
  isLoading = false;

  private readonly CURRENT_PAGE_KEY = 'timesheet-current-page';

  // Left arrow key for previous week
  @HostListener('window:keydown.arrowleft', ['$event'])
  handleLeftArrow(event: Event) {
    // Don't trigger if user is typing in an input, textarea, or if modals are open
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        this.showAddWeekPopup ||
        this.showDeleteModal) {
      return;
    }

    if (this.canGoBack) {
      this.previousWeek();
      event.preventDefault(); // Prevent page scroll
    }
  }

  // Right arrow key for next week
  @HostListener('window:keydown.arrowright', ['$event'])
  handleRightArrow(event: Event) {
    // Don't trigger if user is typing in an input, textarea, or if modals are open
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement ||
        this.showAddWeekPopup ||
        this.showDeleteModal) {
      return;
    }

    if (this.canGoNext) {
      this.nextWeek();
      event.preventDefault(); // Prevent page scroll
    }
  }

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
    this.currentCalendarDate = new Date(today.getFullYear(), today.getMonth(), 1);
    this.dateInput = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
    this.dateError = '';
    this.selectedWeekStart = null;
    this.hoveredDate = null;
    this.generateCalendar();
  }

  closeAddWeekPopup(): void {
    this.showAddWeekPopup = false;
    this.dateError = '';
    this.selectedWeekStart = null;
    this.hoveredDate = null;
  }

  // Calendar navigation methods
  previousMonth(): void {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() - 1,
      1
    );
    this.generateCalendar();
  }

  nextMonth(): void {
    this.currentCalendarDate = new Date(
      this.currentCalendarDate.getFullYear(),
      this.currentCalendarDate.getMonth() + 1,
      1
    );
    this.generateCalendar();
  }

  get currentMonthYear(): string {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return `${months[this.currentCalendarDate.getMonth()]} ${this.currentCalendarDate.getFullYear()}`;
  }

  // Generate calendar grid (6 weeks of 7 days = 42 cells)
  generateCalendar(): void {
    const year = this.currentCalendarDate.getFullYear();
    const month = this.currentCalendarDate.getMonth();
    
    // First day of the month
    const firstDay = new Date(year, month, 1);
    
    // Get the day of week (0=Sunday, 1=Monday, etc.)
    // Monday should be the first column so adjust
    let firstDayOfWeek = firstDay.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Convert to Monday=0
    
    // Last day of the month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Previous month info
    const prevMonthLastDay = new Date(year, month, 0);
    const daysInPrevMonth = prevMonthLastDay.getDate();
    
    // Build calendar array
    this.calendarDays = [];
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      this.calendarDays.push(new Date(year, month - 1, daysInPrevMonth - i));
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      this.calendarDays.push(new Date(year, month, day));
    }
    
    // Add days from next month to fill the grid (always show 6 weeks = 42 days)
    const remainingDays = 42 - this.calendarDays.length;
    for (let day = 1; day <= remainingDays; day++) {
      this.calendarDays.push(new Date(year, month + 1, day));
    }
  }

  // Get the Monday of a given date's week
  getMondayOfWeek(date: Date): Date {
    const dayOfWeek = date.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(date);
    monday.setDate(date.getDate() + mondayOffset);
    return monday;
  }

  // Get the Sunday of a given date's week
  getSundayOfWeek(date: Date): Date {
    const monday = this.getMondayOfWeek(date);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return sunday;
  }

  // Check if a date is in the currently selected week
  isInSelectedWeek(date: Date | null): boolean {
    if (!date) return false;
    
    const weekStart = this.selectedWeekStart || (this.hoveredDate ? this.getMondayOfWeek(this.hoveredDate) : null);
    if (!weekStart) return false;
    
    const weekEnd = this.getSundayOfWeek(weekStart);
    const dateTime = date.getTime();
    
    return dateTime >= weekStart.getTime() && dateTime <= weekEnd.getTime();
  }

  // Check if a date is in the current calendar month
  isCurrentMonth(date: Date | null): boolean {
    if (!date) return false;
    return date.getMonth() === this.currentCalendarDate.getMonth();
  }

  // Check if a date is today
  isToday(date: Date | null): boolean {
    if (!date) return false;
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  // Handle date hover
  onDateHover(date: Date | null): void {
    this.hoveredDate = date;
  }

  // Handle date selection
  onDateClick(date: Date | null): void {
    if (!date) return;
    
    const monday = this.getMondayOfWeek(date);
    this.selectedWeekStart = monday;
    
    // Clear any previous error
    this.dateError = '';
  }

  // Get the week range text for display
  get selectedWeekRange(): string {
    const weekStart = this.selectedWeekStart || (this.hoveredDate ? this.getMondayOfWeek(this.hoveredDate) : null);
    if (!weekStart) return '';
    
    const weekEnd = this.getSundayOfWeek(weekStart);
    return `Selected Week: ${this.formatDate(weekStart)} - ${this.formatDate(weekEnd)}`;
  }

  // Confirm adding the selected week
  async confirmAddWeek(): Promise<void> {
    if (!this.selectedWeekStart) {
      this.dateError = 'Please select a week from the calendar';
      return;
    }

    await this.addWeekFromDate(this.selectedWeekStart);
  }

  openDeleteModal(week: Week): void {
    this.weekToDelete = week;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.weekToDelete = null;
  }

  // Delete the week after confirmation
  async confirmDelete(): Promise<void> {
    if (!this.weekToDelete || !this.weekToDelete.id) {
      return;
    }

    try {
      // Delete from Firestore
      await this.timesheetService.deleteWeek(this.weekToDelete.id);

      // If user is deleting the current week and it's the last one go back one page
      if (this.currentPage === this.weeks.length - 1 && this.currentPage > 0) {
        this.currentPage--;
      }

      // Reload weeks from Firestore
      await this.loadWeeks();

      this.closeDeleteModal();
    } catch (error) {
      console.error('Error deleting week:', error);
    }
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
