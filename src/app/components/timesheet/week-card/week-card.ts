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

  // Emit event when delete button is clicked
  @Output() deleteRequested = new EventEmitter<void>();

  get weeklyTotal(): number {
    return this.days.reduce((sum, day) => sum + (day.hours || 0), 0);
  }

  onHoursFocus(event: FocusEvent) {
    const input = event.target as HTMLInputElement;
    if (input.value === '0') {
      input.select();
    }
  }

  // Called when user clicks out of hours field
  onHoursBlur(dayIndex: number) {
    // If hours is empty, null, undefined, or NaN, default to 0
    if (!this.days[dayIndex].hours && this.days[dayIndex].hours !== 0) {
      this.days[dayIndex].hours = 0;
    }
    this.hoursChanged.emit(dayIndex);
  }

  // Called when user clicks out of notes field
  onNotesBlur(dayIndex: number) {
    this.notesChanged.emit(dayIndex);
  }

  // Called when delete button is clicked
  onDeleteClick() {
    this.deleteRequested.emit();
  }
}
