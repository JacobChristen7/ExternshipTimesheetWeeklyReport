import { Component, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Authentication } from '../../services/auth';
import { Router } from '@angular/router';

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
  
  user = signal<any>(null);
  isLoading = signal(true);
  externshipInfo = signal<ExternshipInfo>({
    companyName: '',
    managerName: '',
  });

  async ngOnInit() {
    this.authService.user$.subscribe((user) => {
      if (user) {
        this.user.set(user);
        this.isLoading.set(false);
      } else {
        this.router.navigate(['/login']);
      }
    });
  }

  saveExternshipInfo() {
    console.log('Saving externship info:', this.externshipInfo());
  }
}
