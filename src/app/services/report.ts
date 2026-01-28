import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, serverTimestamp } from '@angular/fire/firestore';
import { Authentication } from './auth';

export interface ReportData {
  id?: string; // Firestore document ID
  userId: string;
  userEmail?: string;
  week: string;
  studentName: string;
  manager: string;
  company: string;
  programmingLanguages: string;
  accomplishments: string;
  challenges: string;
  goals: string;
  hoursThisWeek: number;
  totalHours: number;
  questions: string;
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class ReportService {
  private firestore = inject(Firestore);
  private authService = inject(Authentication);

  // Create a new weekly report
  async createReport(reportData: Omit<ReportData, 'id' | 'userId' | 'userEmail' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User not logged in');

    const currentUser = this.authService.currentUser();
    const userEmail = currentUser?.email || undefined;

    const fullReportData: ReportData = {
      userId: userId,
      userEmail: userEmail,
      ...reportData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(this.firestore, 'reports'), fullReportData);
    return docRef.id;
  }
}