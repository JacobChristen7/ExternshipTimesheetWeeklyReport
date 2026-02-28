import { Injectable, inject, signal } from '@angular/core';
import { Auth, user, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, sendPasswordResetEmail, deleteUser, EmailAuthProvider, reauthenticateWithCredential, reauthenticateWithPopup, User } from '@angular/fire/auth';

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

  // Send password reset email
  async resetPassword(email: string) {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Re-authenticate user with password (required before deletion)
  async reauthenticate(password: string) {
    try {
      const user = this.currentUser();
      if (!user || !user.email) {
        throw new Error('No user logged in');
      }
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Re-authenticate user with Google (required before deletion)
  async reauthenticateWithGoogle() {
    try {
      const user = this.currentUser();
      if (!user) {
        throw new Error('No user logged in');
      }
      const provider = new GoogleAuthProvider();
      await reauthenticateWithPopup(user, provider);
    } catch (error: any) {
      throw this.handleError(error);
    }
  }

  // Check if user signed in with Google
  isGoogleUser(): boolean {
    const user = this.currentUser();
    if (!user) return false;
    return user.providerData.some(provider => provider.providerId === 'google.com');
  }

  // Delete user account
  async deleteAccount() {
    try {
      const user = this.currentUser();
      if (!user) {
        throw new Error('No user logged in');
      }
      await deleteUser(user);
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
      case 'auth/too-many-requests':
        return 'Too many attempts. Please try again later.';
      case 'auth/requires-recent-login':
        return 'Please sign in again before deleting your account.';
      case 'auth/popup-closed-by-user':
        return 'Sign-in popup was closed. Please try again.';
      case 'auth/popup-blocked':
        return 'Popup was blocked by your browser. Please allow popups and try again.';
      case 'auth/cancelled-popup-request':
        return 'Sign-in was cancelled.';
      default:
        return error.message || 'An error occurred.';
    }
  }
}
