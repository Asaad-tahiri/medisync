import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { DoctorService } from '../../services/doctor';

@Component({
    selector: 'app-doctor-profile',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container">
            <div class="page-header">
                <h1>👤 Mon Profil Médecin</h1>
                <div class="header-actions">
                    <a routerLink="/dashboard" class="btn btn-secondary">🏠 Dashboard</a>
                    <a routerLink="/doctor" class="btn btn-secondary">🩺 Consultations</a>
                    <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
                </div>
            </div>

            <div *ngIf="message" class="alert" [class.alert-success]="isSuccess" [class.alert-error]="!isSuccess">
                {{ message }}
            </div>

            <div *ngIf="isLoading" class="card empty-state">Chargement...</div>

            <div *ngIf="!isLoading" class="card">
                <h2>Informations personnelles</h2>
                <form (ngSubmit)="saveProfile()">
                    <div class="form-row">
                        <div class="form-group">
                            <label>Prénom</label>
                            <input type="text" [(ngModel)]="profile.firstName" name="firstName" required>
                        </div>
                        <div class="form-group">
                            <label>Nom</label>
                            <input type="text" [(ngModel)]="profile.lastName" name="lastName" required>
                        </div>
                    </div>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Téléphone</label>
                            <input type="tel" [(ngModel)]="profile.phone" name="phone">
                        </div>
                        <div class="form-group">
                            <label>Email</label>
                            <input type="email" [value]="profile.email || ''" disabled>
                        </div>
                    </div>

                    <h2>Informations professionnelles</h2>
                    <div class="form-row">
                        <div class="form-group">
                            <label>Spécialité</label>
                            <input type="text" [(ngModel)]="profile.specialty" name="specialty"
                                   placeholder="Médecine générale">
                        </div>
                        <div class="form-group">
                            <label>Ville / Adresse</label>
                            <input type="text" [(ngModel)]="profile.city" name="city"
                                   placeholder="Casablanca">
                        </div>
                    </div>

                    <div class="form-group">
                        <label>Langues parlées</label>
                        <div class="tag-input">
                            <input type="text"
                                   [(ngModel)]="newLanguage"
                                   name="newLanguage"
                                   placeholder="Ex : Français"
                                   (keydown.enter)="$event.preventDefault(); addLanguage()">
                            <button type="button" class="btn-add" (click)="addLanguage()">+ Ajouter</button>
                        </div>
                        <div class="tag-list" *ngIf="languages.length > 0">
                            <span class="tag" *ngFor="let lang of languages; let i = index">
                                {{ lang }}
                                <button type="button" (click)="removeLanguage(i)" aria-label="Supprimer">×</button>
                            </span>
                        </div>
                        <p class="empty" *ngIf="languages.length === 0">Aucune langue renseignée.</p>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label>Tarif de consultation (DH)</label>
                            <input type="number" [(ngModel)]="profile.consultationFee" name="consultationFee" min="0"
                                   placeholder="Ex : 300">
                        </div>
                        <div class="form-group">
                            <label>Secteur</label>
                            <select [(ngModel)]="profile.sector" name="sector">
                                <option [ngValue]="null">-- Non précisé --</option>
                                <option [ngValue]="1">Secteur 1 — Conventionné</option>
                                <option [ngValue]="2">Secteur 2 — Dépassement d'honoraires</option>
                                <option [ngValue]="3">Secteur 3 — Non conventionné</option>
                            </select>
                        </div>
                    </div>

                    <button type="submit" class="btn btn-primary" [disabled]="isSaving">
                        {{ isSaving ? 'Sauvegarde...' : '💾 Sauvegarder' }}
                    </button>
                </form>
            </div>
        </div>
    `,
    styles: [`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem; }
        .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        h2 { margin-bottom: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--gray-200); }
        h2:first-of-type { padding-top: 0; border-top: none; }
        .empty-state { text-align: center; color: var(--gray-600); padding: 3rem; }
        .alert { padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
        .alert-success { background: #d1fae5; color: #065f46; }
        .alert-error { background: #fee2e2; color: #991b1b; }

        /* Tag input (langues) */
        .tag-input { display: flex; gap: 0.5rem; }
        .tag-input input { flex: 1; }
        .btn-add {
            padding: 0 1rem;
            background: #f0f3f7;
            border: 1px solid #d6dbe3;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            color: #334;
            transition: background 0.15s;
        }
        .btn-add:hover { background: #e3e8ef; }
        .tag-list {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;
            margin-top: 0.75rem;
        }
        .tag {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            background: #e3f2fd;
            color: #1565c0;
            padding: 0.35rem 0.75rem;
            border-radius: 20px;
            font-size: 0.875rem;
        }
        .tag button {
            background: none;
            border: none;
            color: #1565c0;
            cursor: pointer;
            font-size: 1.1rem;
            line-height: 1;
            padding: 0;
        }
        .tag button:hover { color: #c62828; }
        .empty {
            margin: 0.5rem 0 0;
            color: #888;
            font-style: italic;
            font-size: 0.875rem;
        }
    `]
})
export class DoctorProfileComponent implements OnInit {
    profile: any = {};
    languages: string[] = [];
    newLanguage = '';
    isLoading = true;
    isSaving = false;
    message = '';
    isSuccess = false;

    constructor(
        private authService: AuthService,
        private doctorService: DoctorService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            if (user && this.isLoading) {
                this.profile = { ...user };
                this.languages = Array.isArray(user.languages) ? [...user.languages] : [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    addLanguage() {
        const value = this.newLanguage.trim();
        if (value && !this.languages.includes(value)) {
            this.languages.push(value);
            this.newLanguage = '';
        }
    }

    removeLanguage(index: number) {
        this.languages.splice(index, 1);
    }

    saveProfile() {
        this.isSaving = true;
        this.message = '';
        this.cdr.detectChanges();

        this.doctorService.updateProfile({
            firstName: this.profile.firstName,
            lastName: this.profile.lastName,
            phone: this.profile.phone,
            specialty: this.profile.specialty,
            city: this.profile.city,
            languages: this.languages,
            consultationFee: this.profile.consultationFee,
            sector: this.profile.sector
        }).subscribe({
            next: (updated: any) => {
                this.profile = { ...this.profile, ...updated };
                this.languages = Array.isArray(updated.languages) ? [...updated.languages] : [];
                const stored = localStorage.getItem('user');
                if (stored) {
                    localStorage.setItem('user', JSON.stringify({ ...JSON.parse(stored), ...updated }));
                }
                this.isSaving = false;
                this.message = 'Profil mis à jour avec succès.';
                this.isSuccess = true;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.isSaving = false;
                this.message = err.error?.message || 'Erreur lors de la sauvegarde.';
                this.isSuccess = false;
                this.cdr.detectChanges();
            }
        });
    }

    logout() {
        this.authService.logout();
    }
}