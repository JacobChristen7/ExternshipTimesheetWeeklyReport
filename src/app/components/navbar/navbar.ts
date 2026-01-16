import { Component, signal, inject } from '@angular/core';
import { RouterLink, Router } from '@angular/router'
import { CommonModule } from '@angular/common';
import { Authentication } from '../../services/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  authService = inject(Authentication);  // Make it public so template can access it
  private router = inject(Router);
  isDarkMode = signal(false);

  constructor() {
    // Load dark mode preference from localStorage on init
    const savedTheme = localStorage.getItem('darkMode');
    if (savedTheme === 'true') {
      this.isDarkMode.set(true);
      document.documentElement.classList.add('dark');
    }
  }

  toggleDarkMode() {
    this.isDarkMode.set(!this.isDarkMode());
    
    // Save preference to localStorage
    localStorage.setItem('darkMode', this.isDarkMode().toString());
    
    // Apply the theme
    if (this.isDarkMode()) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  async logout() {
    await this.authService.signOut();
    this.router.navigate(['/login']);
  }
}
