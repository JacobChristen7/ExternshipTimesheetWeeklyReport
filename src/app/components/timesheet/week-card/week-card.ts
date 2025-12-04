import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-week-card',
  standalone: true,
  imports: [],
  templateUrl: './week-card.html',
  styleUrl: './week-card.css',
})
export class WeekCard {
  @Input() weekNumber!: number;
  @Input() startDate!: string;
  @Input() endDate!: string;
}
