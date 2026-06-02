import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class DoctorService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    updateProfile(data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/auth/profile`, data);
    }

    getPatient(id: string): Observable<any> {
        return this.http.get(`${this.apiUrl}/patients/${id}`);
    }

    getMyPatients(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/doctor/my-patients`);
    }
    
    searchDoctors(filters: { specialty?: string; city?: string; language?: string } = {}): Observable<any[]> {
    let params: any = {};
    if (filters.specialty) params.specialty = filters.specialty;
    if (filters.city) params.city = filters.city;
    if (filters.language) params.language = filters.language;
    return this.http.get<any[]>(`${this.apiUrl}/doctors`, {
        params,
        headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
        }
    });
}   
}
