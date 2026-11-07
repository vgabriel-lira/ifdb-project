import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Database } from '../services/database';

export const authGuard: CanActivateFn = () => {
  const database = inject(Database);
  const router = inject(Router);

  if (database.isLoggedIn()) {
    return true;
  }

  return router.createUrlTree(['/login']);
};
