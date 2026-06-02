import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AdminService } from '../../services/admin';

@Component({
    selector: 'app-admin-staff',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <nav class="navbar">
            <a routerLink="/dashboard" class="logo">🏥 MediSync</a>
            <div class="nav-actions">
                <a routerLink="/admin" class="nav-link">📊 Stats</a>
                <a routerLink="/secretary/appointments" class="nav-link">📅 RDV</a>
                <a routerLink="/secretary/invoices" class="nav-link">💶 Factures</a>
                <a routerLink="/dashboard" class="nav-link">🏠 Dashboard</a>
                <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
            </div>
        </nav>

        <div class="container">
            <h1>👨‍⚕️ Gestion du Personnel</h1>

            <!-- Tabs -->
            <div class="tabs">
                <button class="tab" [class.active]="activeTab === 'doctors'" (click)="activeTab = 'doctors'">
                    🩺 Médecins ({{ doctors.length }})
                </button>
                <button class="tab" [class.active]="activeTab === 'secretaries'" (click)="activeTab = 'secretaries'">
                    📋 Secrétaires ({{ secretaries.length }})
                </button>
            </div>

            <!-- Loading -->
            <div *ngIf="isLoading" class="card empty-state">Chargement...</div>

            <!-- TAB MÉDECINS -->
            <div *ngIf="!isLoading && activeTab === 'doctors'">
                <div class="page-header">
                    <h2>Médecins</h2>
                    <button class="btn btn-primary" (click)="openCreateModal('doctor')">+ Nouveau médecin</button>
                </div>

                <div *ngIf="doctors.length === 0" class="card empty-state">
                    <p>Aucun médecin enregistré.</p>
                </div>

                <div *ngIf="doctors.length > 0" class="staff-table card">
                    <table>
                        <thead>
                            <tr>
                                <th>Médecin</th>
                                <th>Email</th>
                                <th>Spécialité</th>
                                <th>Ville</th>
                                <th>Tarif</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let d of doctors">
                                <td>
                                    <div class="person-cell">
                                        <div class="avatar">{{ initials(d) }}</div>
                                        <div>
                                            <strong>Dr. {{ d.firstName }} {{ d.lastName }}</strong>
                                            <small *ngIf="d.phone">📞 {{ d.phone }}</small>
                                        </div>
                                    </div>
                                </td>
                                <td>{{ d.email }}</td>
                                <td>{{ d.specialty || '—' }}</td>
                                <td>{{ d.city || '—' }}</td>
                                <td>{{ d.consultationFee ? d.consultationFee + ' DH' : '—' }}</td>
                                <td>
                                    <div class="actions">
                                        <button class="btn-mini" (click)="openEditModal(d, 'doctor')" title="Modifier">
                                            ✏️
                                        </button>
                                        <button class="btn-mini btn-danger-mini" (click)="deleteStaff(d, 'doctor')"
                                                [disabled]="deletingId === d._id" title="Supprimer">
                                            🗑
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- TAB SECRÉTAIRES -->
            <div *ngIf="!isLoading && activeTab === 'secretaries'">
                <div class="page-header">
                    <h2>Secrétaires</h2>
                    <button class="btn btn-primary" (click)="openCreateModal('secretary')">+ Nouveau secrétaire</button>
                </div>

                <div *ngIf="secretaries.length === 0" class="card empty-state">
                    <p>Aucun secrétaire enregistré.</p>
                </div>

                <div *ngIf="secretaries.length > 0" class="staff-table card">
                    <table>
                        <thead>
                            <tr>
                                <th>Secrétaire</th>
                                <th>Email</th>
                                <th>Téléphone</th>
                                <th>Inscrit le</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr *ngFor="let s of secretaries">
                                <td>
                                    <div class="person-cell">
                                        <div class="avatar">{{ initials(s) }}</div>
                                        <strong>{{ s.firstName }} {{ s.lastName }}</strong>
                                    </div>
                                </td>
                                <td>{{ s.email }}</td>
                                <td>{{ s.phone || '—' }}</td>
                                <td>{{ s.createdAt | date:'dd/MM/yyyy' }}</td>
                                <td>
                                    <div class="actions">
                                        <button class="btn-mini" (click)="openEditModal(s, 'secretary')" title="Modifier">
                                            ✏️
                                        </button>
                                        <button class="btn-mini btn-danger-mini" (click)="deleteStaff(s, 'secretary')"
                                                [disabled]="deletingId === s._id" title="Supprimer">
                                            🗑
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- MODAL : créer / modifier -->
            <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
                <div class="modal" (click)="$event.stopPropagation()">
                    <div class="modal-header">
                        <h2>
                            {{ editingStaff ? '✏️ Modifier' : '➕ Créer' }}
                            {{ modalRole === 'doctor' ? 'un médecin' : 'un secrétaire' }}
                        </h2>
                        <button class="btn-close" (click)="closeModal()">×</button>
                    </div>

                    <!-- Étape 1 : formulaire -->
                    <form *ngIf="!createdCredentials" (ngSubmit)="saveStaff()" class="modal-body">
                        <div *ngIf="modalError" class="alert alert-error">{{ modalError }}</div>

                        <div class="form-row">
                            <div class="form-group">
                                <label>Prénom *</label>
                                <input type="text" [(ngModel)]="form.firstName" name="firstName" required>
                            </div>
                            <div class="form-group">
                                <label>Nom *</label>
                                <input type="text" [(ngModel)]="form.lastName" name="lastName" required>
                            </div>
                        </div>

                        <div class="form-group">
                            <label>Email *</label>
                            <input type="email" [(ngModel)]="form.email" name="email" required
                                   [readonly]="!!editingStaff">
                            <small *ngIf="editingStaff" class="hint">L'email ne peut pas être modifié.</small>
                        </div>

                        <div class="form-group" *ngIf="!editingStaff">
                            <label>Mot de passe *</label>
                            <input type="text" [(ngModel)]="form.password" name="password" required>
                            <small class="hint">8 caractères min, 1 majuscule, 1 chiffre, 1 caractère spécial.</small>
                        </div>

                        <div class="form-group">
                            <label>Téléphone</label>
                            <input type="tel" [(ngModel)]="form.phone" name="phone">
                        </div>

                        <!-- Champs spécifiques médecin -->
                        <ng-container *ngIf="modalRole === 'doctor'">
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Spécialité</label>
                                    <input type="text" [(ngModel)]="form.specialty" name="specialty"
                                           placeholder="Ex : Cardiologie">
                                </div>
                                <div class="form-group">
                                    <label>Ville</label>
                                    <input type="text" [(ngModel)]="form.city" name="city"
                                           placeholder="Ex : Casablanca">
                                </div>
                            </div>
                            <div class="form-row">
                                <div class="form-group">
                                    <label>Tarif (DH)</label>
                                    <input type="number" [(ngModel)]="form.consultationFee" name="fee" min="0">
                                </div>
                                <div class="form-group">
                                    <label>Secteur</label>
                                    <select [(ngModel)]="form.sector" name="sector">
                                        <option [ngValue]="null">-- Non précisé --</option>
                                        <option [ngValue]="1">Secteur 1</option>
                                        <option [ngValue]="2">Secteur 2</option>
                                        <option [ngValue]="3">Secteur 3</option>
                                    </select>
                                </div>
                            </div>
                            <div class="form-group">
                                <label>Langues parlées (séparées par virgule)</label>
                                <input type="text" [(ngModel)]="languagesInput" name="languages"
                                       placeholder="Français, Arabe, Anglais">
                            </div>
                        </ng-container>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" (click)="closeModal()" [disabled]="isSaving">
                                Annuler
                            </button>
                            <button type="submit" class="btn btn-primary" [disabled]="isSaving">
                                {{ isSaving ? 'Enregistrement...' : (editingStaff ? '✓ Mettre à jour' : '✓ Créer le compte') }}
                            </button>
                        </div>
                    </form>

                    <!-- Étape 2 : succès (création seulement) -->
                    <div *ngIf="createdCredentials" class="modal-body">
                        <div class="success-block">
                            <div class="success-icon">✅</div>
                            <h3>Compte créé avec succès !</h3>
                            <p>Communiquez ces identifiants à la personne concernée :</p>
                        </div>

                        <div class="credentials">
                            <div class="cred-row">
                                <span class="cred-label">Email :</span>
                                <span class="cred-value">{{ createdCredentials.email }}</span>
                            </div>
                            <div class="cred-row">
                                <span class="cred-label">Mot de passe :</span>
                                <div class="password-box">
                                    <code>{{ createdCredentials.password }}</code>
                                </div>
                            </div>
                        </div>

                        <div class="warning-box">
                            ⚠️ Notez ce mot de passe. Il devra être changé après la 1ère connexion.
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-primary" (click)="closeModal()">Terminé</button>
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
        .nav-actions { display: flex; gap: 0.6rem; align-items: center; flex-wrap: wrap; }
        .nav-link {
            color: var(--primary); text-decoration: none;
            padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.9rem;
        }
        .nav-link:hover { background: #f5f6f8; }

        h1 { margin: 1.5rem 0; }

        .tabs {
            display: flex; gap: 0;
            border-bottom: 2px solid #e3e8ef;
            margin-bottom: 1.5rem;
        }
        .tab {
            background: none; border: none;
            padding: 0.85rem 1.5rem;
            cursor: pointer;
            font-size: 0.95rem;
            color: #666;
            border-bottom: 3px solid transparent;
            margin-bottom: -2px;
            transition: all 0.15s;
        }
        .tab:hover { color: var(--primary); }
        .tab.active {
            color: var(--primary);
            border-bottom-color: var(--primary);
            font-weight: 600;
        }

        .page-header {
            display: flex; justify-content: space-between; align-items: center;
            margin-bottom: 1rem;
        }
        .page-header h2 { margin: 0; }

        .empty-state { text-align: center; padding: 3rem 1rem; color: var(--gray-600); }
        .staff-table { padding: 0; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        thead { background: #f5f6f8; }
        th, td {
            padding: 0.85rem 1rem;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 0.9rem;
            vertical-align: middle;
        }
        th { font-weight: 600; color: #555; text-transform: uppercase; font-size: 0.75rem; }
        tbody tr:hover { background: #fafbfc; }

        .person-cell { display: flex; align-items: center; gap: 0.6rem; }
        .person-cell small { display: block; color: #888; font-size: 0.75rem; }
        .avatar {
            width: 36px; height: 36px; border-radius: 50%;
            background: linear-gradient(135deg, #2196f3, #1565c0);
            color: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 0.85rem;
        }

        .actions { display: flex; gap: 0.35rem; }
        .btn-mini {
            background: white; color: var(--primary);
            border: 1px solid #d6dbe3;
            padding: 0.35rem 0.6rem;
            border-radius: 6px; cursor: pointer; font-size: 0.85rem;
        }
        .btn-mini:hover:not(:disabled) { background: #f0f7ff; border-color: var(--primary); }
        .btn-danger-mini { color: #c62828; border-color: #ffcdd2; }
        .btn-danger-mini:hover:not(:disabled) { background: #ffebee; border-color: #e57373; }
        .btn-mini:disabled { opacity: 0.5; cursor: not-allowed; }

        /* Modal */
        .modal-overlay {
            position: fixed; inset: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex; align-items: center; justify-content: center;
            z-index: 1000; padding: 1rem;
        }
        .modal {
            background: white; border-radius: 12px;
            width: 100%; max-width: 600px;
            max-height: 92vh; overflow-y: auto;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
        }
        .modal-header {
            display: flex; justify-content: space-between; align-items: center;
            padding: 1.25rem 1.5rem;
            border-bottom: 1px solid #eee;
            position: sticky; top: 0; background: white; z-index: 1;
        }
        .modal-header h2 { margin: 0; font-size: 1.15rem; }
        .btn-close {
            background: none; border: none;
            font-size: 1.8rem; color: #888;
            cursor: pointer; line-height: 1;
        }
        .modal-body { padding: 1.5rem; }

        .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
        .form-group { margin-bottom: 1rem; }
        .form-group label {
            display: block; font-weight: 600;
            color: #334; font-size: 0.9rem; margin-bottom: 0.35rem;
        }
        .form-group input, .form-group select {
            width: 100%; box-sizing: border-box;
            padding: 0.6rem 0.85rem;
            border: 1px solid #d6dbe3;
            border-radius: 6px; font-size: 0.95rem; background: white;
        }
        .form-group input:focus, .form-group select:focus {
            outline: none; border-color: var(--primary);
        }
        .form-group input[readonly] { background: #f5f6f8; color: #777; }
        .hint { display: block; margin-top: 0.3rem; color: #888; font-size: 0.8rem; }

        .alert-error {
            background: #ffebee; color: #c62828;
            padding: 0.75rem 1rem; border-radius: 6px;
            border-left: 4px solid #f44336;
            margin-bottom: 1rem; font-size: 0.9rem;
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
            display: block; font-size: 0.8rem;
            color: #666; font-weight: 600;
            margin-bottom: 0.25rem;
        }
        .cred-value {
            font-family: monospace; font-size: 1rem; color: #1a2540;
        }
        .password-box {
            background: white;
            padding: 0.5rem 0.75rem;
            border: 1px solid #d6dbe3;
            border-radius: 6px;
        }
        .password-box code {
            font-size: 1.1rem; font-weight: bold;
            color: var(--primary); user-select: all;
        }
        .warning-box {
            background: #fff3e0; color: #e65100;
            padding: 0.85rem 1rem;
            border-radius: 6px;
            border-left: 4px solid #ff9800;
            font-size: 0.9rem;
        }

        @media (max-width: 768px) {
            .form-row { grid-template-columns: 1fr; }
        }
    `]
})
export class AdminStaffComponent implements OnInit {
    activeTab: 'doctors' | 'secretaries' = 'doctors';

    doctors: any[] = [];
    secretaries: any[] = [];
    isLoading = true;

    // Modal
    showModal = false;
    modalRole: 'doctor' | 'secretary' = 'doctor';
    editingStaff: any = null;
    form: any = this.emptyForm();
    languagesInput = '';
    isSaving = false;
    modalError = '';
    createdCredentials: { email: string; password: string } | null = null;
    deletingId: string | null = null;

    constructor(
        private adminService: AdminService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loadAll();
    }

    loadAll() {
        this.isLoading = true;

        this.adminService.getDoctors().subscribe({
            next: (data) => {
                this.doctors = data || [];
                this.checkLoaded();
                this.cdr.detectChanges();
            },
            error: () => { this.doctors = []; this.checkLoaded(); this.cdr.detectChanges(); }
        });

        this.adminService.getSecretaries().subscribe({
            next: (data) => {
                this.secretaries = data || [];
                this.checkLoaded();
                this.cdr.detectChanges();
            },
            error: () => { this.secretaries = []; this.checkLoaded(); this.cdr.detectChanges(); }
        });
    }

    private loadedCount = 0;
    private checkLoaded() {
        this.loadedCount++;
        if (this.loadedCount >= 2) {
            this.isLoading = false;
            this.loadedCount = 0;
        }
    }

    // === MODAL ===

    openCreateModal(role: 'doctor' | 'secretary') {
        this.modalRole = role;
        this.editingStaff = null;
        this.form = this.emptyForm();
        this.languagesInput = '';
        this.modalError = '';
        this.createdCredentials = null;
        this.showModal = true;
    }

    openEditModal(staff: any, role: 'doctor' | 'secretary') {
        this.modalRole = role;
        this.editingStaff = staff;
        this.form = {
            firstName: staff.firstName || '',
            lastName: staff.lastName || '',
            email: staff.email || '',
            password: '',
            phone: staff.phone || '',
            specialty: staff.specialty || '',
            city: staff.city || '',
            consultationFee: staff.consultationFee || null,
            sector: staff.sector || null
        };
        this.languagesInput = Array.isArray(staff.languages) ? staff.languages.join(', ') : '';
        this.modalError = '';
        this.createdCredentials = null;
        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        if (this.createdCredentials) {
            this.loadAll();
        }
        this.createdCredentials = null;
        this.editingStaff = null;
    }

    saveStaff() {
        this.modalError = '';

        const languages = this.languagesInput
            .split(',')
            .map(l => l.trim())
            .filter(l => l.length > 0);

        const payload: any = {
            firstName: this.form.firstName.trim(),
            lastName: this.form.lastName.trim(),
            phone: this.form.phone || ''
        };

        if (this.modalRole === 'doctor') {
            payload.specialty = this.form.specialty || '';
            payload.city = this.form.city || '';
            payload.consultationFee = this.form.consultationFee || null;
            payload.sector = this.form.sector || null;
            payload.languages = languages;
        }

        // Création : email + mdp obligatoires
        if (!this.editingStaff) {
            payload.email = this.form.email.trim();
            payload.password = this.form.password;
        }

        this.isSaving = true;
        this.cdr.detectChanges();

        const obs = this.editingStaff
            ? (this.modalRole === 'doctor'
                ? this.adminService.updateDoctor(this.editingStaff._id, payload)
                : this.adminService.updateSecretary(this.editingStaff._id, payload))
            : (this.modalRole === 'doctor'
                ? this.adminService.createDoctor(payload)
                : this.adminService.createSecretary(payload));

        obs.subscribe({
            next: () => {
                this.isSaving = false;
                if (this.editingStaff) {
                    // Modification : pas d'écran credentials, on ferme directement
                    this.loadAll();
                    this.closeModal();
                } else {
                    // Création : afficher l'écran credentials avec le mdp saisi
                    this.createdCredentials = {
                        email: payload.email,
                        password: payload.password
                    };
                }
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isSaving = false;
                this.modalError = err.error?.message || "Erreur lors de l'enregistrement.";
                this.cdr.detectChanges();
            }
        });
    }

    // === DELETE ===

    deleteStaff(staff: any, role: 'doctor' | 'secretary') {
        const name = `${staff.firstName} ${staff.lastName}`;
        const label = role === 'doctor' ? 'le médecin' : 'le secrétaire';
        if (!confirm(`Supprimer ${label} ${name} ? Cette action est irréversible.`)) return;

        this.deletingId = staff._id;
        this.cdr.detectChanges();

        const obs = role === 'doctor'
            ? this.adminService.deleteDoctor(staff._id)
            : this.adminService.deleteSecretary(staff._id);

        obs.subscribe({
            next: () => {
                if (role === 'doctor') {
                    this.doctors = this.doctors.filter(d => d._id !== staff._id);
                } else {
                    this.secretaries = this.secretaries.filter(s => s._id !== staff._id);
                }
                this.deletingId = null;
                this.cdr.detectChanges();
            },
            error: () => {
                this.deletingId = null;
                alert('Erreur lors de la suppression.');
                this.cdr.detectChanges();
            }
        });
    }

    // === HELPERS ===

    private emptyForm() {
        return {
            firstName: '',
            lastName: '',
            email: '',
            password: '',
            phone: '',
            specialty: '',
            city: '',
            consultationFee: null,
            sector: null
        };
    }

    initials(person: any): string {
        if (!person) return '?';
        const f = (person.firstName || '').charAt(0).toUpperCase();
        const l = (person.lastName || '').charAt(0).toUpperCase();
        return f + l || '?';
    }

    logout() {
        this.authService.logout();
    }
}