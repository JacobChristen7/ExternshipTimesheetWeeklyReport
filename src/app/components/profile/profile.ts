import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Authentication } from '../../services/auth';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc, getDoc, collection, query, where, getDocs, deleteDoc } from '@angular/fire/firestore';

interface ExternshipInfo {
  companyName: string;
  managerName: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css',
})
export class Profile implements OnInit {
  private authService = inject(Authentication);
  private router = inject(Router);
  private firestore = inject(Firestore);
  
  user = signal<any>(null);
  isLoading = signal(true);
  isSaving = signal(false);
  saveMessage = signal<string>('');
  saveMessageType = signal<'success' | 'error' | ''>('');
  showMessage = signal(true);
  isSettingsDropdownOpen = signal(false);
  resetPasswordMessage = signal<string>('');
  resetPasswordMessageType = signal<'success' | 'error' | ''>('');
  showResetPasswordMessage = signal(true);
  showDeleteModal = signal(false);
  deletePassword = '';
  deleteError = '';
  isDeleting = false;
  isGoogleUser = false;
  externshipInfo = signal<ExternshipInfo>({
    companyName: '',
    managerName: '',
  });

  async ngOnInit() {
    this.authService.user$.subscribe(async (user) => {
      if (user) {
        this.user.set(user);
        await this.loadExternshipInfo(user.uid);
        this.isLoading.set(false);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  async loadExternshipInfo(uid: string) {
    try {
      const docRef = doc(this.firestore, 'userProfiles', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data() as ExternshipInfo;
        this.externshipInfo.set(data);
        console.log('Loaded externship info:', data);
      } else {
        console.log('No existing externship info found');
      }
    } catch (error) {
      console.error('Error loading externship info:', error);
    }
  }

  @HostListener('document:keydown.enter')
  handleEnterKey() {
    if (this.isSaving()) return;
    
    this.saveExternshipInfo();
  }

  toggleSettingsDropdown() {
    this.isSettingsDropdownOpen.set(!this.isSettingsDropdownOpen());
  }

  closeSettingsDropdown() {
    this.isSettingsDropdownOpen.set(false);
    // Clear reset password message when closing dropdown
    this.resetPasswordMessage.set('');
    this.resetPasswordMessageType.set('');
  }

  openDeleteModal() {
    this.showDeleteModal.set(true);
    this.deletePassword = '';
    this.deleteError = '';
    this.isGoogleUser = this.authService.isGoogleUser();
    this.closeSettingsDropdown();
  }

  closeDeleteModal() {
    this.showDeleteModal.set(false);
    this.deletePassword = '';
    this.deleteError = '';
  }

  async deleteAccount() {
    const user = this.user();
    if (!user) return;

    // For email/password users require password
    if (!this.isGoogleUser && !this.deletePassword) {
      this.deleteError = 'Please enter your password';
      return;
    }

    this.isDeleting = true;
    this.deleteError = '';

    try {
      // Re-authenticate user
      if (this.isGoogleUser) {
        await this.authService.reauthenticateWithGoogle();
      } else {
        await this.authService.reauthenticate(this.deletePassword);
      }

      // Delete all user data from Firestore
      await this.deleteUserData(user.uid);

      // Delete Firebase Auth account
      await this.authService.deleteAccount();

      // Redirect to login
      this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Error deleting account:', error);
      this.deleteError = error || 'Failed to delete account. Please try again.';
      this.isDeleting = false;
    }
  }

  private async deleteUserData(uid: string) {
    try {
      // Delete user profile
      const profileRef = doc(this.firestore, 'userProfiles', uid);
      await deleteDoc(profileRef);

      // Delete all timesheet weeks
      const timesheetsQuery = query(
        collection(this.firestore, 'timesheets'),
        where('userId', '==', uid)
      );
      const timesheetDocs = await getDocs(timesheetsQuery);
      const timesheetDeletes = timesheetDocs.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(timesheetDeletes);

      // Delete all reports
      const reportsQuery = query(
        collection(this.firestore, 'reports'),
        where('userId', '==', uid)
      );
      const reportDocs = await getDocs(reportsQuery);
      const reportDeletes = reportDocs.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(reportDeletes);

      console.log('All user data deleted from Firestore');
    } catch (error) {
      console.error('Error deleting user data:', error);
      throw 'Failed to delete user data';
    }
  }

  async sendPasswordResetEmail() {
    const user = this.user();
    if (!user?.email) return;

    this.resetPasswordMessage.set('');
    this.resetPasswordMessageType.set('');

    try {
      await this.authService.resetPassword(user.email);
      this.resetPasswordMessage.set('Password reset email sent!');
      this.resetPasswordMessageType.set('success');
      this.showResetPasswordMessage.set(true);
      
      setTimeout(() => {
        this.showResetPasswordMessage.set(false);
      }, 5000);
      
      setTimeout(() => {
        this.resetPasswordMessage.set('');
        this.resetPasswordMessageType.set('');
      }, 5500);
    } catch (error) {
      console.error('Error sending password reset email:', error);
      this.resetPasswordMessage.set('Failed to send reset email.');
      this.resetPasswordMessageType.set('error');
      this.showResetPasswordMessage.set(true);
      
      setTimeout(() => {
        this.showResetPasswordMessage.set(false);
      }, 5000);
      
      setTimeout(() => {
        this.resetPasswordMessage.set('');
        this.resetPasswordMessageType.set('');
      }, 5500);
    }
  }

  async saveExternshipInfo() {
    const user = this.user();
    if (!user) return;

    this.isSaving.set(true);
    this.saveMessage.set('');
    this.saveMessageType.set('');
    this.showMessage.set(true);
    
    try {
      const docRef = doc(this.firestore, 'userProfiles', user.uid);
      const dataToSave = {
        ...this.externshipInfo(),
        userId: user.uid,
        email: user.email
      };
      await setDoc(docRef, dataToSave, { merge: true });
      console.log('Externship info saved successfully!');
      this.saveMessage.set('Information saved successfully!');
      this.saveMessageType.set('success');
      
      setTimeout(() => {
        this.showMessage.set(false);
      }, 5000);
      
      setTimeout(() => {
        this.saveMessage.set('');
        this.saveMessageType.set('');
      }, 5500);
    } catch (error) {
      console.error('Error saving externship info:', error);
      this.saveMessage.set('Error saving information. Please try again.');
      this.saveMessageType.set('error');
      
      setTimeout(() => {
        this.showMessage.set(false);
      }, 5000);
      
      setTimeout(() => {
        this.saveMessage.set('');
        this.saveMessageType.set('');
      }, 5500);
    } finally {
      this.isSaving.set(false);
    }
  }
}
