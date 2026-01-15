import { Injectable, inject, signal } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, User } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class Authentication {
  private auth = inject(Auth);  // Inject Firebase Auth
  
  // Observable of current user
  user$ = user(this.auth);
  
  // Signal for current user (easier to use in components)
  currentUser = signal<User | null>(null);

  constructor() {
    // Update signal when user changes
    this.user$.subscribe(user => {
      this.currentUser.set(user);
    });
  }

  // Sign up with email and password
async signUp(email: string, password: string) {
  try {
    const credential = await createUserWithEmailAndPassword(this.auth, email, password);
    return credential.user;
  } catch (error: any) {
    throw this.handleError(error);
  }
}

  // Sign in with email and password
  async signIn(email: string, password: string) {
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      return credential.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Google sign in
  async signInWithGoogle() {
    try {
      const provider = new GoogleAuthProvider();
      const credential = await signInWithPopup(this.auth, provider);
      return credential.user;
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Sign out
  async signOut() {
    try {
      await signOut(this.auth);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Get current user ID
  getCurrentUserId(): string | null {
    return this.currentUser()?.uid || null;
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return this.currentUser() !== null;
  }

  // Error handling
  private handleError(error: any): string {
    switch (error.code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered.';
      case 'auth/invalid-email':
        return 'Invalid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      default:
        return error.message || 'An error occurred.';
    }
  }
}
