import { Injectable, inject } from '@angular/core';
import { Firestore, collection, addDoc, updateDoc, doc, query, where, getDocs, deleteDoc, serverTimestamp } from '@angular/fire/firestore';
import { Authentication } from './auth';

export interface DayEntry {
  date: string;
  hours: number;
  notes: string;
}

export interface WeekData {
  id?: string; // Firestore document ID
  userId: string;
  userEmail?: string;
  weekStartDate: string;
  weekEndDate: string;
  totalHours: number;
  days: DayEntry[];
  createdAt?: any;
  updatedAt?: any;
}

@Injectable({
  providedIn: 'root',
})
export class Timesheet {
  private firestore = inject(Firestore);
  private authService = inject(Authentication);

  // Create a new week timesheet
  async createWeek(startDate: string, endDate: string, days: DayEntry[]): Promise<string> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) throw new Error('User not logged in');

    const currentUser = this.authService.currentUser();
    const userEmail = currentUser?.email || undefined;

    const weekData: WeekData = {
      userId: userId,
      userEmail: userEmail,
      weekStartDate: startDate,
      weekEndDate: endDate,
      totalHours: days.reduce((sum, day) => sum + (day.hours || 0), 0),
      days: days,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(this.firestore, 'timesheets'), weekData);
    return docRef.id;  // Return the new document ID
  }

  // Get all weeks for current user
  async getUserWeeks(): Promise<WeekData[]> {
    const userId = this.authService.getCurrentUserId();
    if (!userId) return [];

    const q = query(
      collection(this.firestore, 'timesheets'),
      where('userId', '==', userId)
    );

    const querySnapshot = await getDocs(q);
    const weeks: WeekData[] = [];

    querySnapshot.forEach((doc) => {
      weeks.push({
        id: doc.id,
        ...doc.data()
      } as WeekData);
    });

    // Sort by weekStartDate (oldest to newest)
    weeks.sort((a, b) => {
      const dateA = new Date(a.weekStartDate);
      const dateB = new Date(b.weekStartDate);
      return dateA.getTime() - dateB.getTime();
    });

    return weeks;
  }

  // Update a specific day in a week
  async updateDay(weekId: string, dayIndex: number, updatedDay: DayEntry, allDays: DayEntry[]): Promise<void> {
    const weekRef = doc(this.firestore, 'timesheets', weekId);
    
    // Recalculate total hours
    const totalHours = allDays.reduce((sum, day) => sum + (day.hours || 0), 0);

    await updateDoc(weekRef, {
      days: allDays,
      totalHours: totalHours,
      updatedAt: serverTimestamp()
    });
  }

  // Delete a week
  async deleteWeek(weekId: string): Promise<void> {
    const weekRef = doc(this.firestore, 'timesheets', weekId);
    await deleteDoc(weekRef);
  }
}
