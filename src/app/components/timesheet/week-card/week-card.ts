import { Component, Input, Output, EventEmitter } from '@angular/core';
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
  
  // Emit event when a day's hours change
  @Output() hoursChanged = new EventEmitter<number>();
  
  // Emit event when a day's notes change
  @Output() notesChanged = new EventEmitter<number>();

  get weeklyTotal(): number {
    return this.days.reduce((sum, day) => sum + (day.hours || 0), 0);
  }

  // Called when user clicks out of hours field
  onHoursBlur(dayIndex: number) {
    this.hoursChanged.emit(dayIndex);
  }

  // Called when user clicks out of notes field
  onNotesBlur(dayIndex: number) {
    this.notesChanged.emit(dayIndex);
  }
}
