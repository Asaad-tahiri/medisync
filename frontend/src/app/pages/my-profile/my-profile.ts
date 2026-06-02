import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
    selector: 'app-my-profile',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './my-profile.html',
    styleUrls: ['./my-profile.css']
})
export class MyProfileComponent implements OnInit {
    // Champs du formulaire
    firstName = '';
    lastName = '';
    email = '';            // readonly (affichage)
    phone = '';
    dateOfBirth = '';      // format yyyy-MM-dd pour <input type="date">
    socialSecurityNumber = '';

    // Listes (arrays dans le modèle)
    allergies: string[] = [];
    antecedents: string[] = [];
    newAllergy = '';
    newAntecedent = '';

    // UI state
    loading = false;
    successMessage = '';
    errorMessage = '';

    constructor(private authService: AuthService, private router: Router) {}

    ngOnInit(): void {
        const user = this.authService.getCurrentUser();
        if (!user) {
            this.router.navigate(['/login']);
            return;
        }
        this.hydrateForm(user);
    }

    private hydrateForm(user: any): void {
        this.firstName = user.firstName || '';
        this.lastName = user.lastName || '';
        this.email = user.email || '';
        this.phone = user.phone || '';
        this.socialSecurityNumber = user.socialSecurityNumber || '';
        this.allergies = Array.isArray(user.allergies) ? [...user.allergies] : [];
        this.antecedents = Array.isArray(user.antecedents) ? [...user.antecedents] : [];

        if (user.dateOfBirth) {
            // Le backend renvoie une ISO string ; on extrait yyyy-MM-dd
            this.dateOfBirth = new Date(user.dateOfBirth).toISOString().split('T')[0];
        }
    }

    addAllergy(): void {
        const value = this.newAllergy.trim();
        if (value && !this.allergies.includes(value)) {
            this.allergies.push(value);
            this.newAllergy = '';
        }
    }

    removeAllergy(index: number): void {
        this.allergies.splice(index, 1);
    }

    addAntecedent(): void {
        const value = this.newAntecedent.trim();
        if (value && !this.antecedents.includes(value)) {
            this.antecedents.push(value);
            this.newAntecedent = '';
        }
    }

    removeAntecedent(index: number): void {
        this.antecedents.splice(index, 1);
    }

    save(): void {
        this.successMessage = '';
        this.errorMessage = '';
        this.loading = true;

        const payload: any = {
            firstName: this.firstName.trim(),
            lastName: this.lastName.trim(),
            phone: this.phone.trim(),
            socialSecurityNumber: this.socialSecurityNumber.trim(),
            allergies: this.allergies,
            antecedents: this.antecedents
        };

        if (this.dateOfBirth) {
            payload.dateOfBirth = this.dateOfBirth;
        }

        this.authService.updateProfile(payload).subscribe({
            next: () => {
                this.loading = false;
                this.successMessage = 'Profil mis à jour avec succès.';
                setTimeout(() => this.successMessage = '', 3000);
            },
            error: (err) => {
                this.loading = false;
                this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour.';
            }
        });
    }
}