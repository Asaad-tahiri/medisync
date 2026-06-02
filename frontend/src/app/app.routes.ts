import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';
import { roleGuard } from './guards/role-guard';

export const routes: Routes = [
    { path: '', redirectTo: 'login', pathMatch: 'full' },
    
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then(m => m.LoginComponent)
    },
    {
        path: 'register',
        loadComponent: () => import('./pages/register/register').then(m => m.RegisterComponent)
    },
    {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/dashboard').then(m => m.DashboardComponent),
        canActivate: [authGuard]
    },
    {
        path: 'appointment',
        loadComponent: () => import('./pages/appointment/appointment').then(m => m.AppointmentComponent),
        canActivate: [authGuard, roleGuard(['patient', 'secretary'])]
    },
    {
        path: 'medical-record',
        loadComponent: () => import('./pages/medical-record/medical-record').then(m => m.MedicalRecordComponent),
        canActivate: [authGuard, roleGuard(['patient', 'doctor'])]
    },
    {
    path: 'my-profile',
    loadComponent: () => import('./pages/my-profile/my-profile').then(m => m.MyProfileComponent),
    canActivate: [authGuard, roleGuard(['patient'])]
    },
    {
    path: 'doctor/consultation/:id',
    loadComponent: () => import('./pages/consultation/consultation').then(m => m.ConsultationComponent),
    canActivate: [authGuard, roleGuard(['doctor'])]
    },
    {
    path: 'doctors',
    loadComponent: () => import('./pages/doctor-search/doctor-search').then(m => m.DoctorSearchComponent),
    canActivate: [authGuard, roleGuard(['patient', 'secretary'])]
    },
    {
        path: 'doctor/patients',
        loadComponent: () => import('./pages/doctor-patients/doctor-patients').then(m => m.DoctorPatientsComponent),
        canActivate: [authGuard, roleGuard(['doctor'])]
    },
    {
        path: 'doctor',
        loadComponent: () => import('./pages/doctor/doctor').then(m => m.DoctorComponent),
        canActivate: [authGuard, roleGuard(['doctor'])]
    },
    {
        path: 'doctor/profile',
        loadComponent: () => import('./pages/doctor-profile/doctor-profile').then(m => m.DoctorProfileComponent),
        canActivate: [authGuard, roleGuard(['doctor'])]
    },
    {
        path: 'patient/:id',
        loadComponent: () => import('./pages/patient-profile/patient-profile').then(m => m.PatientProfileComponent),
        canActivate: [authGuard, roleGuard(['doctor', 'secretary', 'admin'])]
    },
    {
    path: 'secretary/patients',
    loadComponent: () => import('./pages/secretary-patients/secretary-patients').then(m => m.SecretaryPatientsComponent),
    canActivate: [authGuard, roleGuard(['secretary', 'admin'])]  // ← ajout 'admin'
    },
    {
    path: 'secretary/appointments',
    loadComponent: () => import('./pages/secretary-appointments/secretary-appointments').then(m => m.SecretaryAppointmentsComponent),
    canActivate: [authGuard, roleGuard(['secretary', 'admin'])]  // ← ajout 'admin'
    },
    {
    path: 'secretary/invoices',
    loadComponent: () => import('./pages/secretary-invoices/secretary-invoices').then(m => m.SecretaryInvoicesComponent),
    canActivate: [authGuard, roleGuard(['secretary', 'admin'])]  // ← ajout 'admin'
    },
    {
    path: 'admin/staff',
    loadComponent: () => import('./pages/admin-staff/admin-staff').then(m => m.AdminStaffComponent),
    canActivate: [authGuard, roleGuard(['admin'])]
    },
    {
        path: 'admin',
        loadComponent: () => import('./pages/admin/admin').then(m => m.AdminComponent),
        canActivate: [authGuard, roleGuard(['admin'])]
    },
    { path: '**', redirectTo: 'login' }
];