import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MedicalRecordService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getRecords(patientId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/patients/${patientId}/records`);
    }

    createRecord(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/medical-records`, data);
    }

    getPrescriptions(patientId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/patients/${patientId}/prescriptions`);
    }

    createPrescription(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/prescriptions`, data);
    }
}