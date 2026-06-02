import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { DoctorService } from '../../services/doctor';

@Component({
    selector: 'app-doctor-patients',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <nav class="navbar">
            <a routerLink="/dashboard" class="logo">🏥 MediSync</a>
            <div class="nav-actions">
                <a routerLink="/doctor" class="nav-link">🩺 Consultations</a>
                <a routerLink="/doctor/profile" class="nav-link">👤 Mon profil</a>
                <a routerLink="/dashboard" class="nav-link">🏠 Dashboard</a>
                <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
            </div>
        </nav>

        <div class="container">
            <div class="page-header">
                <div>
                    <h1>👥 Mes patients</h1>
                    <p class="subtitle" *ngIf="!isLoading">
                        {{ filteredPatients.length }} patient(s) {{ searchTerm ? 'trouvé(s)' : 'au total' }}
                    </p>
                </div>
                <div class="search-box">
                    <input type="text"
                           [(ngModel)]="searchTerm"
                           (ngModelChange)="filterPatients()"
                           placeholder="🔍 Rechercher par nom...">
                </div>
            </div>

            <div *ngIf="isLoading" class="card empty-state">Chargement des patients...</div>

            <div *ngIf="!isLoading && allPatients.length === 0" class="card empty-state">
                <p>📭 Aucun patient à ce jour.</p>
                <p class="hint">Vos patients apparaîtront ici après leur premier rendez-vous.</p>
            </div>

            <div *ngIf="!isLoading && allPatients.length > 0 && filteredPatients.length === 0" class="card empty-state">
                <p>Aucun patient ne correspond à "{{ searchTerm }}".</p>
                <button class="btn btn-secondary" (click)="clearSearch()">Réinitialiser</button>
            </div>

            <div *ngIf="!isLoading && filteredPatients.length > 0" class="patients-grid">
                <a *ngFor="let p of filteredPatients"
                   [routerLink]="['/patient', p._id]"
                   class="patient-card">
                    <div class="card-top">
                        <div class="avatar">{{ p.firstName?.charAt(0) }}{{ p.lastName?.charAt(0) }}</div>
                        <div class="patient-name">
                            <h3>{{ p.firstName }} {{ p.lastName }}</h3>
                            <span class="patient-age" *ngIf="p.dateOfBirth">{{ getAge(p.dateOfBirth) }}</span>
                        </div>
                    </div>

                    <ul class="patient-meta">
                        <li *ngIf="p.phone"><span class="icon">📞</span> {{ p.phone }}</li>
                        <li *ngIf="p.email"><span class="icon">✉️</span> {{ p.email }}</li>
                    </ul>

                    <div class="patient-stats">
                        <div class="stat">
                            <span class="stat-value">{{ p.totalAppointments }}</span>
                            <span class="stat-label">RDV total</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value">{{ p.completedAppointments }}</span>
                            <span class="stat-label">Consultations</span>
                        </div>
                    </div>

                    <div class="card-footer">
                        <div *ngIf="p.nextAppointment" class="next-appt">
                            🗓️ Prochain RDV : {{ p.nextAppointment | date:'dd/MM/yyyy à HH:mm' }}
                        </div>
                        <div *ngIf="!p.nextAppointment" class="last-appt">
                            Dernier RDV : {{ p.lastAppointment | date:'dd/MM/yyyy' }}
                        </div>
                    </div>
                </a>
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
        .logo { font-size: 1.5rem; font-weight: bold; color: var(--primary); text-decoration: none; }
        .nav-actions { display: flex; gap: 0.75rem; align-items: center; }
        .nav-link {
            color: var(--primary);
            text-decoration: none;
            padding: 0.5rem 0.75rem;
            border-radius: 6px;
            font-size: 0.9rem;
        }
        .nav-link:hover { background: #f5f6f8; }

        .page-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 1.5rem 0;
            flex-wrap: wrap;
            gap: 1rem;
        }
        .subtitle { color: var(--gray-600); margin: 0.25rem 0 0; }

        .search-box input {
            padding: 0.6rem 1rem;
            border: 1px solid #d6dbe3;
            border-radius: 8px;
            font-size: 0.95rem;
            min-width: 280px;
        }
        .search-box input:focus { outline: none; border-color: var(--primary); }

        .empty-state {
            text-align: center;
            padding: 3rem 1rem;
            color: var(--gray-600);
        }
        .empty-state p { margin: 0 0 0.5rem; }
        .hint { font-size: 0.85rem; color: #999; }

        .patients-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
            gap: 1rem;
        }
        .patient-card {
            background: white;
            border-radius: 12px;
            padding: 1.25rem;
            box-shadow: var(--shadow);
            text-decoration: none;
            color: inherit;
            transition: all 0.15s;
            display: flex;
            flex-direction: column;
            gap: 0.85rem;
        }
        .patient-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
        }

        .card-top { display: flex; align-items: center; gap: 0.85rem; }
        .avatar {
            width: 48px; height: 48px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2196f3, #1565c0);
            color: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }
        .patient-name h3 { margin: 0; font-size: 1rem; color: #1a2540; }
        .patient-age { color: #888; font-size: 0.85rem; }

        .patient-meta {
            list-style: none;
            padding: 0;
            margin: 0;
            font-size: 0.85rem;
            color: #555;
        }
        .patient-meta li {
            padding: 0.2rem 0;
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }

        .patient-stats {
            display: flex;
            gap: 1rem;
            padding: 0.75rem 0;
            border-top: 1px solid #eee;
            border-bottom: 1px solid #eee;
        }
        .stat { flex: 1; text-align: center; }
        .stat-value { display: block; font-size: 1.25rem; font-weight: 700; color: var(--primary); }
        .stat-label { display: block; font-size: 0.7rem; color: #888; text-transform: uppercase; }

        .card-footer {
            font-size: 0.85rem;
        }
        .next-appt { color: #2e7d32; font-weight: 600; }
        .last-appt { color: #888; }
    `]
})
export class DoctorPatientsComponent implements OnInit {
    allPatients: any[] = [];
    filteredPatients: any[] = [];
    searchTerm = '';
    isLoading = true;

    constructor(
        private doctorService: DoctorService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loadPatients();
    }

    loadPatients() {
        this.doctorService.getMyPatients().subscribe({
            next: (patients: any[]) => {
                this.allPatients = patients || [];
                this.filteredPatients = [...this.allPatients];
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

    filterPatients() {
        const term = this.searchTerm.trim().toLowerCase();
        if (!term) {
            this.filteredPatients = [...this.allPatients];
            return;
        }
        this.filteredPatients = this.allPatients.filter(p => {
            const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
            return fullName.includes(term);
        });
    }

    clearSearch() {
        this.searchTerm = '';
        this.filterPatients();
    }

    getAge(dateOfBirth: string): string {
        if (!dateOfBirth) return '';
        const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
        return `${age} ans`;
    }

    logout() {
        this.authService.logout();
    }
}