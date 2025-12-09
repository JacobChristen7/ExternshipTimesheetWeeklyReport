import { Component, Input } from '@angular/core';
import { DayEntry } from '../timesheet';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-week-card',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './week-card.html',
  styleUrl: './week-card.css',
})
export class WeekCard {
  @Input() weekNumber!: number;
  @Input() startDate!: string;
  @Input() endDate!: string;
  @Input() days!: DayEntry[];
  @Input() totalAllWeeks!: number;

  get weeklyTotal(): number {
    return this.days.reduce((sum, day) => sum + (day.hours || 0), 0);
  }
}
