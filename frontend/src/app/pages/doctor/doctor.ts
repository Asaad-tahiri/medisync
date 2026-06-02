import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { AppointmentService } from '../../services/appointment';

@Component({
    selector: 'app-doctor',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <nav class="navbar">
            <a routerLink="/dashboard" class="logo">🏥 MediSync</a>
            <div class="nav-actions">
                <a routerLink="/doctor/profile" class="nav-link">👤 Mon profil</a>
                <a routerLink="/dashboard" class="nav-link">🏠 Dashboard</a>
                <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
            </div>
        </nav>

        <div class="container">
            <div class="page-header">
                <div>
                    <h1>🩺 Consultations du jour</h1>
                    <p class="subtitle">{{ today | date:'EEEE d MMMM y':'':'fr' }}</p>
                </div>
                <div class="header-stats">
                    <div class="stat-box">
                        <span class="stat-num">{{ stats.total }}</span>
                        <span class="stat-label">Total</span>
                    </div>
                    <div class="stat-box scheduled">
                        <span class="stat-num">{{ stats.waiting }}</span>
                        <span class="stat-label">En attente</span>
                    </div>
                    <div class="stat-box in-progress">
                        <span class="stat-num">{{ stats.inProgress }}</span>
                        <span class="stat-label">En cours</span>
                    </div>
                    <div class="stat-box completed">
                        <span class="stat-num">{{ stats.completed }}</span>
                        <span class="stat-label">Terminées</span>
                    </div>
                </div>
            </div>

            <div *ngIf="message" class="alert" [class.alert-success]="isSuccess" [class.alert-error]="!isSuccess">
                {{ message }}
            </div>

            <div *ngIf="isLoading" class="card empty-state">Chargement des consultations...</div>

            <div *ngIf="!isLoading && todayAppointments.length === 0" class="card empty-state">
                <p>📭 Aucune consultation prévue aujourd'hui.</p>
            </div>

            <div *ngIf="!isLoading && todayAppointments.length > 0" class="appointments-list">
                <div *ngFor="let appt of todayAppointments" class="appt-card" [class]="'status-' + appt.status">
                    <div class="appt-time">
                        <span class="time">{{ appt.dateTime | date:'HH:mm' }}</span>
                        <span class="duration">{{ appt.duration }} min</span>
                    </div>

                    <div class="appt-body">
                        <div class="patient-info">
                            <h3>{{ appt.patientId?.firstName }} {{ appt.patientId?.lastName }}</h3>
                            <span class="patient-phone" *ngIf="appt.patientId?.phone">📞 {{ appt.patientId.phone }}</span>
                        </div>
                        <div class="motif-badge" [class]="'motif-' + appt.motif">{{ motifLabel(appt.motif) }}</div>
                        <p *ngIf="appt.notes" class="patient-notes">
                            <strong>Demande du patient :</strong> {{ appt.notes }}
                        </p>
                    </div>

                    <div class="appt-actions">
                        <span class="status-badge" [class]="'badge-' + appt.status">{{ statusLabel(appt.status) }}</span>

                        <a [routerLink]="['/patient', appt.patientId?._id]" class="btn-action btn-secondary">
                            📋 Dossier patient
                        </a>

                        <button *ngIf="appt.status === 'scheduled'"
                                class="btn-action btn-primary"
                                (click)="startConsultation(appt)"
                                [disabled]="updatingId === appt._id">
                            ▶ Commencer
                        </button>

                        <button *ngIf="appt.status === 'in-progress'"
                                class="btn-action btn-success"
                                (click)="completeConsultation(appt)"
                                [disabled]="updatingId === appt._id">
                            ✓ Terminer
                        </button>

                        <button *ngIf="appt.status === 'scheduled'"
                                class="btn-action btn-warning"
                                (click)="markNoShow(appt)"
                                [disabled]="updatingId === appt._id">
                            ⚠ Absent
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .navbar {
            background: white;
            padding: 1rem 2rem;
            display: flex;
            justify-content: space-between;
            align-items: center;
            box-shadow: var(--shadow);
        }
        .logo {
            font-size: 1.5rem;
            font-weight: bold;
            color: var(--primary);
            text-decoration: none;
        }
        .nav-actions { display: flex; gap: 1rem; align-items: center; }
        .nav-link {
            color: var(--primary);
            text-decoration: none;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        .nav-link:hover { background: var(--gray-100, #f5f6f8); }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            margin: 1.5rem 0;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .subtitle { color: var(--gray-600); margin: 0.25rem 0 0; text-transform: capitalize; }

        .header-stats {
            display: flex;
            gap: 0.75rem;
        }
        .stat-box {
            background: white;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            text-align: center;
            min-width: 80px;
            box-shadow: var(--shadow);
        }
        .stat-box.scheduled { border-top: 3px solid #f5a623; }
        .stat-box.in-progress { border-top: 3px solid #2196f3; }
        .stat-box.completed { border-top: 3px solid #4caf50; }
        .stat-num { display: block; font-size: 1.5rem; font-weight: bold; color: var(--primary); }
        .stat-label { display: block; font-size: 0.75rem; color: var(--gray-600); text-transform: uppercase; }

        /* Cards RDV */
        .appointments-list { display: flex; flex-direction: column; gap: 1rem; }
        .appt-card {
            background: white;
            border-radius: 12px;
            padding: 1.25rem;
            box-shadow: var(--shadow);
            display: grid;
            grid-template-columns: 100px 1fr auto;
            gap: 1.25rem;
            align-items: center;
            border-left: 5px solid #ddd;
            transition: all 0.15s;
        }
        .appt-card.status-scheduled { border-left-color: #f5a623; }
        .appt-card.status-in-progress { border-left-color: #2196f3; background: #f0f7ff; }
        .appt-card.status-completed { border-left-color: #4caf50; opacity: 0.7; }
        .appt-card.status-cancelled { border-left-color: #e57373; opacity: 0.5; }
        .appt-card.status-no-show { border-left-color: #9e9e9e; opacity: 0.6; }

        .appt-time {
            text-align: center;
            background: var(--primary);
            color: white;
            padding: 0.75rem;
            border-radius: 8px;
        }
        .appt-time .time { display: block; font-size: 1.5rem; font-weight: bold; }
        .appt-time .duration { display: block; font-size: 0.75rem; opacity: 0.9; }

        .appt-body { display: flex; flex-direction: column; gap: 0.5rem; }
        .patient-info { display: flex; align-items: baseline; gap: 0.75rem; flex-wrap: wrap; }
        .patient-info h3 { margin: 0; font-size: 1.1rem; }
        .patient-phone { color: var(--gray-600); font-size: 0.9rem; }
        .motif-badge {
            display: inline-block;
            padding: 0.2rem 0.6rem;
            border-radius: 12px;
            font-size: 0.75rem;
            font-weight: 600;
            width: fit-content;
            background: #e3f2fd;
            color: #1565c0;
        }
        .motif-badge.motif-urgence { background: #ffebee; color: #c62828; }
        .motif-badge.motif-suivi { background: #f3e5f5; color: #6a1b9a; }
        .motif-badge.motif-bilan { background: #fff3e0; color: #e65100; }
        .patient-notes {
            margin: 0.5rem 0 0;
            padding: 0.6rem 0.85rem;
            background: var(--gray-50, #f5f6f8);
            border-radius: 6px;
            font-size: 0.9rem;
            color: #444;
        }

        .appt-actions {
            display: flex;
            flex-direction: column;
            gap: 0.5rem;
            align-items: stretch;
            min-width: 180px;
        }
        .status-badge {
            text-align: center;
            padding: 0.3rem 0.6rem;
            border-radius: 12px;
            font-size: 0.8rem;
            color: white;
            font-weight: 600;
        }
        .badge-scheduled { background: #f5a623; }
        .badge-in-progress { background: #2196f3; }
        .badge-completed { background: #4caf50; }
        .badge-cancelled { background: #e57373; }
        .badge-no-show { background: #9e9e9e; }

        .btn-action {
            padding: 0.5rem 0.85rem;
            border-radius: 6px;
            font-size: 0.85rem;
            cursor: pointer;
            border: none;
            text-decoration: none;
            text-align: center;
            transition: opacity 0.15s;
        }
        .btn-action:disabled { opacity: 0.5; cursor: not-allowed; }
        .btn-secondary {
            background: white;
            color: var(--primary);
            border: 1px solid var(--primary);
        }
        .btn-secondary:hover { background: #f0f7ff; }
        .btn-primary { background: var(--primary); color: white; }
        .btn-success { background: #4caf50; color: white; }
        .btn-warning { background: #ff9800; color: white; }

        .empty-state {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--gray-600);
        }
        .empty-state p { margin: 0; font-size: 1rem; }

        .alert { padding: 1rem; border-radius: 8px; margin-bottom: 1rem; }
        .alert-success { background: #d1fae5; color: #065f46; }
        .alert-error { background: #fee2e2; color: #991b1b; }

        @media (max-width: 768px) {
            .appt-card { grid-template-columns: 1fr; }
            .appt-actions { min-width: auto; }
        }
    `]
})
export class DoctorComponent implements OnInit {
    today = new Date();
    todayAppointments: any[] = [];
    isLoading = true;
    updatingId: string | null = null;
    message = '';
    isSuccess = false;

    get stats() {
        return {
            total: this.todayAppointments.length,
            waiting: this.todayAppointments.filter(a => a.status === 'scheduled').length,
            inProgress: this.todayAppointments.filter(a => a.status === 'in-progress').length,
            completed: this.todayAppointments.filter(a => a.status === 'completed').length
        };
    }

    constructor(
        private authService: AuthService,
        private appointmentService: AppointmentService,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loadTodayAppointments();
    }

    loadTodayAppointments() {
        this.isLoading = true;
        this.appointmentService.getAppointments().subscribe({
            next: (appts: any[]) => {
                const todayStr = new Date().toISOString().split('T')[0];
                this.todayAppointments = (appts || [])
                    .filter(a => new Date(a.dateTime).toISOString().split('T')[0] === todayStr)
                    .sort((a, b) => new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime());
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.todayAppointments = [];
                this.isLoading = false;
                this.message = 'Impossible de charger les consultations.';
                this.isSuccess = false;
                this.cdr.detectChanges();
            }
        });
    }

    startConsultation(appt: any) {
    this.updatingId = appt._id;
    this.cdr.detectChanges();

    this.appointmentService.updateAppointment(appt._id, { status: 'in-progress' }).subscribe({
        next: () => {
            appt.status = 'in-progress';
            this.updatingId = null;
            // Redirection vers la page de consultation
            this.router.navigate(['/doctor/consultation', appt._id]);
        },
        error: (err: any) => {
            this.updatingId = null;
            this.message = err.error?.message || 'Erreur lors de la mise à jour.';
            this.isSuccess = false;
            this.cdr.detectChanges();
        }
    });
    }

    completeConsultation(appt: any) {
        this.updateStatus(appt, 'completed');
    }

    markNoShow(appt: any) {
        if (!confirm('Marquer ce patient comme absent ?')) return;
        this.updateStatus(appt, 'no-show');
    }

    private updateStatus(appt: any, newStatus: string) {
        this.updatingId = appt._id;
        this.cdr.detectChanges();

        this.appointmentService.updateAppointment(appt._id, { status: newStatus }).subscribe({
            next: () => {
                appt.status = newStatus;
                this.updatingId = null;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.updatingId = null;
                this.message = err.error?.message || 'Erreur lors de la mise à jour.';
                this.isSuccess = false;
                this.cdr.detectChanges();
            }
        });
    }

    motifLabel(motif: string): string {
        const map: Record<string, string> = {
            consultation: 'Consultation',
            suivi: 'Suivi',
            urgence: 'URGENCE',
            bilan: 'Bilan'
        };
        return map[motif] || motif;
    }

    statusLabel(status: string): string {
        const map: Record<string, string> = {
            scheduled: 'En attente',
            'in-progress': 'En cours',
            completed: 'Terminée',
            cancelled: 'Annulée',
            'no-show': 'Absent'
        };
        return map[status] || status;
    }

    logout() {
        this.authService.logout();
    }
}