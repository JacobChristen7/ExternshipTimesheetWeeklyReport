import { Component, inject, OnInit, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Authentication } from '../../services/auth';
import { Router } from '@angular/router';
import { Firestore, doc, setDoc, getDoc } from '@angular/fire/firestore';

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
