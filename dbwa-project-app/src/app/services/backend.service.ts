import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class BackendService {
  private apiUrl = '/api'; // Handled by our Express server

  constructor(private http: HttpClient, private authService: AuthService) {}

  private getHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // --- Auth ---
  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, userData);
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials);
  }

  resetPassword(payload: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, payload);
  }

  // --- Watchlist ---
  getWatchlist(userId?: number): Observable<any[]> {
    const url = userId ? `${this.apiUrl}/watchlist?userId=${userId}` : `${this.apiUrl}/watchlist`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  addToWatchlist(tmdbId: number, mediaType: 'movie' | 'tv'): Observable<any> {
    return this.http.post(`${this.apiUrl}/watchlist`, { tmdbId, mediaType }, { headers: this.getHeaders() });
  }

  removeFromWatchlist(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/watchlist/${id}`, { headers: this.getHeaders() });
  }

  // --- Watched List ---
  getWatchedList(userId?: number): Observable<any[]> {
    const url = userId ? `${this.apiUrl}/watched?userId=${userId}` : `${this.apiUrl}/watched`;
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  addToWatched(tmdbId: number, mediaType: 'movie' | 'tv'): Observable<any> {
    return this.http.post(`${this.apiUrl}/watched`, { tmdbId, mediaType }, { headers: this.getHeaders() });
  }

  removeFromWatched(tmdbId: number, mediaType: 'movie' | 'tv'): Observable<any> {
    return this.http.delete(`${this.apiUrl}/watched/${tmdbId}/${mediaType}`, { headers: this.getHeaders() });
  }

  // --- Users ---
  getMe(): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/me`, { headers: this.getHeaders() });
  }

  updateProfile(data: { bio?: string, avatar?: string, favoriteGenres?: string, username?: string, email?: string, password?: string }): Observable<any> {
    return this.http.put(`${this.apiUrl}/users/me`, data, { headers: this.getHeaders() });
  }

  deleteAccount(recoveryCode: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/users/me`, { headers: this.getHeaders(), body: { recoveryCode } });
  }

  searchUsers(query: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/users/search?q=${query}`, { headers: this.getHeaders() });
  }

  getUserProfile(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/users/${id}`, { headers: this.getHeaders() });
  }

  // --- Admin ---
  adminGetUsers(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/users`, { headers: this.getHeaders() });
  }

  adminCreateUser(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/admin/users`, data, { headers: this.getHeaders() });
  }

  adminUpdateUser(id: number, data: any): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/users/${id}`, data, { headers: this.getHeaders() });
  }

  adminDeleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/admin/users/${id}`, { headers: this.getHeaders() });
  }

  adminGetStats(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/stats`, { headers: this.getHeaders() });
  }

  adminGetReports(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/admin/reports`, { headers: this.getHeaders() });
  }

  // --- Friends ---
  sendFriendRequest(addresseeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/friends/request`, { addresseeId }, { headers: this.getHeaders() });
  }

  acceptFriendRequest(requesterId: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/friends/accept/${requesterId}`, {}, { headers: this.getHeaders() });
  }

  getFriends(): Observable<{ friends: any[], pending: any[] }> {
    return this.http.get<{ friends: any[], pending: any[] }>(`${this.apiUrl}/friends`, { headers: this.getHeaders() });
  }

  // --- Ratings ---
  rateMedia(tmdbId: number, mediaType: 'movie' | 'tv', rating: number, comment: string, mediaTitle: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/ratings`, { tmdbId, mediaType, rating, comment, mediaTitle }, { headers: this.getHeaders() });
  }

  getMediaRatings(mediaType: 'movie' | 'tv', tmdbId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/ratings/media/${mediaType}/${tmdbId}`, { headers: this.getHeaders() });
  }

  // --- Reports ---
  reportRating(ratingId: number, reason: 'spoiler' | 'other', comment?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/reports`, { ratingId, reason, comment }, { headers: this.getHeaders() });
  }

  resolveReport(reportId: number, action: 'delete' | 'keep'): Observable<any> {
    return this.http.put(`${this.apiUrl}/reports/${reportId}/resolve`, { action }, { headers: this.getHeaders() });
  }

  // --- Notifications ---
  getNotifications(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/notifications`, { headers: this.getHeaders() });
  }

  markNotificationRead(id: number): Observable<any> {
    return this.http.put(`${this.apiUrl}/notifications/${id}/read`, {}, { headers: this.getHeaders() });
  }
}
