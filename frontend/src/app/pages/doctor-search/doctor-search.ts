import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { DoctorService } from '../../services/doctor';


@Component({
    selector: 'app-doctor-search',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './doctor-search.html',
    styleUrls: ['./doctor-search.css']
})
export class DoctorSearchComponent implements OnInit {
    allDoctors: any[] = [];
    filteredDoctors: any[] = [];

    // Filtres
    selectedSpecialty = '';
    selectedCity = '';
    selectedLanguage = '';
    maxFee: number | null = null;

    // Options des filtres (extraites des médecins chargés)
    specialties: string[] = [];
    cities: string[] = [];
    languages: string[] = [];

    loading = true;
    error = '';

    constructor(private doctorService: DoctorService,
    private router: Router,
    private cdr: ChangeDetectorRef
    ) {}

    ngOnInit(): void {
        this.loadDoctors();
    }

    loadDoctors(): void {
    this.loading = true;
    this.error = '';
    this.doctorService.searchDoctors().subscribe({
        next: (doctors) => {
            this.allDoctors = doctors || [];
            this.extractFilterOptions();
            this.applyFilters();
            this.loading = false;
            this.cdr.detectChanges(); // ← ajout
        },
        error: (err) => {
            this.error = err?.error?.message || 'Erreur lors du chargement des médecins.';
            this.loading = false;
            this.cdr.detectChanges(); // ← ajout
        }
    });
}

    private extractFilterOptions(): void {
        const specialties = new Set<string>();
        const cities = new Set<string>();
        const languages = new Set<string>();

        this.allDoctors.forEach(doc => {
            if (doc.specialty) specialties.add(doc.specialty);
            if (doc.city) cities.add(doc.city);
            if (Array.isArray(doc.languages)) {
                doc.languages.forEach((l: string) => l && languages.add(l));
            }
        });

        this.specialties = Array.from(specialties).sort();
        this.cities = Array.from(cities).sort();
        this.languages = Array.from(languages).sort();
    }

    applyFilters(): void {
        this.filteredDoctors = this.allDoctors.filter(doc => {
            if (this.selectedSpecialty && doc.specialty !== this.selectedSpecialty) return false;
            if (this.selectedCity && doc.city !== this.selectedCity) return false;
            if (this.selectedLanguage && (!doc.languages || !doc.languages.includes(this.selectedLanguage))) return false;
            if (this.maxFee != null && doc.consultationFee && doc.consultationFee > this.maxFee) return false;
            return true;
        });
    }

    resetFilters(): void {
        this.selectedSpecialty = '';
        this.selectedCity = '';
        this.selectedLanguage = '';
        this.maxFee = null;
        this.applyFilters();
    }

    bookAppointment(doctorId: string): void {
        this.router.navigate(['/appointment'], { queryParams: { doctorId } });
    }

    getInitials(doc: any): string {
        const f = (doc.firstName || '').charAt(0).toUpperCase();
        const l = (doc.lastName || '').charAt(0).toUpperCase();
        return f + l || '?';
    }

    getStars(rating: number): boolean[] {
        const rounded = Math.round(rating || 0);
        return [1, 2, 3, 4, 5].map(i => i <= rounded);
    }
}