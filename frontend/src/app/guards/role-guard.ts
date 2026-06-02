import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth';

export const roleGuard = (allowedRoles: string[]): CanActivateFn => {
    return () => {
        const authService = inject(AuthService);
        const router = inject(Router);

        const userRole = authService.getUserRole();

        if (userRole && allowedRoles.includes(userRole)) {
            return true;
        }

        alert('Accès interdit : vous n\'avez pas les permissions nécessaires.');
        router.navigate(['/dashboard']);
        return false;
    };
};