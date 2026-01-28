import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report';
import { Authentication } from '../../services/auth';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class Report implements OnInit {
  private reportService = inject(ReportService);
  private authService = inject(Authentication);

  email = '';
  week = '';
  studentName = '';
  manager = '';
  company = '';
  programmingLanguages = '';
  accomplishments = '';
  challenges = '';
  goals = '';
  hoursThisWeek = 0;
  totalHours = 0;
  questions = '';
  
  isSubmitting = false;
  submitSuccess = false;
  submitError = '';

  ngOnInit() {
    // Adds email from authenticated user into email field
    this.authService.user$.subscribe(user => {
      if (user?.email) {
        this.email = user.email;
      }
    });
  }
  
  async onSubmit() {
    if (this.isSubmitting) return;

    // Basic validation
    if (!this.week || !this.studentName || !this.manager || !this.company || !this.programmingLanguages) {
      this.submitError = 'Please fill in all required fields';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = false;

    try {
      await this.reportService.createReport({
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

      this.submitSuccess = true;
      console.log('Report submitted successfully!');
      
      // Reset form after successful submission
      this.resetForm();
      
    } catch (error) {
      console.error('Error submitting report:', error);
      this.submitError = 'Failed to submit report. Please try again.';
    } finally {
      this.isSubmitting = false;
    }
  }

  private resetForm() {
    // Keep email, reset everything else
    this.week = '';
    this.studentName = '';
    this.manager = '';
    this.company = '';
    this.programmingLanguages = '';
    this.accomplishments = '';
    this.challenges = '';
    this.goals = '';
    this.hoursThisWeek = 0;
    this.totalHours = 0;
    this.questions = '';
  }
}
