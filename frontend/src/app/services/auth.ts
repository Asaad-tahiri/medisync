import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private apiUrl = environment.apiUrl;
    private currentUserSubject = new BehaviorSubject<any>(this.getStoredUser());
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor(private http: HttpClient, private router: Router) {}

    register(userData: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/auth/register`, userData);
    }

    login(email: string, password: string): Observable<any> {
        return new Observable(observer => {
            this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password })
                .subscribe({
                    next: (response) => {
                        localStorage.setItem('token', response.token);
                        localStorage.setItem('user', JSON.stringify(response.user));
                        this.currentUserSubject.next(response.user);
                        observer.next(response);
                        observer.complete();
                    },
                    error: (err) => observer.error(err)
                });
        });
    }

    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        this.currentUserSubject.next(null);
        this.router.navigate(['/login']);
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem('token');
    }

    getUserRole(): string | null {
        const user = this.getStoredUser();
        return user ? user.role : null;
    }

    getToken(): string | null {
        return localStorage.getItem('token');
    }
    updateProfile(data: any): Observable<any> {
    return new Observable(observer => {
        this.http.put<any>(`${this.apiUrl}/auth/profile`, data)
            .subscribe({
                next: (updatedUser) => {
                    // On rafraîchit le user en localStorage et le BehaviorSubject
                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    this.currentUserSubject.next(updatedUser);
                    observer.next(updatedUser);
                    observer.complete();
                },
                error: (err) => observer.error(err)
            });
    });
    }

    getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/me`);
    }

    getCurrentUser(): any {
    return this.getStoredUser();
    }
    private getStoredUser(): any {
        const user = localStorage.getItem('user');
        return user ? JSON.parse(user) : null;
    }
}