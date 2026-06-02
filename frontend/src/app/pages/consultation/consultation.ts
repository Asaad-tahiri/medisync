import { Component, OnInit, ChangeDetectorRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AppointmentService } from '../../services/appointment';
import { MedicalRecordService } from '../../services/medical-record';

interface Medicine {
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
}

interface Template {
    label: string;
    symptoms: string;
    diagnosis: string;
    treatment: string;
}

@Component({
    selector: 'app-consultation',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './consultation.html',
    styleUrls: ['./consultation.css']
})
export class ConsultationComponent implements OnInit {
    appointment: any = null;
    patient: any = null;
    isLoading = true;
    isSaving = false;
    notFound = false;

    // Compte-rendu
    symptoms = '';
    diagnosis = '';
    treatment = '';
    notes = '';

    // Ordonnance
    medicines: Medicine[] = [];

    // UI
    errorMessage = '';

    // Templates pré-remplis
    templates: Template[] = [
        {
            label: '🤒 Grippe saisonnière',
            symptoms: 'Fièvre, courbatures, toux sèche, fatigue, maux de tête.',
            diagnosis: 'Syndrome grippal.',
            treatment: 'Repos, hydratation abondante, paracétamol si fièvre. Surveillance pendant 5-7 jours.'
        },
        {
            label: '💓 Suivi hypertension',
            symptoms: 'Patient asymptomatique, suivi régulier.',
            diagnosis: 'HTA essentielle stabilisée sous traitement.',
            treatment: 'Poursuite du traitement antihypertenseur. Contrôle tensionnel à 3 mois.'
        },
        {
            label: '🔄 Renouvellement ordonnance',
            symptoms: 'État clinique stable, pas de nouveaux symptômes.',
            diagnosis: 'Renouvellement de traitement chronique.',
            treatment: 'Poursuite du traitement habituel à dose équivalente.'
        },
        {
            label: '📋 Bilan annuel',
            symptoms: 'Aucun symptôme particulier, consultation de prévention.',
            diagnosis: 'Bilan de santé annuel.',
            treatment: 'Hygiène de vie, alimentation équilibrée, activité physique régulière. Bilan biologique demandé.'
        }
    ];

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private appointmentService: AppointmentService,
        private medicalRecordService: MedicalRecordService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        const apptId = this.route.snapshot.paramMap.get('id');
        if (!apptId) {
            this.notFound = true;
            this.isLoading = false;
            return;
        }
        this.loadAppointment(apptId);
    }

    loadAppointment(apptId: string) {
        this.appointmentService.getAppointments().subscribe({
            next: (appts: any[]) => {
                this.appointment = (appts || []).find(a => a._id === apptId);
                if (!this.appointment) {
                    this.notFound = true;
                } else {
                    this.patient = this.appointment.patientId;
                }
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.notFound = true;
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    applyTemplate(tpl: Template) {
        if (this.hasContent() && !confirm('Appliquer ce modèle remplacera votre contenu actuel. Continuer ?')) {
            return;
        }
        this.symptoms = tpl.symptoms;
        this.diagnosis = tpl.diagnosis;
        this.treatment = tpl.treatment;
    }

    addMedicine() {
        this.medicines.push({ name: '', dosage: '', frequency: '', duration: '' });
    }

    removeMedicine(index: number) {
        this.medicines.splice(index, 1);
    }

    /** Vérifie si du contenu a été saisi (pour la confirmation avant départ) */
    hasContent(): boolean {
        return !!(this.symptoms || this.diagnosis || this.treatment || this.notes ||
                  this.medicines.some(m => m.name || m.dosage || m.frequency || m.duration));
    }

    /** Confirmation avant de quitter la page si du contenu non sauvegardé */
    @HostListener('window:beforeunload', ['$event'])
    onBeforeUnload(event: BeforeUnloadEvent) {
        if (this.hasContent() && !this.isSaving) {
            event.preventDefault();
            event.returnValue = '';
        }
    }

    cancel() {
        if (this.hasContent() &&
            !confirm('Vous avez des données non sauvegardées. Vraiment quitter sans enregistrer ?')) {
            return;
        }
        this.router.navigate(['/doctor']);
    }

    completeConsultation() {
        // Validation
        if (!this.diagnosis.trim()) {
            this.errorMessage = 'Le diagnostic est obligatoire pour terminer la consultation.';
            this.cdr.detectChanges();
            return;
        }

        // Filtrer les médicaments incomplets
        const validMedicines = this.medicines.filter(m =>
            m.name.trim() && m.dosage.trim() && m.frequency.trim() && m.duration.trim()
        );
        const hasInvalidMedicines = this.medicines.length > 0 && validMedicines.length !== this.medicines.length;

        if (hasInvalidMedicines &&
            !confirm(`${this.medicines.length - validMedicines.length} médicament(s) incomplet(s) seront ignorés. Continuer ?`)) {
            return;
        }

        this.errorMessage = '';
        this.isSaving = true;
        this.cdr.detectChanges();

        // Étape 1 : créer le compte-rendu
        const recordPayload = {
            patientId: this.patient._id,
            appointmentId: this.appointment._id,
            symptoms: this.symptoms.trim(),
            diagnosis: this.diagnosis.trim(),
            treatment: this.treatment.trim(),
            notes: this.notes.trim()
        };

        this.medicalRecordService.createRecord(recordPayload).subscribe({
            next: (record: any) => {
                // Étape 2 : créer la prescription si médicaments
                if (validMedicines.length > 0) {
                    this.createPrescription(record._id, validMedicines);
                } else {
                    this.markAppointmentCompleted();
                }
            },
            error: (err: any) => {
                this.isSaving = false;
                this.errorMessage = err.error?.message || err.error?.error || 'Erreur lors de la création du compte-rendu.';
                this.cdr.detectChanges();
            }
        });
    }

    private createPrescription(medicalRecordId: string, medicines: Medicine[]) {
        const payload = {
            medicalRecordId,
            patientId: this.patient._id,
            medicines
        };
        this.medicalRecordService.createPrescription(payload).subscribe({
            next: () => this.markAppointmentCompleted(),
            error: (err: any) => {
                this.isSaving = false;
                this.errorMessage = 'Compte-rendu sauvegardé mais erreur sur l\'ordonnance : ' +
                                    (err.error?.message || 'erreur inconnue');
                this.cdr.detectChanges();
            }
        });
    }

    private markAppointmentCompleted() {
        this.appointmentService.updateAppointment(this.appointment._id, { status: 'completed' }).subscribe({
            next: () => {
                this.isSaving = false;
                // Vider le contenu pour éviter l'alerte beforeunload
                this.symptoms = this.diagnosis = this.treatment = this.notes = '';
                this.medicines = [];
                this.router.navigate(['/doctor']);
            },
            error: () => {
                this.isSaving = false;
                this.errorMessage = 'Compte-rendu et ordonnance sauvegardés, mais erreur lors de la mise à jour du statut.';
                this.cdr.detectChanges();
            }
        });
    }

    getAge(dateOfBirth: string): string {
        if (!dateOfBirth) return '';
        const age = new Date().getFullYear() - new Date(dateOfBirth).getFullYear();
        return `${age} ans`;
    }

    motifLabel(motif: string): string {
        const map: Record<string, string> = {
            consultation: 'Consultation', suivi: 'Suivi', urgence: 'URGENCE', bilan: 'Bilan'
        };
        return map[motif] || motif;
    }
}