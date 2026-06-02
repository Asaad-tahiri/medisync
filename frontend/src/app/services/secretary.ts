import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SecretaryService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) {}

    getAllPatients(): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/secretary/patients`);
    }

    createPatient(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/secretary/patients`, data);
    }
    getAllInvoices(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/invoices`);
    }

    createInvoice(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/invoices`, data);
    }

    updateInvoiceStatus(id: string, status: 'paid' | 'unpaid'): Observable<any> {
        return this.http.patch(`${this.apiUrl}/invoices/${id}/status`, { status });
    }
}