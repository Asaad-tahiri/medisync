import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import { ChartConfiguration } from 'chart.js';
import { AuthService } from '../../services/auth';
import { AdminService } from '../../services/admin';
import { SecretaryService } from '../../services/secretary';

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [CommonModule, RouterLink, BaseChartDirective],
    template: `
        <nav class="navbar">
            <a routerLink="/dashboard" class="logo">🏥 MediSync</a>
            <div class="nav-actions">
                <a routerLink="/admin/staff" class="nav-link">👨‍⚕️ Personnel</a>
                <a routerLink="/secretary/appointments" class="nav-link">📅 RDV</a>
                <a routerLink="/secretary/invoices" class="nav-link">💶 Factures</a>
                <a routerLink="/dashboard" class="nav-link">🏠 Dashboard</a>
                <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
            </div>
        </nav>

        <div class="container">
            <h1>📊 Tableau de Bord Administratif</h1>

            <div *ngIf="isLoading" class="loading-card">Chargement des statistiques...</div>

            <ng-container *ngIf="!isLoading">
                <!-- KPIs -->
                <div class="kpi-grid">
                    <div class="kpi-card blue">
                        <div class="kpi-icon">👥</div>
                        <div class="kpi-value">{{ stats.totalPatients }}</div>
                        <div class="kpi-label">Patients</div>
                    </div>
                    <div class="kpi-card teal">
                        <div class="kpi-icon">🩺</div>
                        <div class="kpi-value">{{ stats.totalDoctors }}</div>
                        <div class="kpi-label">Médecins</div>
                    </div>
                    <div class="kpi-card green">
                        <div class="kpi-icon">📅</div>
                        <div class="kpi-value">{{ stats.totalAppointments }}</div>
                        <div class="kpi-label">Rendez-vous total</div>
                    </div>
                    <div class="kpi-card orange">
                        <div class="kpi-icon">💰</div>
                        <div class="kpi-value">{{ totalRevenue | number:'1.0-0' }} DH</div>
                        <div class="kpi-label">Revenus total</div>
                    </div>
                    <div class="kpi-card red">
                        <div class="kpi-icon">❌</div>
                        <div class="kpi-value">{{ stats.noShowRate }}%</div>
                        <div class="kpi-label">Taux de no-show</div>
                    </div>
                </div>

                <!-- Charts -->
                <div class="charts-grid">
                    <div class="card">
                        <h3>💶 Revenus quotidiens (DH)</h3>
                        <div *ngIf="revenueChartData.datasets[0].data.length === 0" class="no-data">
                            Aucune facture pour le moment.
                        </div>
                        <canvas *ngIf="revenueChartData.datasets[0].data.length > 0"
                                baseChart
                                [data]="revenueChartData"
                                [options]="lineChartOptions"
                                [type]="'line'"></canvas>
                    </div>

                    <div class="card">
                        <h3>🩺 Top médecins (par nombre de RDV)</h3>
                        <div *ngIf="doctorsChartData.datasets[0].data.length === 0" class="no-data">
                            Aucun rendez-vous enregistré.
                        </div>
                        <canvas *ngIf="doctorsChartData.datasets[0].data.length > 0"
                                baseChart
                                [data]="doctorsChartData"
                                [options]="barChartOptions"
                                [type]="'bar'"></canvas>
                    </div>

                    <div class="card">
                        <h3>📈 Statut des factures</h3>
                        <div *ngIf="invoicesChartData.datasets[0].data[0] === 0 && invoicesChartData.datasets[0].data[1] === 0" class="no-data">
                            Aucune facture.
                        </div>
                        <canvas *ngIf="invoicesChartData.datasets[0].data[0] !== 0 || invoicesChartData.datasets[0].data[1] !== 0"
                                baseChart
                                [data]="invoicesChartData"
                                [type]="'doughnut'"></canvas>
                    </div>

                    <div class="card summary">
                        <h3>📋 Résumé</h3>
                        <ul class="summary-list">
                            <li>
                                <span>Patients enregistrés</span>
                                <strong>{{ stats.totalPatients }}</strong>
                            </li>
                            <li>
                                <span>Médecins actifs</span>
                                <strong>{{ stats.totalDoctors }}</strong>
                            </li>
                            <li>
                                <span>Total RDV</span>
                                <strong>{{ stats.totalAppointments }}</strong>
                            </li>
                            <li>
                                <span>Factures émises</span>
                                <strong>{{ invoices.length }}</strong>
                            </li>
                            <li>
                                <span>Factures payées</span>
                                <strong class="paid">{{ paidCount }}</strong>
                            </li>
                            <li>
                                <span>Factures impayées</span>
                                <strong class="unpaid">{{ unpaidCount }}</strong>
                            </li>
                            <li>
                                <span>Montant impayé</span>
                                <strong class="unpaid">{{ totalUnpaid | number:'1.2-2' }} DH</strong>
                            </li>
                        </ul>
                    </div>
                </div>
            </ng-container>
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

        .loading-card {
            background: white; padding: 3rem; border-radius: 12px;
            text-align: center; color: var(--gray-600);
            box-shadow: var(--shadow);
            margin-top: 1.5rem;
        }

        .kpi-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem;
            margin: 1.5rem 0;
        }
        .kpi-card {
            background: white; padding: 1.25rem;
            border-radius: 12px; text-align: center;
            box-shadow: var(--shadow);
        }
        .kpi-card.blue   { border-top: 4px solid var(--primary); }
        .kpi-card.teal   { border-top: 4px solid #009688; }
        .kpi-card.green  { border-top: 4px solid var(--success); }
        .kpi-card.orange { border-top: 4px solid var(--warning); }
        .kpi-card.red    { border-top: 4px solid var(--danger); }
        .kpi-icon { font-size: 1.75rem; }
        .kpi-value { font-size: 1.75rem; font-weight: bold; margin: 0.4rem 0; }
        .kpi-label { color: var(--gray-600); font-size: 0.85rem; }

        .charts-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
            gap: 1.5rem;
        }
        .card h3 { margin: 0 0 1rem; font-size: 1rem; color: #1a2540; }
        .no-data {
            padding: 2rem;
            text-align: center;
            color: #999;
            font-style: italic;
        }

        .summary-list {
            list-style: none;
            padding: 0;
            margin: 0;
        }
        .summary-list li {
            display: flex;
            justify-content: space-between;
            padding: 0.6rem 0;
            border-bottom: 1px solid #eee;
            font-size: 0.9rem;
        }
        .summary-list li:last-child { border-bottom: none; }
        .summary-list span { color: #555; }
        .summary-list strong { color: #1a2540; }
        .summary-list .paid { color: #2e7d32; }
        .summary-list .unpaid { color: #c62828; }
    `]
})
export class AdminComponent implements OnInit {
    isLoading = true;
    stats: any = { totalPatients: 0, totalDoctors: 0, totalAppointments: 0, noShowRate: 0, revenueByDay: [], appointmentsByDoctor: [] };
    invoices: any[] = [];

