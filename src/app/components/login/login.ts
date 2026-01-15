import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Authentication } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  private authService = inject(Authentication);
  private router = inject(Router);

  email = '';
  password = '';
  errorMessage = '';
  isSignUp = false;  // Toggle between sign in/sign up
  loading = false;

  async onSubmit() {
    this.errorMessage = '';
    this.loading = true;

    try {
      if (this.isSignUp) {
        await this.authService.signUp(this.email, this.password);
      } else {
        await this.authService.signIn(this.email, this.password);
      }
      
      // Redirect to home page after successful login
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMessage = error;
    } finally {
      this.loading = false;
    }
  }

  async signInWithGoogle() {
    this.errorMessage = '';
    this.loading = true;

    try {
      await this.authService.signInWithGoogle();
      this.router.navigate(['/']);
    } catch (error: any) {
      this.errorMessage = error;
    } finally {
      this.loading = false;
    }
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.errorMessage = '';
  }
}
