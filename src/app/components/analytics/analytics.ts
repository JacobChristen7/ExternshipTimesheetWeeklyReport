import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Timesheet as TimesheetService, WeekData } from '../../services/timesheet';
import { Authentication } from '../../services/auth';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrl: './analytics.css',
})
export class Analytics implements OnInit {
  private timesheetService = inject(TimesheetService);
  private authService = inject(Authentication);
  
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

  async ngOnInit() {
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
        this.createChart(this.weeks);
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
        setTimeout(() => this.createChart(this.weeks), 0);
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
    this.weekCount.set(weeks.length);
    this.averageHours.set(weeks.length > 0 ? Math.round(total / weeks.length) : 0);
    
    // Calculate progress
    const required = this.requiredHours();
    const percentage = Math.min(Math.floor((total / required) * 100), 100);
    this.progressPercentage.set(percentage);
    this.remainingHours.set(Math.max(required - total, 0));
  }

  createChart(weeks: WeekData[]) {
    const canvas = document.getElementById('hoursChart') as HTMLCanvasElement;
    if (!canvas) return;

    // Destroy existing chart if it exists
    if (this.chart) {
      this.chart.destroy();
    }

    // Prepare data
    const labels = weeks.map((week, index) => `Week ${index + 1}`);
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
