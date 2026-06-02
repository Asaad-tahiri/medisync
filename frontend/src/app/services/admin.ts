import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getStats(): Observable<any> {
        return this.http.get(`${this.apiUrl}/admin/stats`);
    }

    // Médecins
    getDoctors(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/admin/doctors`);
    }
    createDoctor(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/admin/doctors`, data);
    }
    updateDoctor(id: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/admin/doctors/${id}`, data);
    }
    deleteDoctor(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/admin/doctors/${id}`);
    }

    // Secrétaires
    getSecretaries(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/admin/secretaries`);
    }
    createSecretary(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/admin/secretaries`, data);
    }
    updateSecretary(id: string, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/secretaries/${id}`, data);
    }
    deleteSecretary(id: string): Observable<any> {
        return this.http.delete(`${this.apiUrl}/admin/secretaries/${id}`);
    }
}