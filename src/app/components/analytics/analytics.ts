import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Timesheet as TimesheetService, WeekData } from '../../services/timesheet';
import { Authentication } from '../../services/auth';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit, OnDestroy {
  private timesheetService = inject(TimesheetService);
  private authService = inject(Authentication);
  
  private readonly WEEKS_PER_PAGE_KEY = 'analytics_weeks_per_page';
  private readonly CURRENT_PAGE_KEY = 'analytics_current_page';
  
  chart: Chart | null = null;
  totalHours = signal(0);
  averageHours = signal(0);
  weekCount = signal(0);
  isLoading = signal(true);
  private weeks: WeekData[] = [];
  private themeObserver: MutationObserver | null = null;
  
  requiredHours = signal(240); // The number can be changed
  progressPercentage = signal(0);
  remainingHours = signal(240);

  // Settings and pagination
  isSettingsDropdownOpen = signal(false);
  isWeeksModalOpen = signal(false);
  weeksPerPage = signal(4); // Will be set to saved value or max on init
  currentPage = signal(0);
  totalPages = signal(1);
  paginatedWeeks: WeekData[] = [];

  async ngOnInit() {
    // Load saved weeks per page setting (or default to 4 temporarily)
    const savedValue = this.loadWeeksPerPageFromStorage();
    if (savedValue !== -1) {
      this.weeksPerPage.set(savedValue);
    }
    
    // Load saved current page
    const savedPage = this.loadCurrentPageFromStorage();
    if (savedPage !== -1) {
      this.currentPage.set(savedPage);
    }
    
    // Wait for auth to be ready
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        await this.loadAnalytics();
      } else {
        this.isLoading.set(false);
      }
    });

    // Watch for dark mode change
    this.themeObserver = new MutationObserver(() => {
      if (this.weeks.length > 0) {
        this.createChart(this.paginatedWeeks);
      }
    });

    this.themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
  }

  async loadAnalytics() {
    this.isLoading.set(true);
    try {
      this.weeks = await this.timesheetService.getUserWeeks();
      
      if (this.weeks.length > 0) {
        this.calculateStats(this.weeks);
        // Wait for the DOM to render before creating chart
        setTimeout(() => this.createChart(this.paginatedWeeks), 0);
      }
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  calculateStats(weeks: WeekData[]) {
    const total = weeks.reduce((sum, week) => sum + week.totalHours, 0);
    this.totalHours.set(total);
    
    const savedValue = this.loadWeeksPerPageFromStorage();
    
    // Check if user is at max or was at max before adding a new week
    // savedValue === weeks.length means they're currently showing all weeks (at max)
    // savedValue === weeks.length - 1 means they were at max before adding a new week
    const isAtMaxOrWasAtMax = savedValue !== -1 && 
                               (savedValue === weeks.length || savedValue === weeks.length - 1);
    
    this.weekCount.set(weeks.length);
    
    // If user is at max or was at previous max, keep them at max
    if (isAtMaxOrWasAtMax) {
      this.weeksPerPage.set(weeks.length);
      this.saveWeeksPerPageToStorage(weeks.length);
    }
    // If first load and no saved preference, default to max
    else if (savedValue === -1) {
      this.weeksPerPage.set(weeks.length);
      this.saveWeeksPerPageToStorage(weeks.length);
    }
    
    this.averageHours.set(weeks.length > 0 ? Math.round(total / weeks.length) : 0);
    
    // Calculate progress
    const required = this.requiredHours();
    const percentage = Math.min(Math.floor((total / required) * 100), 100);
    this.progressPercentage.set(percentage);
    this.remainingHours.set(Math.max(required - total, 0));

    // Calculate pagination
    this.updatePagination();
  }

  updatePagination() {
    const total = Math.ceil(this.weeks.length / this.weeksPerPage());
    this.totalPages.set(Math.max(total, 1));
    
    // Reset to first page if current page is out of bounds
    if (this.currentPage() >= total) {
      const newPage = Math.max(0, total - 1);
      this.currentPage.set(newPage);
      this.saveCurrentPageToStorage(newPage);
    }
    
    // Get weeks for current page
    const startIdx = this.currentPage() * this.weeksPerPage();
    const endIdx = startIdx + this.weeksPerPage();
    this.paginatedWeeks = this.weeks.slice(startIdx, endIdx);
  }

  goToPage(pageIndex: number) {
    this.currentPage.set(pageIndex);
    this.saveCurrentPageToStorage(pageIndex);
    this.updatePagination();
    this.createChart(this.paginatedWeeks);
  }

  toggleSettingsDropdown() {
    this.isSettingsDropdownOpen.set(!this.isSettingsDropdownOpen());
  }

  closeSettingsDropdown() {
    this.isSettingsDropdownOpen.set(false);
  }

  openWeeksModal() {
    this.isWeeksModalOpen.set(true);
    this.closeSettingsDropdown();
  }

  closeWeeksModal() {
    this.isWeeksModalOpen.set(false);
  }

  updateWeeksPerPage(value: number) {
    const newValue = Math.max(4, value); // Ensure minimum of 4
    this.weeksPerPage.set(newValue);
    this.saveWeeksPerPageToStorage(newValue);
    this.updatePagination();
    this.createChart(this.paginatedWeeks);
  }

  private loadWeeksPerPageFromStorage(): number {
    try {
      const saved = localStorage.getItem(this.WEEKS_PER_PAGE_KEY);
      if (saved) {
        const value = parseInt(saved, 10);
        return Math.max(4, value); // Ensure minimum of 4
      }
    } catch (error) {
      console.error('Error loading weeks per page from localStorage:', error);
    }
    return -1; // Return -1 to indicate no saved value (will default to max)
  }

  private saveWeeksPerPageToStorage(value: number): void {
    try {
      localStorage.setItem(this.WEEKS_PER_PAGE_KEY, value.toString());
    } catch (error) {
      console.error('Error saving weeks per page to localStorage:', error);
    }
  }

  private loadCurrentPageFromStorage(): number {
    try {
      const saved = localStorage.getItem(this.CURRENT_PAGE_KEY);
      if (saved) {
        const value = parseInt(saved, 10);
        return Math.max(0, value); // Ensure non-negative
      }
    } catch (error) {
      console.error('Error loading current page from localStorage:', error);
    }
    return -1; // Return -1 to indicate no saved value
  }

  private saveCurrentPageToStorage(value: number): void {
    try {
      localStorage.setItem(this.CURRENT_PAGE_KEY, value.toString());
    } catch (error) {
      console.error('Error saving current page to localStorage:', error);
    }
  }

  get pageNumbers(): number[] {
    return Array.from({length: this.totalPages()}, (_, i) => i);
  }

  createChart(weeks: WeekData[]) {
    const canvas = document.getElementById('hoursChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Prepare data - calculate the actual week numbers based on current page
    const startWeekNum = this.currentPage() * this.weeksPerPage() + 1;
    const labels = weeks.map((week, index) => `Week ${startWeekNum + index}`);
    const data = weeks.map(week => week.totalHours);

    // Check if dark mode is active
    const isDarkMode = document.documentElement.classList.contains('dark');
    const textColor = isDarkMode ? '#e5e7eb' : '#1f2937';
    const gridColor = isDarkMode ? '#374151' : '#e5e7eb';

    const config: ChartConfiguration = {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Hours Logged',
          data: data,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.3,
          fill: true,
          pointRadius: 5,
          pointHoverRadius: 7,
          pointBackgroundColor: 'rgb(59, 130, 246)',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: isDarkMode ? '#1f2937' : '#fff',
            titleColor: textColor,
            bodyColor: textColor,
            borderColor: gridColor,
            borderWidth: 1,
            callbacks: {
              label: function(context) {
                return ` ${context.parsed.y} hours`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: textColor,
              callback: function(value) {
                return value + 'h';
              }
            },
            grid: {
              color: gridColor
            }
          },
          x: {
            ticks: {
              color: textColor
            },
            grid: {
              color: gridColor
            }
          }
        }
      }
    };

    this.chart = new Chart(canvas, config);
  }

  ngOnDestroy() {
    // Clean up chart when component is destroyed
    if (this.chart) {
      this.chart.destroy();
    }
    // Clean up theme observer
    if (this.themeObserver) {
      this.themeObserver.disconnect();
    }
  }
}
