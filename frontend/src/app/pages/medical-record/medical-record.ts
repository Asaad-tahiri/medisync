import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth';
import { MedicalRecordService } from '../../services/medical-record';
import { AppointmentService } from '../../services/appointment';
import { jsPDF } from 'jspdf';

@Component({
    selector: 'app-medical-record',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="container">
            <h1>📋 Mon Dossier Médical</h1>

            <!-- Informations générales -->
            <div class="card">
                <h2>Informations générales</h2>
                <div *ngIf="isLoadingProfile" class="loading">Chargement...</div>
                <div *ngIf="!isLoadingProfile" class="info-grid">
                    <div><strong>Allergies :</strong></div>
                    <div>{{ profile.allergies?.length ? profile.allergies.join(', ') : 'Aucune renseignée' }}</div>
                    <div><strong>Antécédents :</strong></div>
                    <div>{{ profile.antecedents?.length ? profile.antecedents.join(', ') : 'Aucun renseigné' }}</div>
                </div>
            </div>

            <!-- Mes rendez-vous -->
            <div class="card">
                <h2>Mes rendez-vous</h2>
                <div *ngIf="isLoadingAppts" class="loading">Chargement...</div>
                <div *ngIf="!isLoadingAppts && appointments.length === 0" class="none">
                    Aucun rendez-vous prévu.
                </div>
                <div *ngFor="let appt of appointments" class="appt-item">
                    <div class="appt-date">{{ appt.dateTime | date:'dd/MM/yyyy à HH:mm' }}</div>
                    <div class="appt-info">
                        <strong>Dr. {{ appt.doctorId?.firstName }} {{ appt.doctorId?.lastName }}</strong>
                        <span *ngIf="appt.doctorId?.specialty" class="specialty"> — {{ appt.doctorId.specialty }}</span>
                        <p class="appt-meta">Motif : {{ appt.motif }} · Durée : {{ appt.duration }} min</p>
                    </div>
                    <div class="appt-actions">
                        <span class="status" [class.scheduled]="appt.status === 'scheduled' && !isPast(appt)"
                                            [class.completed]="appt.status === 'completed'"
                                            [class.cancelled]="appt.status === 'cancelled'"
                                            [class.past]="isPast(appt)">
                            {{ statusLabel(appt) }}
                        </span>
                        <button *ngIf="appt.status === 'scheduled' && !isPast(appt)"
                                class="btn-cancel"
                                (click)="cancelAppointment(appt)"
                                [disabled]="cancellingId === appt._id">
                            {{ cancellingId === appt._id ? 'Annulation...' : 'Annuler' }}
                        </button>
                    </div>
                </div>
            </div>

            <!-- Historique consultations -->
            <div class="card">
                <h2>Historique des consultations</h2>
                <div *ngIf="isLoadingRecords" class="loading">Chargement...</div>
                <div *ngIf="!isLoadingRecords && records.length === 0" class="none">
                    Aucune consultation enregistrée.
                </div>
                <div *ngFor="let r of records" class="consultation">
                    <div class="consultation-header">
                        <h3>{{ r.createdAt | date:'dd/MM/yyyy' }}</h3>
                        <button class="btn btn-primary btn-small" (click)="downloadRecord(r)">
                            📄 Télécharger
                        </button>
                    </div>
                    <p *ngIf="r.doctorId">
                        <strong>Médecin :</strong> Dr. {{ r.doctorId.firstName }} {{ r.doctorId.lastName }}
                        <span *ngIf="r.doctorId.specialty"> — {{ r.doctorId.specialty }}</span>
                    </p>
                    <p *ngIf="r.symptoms"><strong>Symptômes :</strong> {{ r.symptoms }}</p>
                    <p *ngIf="r.diagnosis"><strong>Diagnostic :</strong> {{ r.diagnosis }}</p>
                    <p *ngIf="r.treatment"><strong>Traitement :</strong> {{ r.treatment }}</p>
                    <p *ngIf="r.notes"><strong>Notes :</strong> {{ r.notes }}</p>
                </div>
            </div>

            <!-- Ordonnances -->
            <div class="card">
                <h2>Ordonnances</h2>
                <div *ngIf="isLoadingPresc" class="loading">Chargement...</div>
                <div *ngIf="!isLoadingPresc && prescriptions.length === 0" class="none">
                    Aucune ordonnance.
                </div>
                <div *ngFor="let p of prescriptions" class="consultation">
                    <div class="consultation-header">
                        <h3>{{ p.createdAt | date:'dd/MM/yyyy' }}</h3>
                        <span *ngIf="p.doctorId" class="doctor-tag">
                            Dr. {{ p.doctorId.firstName }} {{ p.doctorId.lastName }}
                        </span>
                    </div>
                    <ul>
                        <li *ngFor="let m of p.medicines">
                            <strong>{{ m.name }}</strong>
                            <span *ngIf="m.dosage"> — {{ m.dosage }}</span>
                            <span *ngIf="m.frequency"> · {{ m.frequency }}</span>
                            <span *ngIf="m.duration"> · {{ m.duration }}</span>
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .info-grid { display: grid; grid-template-columns: 150px 1fr; gap: 0.75rem; }
        h2 { margin-bottom: 1rem; }
        .consultation {
            padding: 1.25rem;
            border-left: 4px solid var(--primary);
            background: var(--gray-50);
            margin-bottom: 1rem;
            border-radius: 8px;
        }
        .consultation p { margin-bottom: 0.4rem; }
        .consultation-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }
        .consultation-header h3 { margin: 0; }
        .btn-small { padding: 0.5rem 1rem; font-size: 0.9rem; }
        .doctor-tag { color: var(--primary); font-size: 0.9rem; }
        ul { margin-left: 1.5rem; margin-top: 0.5rem; }
        li { margin-bottom: 0.25rem; }
        .none { color: var(--gray-600); font-style: italic; }
        .loading { text-align: center; color: var(--gray-600); padding: 1rem; }

        /* Rendez-vous */
        .appt-item {
            display: flex;
            align-items: center;
            gap: 1rem;
            padding: 1rem;
            border-bottom: 1px solid var(--gray-200);
        }
        .appt-item:last-child { border-bottom: none; }
        .appt-date {
            background: var(--primary);
            color: white;
            padding: 0.6rem 0.75rem;
            border-radius: 8px;
            text-align: center;
            min-width: 140px;
            font-size: 0.85rem;
            font-weight: 600;
        }
        .appt-info { flex: 1; }
        .appt-info .specialty { color: var(--gray-600); font-weight: normal; }
        .appt-meta { color: var(--gray-600); font-size: 0.9rem; margin: 0.3rem 0 0; }
        .appt-actions {
            display: flex;
            flex-direction: column;
            align-items: flex-end;
            gap: 0.5rem;
        }
        .status {
            padding: 0.25rem 0.75rem;
            border-radius: 20px;
            font-size: 0.8rem;
            color: white;
            background: #999;
        }
        .status.scheduled { background: #f5a623; }
        .status.completed { background: #4caf50; }
        .status.cancelled { background: #e57373; }
        .status.past { background: #9e9e9e; }
        .btn-cancel {
            background: white;
            color: #c62828;
            border: 1px solid #e57373;
            padding: 0.35rem 0.8rem;
            border-radius: 6px;
            cursor: pointer;
            font-size: 0.85rem;
            transition: all 0.15s;
        }
        .btn-cancel:hover:not(:disabled) {
            background: #ffebee;
        }
        .btn-cancel:disabled {
            opacity: 0.6;
            cursor: not-allowed;
        }
    `]
})
export class MedicalRecordComponent implements OnInit {
    profile: any = {};
    records: any[] = [];
    prescriptions: any[] = [];
    appointments: any[] = [];

    isLoadingProfile = true;
    isLoadingRecords = true;
    isLoadingPresc = true;
    isLoadingAppts = true;

    cancellingId: string | null = null;

    constructor(
        private authService: AuthService,
        private medicalRecordService: MedicalRecordService,
        private appointmentService: AppointmentService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.authService.currentUser$.subscribe(user => {
            if (!user) return;
            this.profile = user;
            this.isLoadingProfile = false;
            this.cdr.detectChanges();

            this.loadRecords(user._id);
            this.loadPrescriptions(user._id);
            this.loadAppointments();
        });
    }

    loadRecords(userId: string) {
        this.medicalRecordService.getRecords(userId).subscribe({
            next: (r: any[]) => {
                this.records = r || [];
                this.isLoadingRecords = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.records = [];
                this.isLoadingRecords = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadPrescriptions(userId: string) {
        this.medicalRecordService.getPrescriptions(userId).subscribe({
            next: (p: any[]) => {
                this.prescriptions = p || [];
                this.isLoadingPresc = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.prescriptions = [];
                this.isLoadingPresc = false;
                this.cdr.detectChanges();
            }
        });
    }

    loadAppointments() {
        this.appointmentService.getAppointments().subscribe({
            next: (data: any) => {
                this.appointments = (data || []).sort((a: any, b: any) =>
                    new Date(a.dateTime).getTime() - new Date(b.dateTime).getTime()
                );
                this.isLoadingAppts = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.appointments = [];
                this.isLoadingAppts = false;
                this.cdr.detectChanges();
            }
        });
    }

    cancelAppointment(appt: any) {
        if (!confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) return;

        this.cancellingId = appt._id;
        this.cdr.detectChanges();

        this.appointmentService.updateAppointment(appt._id, { status: 'cancelled' }).subscribe({
            next: () => {
                appt.status = 'cancelled';
                this.cancellingId = null;
                this.cdr.detectChanges();
            },
            error: () => {
                this.cancellingId = null;
                alert("Erreur lors de l'annulation. Veuillez réessayer.");
                this.cdr.detectChanges();
            }
        });
    }

    statusLabel(appt: any): string {
    // Si le RDV est "scheduled" mais que la date est passée → "Passé"
    if (appt.status === 'scheduled' && new Date(appt.dateTime) < new Date()) {
        return 'Passé';
    }
    const map: Record<string, string> = {
        scheduled: 'Programmé',
        completed: 'Terminé',
        cancelled: 'Annulé',
        'no-show': 'Absent'
    };
    return map[appt.status] || appt.status;
    }

    isPast(appt: any): boolean {
        return appt.status === 'scheduled' && new Date(appt.dateTime) < new Date();
    }
    downloadRecord(record: any) {
        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.setTextColor(14, 165, 233);
        doc.text('MediSync — Compte rendu de consultation', 20, 20);

        doc.setFontSize(12);
        doc.setTextColor(0, 0, 0);
        doc.text('Date : ' + new Date(record.createdAt).toLocaleDateString('fr-FR'), 20, 35);
        if (record.doctorId) {
            doc.text(`Médecin : Dr. ${record.doctorId.firstName} ${record.doctorId.lastName}`, 20, 45);
            if (record.doctorId.specialty) {
                doc.text(`Spécialité : ${record.doctorId.specialty}`, 20, 55);
            }
        }

        doc.setDrawColor(14, 165, 233);
        doc.line(20, 62, 190, 62);

        let y = 75;
        const addLine = (label: string, value: string) => {
            if (!value) return;
            doc.setFontSize(11);
            doc.setTextColor(80, 80, 80);
            doc.text(label, 20, y);
            doc.setTextColor(0, 0, 0);
            const lines = doc.splitTextToSize(value, 155);
            doc.text(lines, 20, y + 8);
            y += 8 + lines.length * 7 + 4;
        };

        addLine('Symptômes :', record.symptoms);
        addLine('Diagnostic :', record.diagnosis);
        addLine('Traitement :', record.treatment);
        addLine('Notes :', record.notes);

        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Document généré automatiquement par MediSync', 20, 280);

        doc.save('consultation_' + new Date(record.createdAt).getTime() + '.pdf');
    }
}