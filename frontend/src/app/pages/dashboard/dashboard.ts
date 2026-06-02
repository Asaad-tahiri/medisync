import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <nav class="navbar">
            <div class="logo">🏥 MediSync</div>
            <div class="user-info" *ngIf="currentUser">
                <span>👤 {{ currentUser.firstName }} ({{ currentUser.role }})</span>
                <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
            </div>
        </nav>

        <div class="container">
            <h1>Bienvenue {{ currentUser?.firstName }} !</h1>
            <p class="subtitle">Que souhaitez-vous faire aujourd'hui ?</p>

            <div class="cards-grid">
                <!-- Cartes patient -->
                <div class="action-card patient" *ngIf="currentUser?.role === 'patient'" routerLink="/doctors">
                    <div class="icon">📅</div>
                    <h3>Prendre rendez-vous</h3>
                    <p>Trouver un médecin et réserver un créneau</p>
                </div>
                <div class="action-card patient" *ngIf="currentUser?.role === 'patient'" routerLink="/medical-record">
                    <div class="icon">📋</div>
                    <h3>Dossier médical</h3>
                    <p>Consulter mon historique médical</p>
                </div>
                <div class="action-card patient" *ngIf="currentUser?.role === 'patient'" routerLink="/my-profile">
                    <div class="icon">👤</div>
                    <h3>Mon Profil</h3>
                    <p>Gérer mes informations personnelles et médicales</p>
                </div>

                <!-- Cartes médecin -->
                <div class="action-card doctor" *ngIf="currentUser?.role === 'doctor'" routerLink="/doctor">
                    <div class="icon">🩺</div>
                    <h3>Consultations du jour</h3>
                    <p>Voir et gérer mes rendez-vous d'aujourd'hui</p>
                </div>
                <div class="action-card doctor" *ngIf="currentUser?.role === 'doctor'" routerLink="/doctor/patients">
                    <div class="icon">👥</div>
                    <h3>Mes patients</h3>
                    <p>Consulter les dossiers de mes patients</p>
                </div>
                <div class="action-card profile" *ngIf="currentUser?.role === 'doctor'" routerLink="/doctor/profile">
                    <div class="icon">👤</div>
                    <h3>Mon Profil</h3>
                    <p>Mettre à jour mes informations professionnelles</p>
                </div>

                <!-- Cartes secrétaire -->
                <div class="action-card" *ngIf="currentUser?.role === 'secretary'" routerLink="/secretary/patients">
                    <div class="icon">👥</div>
                    <h3>Patients</h3>
                    <p>Créer et gérer les comptes patients</p>
                </div>
                <div class="action-card" *ngIf="currentUser?.role === 'secretary'" routerLink="/secretary/appointments">
                    <div class="icon">📅</div>
                    <h3>Rendez-vous</h3>
                    <p>Gérer les rendez-vous du cabinet</p>
                </div>
                <div class="action-card" *ngIf="currentUser?.role === 'secretary'" routerLink="/secretary/invoices">
                    <div class="icon">💶</div>
                    <h3>Facturation</h3>
                    <p>Gérer les factures </p>
                </div>

                <!-- Cartes admin -->
                <div class="action-card admin" *ngIf="currentUser?.role === 'admin'" routerLink="/admin">
                    <div class="icon">📊</div>
                    <h3>Statistiques</h3>
                    <p>Tableau de bord administratif</p>
                </div>
                <div class="action-card admin" *ngIf="currentUser?.role === 'admin'" routerLink="/admin/staff">
                    <div class="icon">👨‍⚕️</div>
                    <h3>Personnel</h3>
                    <p>Gérer les médecins et secrétaires</p>
                </div>
                <div class="action-card admin" *ngIf="currentUser?.role === 'admin'" routerLink="/secretary/appointments">
                    <div class="icon">📅</div>
                    <h3>Rendez-vous</h3>
                    <p>Voir tous les rendez-vous du cabinet</p>
                </div>
                <div class="action-card admin" *ngIf="currentUser?.role === 'admin'" routerLink="/secretary/invoices">
                    <div class="icon">💶</div>
                    <h3>Facturation</h3>
                    <p>Voir toutes les factures</p>
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
        .logo { font-size: 1.5rem; font-weight: bold; color: var(--primary); }
        .user-info { display: flex; gap: 1rem; align-items: center; }
        h1 { margin-top: 2rem; }
        .subtitle { color: var(--gray-600); margin-bottom: 2rem; }
        .cards-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 1.5rem;
            margin-top: 2rem;
        }
        .action-card {
            background: white;
            padding: 2rem;
            border-radius: 12px;
            text-align: center;
            cursor: pointer;
            transition: all 0.3s;
            box-shadow: var(--shadow);
        }
        .action-card:hover { transform: translateY(-5px); box-shadow: var(--shadow-lg); }
        .action-card.patient { border-top: 4px solid var(--primary); }
        .action-card.doctor { border-top: 4px solid var(--success); }
        .action-card.profile { border-top: 4px solid var(--primary); }
        .action-card.admin { border-top: 4px solid var(--warning); }
        .icon { font-size: 3rem; margin-bottom: 1rem; }
        h3 { margin-bottom: 0.5rem; }
        p { color: var(--gray-600); }
    `]
})
export class DashboardComponent implements OnInit {
    currentUser: any = null;

    constructor(private authService: AuthService) {}

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => this.currentUser = user);
    }

    logout() {
        this.authService.logout();
    }
}