import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment';
import { DoctorService } from '../../services/doctor';

@Component({
    selector: 'app-appointment',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <div class="container">
            <h1>📅 Mes Rendez-vous</h1>

            <!-- Pas de médecin sélectionné -->
            <div *ngIf="!doctorId" class="card no-doctor">
                <p>⚠️ Aucun médecin sélectionné.</p>
                <a routerLink="/doctors" class="btn btn-primary">Rechercher un médecin</a>
            </div>

            <!-- Flow de réservation -->
            <div *ngIf="doctorId" class="card">
                <h2>Prendre un rendez-vous</h2>

                <!-- Message global -->
                <div *ngIf="message" class="alert"
                     [class.alert-success]="isSuccess"
                     [class.alert-error]="!isSuccess">
                    {{ message }}
                </div>

                <!-- ÉTAPE 1 : Médecin sélectionné -->
                <div class="step">
                    <div class="step-header">
                        <span class="step-num">1</span>
                        <h3>Médecin sélectionné</h3>
                    </div>

                    <div *ngIf="loadingDoctor" class="loading-text">Chargement...</div>

                    <div *ngIf="!loadingDoctor && selectedDoctor" class="doctor-summary">
                        <div class="avatar">{{ getInitials(selectedDoctor) }}</div>
                        <div class="doctor-info">
                            <strong>Dr. {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}</strong>
                            <span class="specialty" *ngIf="selectedDoctor.specialty">{{ selectedDoctor.specialty }}</span>
                            <div class="meta">
                                <span *ngIf="selectedDoctor.city">📍 {{ selectedDoctor.city }}</span>
                                <span *ngIf="selectedDoctor.consultationFee">💶 {{ selectedDoctor.consultationFee }} DH</span>
                            </div>
                        </div>
                        <a routerLink="/doctors" class="btn-change">Changer</a>
                    </div>

                    <div *ngIf="!loadingDoctor && !selectedDoctor" class="alert alert-error">
                        Médecin introuvable.
                        <a routerLink="/doctors">Retour à la recherche</a>
                    </div>
                </div>

                <!-- ÉTAPE 2 : Date + créneau -->
                <div class="step" *ngIf="selectedDoctor">
                    <div class="step-header">
                        <span class="step-num">2</span>
                        <h3>Choisir une date et un créneau</h3>
                    </div>

                    <div class="form-group">
                        <label>Date du rendez-vous</label>
                        <input type="date"
                               [(ngModel)]="selectedDate"
                               name="date"
                               [min]="minDate"
                               (change)="onDateChange()">
                    </div>

                    <div *ngIf="selectedDate" class="slots-section">
                        <label>Créneaux disponibles</label>

                        <div *ngIf="loadingSlots" class="loading-text">⏳ Recherche des créneaux...</div>

                        <div *ngIf="!loadingSlots && availableSlots.length === 0" class="empty-slots">
                            Aucun créneau disponible ce jour. Essayez une autre date.
                        </div>

                        <div *ngIf="!loadingSlots && availableSlots.length > 0" class="slots-grid">
                            <button type="button"
                                    *ngFor="let slot of availableSlots"
                                    class="slot-btn"
                                    [class.selected]="selectedSlot === slot"
                                    (click)="selectSlot(slot)">
                                {{ slot }}
                            </button>
                        </div>
                    </div>
                </div>

                <!-- ÉTAPE 3 : Détails -->
                <div class="step" *ngIf="selectedSlot">
                    <div class="step-header">
                        <span class="step-num">3</span>
                        <h3>Détails du rendez-vous</h3>
                    </div>

                    <div class="form-group">
                        <label>Durée</label>
                        <select [(ngModel)]="duration" name="duration">
                            <option value="15">15 minutes (consultation rapide)</option>
                            <option value="30">30 minutes (consultation standard)</option>
                            <option value="60">60 minutes (consultation approfondie)</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Motif</label>
                        <select [(ngModel)]="motif" name="motif">
                            <option value="consultation">Consultation générale</option>
                            <option value="suivi">Suivi</option>
                            <option value="urgence">Urgence</option>
                            <option value="bilan">Bilan</option>
                        </select>
                    </div>

                    <div class="form-group">
                        <label>Décrivez votre demande (optionnel)</label>
                        <textarea [(ngModel)]="notes"
                                  name="notes"
                                  rows="3"
                                  placeholder="Symptômes, raison de la visite, questions à aborder..."></textarea>
                    </div>

                    <div class="recap">
                        <strong>Récapitulatif :</strong>
                        Dr. {{ selectedDoctor.firstName }} {{ selectedDoctor.lastName }}
                        — le {{ formatDate(selectedDate) }} à {{ selectedSlot }} ({{ duration }} min)
                    </div>

                    <button type="button"
                            class="btn btn-primary"
                            [disabled]="isLoading"
                            (click)="confirmAppointment()">
                        {{ isLoading ? 'Enregistrement...' : '✓ Confirmer le rendez-vous' }}
                    </button>
                </div>
            </div>

            <!-- Liste des RDV à venir -->
            <div class="card">
                <h2>Mes prochains rendez-vous</h2>
                <div *ngIf="appointments.length === 0" class="empty-list">Aucun rendez-vous prévu.</div>

                <div *ngFor="let appt of appointments" class="appointment-item">
                    <div class="appt-date">{{ appt.dateTime | date:'dd/MM/yyyy HH:mm' }}</div>
                    <div class="appt-info">
                        <strong>Dr. {{ appt.doctorId?.firstName }} {{ appt.doctorId?.lastName }}</strong>
                        <p>Motif : {{ appt.motif }} | Durée : {{ appt.duration }} min</p>
                    </div>
                    <span class="status" [class.confirme]="appt.status === 'scheduled'">
                        {{ appt.status }}
                    </span>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .no-doctor {
            text-align: center;
            padding: 2rem;
        }
        .no-doctor p {
            margin-bottom: 1rem;
            color: var(--gray-600);
        }

        .step {
            border-top: 1px solid var(--gray-200);
            padding: 1.5rem 0;
        }
        .step:first-of-type { border-top: none; padding-top: 0; }

        .step-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            margin-bottom: 1rem;
        }
        .step-num {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            border-radius: 50%;
            background: var(--primary);
            color: white;
            font-weight: bold;
            font-size: 0.9rem;
        }
        .step-header h3 { margin: 0; font-size: 1.1rem; }

        /* Médecin sélectionné */
        .doctor-summary {
            display: flex;
            align-items: center;
            gap: 1rem;
            background: var(--gray-100, #f5f6f8);
            padding: 1rem;
            border-radius: 8px;
        }
        .avatar {
            width: 50px; height: 50px;
            border-radius: 50%;
            background: linear-gradient(135deg, #2196f3, #1565c0);
            color: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold;
            flex-shrink: 0;
        }
        .doctor-info { flex: 1; display: flex; flex-direction: column; gap: 0.25rem; }
        .doctor-info .specialty {
            display: inline-block;
            background: #e3f2fd;
            color: #1565c0;
            padding: 0.15rem 0.6rem;
            border-radius: 12px;
            font-size: 0.78rem;
            font-weight: 600;
            width: fit-content;
        }
        .doctor-info .meta {
            display: flex; gap: 1rem;
            font-size: 0.85rem; color: #555;
            margin-top: 0.25rem;
        }
        .btn-change {
            background: white;
            border: 1px solid #d6dbe3;
            padding: 0.4rem 0.9rem;
            border-radius: 6px;
            color: #334;
            text-decoration: none;
            font-size: 0.85rem;
        }
        .btn-change:hover { background: #f0f3f7; }

        /* Créneaux */
        .slots-section { margin-top: 1rem; }
        .slots-section label {
            display: block;
            font-weight: 600;
            margin-bottom: 0.5rem;
            color: #334;
        }
        .slots-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
            gap: 0.5rem;
        }
        .slot-btn {
            padding: 0.6rem;
            border: 1px solid #d6dbe3;
            background: white;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.15s;
        }
        .slot-btn:hover {
            border-color: var(--primary);
            background: #f0f7ff;
        }
        .slot-btn.selected {
            background: var(--primary);
            color: white;
            border-color: var(--primary);
        }

        .empty-slots, .loading-text, .empty-list {
            padding: 1rem;
            color: #888;
            font-style: italic;
            text-align: center;
        }

        textarea {
            width: 100%;
            padding: 0.65rem 0.85rem;
            border: 1px solid #d6dbe3;
            border-radius: 6px;
            font-size: 0.95rem;
            font-family: inherit;
            resize: vertical;
            box-sizing: border-box;
        }
        textarea:focus { outline: none; border-color: var(--primary); }

        .recap {
            background: #e8f5e9;
            color: #2e7d32;
            padding: 0.85rem 1rem;
            border-radius: 6px;
            margin: 1rem 0;
            font-size: 0.95rem;
            border-left: 4px solid #4caf50;
        }

        /* Liste RDV existante */
        .appointment-item {
            display: flex;
            align-items: center;
            padding: 1rem;
            border-bottom: 1px solid var(--gray-200);
            gap: 1rem;
        }
        .appt-date {
            background: var(--primary);
            color: white;
            padding: 0.75rem;
            border-radius: 8px;
            text-align: center;
            min-width: 120px;
            font-size: 0.9rem;
        }
        .appt-info { flex: 1; }
        .status {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            background: var(--warning);
            color: white;
            font-size: 0.85rem;
        }
        .status.confirme { background: var(--success); }
    `]
})
export class AppointmentComponent implements OnInit {
    // Médecin sélectionné
    doctorId: string | null = null;
    selectedDoctor: any = null;
    loadingDoctor = false;

    // Date & créneaux
    selectedDate = '';
    availableSlots: string[] = [];
    selectedSlot = '';
    loadingSlots = false;
    minDate = new Date().toISOString().split('T')[0];

    // Détails du RDV
    duration = '30';
    motif = 'consultation';
    notes = '';

    // UI
    message = '';
    isSuccess = false;
    isLoading = false;

    // Liste existante
    appointments: any[] = [];

    constructor(
        private appointmentService: AppointmentService,
        private doctorService: DoctorService,
        private route: ActivatedRoute,
        private router: Router,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.doctorId = this.route.snapshot.queryParamMap.get('doctorId');
        if (this.doctorId) {
            this.loadDoctorInfo();
        }
        this.loadAppointments();
    }

    loadDoctorInfo() {
        this.loadingDoctor = true;
        this.doctorService.searchDoctors().subscribe({
            next: (doctors) => {
                this.selectedDoctor = doctors.find((d: any) => d._id === this.doctorId) || null;
                this.loadingDoctor = false;
                this.cdr.detectChanges(); // ← ajout
            },
            error: () => {
                this.loadingDoctor = false;
                this.selectedDoctor = null;
                this.cdr.detectChanges(); // ← ajout
            }
        });
    }

    loadAppointments() {
        this.appointmentService.getAppointments().subscribe({
            next: (data) => { this.appointments = data; },
            error: (err) => console.error('Erreur chargement RDV:', err)
        });
    }

    onDateChange() {
        this.selectedSlot = '';
        this.availableSlots = [];
        if (!this.selectedDate || !this.doctorId) return;

        this.loadingSlots = true;
        this.appointmentService.getAvailableSlots(this.doctorId, this.selectedDate).subscribe({
            next: (slots: any[]) => {
                // Le backend renvoie [{ time, available }, ...] — on garde uniquement les libres
                this.availableSlots = slots
                    .filter(s => s.available)
                    .map(s => s.time);
                this.loadingSlots = false;
            },
            error: () => {
                this.loadingSlots = false;
                this.availableSlots = [];
                this.message = 'Impossible de charger les créneaux.';
                this.isSuccess = false;
            }
        });
    }

    selectSlot(slot: string) {
        this.selectedSlot = slot;
    }

    confirmAppointment() {
        if (!this.doctorId || !this.selectedDate || !this.selectedSlot) return;

        this.isLoading = true;
        this.message = '';

        // Construction de la dateTime ISO : "2026-05-23T14:30:00"
        const dateTime = `${this.selectedDate}T${this.selectedSlot}:00`;

        const payload = {
            doctorId: this.doctorId,
            dateTime,
            duration: Number(this.duration),
            motif: this.motif,
            notes: this.notes.trim()
        };

        this.appointmentService.createAppointment(payload).subscribe({
            next: () => {
                this.isLoading = false;
                this.message = '✓ Rendez-vous confirmé !';
                this.isSuccess = true;
                this.resetForm();
                this.loadAppointments();
                this.cdr.detectChanges(); // ← celui-là
            },
            error: (err) => {
                this.isLoading = false;
                this.message = err.error?.message || err.error?.error || 'Erreur lors de la création du rendez-vous.';
                this.isSuccess = false;
            }
        });
    }

    private resetForm() {
        this.selectedDate = '';
        this.selectedSlot = '';
        this.availableSlots = [];
        this.duration = '30';
        this.motif = 'consultation';
        this.notes = '';
    }

    getInitials(doc: any): string {
        const f = (doc.firstName || '').charAt(0).toUpperCase();
        const l = (doc.lastName || '').charAt(0).toUpperCase();
        return f + l || '?';
    }

    formatDate(date: string): string {
        if (!date) return '';
        return new Date(date).toLocaleDateString('fr-FR', {
            weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
        });
    }
}