import { CanActivateFn, Router } from '@angular/router';
import { take, map } from 'rxjs';
import { inject } from '@angular/core';
import { Authentication } from '../services/auth';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Authentication)
  const router = inject(Router)

  return authService.user$.pipe(
    take(1), // Checks one time
    map(user => {
      if (user) {
        return true;  // User is logged in, allow access
      } else {
        router.navigate(['/login']);
        return false;  // Not logged in, block access
      }
    })
  );
};
