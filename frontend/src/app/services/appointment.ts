import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppointmentService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getAppointments(): Observable<any> {
        return this.http.get(`${this.apiUrl}/appointments`);
    }

    createAppointment(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/appointments`, data);
    }

    getDoctors(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/doctors`);
    }
    cancelAppointment(id: string): Observable<any> {
    return this.http.patch(`${this.apiUrl}/appointments/${id}/cancel`, {});
}

    // Création par secrétaire : patientId requis dans le payload
    createForPatient(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/appointments`, data);
    }
    updateAppointment(id: string, data: any): Observable<any> {
        return this.http.put(`${this.apiUrl}/appointments/${id}`, data);
    }
    getAvailableSlots(doctorId: string, date: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/doctors/${doctorId}/available-slots`, {
        params: { date }
    });
}
}
