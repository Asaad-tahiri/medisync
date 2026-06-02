import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { DoctorService } from '../../services/doctor';
import { MedicalRecordService } from '../../services/medical-record';

@Component({
    selector: 'app-patient-profile',
    standalone: true,
    imports: [CommonModule, RouterLink],
    template: `
        <div class="container">
            <div class="page-header">
                <h1>🗂️ Dossier Patient</h1>
                <div class="header-actions">
                    <a routerLink="/doctor/patients" class="btn btn-secondary">👥 Mes patients</a>
                    <a routerLink="/doctor" class="btn btn-secondary">🩺 Consultations</a>
                    <a routerLink="/dashboard" class="btn btn-secondary">🏠 Dashboard</a>
                </div>
            </div>

            <div *ngIf="isLoading" class="card empty-state">Chargement du dossier patient...</div>

            <div *ngIf="!isLoading && !patient" class="card empty-state" style="color:var(--danger)">
                Patient introuvable.
            </div>

            <ng-container *ngIf="!isLoading && patient">
                <div class="card patient-header">
                    <div class="avatar">{{ patient.firstName?.charAt(0) }}{{ patient.lastName?.charAt(0) }}</div>
                    <div>
                        <h2>{{ patient.firstName }} {{ patient.lastName }}</h2>
                        <p class="meta">{{ patient.email }}</p>
                        <p class="meta" *ngIf="patient.phone">📞 {{ patient.phone }}</p>
                        <p class="meta" *ngIf="patient.dateOfBirth">
                            Né(e) le {{ patient.dateOfBirth | date:'dd/MM/yyyy' }}
                        </p>
                    </div>
                </div>

                <div class="card">
                    <h2>Informations médicales</h2>
                    <div class="info-row">
                        <strong>Allergies :</strong>
                        <span *ngIf="patient.allergies?.length">{{ patient.allergies.join(', ') }}</span>
                        <span *ngIf="!patient.allergies?.length" class="none">Aucune renseignée</span>
                    </div>
                    <div class="info-row">
                        <strong>Antécédents :</strong>
                        <span *ngIf="patient.antecedents?.length">{{ patient.antecedents.join(', ') }}</span>
                        <span *ngIf="!patient.antecedents?.length" class="none">Aucun renseigné</span>
                    </div>
                </div>

                <div class="card">
                    <h2>Historique médical ({{ records.length }} consultation(s))</h2>
                    <div *ngIf="records.length === 0" class="none">Aucun dossier médical enregistré.</div>
                    <div *ngFor="let r of records" class="record-item">
                        <div class="record-date">{{ r.createdAt | date:'dd/MM/yyyy' }}</div>
                        <div class="record-body">
                            <p *ngIf="r.doctorId" class="doctor-name">
                                Dr. {{ r.doctorId.firstName }} {{ r.doctorId.lastName }}
                                <small *ngIf="r.doctorId.specialty"> — {{ r.doctorId.specialty }}</small>
                            </p>
                            <p *ngIf="r.symptoms"><strong>Symptômes :</strong> {{ r.symptoms }}</p>
                            <p *ngIf="r.diagnosis"><strong>Diagnostic :</strong> {{ r.diagnosis }}</p>
                            <p *ngIf="r.treatment"><strong>Traitement :</strong> {{ r.treatment }}</p>
                            <p *ngIf="r.notes"><strong>Notes :</strong> {{ r.notes }}</p>
                        </div>
                    </div>
                </div>

                <div class="card">
                    <h2>Ordonnances ({{ prescriptions.length }})</h2>
                    <div *ngIf="prescriptions.length === 0" class="none">Aucune ordonnance.</div>
                    <div *ngFor="let p of prescriptions" class="record-item">
                        <div class="record-date">{{ p.createdAt | date:'dd/MM/yyyy' }}</div>
                        <div class="record-body">
                            <p *ngIf="p.doctorId" class="doctor-name">
                                Dr. {{ p.doctorId.firstName }} {{ p.doctorId.lastName }}
                            </p>
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
            </ng-container>
        </div>
    `,
    styles: [`
        .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
        .patient-header { display: flex; align-items: center; gap: 1.5rem; }
        .avatar {
            width: 64px; height: 64px;
            background: var(--primary);
            color: white;
            border-radius: 50%;
            display: flex; align-items: center; justify-content: center;
            font-size: 1.5rem; font-weight: bold;
            flex-shrink: 0;
        }
        .patient-header h2 { margin: 0 0 0.25rem; }
        .meta { color: var(--gray-600); font-size: 0.9rem; margin: 0.1rem 0; }
        h2 { margin-bottom: 1rem; }
        .info-row { display: flex; gap: 1rem; margin-bottom: 0.75rem; align-items: flex-start; }
        .record-item {
            display: flex;
            gap: 1rem;
            padding: 1rem 0;
            border-bottom: 1px solid var(--gray-200);
        }
        .record-item:last-child { border-bottom: none; }
        .record-date {
            background: var(--primary);
            color: white;
            padding: 0.5rem;
            border-radius: 6px;
            font-size: 0.85rem;
            text-align: center;
            min-width: 90px;
            height: fit-content;
        }
        .record-body { flex: 1; }
        .record-body p { margin-bottom: 0.4rem; }
        .doctor-name { color: var(--primary); font-weight: 500; }
        .none { color: var(--gray-600); font-style: italic; }
        .empty-state { text-align: center; color: var(--gray-600); padding: 3rem; }
        ul { margin-left: 1.5rem; margin-top: 0.5rem; }
        li { margin-bottom: 0.25rem; }
        .header-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; }
    `]
})
export class PatientProfileComponent implements OnInit {
    patient: any = null;
    records: any[] = [];
    prescriptions: any[] = [];
    isLoading = true;

    constructor(
        private route: ActivatedRoute,
        private doctorService: DoctorService,
        private medicalRecordService: MedicalRecordService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        const patientId = this.route.snapshot.paramMap.get('id')!;
        this.loadAll(patientId);
    }

    loadAll(patientId: string) {
    this.doctorService.getPatient(patientId).subscribe({
        next: (p: any) => {
            this.patient = p;
            this.isLoading = false;
            this.cdr.detectChanges();

            this.medicalRecordService.getRecords(patientId).subscribe({
                next: (r: any[]) => {
                    this.records = r;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.records = [];
                    this.cdr.detectChanges();
                }
            });

            this.medicalRecordService.getPrescriptions(patientId).subscribe({
                next: (p: any[]) => {
                    this.prescriptions = p;
                    this.cdr.detectChanges();
                },
                error: () => {
                    this.prescriptions = [];
                    this.cdr.detectChanges();
                }
            });
        },
        error: () => {
            this.patient = null;
            this.isLoading = false;
            this.cdr.detectChanges();
        }
    });
}
}
