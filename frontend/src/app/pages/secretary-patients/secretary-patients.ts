import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { SecretaryService } from '../../services/secretary';

@Component({
    selector: 'app-secretary-patients',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <nav class="navbar">
            <a routerLink="/dashboard" class="logo">🏥 MediSync</a>
            <div class="nav-actions">
                <a routerLink="/secretary/appointments" class="nav-link">📅 Rendez-vous</a>
                <a routerLink="/dashboard" class="nav-link">🏠 Dashboard</a>
                <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
            </div>
        </nav>

        <div class="container">
            <div class="page-header">
                <div>
                    <h1>👥 Patients du cabinet</h1>
                    <p class="subtitle" *ngIf="!isLoading">
                        {{ filteredPatients.length }} patient(s) {{ searchTerm ? 'trouvé(s)' : 'au total' }}
                    </p>
                </div>
                <div class="header-actions">
                    <input type="text"
                           class="search-input"
                           [(ngModel)]="searchTerm"
                           (ngModelChange)="filter()"
                           placeholder="🔍 Rechercher (nom, email, téléphone)">
                    <button class="btn btn-primary" (click)="openCreateModal()">+ Nouveau patient</button>
                </div>
            </div>

            <!-- Liste -->
            <div *ngIf="isLoading" class="card empty-state">Chargement...</div>

            <div *ngIf="!isLoading && filteredPatients.length === 0" class="card empty-state">
                <p *ngIf="allPatients.length === 0">Aucun patient enregistré. Créez le premier !</p>
                <p *ngIf="allPatients.length > 0">Aucun résultat pour "{{ searchTerm }}".</p>
            </div>

            <div *ngIf="!isLoading && filteredPatients.length > 0" class="patients-table card">
                <table>
                    <thead>
                        <tr>
                            <th>Patient</th>
                            <th>Email</th>
                            <th>Téléphone</th>
                            <th>Date de naissance</th>
                            <th>Inscrit le</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let p of filteredPatients">
                            <td>
                                <div class="patient-cell">
                                    <div class="avatar">{{ p.firstName?.charAt(0) }}{{ p.lastName?.charAt(0) }}</div>
                                    <strong>{{ p.firstName }} {{ p.lastName }}</strong>
                                </div>
                            </td>
                            <td>{{ p.email }}</td>
                            <td>{{ p.phone || '—' }}</td>
                            <td>{{ p.dateOfBirth ? (p.dateOfBirth | date:'dd/MM/yyyy') : '—' }}</td>
                            <td>{{ p.createdAt | date:'dd/MM/yyyy' }}</td>
                            <td>
                                <a [routerLink]="['/patient', p._id]" class="btn-mini">📋 Dossier</a>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Modal création -->
            <div *ngIf="showCreateModal" class="modal-overlay" (click)="closeCreateModal()">
                <div class="modal" (click)="$event.stopPropagation()">
                    <div class="modal-header">
                        <h2>➕ Créer un patient</h2>
                        <button class="btn-close" (click)="closeCreateModal()">×</button>
                    </div>

                    <!-- Étape 1 : formulaire -->
                    <form *ngIf="!createdPatient" (ngSubmit)="createPatient()" class="modal-body">
                        <div *ngIf="createError" class="alert alert-error">{{ createError }}</div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Prénom *</label>
                                <input type="text" [(ngModel)]="newPatient.firstName" name="firstName" required>
                            </div>
                            <div class="form-group">
                                <label>Nom *</label>
                                <input type="text" [(ngModel)]="newPatient.lastName" name="lastName" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" [(ngModel)]="newPatient.email" name="email" required>
                            <small class="hint">Le patient utilisera cet email pour se connecter.</small>
                        </div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Téléphone</label>
                                <input type="tel" [(ngModel)]="newPatient.phone" name="phone">
                            </div>
                            <div class="form-group">
                                <label>Date de naissance</label>
                                <input type="date" [(ngModel)]="newPatient.dateOfBirth" name="dateOfBirth">
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Numéro de sécurité sociale</label>
                            <input type="text" [(ngModel)]="newPatient.socialSecurityNumber" name="ssn">
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" (click)="closeCreateModal()">Annuler</button>
                            <button type="submit" class="btn btn-primary" [disabled]="isCreating">
                                {{ isCreating ? 'Création...' : '✓ Créer le compte' }}
                            </button>
                        </div>
                    </form>

                    <!-- Étape 2 : succès + mot de passe -->
                    <div *ngIf="createdPatient" class="modal-body">
                        <div class="success-block">
                            <div class="success-icon">✅</div>
                            <h3>Patient créé avec succès !</h3>
                            <p>Communiquez ces identifiants au patient :</p>
                        </div>

                        <div class="credentials">
                            <div class="cred-row">
                                <span class="cred-label">Email :</span>
                                <span class="cred-value">{{ createdPatient.patient.email }}</span>
                            </div>
                            <div class="cred-row">
                                <span class="cred-label">Mot de passe temporaire :</span>
                                <div class="password-box">
                                    <code>{{ createdPatient.tempPassword }}</code>
                                    <button type="button" class="btn-copy" (click)="copyPassword()">
                                        {{ copied ? '✓ Copié !' : '📋 Copier' }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div class="warning-box">
                            ⚠️ Ce mot de passe ne sera plus affiché. Notez-le ou copiez-le maintenant.
                            Le patient pourra le changer après sa première connexion.
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-primary" (click)="closeCreateModal()">
                                Terminé
                            </button>
                        </div>
                        <!-- Allergies -->
                        <div class="form-group">
                            <label>Allergies</label>
                            <div class="tag-input">
                                <input type="text"
                                    [(ngModel)]="newAllergy"
                                    name="newAllergy"
                                    placeholder="Ex : Pénicilline"
                                    (keydown.enter)="$event.preventDefault(); addAllergy()">
                                <button type="button" class="btn-add" (click)="addAllergy()">+ Ajouter</button>
                            </div>
                            <div class="tag-list" *ngIf="newPatient.allergies.length > 0">
                                <span class="tag tag-danger" *ngFor="let a of newPatient.allergies; let i = index">
                                    {{ a }}
                                    <button type="button" (click)="removeAllergy(i)" aria-label="Supprimer">×</button>
                                </span>
                            </div>
                        </div>

                        <!-- Antécédents -->
                        <div class="form-group">
                            <label>Antécédents médicaux</label>
                            <div class="tag-input">
                                <input type="text"
                                    [(ngModel)]="newAntecedent"
                                    name="newAntecedent"
                                    placeholder="Ex : Diabète type 2"
                                    (keydown.enter)="$event.preventDefault(); addAntecedent()">
                                <button type="button" class="btn-add" (click)="addAntecedent()">+ Ajouter</button>
                            </div>
                            <div class="tag-list" *ngIf="newPatient.antecedents.length > 0">
                                <span class="tag" *ngFor="let a of newPatient.antecedents; let i = index">
                                    {{ a }}
                                    <button type="button" (click)="removeAntecedent(i)" aria-label="Supprimer">×</button>
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .navbar {
            background: white; padding: 1rem 2rem;
            display: flex; justify-content: space-between; align-items: center;
            box-shadow: var(--shadow);
        }
        .logo { font-size: 1.5rem; font-weight: bold; color: var(--primary); text-decoration: none; }
        .nav-actions { display: flex; gap: 0.75rem; align-items: center; }
        .nav-link {
            color: var(--primary); text-decoration: none;
            padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.9rem;
        }
        .nav-link:hover { background: #f5f6f8; }

        .page-header {
            display: flex; justify-content: space-between; align-items: center;
            margin: 1.5rem 0; flex-wrap: wrap; gap: 1rem;
        }
        .subtitle { color: var(--gray-600); margin: 0.25rem 0 0; }
        .header-actions { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
        .search-input {
            padding: 0.6rem 1rem;
            border: 1px solid #d6dbe3;
            border-radius: 8px;
            font-size: 0.95rem;
            min-width: 280px;
        }
        .search-input:focus { outline: none; border-color: var(--primary); }

        .empty-state { text-align: center; padding: 3rem 1rem; color: var(--gray-600); }

        /* Table */
        .patients-table { padding: 0; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        thead { background: #f5f6f8; }
        th, td {
            padding: 0.85rem 1rem;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 0.9rem;
        }
        th { font-weight: 600; color: #555; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        tbody tr:hover { background: #fafbfc; }

        .patient-cell { display: flex; align-items: center; gap: 0.75rem; }
        .avatar {
            width: 36px; height: 36px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2196f3, #1565c0);
            color: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 0.85rem;
            flex-shrink: 0;
        }

        .btn-mini {
            padding: 0.4rem 0.75rem;
            background: white;
            color: var(--primary);
            border: 1px solid var(--primary);
            border-radius: 6px;
            text-decoration: none;
            font-size: 0.8rem;
        }
        .btn-mini:hover { background: #f0f7ff; }

        /* Modal */
        .modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex; align-items: center; justify-content: center;
            z-index: 1000;
            padding: 1rem;
        }
        .modal {
            background: white;
            border-radius: 12px;
            width: 100%;
            max-width: 550px;
            max-height: 90vh;
            overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #eee;
        }
        .modal-header h2 { margin: 0; font-size: 1.2rem; }
        .btn-close {
            background: none; border: none;
            font-size: 1.8rem;
            color: #888;
            cursor: pointer;
            line-height: 1;
        }
        .modal-body { padding: 1.5rem; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label {
            display: block; font-weight: 600;
            color: #334; font-size: 0.9rem; margin-bottom: 0.35rem;
        }
        .form-group input {
            width: 100%; box-sizing: border-box;
            padding: 0.6rem 0.85rem;
            border: 1px solid #d6dbe3;
            border-radius: 6px; font-size: 0.95rem;
        }
        .form-group input:focus { outline: none; border-color: var(--primary); }
        .hint { display: block; margin-top: 0.3rem; color: #888; font-size: 0.8rem; }

        .alert-error {
            background: #ffebee; color: #c62828;
            padding: 0.75rem 1rem; border-radius: 6px;
            border-left: 4px solid #f44336;
            margin-bottom: 1rem;
        }

        .modal-actions {
            display: flex; justify-content: flex-end; gap: 0.75rem;
            margin-top: 1.5rem;
        }
        .btn {
            padding: 0.7rem 1.25rem; border-radius: 6px;
            font-size: 0.95rem; font-weight: 600;
            cursor: pointer; border: none;
        }
        .btn:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary { background: white; color: #555; border: 1px solid #d6dbe3; }
        .btn-secondary:hover:not(:disabled) { background: #f5f6f8; }
        .btn-primary { background: var(--primary); color: white; }

        /* Étape succès */
        .success-block { text-align: center; margin-bottom: 1.5rem; }
        .success-icon { font-size: 3rem; margin-bottom: 0.5rem; }
        .success-block h3 { margin: 0 0 0.5rem; color: #2e7d32; }
        .success-block p { color: #666; margin: 0; }

        .credentials {
            background: #f5f6f8;
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
        }
        .cred-row { margin-bottom: 0.75rem; }
        .cred-row:last-child { margin-bottom: 0; }
        .cred-label {
            display: block;
            font-size: 0.8rem;
            color: #666;
            font-weight: 600;
            margin-bottom: 0.25rem;
        }
        .cred-value {
            font-family: monospace;
            font-size: 1rem;
            color: #1a2540;
        }

        .password-box {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: white;
            padding: 0.5rem 0.75rem;
            border: 1px solid #d6dbe3;
            border-radius: 6px;
        }
        .password-box code {
            font-size: 1.1rem;
            font-weight: bold;
            color: var(--primary);
            flex: 1;
            user-select: all;
        }
        .btn-copy {
            background: var(--primary);
            color: white;
            border: none;
            padding: 0.4rem 0.75rem;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.8rem;
        }

        .warning-box {
            background: #fff3e0;
            color: #e65100;
            padding: 0.85rem 1rem;
            border-radius: 6px;
            border-left: 4px solid #ff9800;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .form-row { grid-template-columns: 1fr; }
            .search-input { min-width: 200px; }
        }
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
        }
        .btn-add:hover { background: #e3e8ef; }
        .tag-list {
            display: flex; flex-wrap: wrap; gap: 0.5rem;
            margin-top: 0.6rem;
        }
        .tag {
            display: inline-flex; align-items: center; gap: 0.4rem;
            background: #e3f2fd; color: #1565c0;
            padding: 0.3rem 0.7rem; border-radius: 20px;
            font-size: 0.85rem;
        }
        .tag-danger { background: #ffebee; color: #c62828; }
        .tag button {
            background: none; border: none;
            cursor: pointer; font-size: 1.1rem;
            line-height: 1; padding: 0;
            color: inherit;
        }
        .tag-danger button:hover { color: #b71c1c; }
    `]
})
export class SecretaryPatientsComponent implements OnInit {
    allPatients: any[] = [];
    filteredPatients: any[] = [];
    searchTerm = '';
    isLoading = true;

    // Modal
    showCreateModal = false;
    newPatient: any = this.emptyPatient();
    isCreating = false;
    createError = '';
    createdPatient: any = null;
    copied = false;

    // Inputs pour les tags
    newAllergy = '';
    newAntecedent = '';

    constructor(
        private secretaryService: SecretaryService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loadPatients();
    }

    loadPatients() {
        this.isLoading = true;
        this.secretaryService.getAllPatients().subscribe({
            next: (patients) => {
                this.allPatients = patients || [];
                this.filter();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.allPatients = [];
                this.filteredPatients = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    filter() {
        const term = this.searchTerm.trim().toLowerCase();
        if (!term) {
            this.filteredPatients = [...this.allPatients];
            return;
        }
        this.filteredPatients = this.allPatients.filter(p => {
            const haystack = `${p.firstName} ${p.lastName} ${p.email} ${p.phone || ''}`.toLowerCase();
            return haystack.includes(term);
        });
    }

    openCreateModal() {
        this.newPatient = this.emptyPatient();
        this.createdPatient = null;
        this.createError = '';
        this.copied = false;
        this.newAllergy = '';
        this.newAntecedent = '';
        this.showCreateModal = true;
    }

    closeCreateModal() {
        this.showCreateModal = false;
        if (this.createdPatient) {
            // Si on ferme après création réussie, on recharge la liste
            this.loadPatients();
        }
        this.createdPatient = null;
    }

    createPatient() {
        this.isCreating = true;
        this.createError = '';
        this.cdr.detectChanges();

        this.secretaryService.createPatient(this.newPatient).subscribe({
            next: (response) => {
                this.createdPatient = response;
                this.isCreating = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isCreating = false;
                this.createError = err.error?.message || 'Erreur lors de la création.';
                this.cdr.detectChanges();
            }
        });
    }

    copyPassword() {
        if (!this.createdPatient?.tempPassword) return;
        navigator.clipboard.writeText(this.createdPatient.tempPassword).then(() => {
            this.copied = true;
            this.cdr.detectChanges();
            setTimeout(() => {
                this.copied = false;
                this.cdr.detectChanges();
            }, 2000);
        });
    }

    addAllergy() {
        const v = this.newAllergy.trim();
        if (v && !this.newPatient.allergies.includes(v)) {
            this.newPatient.allergies.push(v);
            this.newAllergy = '';
        }
    }

    removeAllergy(index: number) {
        this.newPatient.allergies.splice(index, 1);
    }

    addAntecedent() {
        const v = this.newAntecedent.trim();
        if (v && !this.newPatient.antecedents.includes(v)) {
            this.newPatient.antecedents.push(v);
            this.newAntecedent = '';
        }
    }

    removeAntecedent(index: number) {
        this.newPatient.antecedents.splice(index, 1);
    }

    private emptyPatient() {
    return {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        socialSecurityNumber: '',
        allergies: [] as string[],
        antecedents: [] as string[]
    };
    }

    logout() {
        this.authService.logout();
    }
}