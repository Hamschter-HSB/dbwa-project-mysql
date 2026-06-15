import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TmdbService {

  private apiKey = environment.tmdbApiKey;
  private baseUrl = environment.tmdbBaseUrl;

  constructor(private http: HttpClient) {}

  searchMovie(title: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/search/movie`,
      {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          query: title
        }
      }
    );
  }

  getMovieDetails(id: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/movie/${id}`,
      {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        }
      }
    );
  }

  searchTV(title: string): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/search/tv`,
      {
        params: {
          api_key: this.apiKey,
          language: 'en-US',
          query: title
        }
      }
    );
  }

  getTVSeasons(id: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/tv/${id}`,
      {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        }
      }
    );
  }

  getSeasonDetails(showId: number, seasonNumber: number): Observable<any> {
    return this.http.get(
      `${this.baseUrl}/tv/${showId}/season/${seasonNumber}`,
      {
        params: {
          api_key: this.apiKey,
          language: 'en-US'
        }
      }
    );
  }

  // --- NEW ENDPOINTS FOR BOXEDGLASS ---

  getTrendingMovies(): Observable<any> {
    return this.http.get(`${this.baseUrl}/trending/movie/week`, {
      params: { api_key: this.apiKey, language: 'en-US' }
    });
  }

  getTrendingTV(): Observable<any> {
    return this.http.get(`${this.baseUrl}/trending/tv/week`, {
      params: { api_key: this.apiKey, language: 'en-US' }
    });
  }

  getMovieCredits(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/movie/${id}/credits`, {
      params: { api_key: this.apiKey, language: 'en-US' } // English requested
    });
  }

  getTVCredits(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/tv/${id}/credits`, {
      params: { api_key: this.apiKey, language: 'en-US' } // English requested
    });
  }

  getPersonDetails(personId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/person/${personId}`, {
      params: { api_key: this.apiKey, language: 'en-US' } // English bios
    });
  }

  searchPerson(query: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/search/person`, {
      params: { api_key: this.apiKey, language: 'en-US', query }
    });
  }

  getMovieWatchProviders(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/movie/${id}/watch/providers`, {
      params: { api_key: this.apiKey }
    });
  }

  getTVWatchProviders(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/tv/${id}/watch/providers`, {
      params: { api_key: this.apiKey }
    });
  }
}