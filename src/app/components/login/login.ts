import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Authentication } from '../../services/auth';

@Component({
  selector: 'app-login',
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login implements OnInit {
  private authService = inject(Authentication);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  email = '';
  password = '';
  errorMessage = '';
  successMessage = '';
  isSignUp = false;  // Toggle between sign in/sign up
  loading = false;
  returnUrl = '/';  // Default to home page

  ngOnInit() {
    // Get the return URL from query params or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  async onSubmit() {
    this.errorMessage = '';
    this.loading = true;

    try {
      if (this.isSignUp) {
        await this.authService.signUp(this.email, this.password);
      } else {
        await this.authService.signIn(this.email, this.password);
      }
      
      // Redirect to the return URL after successful login
      this.router.navigateByUrl(this.returnUrl);
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
      // Redirect to the return URL after successful login
      this.router.navigateByUrl(this.returnUrl);
    } catch (error: any) {
      this.errorMessage = error;
    } finally {
      this.loading = false;
    }
  }

  toggleMode() {
    this.isSignUp = !this.isSignUp;
    this.errorMessage = '';
    this.successMessage = '';
  }

  async onForgotPassword() {
    if (!this.email) {
      this.errorMessage = 'Please enter your email address.';
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.loading = true;

    try {
      await this.authService.resetPassword(this.email);
      this.successMessage = 'Password reset email sent! Check your inbox.';
    } catch (error: any) {
      this.errorMessage = error;
    } finally {
      this.loading = false;
    }
  }
}
