import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard to protect routes based on user role.
 * Routes must declare `data: { roles: string[] }` to use this guard.
 */
export const roleGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const allowedRoles: string[] = route.data?.['roles'] ?? [];
  const userRole = authService.role();

  // If no roles are defined on the route, allow access
  if (allowedRoles.length === 0) return true;

  if (userRole && allowedRoles.includes(userRole)) {
    return true;
  }

  // Not authorized - redirect to dashboard (they can see what's allowed there)
  router.navigate(['/dashboard']);
  return false;
};
