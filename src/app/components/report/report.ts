import { Component, inject, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../services/report';
import { Authentication } from '../../services/auth';
import { Timesheet } from '../../services/timesheet';
import { Firestore, doc, getDoc } from '@angular/fire/firestore';

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
  private timesheetService = inject(Timesheet);
  private firestore = inject(Firestore);

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
    this.authService.user$.subscribe(async user => {
      if (user?.email) {
        this.email = user.email;
        
        // Load externship info from user profile
        await this.loadExternshipInfo(user.uid);
        
        // Auto-calculate hours from timesheet data
        await this.calculateHours();
      }
    });
  }

  async loadExternshipInfo(uid: string) {
    try {
      const docRef = doc(this.firestore, 'userProfiles', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        // Auto-populate company and manager fields if user has saved info
        if (data['companyName']) {
          this.company = data['companyName'];
        }
        if (data['managerName']) {
          this.manager = data['managerName'];
        }
        console.log('Loaded externship info into report:', data);
      }
    } catch (error) {
      console.error('Error loading externship info:', error);
    }
  }

  async calculateHours() {
    try {
      // Get all user's timesheet weeks (already sorted by weekStartDate, oldest to newest)
      const weeks = await this.timesheetService.getUserWeeks();
      
      // Calculate total hours across all weeks
      this.totalHours = weeks.reduce((sum, week) => sum + (week.totalHours || 0), 0);
      
      // Get the most recent week's hours (last in sorted array)
      if (weeks.length > 0) {
        this.hoursThisWeek = weeks[weeks.length - 1]?.totalHours || 0;
      }
    } catch (error) {
      console.error('Error calculating hours:', error);
      // If calculation fails, leave at 0 - user can still enter manually
    }
  }

  @HostListener('document:keydown.enter')
  handleEnterKey() {
    if (this.isSubmitting) return;
    
    this.onSubmit();
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

  private async resetForm() {
    // Keep email, reset everything else
    this.week = '';
    this.studentName = '';
    this.manager = '';
    this.company = '';
    this.programmingLanguages = '';
    this.accomplishments = '';
    this.challenges = '';
    this.goals = '';
    this.questions = '';
    
    // Recalculate hours for next report
    await this.calculateHours();
  }
}
