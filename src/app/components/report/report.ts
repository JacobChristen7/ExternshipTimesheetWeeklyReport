import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report {
  email = '';
  week = '';
  studentName = '';
  manager = '';
  company = '';
  programmingLanguages = '';
  accomplishments = '';
  challenges = '';
  goals = '';
  hoursThisWeek = '';
  totalHours = '';
  questions = '';
  
  onSubmit() {
    console.log('Form submitted:', {
      email: this.email,
      week: this.week,
      studentName: this.studentName,
      manager: this.manager,
      company: this.company,
      programmingLanguages: this.programmingLanguages,
      accomplishments: this.accomplishments,
      challenges: this.challenges,
      goals: this.goals,
      hoursThisWeek: this.hoursThisWeek,
      totalHours: this.totalHours,
      questions: this.questions
    });
  }
}
