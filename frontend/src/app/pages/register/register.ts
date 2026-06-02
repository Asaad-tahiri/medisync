import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-register',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="login-container">
            <div class="login-card card">
                <div class="logo">🏥 MediSync</div>
                <h1>Créer mon compte patient</h1>
                <p class="subtitle">Inscrivez-vous pour prendre rendez-vous</p>

                <div *ngIf="errorMessage" class="alert alert-error">{{ errorMessage }}</div>
                <div *ngIf="successMessage" class="alert alert-success">{{ successMessage }}</div>

                <form (ngSubmit)="onSubmit()">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Prénom</label>
                            <input type="text" [(ngModel)]="user.firstName" name="firstName" required>
                        </div>
                        <div class="form-group">
                            <label>Nom</label>
                            <input type="text" [(ngModel)]="user.lastName" name="lastName" required>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Email</label>
                        <input type="email" [(ngModel)]="user.email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Téléphone</label>
                        <input type="tel" [(ngModel)]="user.phone" name="phone"
                               placeholder="+212 6 12 34 56 78">
                    </div>
                    <div class="form-group">
                        <label>Mot de passe</label>
                        <input type="password" [(ngModel)]="user.password" name="password" required>
                        <small>8 caractères min, 1 majuscule, 1 chiffre, 1 caractère spécial</small>
                    </div>
                    <button type="submit" class="btn btn-primary btn-full">S'inscrire</button>
                </form>

                <p class="register-link">
                    Déjà un compte ? <a routerLink="/login">Se connecter</a>
                </p>
                <p class="staff-hint">
                    Vous êtes médecin ou secrétaire ? Votre compte est créé par l'administrateur du cabinet.
                </p>
            </div>
        </div>
    `,
    styles: [`
        .login-container {
            min-height: 100vh;
            display: flex; align-items: center; justify-content: center;
            background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%);
            padding: 1rem;
        }
        .login-card { max-width: 500px; width: 100%; }
        .logo { font-size: 2.5rem; font-weight: bold; color: var(--primary); text-align: center; }
        h1 { text-align: center; margin-bottom: 0.25rem; }
        .subtitle { text-align: center; color: var(--gray-600); margin-bottom: 1.5rem; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .btn-full { width: 100%; }
        .register-link { text-align: center; margin-top: 1rem; }
        .staff-hint {
            text-align: center;
            margin-top: 1rem;
            padding: 0.75rem;
            background: #f5f6f8;
            border-radius: 6px;
            font-size: 0.85rem;
            color: var(--gray-600);
        }
        small { color: var(--gray-600); display: block; margin-top: 0.25rem; }
        @media (max-width: 500px) { .form-row { grid-template-columns: 1fr; } }
    `]
})
export class RegisterComponent {
    user = { firstName: '', lastName: '', email: '', password: '', phone: '', role: 'patient' };
    errorMessage = '';
    successMessage = '';

    constructor(private authService: AuthService, private router: Router) {}

    onSubmit() {
        this.errorMessage = '';
        this.successMessage = '';

        // On force toujours le rôle "patient" — la création médecin/secrétaire passe par l'admin
        this.user.role = 'patient';

        this.authService.register(this.user).subscribe({
            next: () => {
                this.successMessage = '✅ Compte créé ! Redirection...';
                setTimeout(() => this.router.navigate(['/login']), 1500);
            },
            error: (err) => {
                this.errorMessage = err.error?.message || "Erreur lors de l'inscription";
            }
        });
    }
}