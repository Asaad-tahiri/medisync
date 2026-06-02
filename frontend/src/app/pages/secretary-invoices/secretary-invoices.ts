import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';
import { SecretaryService } from '../../services/secretary';
import { DoctorService } from '../../services/doctor';
import { jsPDF } from 'jspdf';

interface InvoiceItem {
    description: string;
    amount: number;
}

@Component({
    selector: 'app-secretary-invoices',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
        <nav class="navbar">
            <a routerLink="/dashboard" class="logo">🏥 MediSync</a>
            <div class="nav-actions">
                <a routerLink="/secretary/patients" class="nav-link">👥 Patients</a>
                <a routerLink="/secretary/appointments" class="nav-link">📅 Rendez-vous</a>
                <a routerLink="/dashboard" class="nav-link">🏠 Dashboard</a>
                <button class="btn btn-danger" (click)="logout()">Déconnexion</button>
            </div>
        </nav>

        <div class="container">
            <div class="page-header">
                <div>
                    <h1>💶 Facturation</h1>
                    <p class="subtitle" *ngIf="!isLoading">
                        {{ filteredInvoices.length }} facture(s)
                        — {{ totalUnpaid | number:'1.2-2' }} DH impayé(s)
                    </p>
                </div>
                <button class="btn btn-primary" (click)="openCreateModal()">+ Nouvelle facture</button>
            </div>

            <!-- Filtres -->
            <div class="filters-card">
                <div class="filters-grid">
                    <div class="filter-group">
                        <label>Statut</label>
                        <select [(ngModel)]="filterStatus" (change)="applyFilters()">
                            <option value="">Tous</option>
                            <option value="unpaid">Impayées</option>
                            <option value="paid">Payées</option>
                        </select>
                    </div>
                    <div class="filter-group">
                        <label>Patient</label>
                        <input type="text" [(ngModel)]="filterPatient" (ngModelChange)="applyFilters()"
                               placeholder="Rechercher...">
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
                        <button type="button" class="btn-reset" (click)="resetFilters()">↺ Réinitialiser</button>
                    </div>
                </div>
            </div>

            <!-- Liste -->
            <div *ngIf="isLoading" class="card empty-state">Chargement...</div>

            <div *ngIf="!isLoading && filteredInvoices.length === 0" class="card empty-state">
                <p *ngIf="allInvoices.length === 0">📭 Aucune facture. Créez la première !</p>
                <p *ngIf="allInvoices.length > 0">Aucune facture ne correspond aux filtres.</p>
            </div>

            <div *ngIf="!isLoading && filteredInvoices.length > 0" class="invoices-table card">
                <table>
                    <thead>
                        <tr>
                            <th>N° / Date</th>
                            <th>Patient</th>
                            <th>Médecin</th>
                            <th>Articles</th>
                            <th>Total</th>
                            <th>Statut</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let inv of filteredInvoices" [class.row-paid]="inv.status === 'paid'">
                            <td>
                                <strong class="invoice-num">#{{ shortId(inv._id) }}</strong>
                                <small>{{ inv.createdAt | date:'dd/MM/yyyy' }}</small>
                            </td>
                            <td>
                                <div class="patient-cell">
                                    <div class="avatar">{{ initials(inv.patientId) }}</div>
                                    <strong>{{ inv.patientId?.firstName }} {{ inv.patientId?.lastName }}</strong>
                                </div>
                            </td>
                            <td>Dr. {{ inv.doctorId?.firstName }} {{ inv.doctorId?.lastName }}</td>
                            <td>{{ inv.items?.length || 0 }} article(s)</td>
                            <td><strong>{{ inv.totalAmount | number:'1.2-2' }} DH</strong></td>
                            <td>
                                <span class="status-badge" [class.paid]="inv.status === 'paid'"
                                                          [class.unpaid]="inv.status === 'unpaid'">
                                    {{ inv.status === 'paid' ? '✓ Payée' : '⌛ Impayée' }}
                                </span>
                            </td>
                            <td>
                                <div class="actions">
                                    <button class="btn-mini" (click)="downloadPDF(inv)" title="Télécharger PDF">
                                        📄
                                    </button>
                                    <button class="btn-mini" (click)="toggleStatus(inv)"
                                            [disabled]="updatingId === inv._id"
                                            [title]="inv.status === 'paid' ? 'Marquer impayée' : 'Marquer payée'">
                                        {{ inv.status === 'paid' ? '↩' : '✓' }}
                                    </button>
                                </div>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- MODAL : créer une facture -->
            <div *ngIf="showCreateModal" class="modal-overlay" (click)="closeCreateModal()">
                <div class="modal" (click)="$event.stopPropagation()">
                    <div class="modal-header">
                        <h2>➕ Nouvelle facture</h2>
                        <button class="btn-close" (click)="closeCreateModal()">×</button>
                    </div>

                    <div class="modal-body">
                        <div *ngIf="modalError" class="alert alert-error">{{ modalError }}</div>

                        <!-- Patient -->
                        <div class="form-group">
                            <label>Patient *</label>
                            <div class="patient-search" *ngIf="!selectedPatient">
                                <input type="text"
                                       [(ngModel)]="patientSearchTerm"
                                       (ngModelChange)="filterPatientsForSelect()"
                                       placeholder="Rechercher un patient...">
                                <div *ngIf="patientSearchTerm && filteredPatientsForSelect.length > 0" class="suggestions">
                                    <div *ngFor="let p of filteredPatientsForSelect | slice:0:5"
                                         class="suggestion" (click)="selectPatient(p)">
                                        <div class="avatar-mini">{{ initials(p) }}</div>
                                        <div>
                                            <strong>{{ p.firstName }} {{ p.lastName }}</strong>
                                            <small>{{ p.email }}</small>
                                        </div>
                                    </div>
                                </div>
                                <div *ngIf="patientSearchTerm && filteredPatientsForSelect.length === 0"
                                     class="suggestions empty">Aucun patient trouvé.</div>
                            </div>
                            <div *ngIf="selectedPatient" class="selected-card">
                                <div class="avatar-mini">{{ initials(selectedPatient) }}</div>
                                <div>
                                    <strong>{{ selectedPatient.firstName }} {{ selectedPatient.lastName }}</strong>
                                    <small>{{ selectedPatient.email }}</small>
                                </div>
                                <button type="button" class="btn-change" (click)="selectedPatient = null">Changer</button>
                            </div>
                        </div>

                        <!-- Médecin -->
                        <div class="form-group">
                            <label>Médecin *</label>
                            <select [(ngModel)]="selectedDoctorId">
                                <option value="">-- Choisir un médecin --</option>
                                <option *ngFor="let d of doctors" [value]="d._id">
                                    Dr. {{ d.firstName }} {{ d.lastName }}
                                    {{ d.specialty ? ' — ' + d.specialty : '' }}
                                </option>
                            </select>
                        </div>

                        <!-- Articles -->
                        <div class="form-group">
                            <label>Articles facturés *</label>
                            <div *ngIf="items.length === 0" class="empty-items">
                                Aucun article. Cliquez sur "+ Ajouter" pour commencer.
                            </div>
                            <div *ngFor="let item of items; let i = index" class="item-row">
                                <input type="text" [(ngModel)]="item.description"
                                       name="item-desc-{{i}}" placeholder="Description (ex : Consultation)"
                                       class="item-desc">
                                <input type="number" [(ngModel)]="item.amount"
                                       name="item-amt-{{i}}" placeholder="Montant"
                                       (ngModelChange)="recomputeTotal()"
                                       class="item-amt" min="0" step="0.01">
                                <span class="item-currency">DH</span>
                                <button type="button" class="btn-remove" (click)="removeItem(i)" title="Supprimer">✕</button>
                            </div>
                            <button type="button" class="btn-add-item" (click)="addItem()">
                                + Ajouter un article
                            </button>
                        </div>

                        <div class="total-box">
                            <span>Total :</span>
                            <strong>{{ totalAmount | number:'1.2-2' }} DH</strong>
                        </div>

                        <div class="modal-actions">
                            <button type="button" class="btn btn-secondary" (click)="closeCreateModal()" [disabled]="isSaving">
                                Annuler
                            </button>
                            <button type="button" class="btn btn-primary" (click)="createInvoice()" [disabled]="isSaving">
                                {{ isSaving ? 'Création...' : '✓ Créer la facture' }}
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

        .filters-card {
            background: white; border-radius: 12px;
            padding: 1.25rem; margin-bottom: 1.5rem;
            box-shadow: var(--shadow);
        }
        .filters-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 1rem; align-items: end;
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
        .btn-reset {
            width: 100%; padding: 0.55rem 1rem;
            background: #f0f3f7; border: 1px solid #d6dbe3;
            border-radius: 6px; cursor: pointer; font-size: 0.9rem;
        }
        .btn-reset:hover { background: #e3e8ef; }

        .empty-state { text-align: center; padding: 3rem 1rem; color: var(--gray-600); }
        .invoices-table { padding: 0; overflow: hidden; }
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
        tbody tr.row-paid { opacity: 0.75; }

        .invoice-num { display: block; color: var(--primary); }
        td small { display: block; color: #888; font-size: 0.75rem; }

        .patient-cell { display: flex; align-items: center; gap: 0.6rem; }
        .avatar {
            width: 32px; height: 32px; border-radius: 50%;
            background: linear-gradient(135deg, #2196f3, #1565c0);
            color: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 0.8rem;
        }
        .avatar-mini {
            width: 32px; height: 32px; border-radius: 50%;
            background: linear-gradient(135deg, #2196f3, #1565c0);
            color: white;
            display: flex; align-items: center; justify-content: center;
            font-weight: bold; font-size: 0.8rem;
        }

        .status-badge {
            display: inline-block;
            padding: 0.25rem 0.65rem;
            border-radius: 12px;
            font-size: 0.78rem;
            font-weight: 600;
        }
        .status-badge.paid { background: #e8f5e9; color: #2e7d32; }
        .status-badge.unpaid { background: #fff3e0; color: #e65100; }

        .actions { display: flex; gap: 0.35rem; }
        .btn-mini {
            background: white; color: var(--primary);
            border: 1px solid #d6dbe3;
            padding: 0.35rem 0.6rem;
            border-radius: 6px; cursor: pointer; font-size: 0.85rem;
        }
        .btn-mini:hover:not(:disabled) { background: #f0f7ff; border-color: var(--primary); }
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

        .form-group { margin-bottom: 1rem; }
        .form-group label {
            display: block; font-weight: 600;
            color: #334; font-size: 0.9rem; margin-bottom: 0.35rem;
        }
        .form-group select, .form-group input {
            width: 100%; box-sizing: border-box;
            padding: 0.6rem 0.85rem;
            border: 1px solid #d6dbe3;
            border-radius: 6px; font-size: 0.95rem;
            background: white;
        }

        .patient-search { position: relative; }
        .suggestions {
            position: absolute; top: 100%; left: 0; right: 0;
            background: white;
            border: 1px solid #d6dbe3;
            border-top: none;
            border-radius: 0 0 6px 6px;
            max-height: 220px; overflow-y: auto;
            z-index: 10;
            box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        .suggestions.empty {
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

        .selected-card {
            display: flex; align-items: center; gap: 0.75rem;
            background: #e8f5e9;
            padding: 0.75rem 1rem;
            border-radius: 8px;
            border-left: 4px solid #4caf50;
        }
        .selected-card > div { flex: 1; }
        .selected-card small { color: #666; font-size: 0.8rem; }
        .btn-change {
            background: white; border: 1px solid #d6dbe3;
            padding: 0.35rem 0.75rem;
            border-radius: 6px; font-size: 0.8rem;
            cursor: pointer; color: #555;
        }

        /* Articles */
        .empty-items {
            padding: 1rem; background: #fafbfc;
            border-radius: 6px; text-align: center;
            color: #888; font-style: italic; font-size: 0.9rem;
            margin-bottom: 0.75rem;
        }
        .item-row {
            display: grid;
            grid-template-columns: 1fr 130px 30px 30px;
            gap: 0.5rem;
            margin-bottom: 0.5rem;
            align-items: center;
        }
        .item-desc, .item-amt {
            padding: 0.5rem 0.7rem !important;
            font-size: 0.9rem !important;
        }
        .item-currency { font-weight: 600; color: #666; font-size: 0.9rem; }
        .btn-remove {
            background: none; border: none;
            color: #c62828; cursor: pointer;
            font-size: 1rem; padding: 0.3rem;
        }
        .btn-remove:hover { background: #ffebee; border-radius: 4px; }

        .btn-add-item {
            width: 100%; padding: 0.65rem;
            background: white;
            border: 2px dashed #b0bec5;
            border-radius: 6px;
            color: var(--primary, #2196f3);
            cursor: pointer; font-weight: 600;
        }
        .btn-add-item:hover {
            border-color: var(--primary, #2196f3);
            background: #f0f7ff;
        }

        .total-box {
            background: linear-gradient(135deg, #2196f3, #1565c0);
            color: white;
            padding: 1rem 1.25rem;
            border-radius: 8px;
            display: flex; justify-content: space-between; align-items: center;
            margin: 1rem 0;
            font-size: 1.1rem;
        }
        .total-box strong { font-size: 1.3rem; }

        .alert-error {
            background: #ffebee; color: #c62828;
            padding: 0.75rem 1rem; border-radius: 6px;
            border-left: 4px solid #f44336;
            margin-bottom: 1rem; font-size: 0.9rem;
        }

        .modal-actions {
            display: flex; justify-content: flex-end; gap: 0.75rem;
            margin-top: 1rem;
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
    `]
})
export class SecretaryInvoicesComponent implements OnInit {
    allInvoices: any[] = [];
    filteredInvoices: any[] = [];
    doctors: any[] = [];
    allPatients: any[] = [];

    isLoading = true;
    updatingId: string | null = null;

    // Filtres
    filterStatus = '';
    filterPatient = '';
    filterDoctorId = '';

    // Modal
    showCreateModal = false;
    modalError = '';
    isSaving = false;

    // Modal — patient
    patientSearchTerm = '';
    filteredPatientsForSelect: any[] = [];
    selectedPatient: any = null;

    // Modal — formulaire
    selectedDoctorId = '';
    items: InvoiceItem[] = [];
    totalAmount = 0;

    constructor(
        private secretaryService: SecretaryService,
        private doctorService: DoctorService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.loadAll();
    }

    loadAll() {
        this.isLoading = true;
        this.secretaryService.getAllInvoices().subscribe({
            next: (invoices) => {
                this.allInvoices = invoices || [];
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: () => {
                this.allInvoices = [];
                this.filteredInvoices = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });

        this.doctorService.searchDoctors().subscribe({
            next: (docs) => { this.doctors = docs || []; this.cdr.detectChanges(); },
            error: () => {}
        });

        this.secretaryService.getAllPatients().subscribe({
            next: (patients) => { this.allPatients = patients || []; this.cdr.detectChanges(); },
            error: () => {}
        });
    }

    // === FILTRES ===
    applyFilters() {
        this.filteredInvoices = this.allInvoices.filter(inv => {
            if (this.filterStatus && inv.status !== this.filterStatus) return false;
            if (this.filterDoctorId && inv.doctorId?._id !== this.filterDoctorId) return false;
            if (this.filterPatient) {
                const name = `${inv.patientId?.firstName || ''} ${inv.patientId?.lastName || ''}`.toLowerCase();
                if (!name.includes(this.filterPatient.toLowerCase())) return false;
            }
            return true;
        });
    }

    resetFilters() {
        this.filterStatus = '';
        this.filterPatient = '';
        this.filterDoctorId = '';
        this.applyFilters();
    }

    get totalUnpaid(): number {
        return this.filteredInvoices
            .filter(i => i.status === 'unpaid')
            .reduce((sum, i) => sum + (i.totalAmount || 0), 0);
    }

    // === TOGGLE STATUT ===
    toggleStatus(inv: any) {
        const newStatus = inv.status === 'paid' ? 'unpaid' : 'paid';
        this.updatingId = inv._id;
        this.cdr.detectChanges();

        this.secretaryService.updateInvoiceStatus(inv._id, newStatus).subscribe({
            next: (updated) => {
                const idx = this.allInvoices.findIndex(i => i._id === inv._id);
                if (idx >= 0) this.allInvoices[idx] = updated;
                this.applyFilters();
                this.updatingId = null;
                this.cdr.detectChanges();
            },
            error: () => {
                this.updatingId = null;
                alert('Erreur lors de la mise à jour du statut.');
                this.cdr.detectChanges();
            }
        });
    }

    // === MODAL CRÉATION ===
    openCreateModal() {
        this.modalError = '';
        this.selectedPatient = null;
        this.patientSearchTerm = '';
        this.filteredPatientsForSelect = [];
        this.selectedDoctorId = '';
        this.items = [{ description: 'Consultation', amount: 0 }];
        this.recomputeTotal();
        this.showCreateModal = true;
    }

    closeCreateModal() {
        this.showCreateModal = false;
    }

    filterPatientsForSelect() {
        const term = this.patientSearchTerm.trim().toLowerCase();
        if (!term) {
            this.filteredPatientsForSelect = [];
            return;
        }
        this.filteredPatientsForSelect = this.allPatients.filter(p => {
            const haystack = `${p.firstName} ${p.lastName} ${p.email}`.toLowerCase();
            return haystack.includes(term);
        });
    }

    selectPatient(p: any) {
        this.selectedPatient = p;
        this.patientSearchTerm = '';
        this.filteredPatientsForSelect = [];
    }

    addItem() {
        this.items.push({ description: '', amount: 0 });
    }

    removeItem(index: number) {
        this.items.splice(index, 1);
        this.recomputeTotal();
    }

    recomputeTotal() {
        this.totalAmount = this.items.reduce((sum, i) => sum + (Number(i.amount) || 0), 0);
    }

    createInvoice() {
        this.modalError = '';

        if (!this.selectedPatient) {
            this.modalError = 'Veuillez sélectionner un patient.';
            return;
        }
        if (!this.selectedDoctorId) {
            this.modalError = 'Veuillez sélectionner un médecin.';
            return;
        }
        const validItems = this.items.filter(i => i.description.trim() && i.amount > 0);
        if (validItems.length === 0) {
            this.modalError = 'Ajoutez au moins un article avec un montant > 0.';
            return;
        }

        const payload = {
            patientId: this.selectedPatient._id,
            doctorId: this.selectedDoctorId,
            items: validItems,
            totalAmount: this.totalAmount
        };

        this.isSaving = true;
        this.cdr.detectChanges();

        this.secretaryService.createInvoice(payload).subscribe({
            next: () => {
                this.isSaving = false;
                this.closeCreateModal();
                this.loadAll();
            },
            error: (err) => {
                this.isSaving = false;
                this.modalError = err.error?.message || 'Erreur lors de la création.';
                this.cdr.detectChanges();
            }
        });
    }

    // === EXPORT PDF ===
    downloadPDF(inv: any) {
        const doc = new jsPDF();

        // Header
        doc.setFontSize(22);
        doc.setTextColor(14, 165, 233);
        doc.text('MediSync', 20, 22);

        doc.setFontSize(16);
        doc.setTextColor(0, 0, 0);
        doc.text('FACTURE', 150, 22);

        doc.setFontSize(9);
        doc.setTextColor(120, 120, 120);
        doc.text(`N° ${this.shortId(inv._id)}`, 150, 30);
        doc.text(`Date : ${new Date(inv.createdAt).toLocaleDateString('fr-FR')}`, 150, 36);

        doc.setDrawColor(14, 165, 233);
        doc.setLineWidth(0.5);
        doc.line(20, 42, 190, 42);

        // Infos patient & médecin
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('PATIENT', 20, 52);
        doc.text('MÉDECIN', 110, 52);

        doc.setFontSize(11);
        doc.setTextColor(0, 0, 0);
        const patient = inv.patientId || {};
        const doctor = inv.doctorId || {};
        doc.text(`${patient.firstName || ''} ${patient.lastName || ''}`, 20, 60);
        if (patient.email) doc.text(patient.email, 20, 66);
        if (patient.phone) doc.text(patient.phone, 20, 72);

        doc.text(`Dr. ${doctor.firstName || ''} ${doctor.lastName || ''}`, 110, 60);
        if (doctor.specialty) doc.text(doctor.specialty, 110, 66);

        // Table des articles
        const startY = 90;
        doc.setFillColor(245, 246, 248);
        doc.rect(20, startY, 170, 8, 'F');
        doc.setFontSize(10);
        doc.setTextColor(80, 80, 80);
        doc.text('DESCRIPTION', 22, startY + 5.5);
        doc.text('MONTANT', 165, startY + 5.5);

        let y = startY + 14;
        doc.setTextColor(0, 0, 0);
        (inv.items || []).forEach((item: any) => {
            const lines = doc.splitTextToSize(item.description || '', 130);
            doc.text(lines, 22, y);
            doc.text(`${Number(item.amount || 0).toFixed(2)} DH`, 165, y);
            y += lines.length * 6 + 2;
        });

        // Total
        y += 5;
        doc.setDrawColor(200, 200, 200);
        doc.line(20, y, 190, y);
        y += 8;

        doc.setFontSize(13);
        doc.setTextColor(14, 165, 233);
        doc.text('TOTAL', 22, y);
        doc.text(`${Number(inv.totalAmount || 0).toFixed(2)} DH`, 165, y);

        // Statut
        y += 12;
        doc.setFontSize(11);
        if (inv.status === 'paid') {
            doc.setTextColor(46, 125, 50);
            doc.text('✓ FACTURE PAYÉE', 22, y);
        } else {
            doc.setTextColor(230, 81, 0);
            doc.text('⌛ FACTURE EN ATTENTE DE PAIEMENT', 22, y);
        }

        // Footer
        doc.setFontSize(9);
        doc.setTextColor(150, 150, 150);
        doc.text('Document généré automatiquement par MediSync', 20, 280);

        doc.save(`facture_${this.shortId(inv._id)}.pdf`);
    }

    // === HELPERS ===
    initials(person: any): string {
        if (!person) return '?';
        const f = (person.firstName || '').charAt(0).toUpperCase();
        const l = (person.lastName || '').charAt(0).toUpperCase();
        return f + l || '?';
    }

    shortId(id: string): string {
        return id ? id.slice(-6).toUpperCase() : '';
    }

    logout() {
        this.authService.logout();
    }
}