    // Charts (initialisés vides, remplis dans loadStats)
    revenueChartData: ChartConfiguration<'line'>['data'] = {
        labels: [],
        datasets: [{
            data: [],
            label: 'Revenus (DH)',
            borderColor: '#0ea5e9',
            backgroundColor: 'rgba(14, 165, 233, 0.1)',
            fill: true,
            tension: 0.4
        }]
    };
    lineChartOptions: ChartConfiguration<'line'>['options'] = { responsive: true, maintainAspectRatio: true };

    doctorsChartData: ChartConfiguration<'bar'>['data'] = {
        labels: [],
        datasets: [{
            data: [],
            label: 'Nombre de RDV',
            backgroundColor: '#10b981'
        }]
    };
    barChartOptions: ChartConfiguration<'bar'>['options'] = { responsive: true, maintainAspectRatio: true };

    invoicesChartData: ChartConfiguration<'doughnut'>['data'] = {
        labels: ['Payées', 'Impayées'],
        datasets: [{
            data: [0, 0],
            backgroundColor: ['#10b981', '#ef4444']
        }]
    };

    constructor(
        private adminService: AdminService,
        private secretaryService: SecretaryService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {}
    
    ngOnInit() {
        this.loadStats();
        this.loadInvoices();
    }

    loadStats() {
        this.adminService.getStats().subscribe({
            next: (data) => {
                this.stats = data;

                // Câblage du chart revenus
                this.revenueChartData = {
                    labels: (data.revenueByDay || []).map((r: any) =>
                        new Date(r.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
                    ),
                    datasets: [{
                        data: (data.revenueByDay || []).map((r: any) => r.amount),
                        label: 'Revenus (DH)',
                        borderColor: '#0ea5e9',
                        backgroundColor: 'rgba(14, 165, 233, 0.1)',
                        fill: true,
                        tension: 0.4
                    }]
                };

                // Câblage du chart médecins
                this.doctorsChartData = {
                    labels: (data.appointmentsByDoctor || []).map((d: any) => `Dr. ${d.name}`),
                    datasets: [{
                        data: (data.appointmentsByDoctor || []).map((d: any) => d.count),
                        label: 'Nombre de RDV',
                        backgroundColor: '#10b981'
                    }]
                };

                this.checkLoading();
                this.cdr.detectChanges();
            },
            error: () => {
                this.checkLoading();
                this.cdr.detectChanges();
            }
        });
    }

    loadInvoices() {
        this.secretaryService.getAllInvoices().subscribe({
            next: (invoices) => {
                this.invoices = invoices || [];
                this.invoicesChartData = {
                    labels: ['Payées', 'Impayées'],
                    datasets: [{
                        data: [this.paidCount, this.unpaidCount],
                        backgroundColor: ['#10b981', '#ef4444']
                    }]
                };
                this.checkLoading();
                this.cdr.detectChanges();
            },
            error: () => {
                this.invoices = [];
                this.checkLoading();
                this.cdr.detectChanges();
            }
        });
    }

    private loadCount = 0;
    private checkLoading() {
        this.loadCount++;
        if (this.loadCount >= 2) this.isLoading = false;
    }

    get totalRevenue(): number {
        return this.invoices
            .filter(i => i.status === 'paid')
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    }
    get paidCount(): number { return this.invoices.filter(i => i.status === 'paid').length; }
    get unpaidCount(): number { return this.invoices.filter(i => i.status === 'unpaid').length; }
    get totalUnpaid(): number {
        return this.invoices
            .filter(i => i.status === 'unpaid')
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    }

    logout() {
        this.authService.logout();
    }
}