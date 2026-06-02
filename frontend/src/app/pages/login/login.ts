import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="login-container">
            <div class="login-card card">
                <div class="logo">🏥 MediSync</div>
                <h1>Connexion</h1>
                <p class="subtitle">Accédez à votre espace médical</p>

                <div *ngIf="errorMessage" class="alert alert-error">{{ errorMessage }}</div>

                <form (ngSubmit)="onSubmit()">
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" [(ngModel)]="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Mot de passe</label>
                        <input type="password" [(ngModel)]="password" name="password" required>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full" [disabled]="isLoading">
                        {{ isLoading ? 'Connexion...' : 'Se connecter' }}
                    </button>
                </form>

                <p class="register-link">
                    Pas encore de compte ? <a routerLink="/register">S'inscrire</a>
                </p>
            </div>
        </div>
    `,
    styles: [`
        .login-container {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            padding: 1rem;
        }
        .login-card { max-width: 420px; width: 100%; text-align: center; }
        .logo { font-size: 2.5rem; font-weight: bold; color: var(--primary); margin-bottom: 1rem; }
        h1 { margin-bottom: 0.5rem; }
        .subtitle { color: var(--gray-600); margin-bottom: 2rem; }
        .btn-full { width: 100%; }
        .register-link { margin-top: 1.5rem; color: var(--gray-600); }
        .register-link a { color: var(--primary); font-weight: 500; text-decoration: none; }
    `]
})
export class LoginComponent {
    email = '';
    password = '';
    errorMessage = '';
    isLoading = false;

    constructor(private authService: AuthService, private router: Router) {}

    onSubmit() {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.email, this.password).subscribe({
        next: () => {
            this.isLoading = false;
            // Tout le monde passe par le dashboard (qui adapte ses cartes selon le rôle)
            this.router.navigate(['/dashboard']);
        },
        error: (err) => {
            this.isLoading = false;
            this.errorMessage = err.error?.message || 'Erreur de connexion';
        }
    });
}
}