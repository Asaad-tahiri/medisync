import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AppointmentService } from '../../services/appointment';
import { DoctorService } from '../../services/doctor';
import { SecretaryService } from '../../services/secretary';

@Component({
    selector: 'app-secretary-appointments',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <nav class="navbar">
            <a routerLink="/dashboard" class="logo">🏥 MediSync</a>
            <div class="nav-actions">
                <a routerLink="/secretary/patients" class="nav-link">👥 Patients</a>
                <a routerLink="/dashboard" class="nav-link">🏠 Dashboard</a>
                <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
            </div>
        </nav>

        <div class="container">
            <div class="page-header">
                <div>
                    <h1>📅 Rendez-vous du cabinet</h1>
                    <p class="subtitle" *ngIf="!isLoading">
                        {{ filteredAppointments.length }} rendez-vous {{ hasActiveFilters() ? 'trouvé(s)' : 'au total' }}
                    </p>
                </div>
                <button class="btn btn-primary" (click)="openCreateModal()">+ Nouveau rendez-vous</button>
            </div>

            <!-- Filtres -->
            <div class="filters-card">
                <div class="filters-grid">
                    <div class="filter-group">
                        <label>Date</label>
                        <input type="date" [(ngModel)]="filterDate" (ngModelChange)="applyFilters()">
                    </div>
                    <div class="filter-group">
                        <label>Médecin</label>
                        <select [(ngModel)]="filterDoctorId" (change)="applyFilters()">
                            <option value="">Tous</option>
                            <option *ngFor="let d of doctors" [value]="d._id">
                                Dr. {{ d.firstName }} {{ d.lastName }}
                            </option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Statut</label>
                        <select [(ngModel)]="filterStatus" (change)="applyFilters()">
                            <option value="">Tous</option>
                            <option value="scheduled">Programmé</option>
                            <option value="in-progress">En cours</option>
                            <option value="completed">Terminé</option>
                            <option value="cancelled">Annulé</option>
                            <option value="no-show">Absent</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Patient</label>
                        <input type="text" [(ngModel)]="filterPatient" (ngModelChange)="applyFilters()"
                               placeholder="Rechercher...">
                    </div>
                    <div class="filter-group">
                        <button type="button" class="btn-reset" (click)="resetFilters()">↺ Réinitialiser</button>
                    </div>
                </div>
            </div>

            <!-- Liste -->
            <div *ngIf="isLoading" class="card empty-state">Chargement...</div>

            <div *ngIf="!isLoading && filteredAppointments.length === 0" class="card empty-state">
                <p>📭 Aucun rendez-vous {{ hasActiveFilters() ? 'ne correspond aux filtres' : 'au cabinet' }}.</p>
            </div>

            <div *ngIf="!isLoading && filteredAppointments.length > 0" class="appointments-table card">
                <table>
                    <thead>
                        <tr>
                            <th>Date / Heure</th>
                            <th>Patient</th>
                            <th>Médecin</th>
                            <th>Motif</th>
                            <th>Durée</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let appt of filteredAppointments" [class]="'row-' + appt.status">
                            <td class="cell-date">
                                <strong>{{ appt.dateTime | date:'dd/MM/yyyy' }}</strong>
                                <span class="time">{{ appt.dateTime | date:'HH:mm' }}</span>
                            </td>
                            <td>
                                <div class="patient-cell">
                                    <div class="avatar">{{ initials(appt.patientId) }}</div>
                                    <div>
                                        <strong>{{ appt.patientId?.firstName }} {{ appt.patientId?.lastName }}</strong>
                                        <small *ngIf="appt.patientId?.phone">📞 {{ appt.patientId.phone }}</small>
                                    </div>
                                </div>
                            </td>
                            <td>
                                Dr. {{ appt.doctorId?.firstName }} {{ appt.doctorId?.lastName }}
                                <small *ngIf="appt.doctorId?.specialty">{{ appt.doctorId.specialty }}</small>
                            </td>
                            <td>
                                <span class="motif-badge" [class]="'motif-' + appt.motif">
                                    {{ motifLabel(appt.motif) }}
                                </span>
                            </td>
                            <td>{{ appt.duration }} min</td>
                            <td>
                                <span class="status-badge" [class]="'badge-' + appt.status">
                                    {{ statusLabel(appt.status) }}
                                </span>
                            </td>
                            <td>
                                <div class="actions">
                                    <button class="btn-mini" (click)="openEditModal(appt)"
                                            *ngIf="appt.status === 'scheduled'"
                                            title="Modifier">
                                        ✏️
                                    </button>
                                    <button class="btn-mini btn-danger-mini" (click)="cancelAppt(appt)"
                                            *ngIf="appt.status === 'scheduled'"
                                            [disabled]="updatingId === appt._id"
                                            title="Annuler">
                                        🗑
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- MODAL : créer / modifier un RDV -->
            <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
                <div class="modal" (click)="$event.stopPropagation()">
                    <div class="modal-header">
                        <h2>{{ editingAppt ? '✏️ Modifier le rendez-vous' : '➕ Nouveau rendez-vous' }}</h2>
                        <button class="btn-close" (click)="closeModal()">×</button>
                    </div>

                    <div class="modal-body">
                        <div *ngIf="modalError" class="alert alert-error">{{ modalError }}</div>

                        <!-- Patient -->
                        <div class="form-group">
                            <label>Patient *</label>
                            <div class="patient-search" *ngIf="!editingAppt">
                                <input type="text"
                                       [(ngModel)]="patientSearchTerm"
                                       (ngModelChange)="filterPatientsForSelect()"
                                       placeholder="Rechercher un patient par nom..."
                                       [disabled]="!!selectedPatient">
                                <div *ngIf="patientSearchTerm && !selectedPatient && filteredPatientsForSelect.length > 0"
                                     class="patient-suggestions">
                                    <div *ngFor="let p of filteredPatientsForSelect | slice:0:5"
                                         class="suggestion"
                                         (click)="selectPatient(p)">
                                        <div class="avatar-mini">{{ initials(p) }}</div>
                                        <div>
                                            <strong>{{ p.firstName }} {{ p.lastName }}</strong>
                                            <small>{{ p.email }}</small>
                                        </div>
                                    </div>
                                </div>
                                <div *ngIf="patientSearchTerm && !selectedPatient && filteredPatientsForSelect.length === 0"
                                     class="patient-suggestions empty">
                                    Aucun patient trouvé.
                                </div>
                            </div>

                            <div *ngIf="selectedPatient" class="selected-patient">
                                <div class="avatar-mini">{{ initials(selectedPatient) }}</div>
                                <div>
                                    <strong>{{ selectedPatient.firstName }} {{ selectedPatient.lastName }}</strong>
                                    <small>{{ selectedPatient.email }}</small>
                                </div>
                                <button *ngIf="!editingAppt" type="button"
                                        class="btn-change" (click)="clearPatient()">Changer</button>
                            </div>
                        </div>

                        <!-- Médecin -->
                        <div class="form-group">
                            <label>Médecin *</label>
                            <select [(ngModel)]="selectedDoctorId" (change)="onDoctorChange()">
                                <option value="">-- Choisir un médecin --</option>
                                <option *ngFor="let d of doctors" [value]="d._id">
                                    Dr. {{ d.firstName }} {{ d.lastName }}
                                    {{ d.specialty ? ' — ' + d.specialty : '' }}
                                </option>
                            </select>
                        </div>

                        <!-- Date -->
                        <div class="form-group">
                            <label>Date du rendez-vous *</label>
                            <input type="date" [(ngModel)]="selectedDate" [min]="minDate" (change)="loadSlots()">
                        </div>

                        <!-- Créneaux -->
                        <div *ngIf="selectedDoctorId && selectedDate" class="form-group">
                            <label>Créneau disponible *</label>
                            <div *ngIf="loadingSlots" class="loading-text">⏳ Recherche des créneaux...</div>
                            <div *ngIf="!loadingSlots && availableSlots.length === 0" class="empty-slots">
                                Aucun créneau disponible ce jour pour ce médecin.
                            </div>
                            <div *ngIf="!loadingSlots && availableSlots.length > 0" class="slots-grid">
                                <button type="button"
                                        *ngFor="let slot of availableSlots"
                                        class="slot-btn"
                                        [class.selected]="selectedSlot === slot"
                                        (click)="selectedSlot = slot">
                                    {{ slot }}
                                </button>
                            </div>
                        </div>

                        <!-- Durée + motif -->
                        <div class="form-row">
                            <div class="form-group">
                                <label>Durée</label>
                                <select [(ngModel)]="duration">
                                    <option value="15">15 minutes</option>
                                    <option value="30">30 minutes</option>
                                    <option value="60">60 minutes</option>
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Motif</label>
                                <select [(ngModel)]="motif">
                                    <option value="consultation">Consultation</option>
                                    <option value="suivi">Suivi</option>
                                    <option value="urgence">Urgence</option>
                                    <option value="bilan">Bilan</option>
                                </select>
                            </div>
                        </div>

                        <!-- Notes -->
                        <div class="form-group">
                            <label>Notes / Demande du patient</label>
                            <textarea [(ngModel)]="notes" rows="3"
                                      placeholder="Symptômes, raison de la visite..."></textarea>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" (click)="closeModal()" [disabled]="isSaving">
                                Annuler
                            </button>
                            <button type="button" class="btn btn-primary" (click)="saveAppointment()" [disabled]="isSaving">
                                {{ isSaving ? 'Enregistrement...' : (editingAppt ? '✓ Mettre à jour' : '✓ Créer le rendez-vous') }}
                            </button>
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

        /* Filtres */
        .filters-card {
            background: white; border-radius: 12px;
            padding: 1.25rem; margin-bottom: 1.5rem;
            box-shadow: var(--shadow);
        }
        .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
            gap: 1rem;
            align-items: end;
        }
        .filter-group label {
            display: block; font-size: 0.85rem; font-weight: 600;
            color: #334; margin-bottom: 0.35rem;
        }
        .filter-group select, .filter-group input {
            width: 100%; box-sizing: border-box;
            padding: 0.55rem 0.75rem;
            border: 1px solid #d6dbe3;
            border-radius: 6px; font-size: 0.9rem; background: white;
        }
        .filter-group select:focus, .filter-group input:focus {
            outline: none; border-color: var(--primary);
        }
        .btn-reset {
            width: 100%; padding: 0.55rem 1rem;
            background: #f0f3f7; border: 1px solid #d6dbe3;
            border-radius: 6px; cursor: pointer; font-size: 0.9rem; color: #334;
        }
        .btn-reset:hover { background: #e3e8ef; }

        /* Table */
        .empty-state { text-align: center; padding: 3rem 1rem; color: var(--gray-600); }
        .appointments-table { padding: 0; overflow: hidden; }
        table { width: 100%; border-collapse: collapse; }
        thead { background: #f5f6f8; }
        th, td {
            padding: 0.85rem 1rem;
            text-align: left;
            border-bottom: 1px solid #eee;
            font-size: 0.9rem;
            vertical-align: middle;
        }
        th { font-weight: 600; color: #555; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.05em; }
        tbody tr:hover { background: #fafbfc; }
        tbody tr.row-cancelled { opacity: 0.55; }
        tbody tr.row-completed { opacity: 0.75; }
        tbody tr.row-in-progress { background: #f0f7ff; }

        .cell-date strong { display: block; }
        .cell-date .time { font-size: 0.85rem; color: #666; }

        .patient-cell { display: flex; align-items: center; gap: 0.6rem; }
        .patient-cell small, td small {
            display: block; color: #888; font-size: 0.75rem;
        }
        .avatar {
            width: 32px; height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2196f3, #1565c0);
            color: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 0.8rem;
            flex-shrink: 0;
        }

        .motif-badge, .status-badge {
            display: inline-block;
            padding: 0.2rem 0.55rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
        }
        .motif-badge { background: #e3f2fd; color: #1565c0; }
        .motif-badge.motif-urgence { background: #ffebee; color: #c62828; }
        .motif-badge.motif-suivi { background: #f3e5f5; color: #6a1b9a; }
        .motif-badge.motif-bilan { background: #fff3e0; color: #e65100; }

        .status-badge { color: white; }
        .badge-scheduled { background: #f5a623; }
        .badge-in-progress { background: #2196f3; }
        .badge-completed { background: #4caf50; }
        .badge-cancelled { background: #e57373; }
        .badge-no-show { background: #9e9e9e; }

        .actions { display: flex; gap: 0.35rem; }
        .btn-mini {
            background: white;
            color: var(--primary);
            border: 1px solid #d6dbe3;
            padding: 0.35rem 0.55rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
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
        .form-group select, .form-group input, .form-group textarea {
            width: 100%; box-sizing: border-box;
            padding: 0.6rem 0.85rem;
            border: 1px solid #d6dbe3;
            border-radius: 6px; font-size: 0.95rem;
            font-family: inherit; background: white;
        }
        .form-group select:focus, .form-group input:focus, .form-group textarea:focus {
            outline: none; border-color: var(--primary);
        }
        .form-group input:disabled { background: #f5f6f8; cursor: not-allowed; }

        /* Recherche patient */
        .patient-search { position: relative; }
        .patient-suggestions {
            position: absolute; top: 100%; left: 0; right: 0;
            background: white;
            border: 1px solid #d6dbe3;
            border-top: none;
            border-radius: 0 0 6px 6px;
            max-height: 220px;
            overflow-y: auto;
            z-index: 10;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .patient-suggestions.empty {
            padding: 0.85rem; text-align: center;
            color: #888; font-style: italic; font-size: 0.9rem;
        }
        .suggestion {
            padding: 0.6rem 0.85rem;
            display: flex; align-items: center; gap: 0.6rem;
            cursor: pointer;
            border-bottom: 1px solid #eee;
        }
        .suggestion:hover { background: #f0f7ff; }
        .suggestion small { display: block; color: #888; font-size: 0.75rem; }
        .avatar-mini {
            width: 32px; height: 32px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2196f3, #1565c0);
            color: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 0.8rem;
        }
        .selected-patient {
            display: flex; align-items: center; gap: 0.75rem;
            background: #e8f5e9;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            border-left: 4px solid #4caf50;
        }
        .selected-patient strong { display: block; }
        .selected-patient small { color: #666; font-size: 0.8rem; }
        .selected-patient > div { flex: 1; }
        .btn-change {
            background: white; border: 1px solid #d6dbe3;
            padding: 0.35rem 0.75rem;
            border-radius: 6px; font-size: 0.8rem;
            cursor: pointer; color: #555;
        }

        /* Créneaux */
        .loading-text { padding: 1rem; color: #888; text-align: center; font-style: italic; }
        .empty-slots {
            padding: 1rem;
            background: #fff3e0; color: #e65100;
            border-radius: 6px;
            text-align: center; font-size: 0.9rem;
        }
        .slots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(75px, 1fr));
            gap: 0.4rem;
        }
        .slot-btn {
            padding: 0.55rem;
            border: 1px solid #d6dbe3;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
        }
        .slot-btn:hover { border-color: var(--primary); background: #f0f7ff; }
        .slot-btn.selected {
            background: var(--primary); color: white; border-color: var(--primary);
        }

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

        @media (max-width: 768px) {
            .form-row { grid-template-columns: 1fr; }
            .filters-grid { grid-template-columns: 1fr 1fr; }
        }
    `]
})
export class SecretaryAppointmentsComponent implements OnInit {
    // Données
    allAppointments: any[] = [];
    filteredAppointments: any[] = [];
    doctors: any[] = [];
    allPatients: any[] = [];

    isLoading = true;
    updatingId: string | null = null;

    // Filtres
    filterDate = '';
    filterDoctorId = '';
    filterStatus = '';
    filterPatient = '';

    // Modal
    showModal = false;
    editingAppt: any = null;
    modalError = '';
    isSaving = false;

    // Modal — sélection patient
    patientSearchTerm = '';
    filteredPatientsForSelect: any[] = [];
    selectedPatient: any = null;

    // Modal — formulaire RDV
    selectedDoctorId = '';
    selectedDate = '';
    availableSlots: string[] = [];
    selectedSlot = '';
    loadingSlots = false;
    duration = '30';
    motif = 'consultation';
    notes = '';
    minDate = new Date().toISOString().split('T')[0];

    constructor(
        private appointmentService: AppointmentService,
        private doctorService: DoctorService,
        private secretaryService: SecretaryService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        // Filtre par défaut sur la date d'aujourd'hui
        this.filterDate = new Date().toISOString().split('T')[0];
        this.loadAll();
    }

    loadAll() {
        this.isLoading = true;
        // Charge en parallèle : appointments, doctors, patients
        this.appointmentService.getAppointments().subscribe({
            next: (appts: any[]) => {
                this.allAppointments = (appts || [])
                    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });

        this.doctorService.searchDoctors().subscribe({
            next: (docs) => {
                this.doctors = docs || [];
                this.cdr.detectChanges();
            },
            error: () => { this.doctors = []; }
        });

        this.secretaryService.getAllPatients().subscribe({
            next: (patients) => {
                this.allPatients = patients || [];
                this.cdr.detectChanges();
            },
            error: () => { this.allPatients = []; }
        });
    }

    // === FILTRES ===

    applyFilters() {
        this.filteredAppointments = this.allAppointments.filter(appt => {
            if (this.filterDate) {
                const apptDate = new Date(appt.dateTime).toISOString().split('T')[0];
                if (apptDate !== this.filterDate) return false;
            }
            if (this.filterDoctorId && appt.doctorId?._id !== this.filterDoctorId) return false;
            if (this.filterStatus && appt.status !== this.filterStatus) return false;
            if (this.filterPatient) {
                const fullName = `${appt.patientId?.firstName || ''} ${appt.patientId?.lastName || ''}`.toLowerCase();
                if (!fullName.includes(this.filterPatient.toLowerCase())) return false;
            }
            return true;
        });
    }

    resetFilters() {
        this.filterDate = '';
        this.filterDoctorId = '';
        this.filterStatus = '';
        this.filterPatient = '';
        this.applyFilters();
    }

    hasActiveFilters(): boolean {
        return !!(this.filterDate || this.filterDoctorId || this.filterStatus || this.filterPatient);
    }

    // === ANNULER ===

    cancelAppt(appt: any) {
        if (!confirm(`Annuler le rendez-vous de ${appt.patientId?.firstName} ${appt.patientId?.lastName} ?`)) return;

        this.updatingId = appt._id;
        this.cdr.detectChanges();

        this.appointmentService.cancelAppointment(appt._id).subscribe({
            next: () => {
                appt.status = 'cancelled';
                this.updatingId = null;
                this.applyFilters();
                this.cdr.detectChanges();
            },
            error: () => {
                this.updatingId = null;
                alert("Erreur lors de l'annulation.");
                this.cdr.detectChanges();
            }
        });
    }

    // === MODAL : OUVRIR / FERMER ===

    openCreateModal() {
        this.editingAppt = null;
        this.resetModalForm();
        this.showModal = true;
    }

    openEditModal(appt: any) {
        this.editingAppt = appt;
        this.resetModalForm();

        this.selectedPatient = appt.patientId;
        this.selectedDoctorId = appt.doctorId?._id || '';
        this.selectedDate = new Date(appt.dateTime).toISOString().split('T')[0];
        this.duration = String(appt.duration);
        this.motif = appt.motif;
        this.notes = appt.notes || '';

        // Charge les créneaux pour la date du RDV
        if (this.selectedDoctorId && this.selectedDate) {
            this.loadSlots(appt.dateTime);
        }

        this.showModal = true;
    }

    closeModal() {
        this.showModal = false;
        this.editingAppt = null;
    }

    private resetModalForm() {
        this.modalError = '';
        this.patientSearchTerm = '';
        this.filteredPatientsForSelect = [];
        this.selectedPatient = null;
        this.selectedDoctorId = '';
        this.selectedDate = '';
        this.availableSlots = [];
        this.selectedSlot = '';
        this.duration = '30';
        this.motif = 'consultation';
        this.notes = '';
    }

    // === MODAL : SÉLECTION PATIENT ===

    filterPatientsForSelect() {
        const term = this.patientSearchTerm.trim().toLowerCase();
        if (!term) {
            this.filteredPatientsForSelect = [];
            return;
        }
        this.filteredPatientsForSelect = this.allPatients.filter(p => {
            const fullName = `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase();
            return fullName.includes(term);
        });
    }

    selectPatient(p: any) {
        this.selectedPatient = p;
        this.patientSearchTerm = '';
        this.filteredPatientsForSelect = [];
    }

    clearPatient() {
        this.selectedPatient = null;
        this.patientSearchTerm = '';
    }

    // === MODAL : SÉLECTION MÉDECIN + CRÉNEAUX ===

    onDoctorChange() {
        this.selectedSlot = '';
        this.availableSlots = [];
        if (this.selectedDoctorId && this.selectedDate) {
            this.loadSlots();
        }
    }

    loadSlots(preselectDateTime?: string) {
        if (!this.selectedDoctorId || !this.selectedDate) return;

        this.loadingSlots = true;
        this.availableSlots = [];
        this.selectedSlot = '';
        this.cdr.detectChanges();

        this.appointmentService.getAvailableSlots(this.selectedDoctorId, this.selectedDate).subscribe({
            next: (slots: any[]) => {
                // En mode édition, on inclut aussi le créneau actuel du RDV (sinon il serait marqué "pris" par lui-même)
                this.availableSlots = slots.filter(s => s.available).map(s => s.time);

                if (preselectDateTime) {
                    const h = new Date(preselectDateTime);
                    const slotStr = `${String(h.getHours()).padStart(2, '0')}:${String(h.getMinutes()).padStart(2, '0')}`;
                    if (!this.availableSlots.includes(slotStr)) {
                        this.availableSlots.push(slotStr);
                        this.availableSlots.sort();
                    }
                    this.selectedSlot = slotStr;
                }

                this.loadingSlots = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.availableSlots = [];
                this.loadingSlots = false;
                this.cdr.detectChanges();
            }
        });
    }

    // === MODAL : SAUVEGARDER ===

    saveAppointment() {
        this.modalError = '';

        if (!this.selectedPatient) {
            this.modalError = 'Veuillez sélectionner un patient.';
            return;
        }
        if (!this.selectedDoctorId) {
            this.modalError = 'Veuillez sélectionner un médecin.';
            return;
        }
        if (!this.selectedDate) {
            this.modalError = 'Veuillez choisir une date.';
            return;
        }
        if (!this.selectedSlot) {
            this.modalError = 'Veuillez choisir un créneau.';
            return;
        }

        const dateTime = `${this.selectedDate}T${this.selectedSlot}:00`;
        const payload: any = {
            patientId: this.selectedPatient._id,
            doctorId: this.selectedDoctorId,
            dateTime,
            duration: Number(this.duration),
            motif: this.motif,
            notes: this.notes.trim()
        };

        this.isSaving = true;
        this.cdr.detectChanges();

        if (this.editingAppt) {
            // MODIFICATION
            this.appointmentService.updateAppointment(this.editingAppt._id, payload).subscribe({
                next: (updated: any) => {
                    // Met à jour la liste locale
                    const idx = this.allAppointments.findIndex(a => a._id === this.editingAppt._id);
                    if (idx >= 0) this.allAppointments[idx] = updated;
                    this.allAppointments.sort((a, b) =>
                        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
                    );
                    this.applyFilters();
                    this.isSaving = false;
                    this.closeModal();
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.isSaving = false;
                    this.modalError = err.error?.message || 'Erreur lors de la mise à jour.';
                    this.cdr.detectChanges();
                }
            });
        } else {
            // CRÉATION
            this.appointmentService.createForPatient(payload).subscribe({
                next: (created: any) => {
                    this.allAppointments.push(created);
                    this.allAppointments.sort((a, b) =>
                        new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
                    );
                    this.applyFilters();
                    this.isSaving = false;
                    this.closeModal();
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    this.isSaving = false;
                    this.modalError = err.error?.message || 'Erreur lors de la création.';
                    this.cdr.detectChanges();
                }
            });
        }
    }

    // === HELPERS ===

    initials(person: any): string {
        if (!person) return '?';
        const f = (person.firstName || '').charAt(0).toUpperCase();
        const l = (person.lastName || '').charAt(0).toUpperCase();
        return f + l || '?';
    }

    motifLabel(motif: string): string {
        const map: Record<string, string> = {
            consultation: 'Consultation', suivi: 'Suivi',
            urgence: 'URGENCE', bilan: 'Bilan'
        };
        return map[motif] || motif;
    }

    statusLabel(status: string): string {
        const map: Record<string, string> = {
            scheduled: 'Programmé',
            'in-progress': 'En cours',
            completed: 'Terminé',
            cancelled: 'Annulé',
            'no-show': 'Absent'
        };
        return map[status] || status;
    }

    logout() {
        this.authService.logout();
    }
}