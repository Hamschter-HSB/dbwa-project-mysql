import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TmdbService } from '../../services/tmdb.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.css']
})
export class SearchComponent implements OnInit {
  searchQuery = '';
  searchType: 'movie' | 'tv' = 'movie';
  results: any[] = [];
  loading = false;
  
  private searchSubject = new Subject<string>();

  constructor(private tmdbService: TmdbService) {
    this.searchSubject.pipe(
      debounceTime(500),
      distinctUntilChanged()
    ).subscribe(query => {
      this.performSearch(query);
    });
  }

  ngOnInit(): void {
    this.loadDefault();
  }

  onSearchChange(): void {
    this.searchSubject.next(this.searchQuery);
  }

  setType(type: 'movie' | 'tv'): void {
    this.searchType = type;
    if (this.searchQuery) {
      this.performSearch(this.searchQuery);
    } else {
      this.loadDefault();
    }
  }

  private loadDefault(): void {
    this.loading = true;
    const request = this.searchType === 'movie' 
      ? this.tmdbService.getTrendingMovies() 
      : this.tmdbService.getTrendingTV();

    request.subscribe({
      next: (res) => {
        this.results = res.results;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load defaults', err);
        this.loading = false;
      }
    });
  }

  private performSearch(query: string): void {
    if (!query.trim()) {
      this.loadDefault();
      return;
    }

    this.loading = true;
    const request = this.searchType === 'movie'
      ? this.tmdbService.searchMovie(query)
      : this.tmdbService.searchTV(query);

    request.subscribe({
      next: (res) => {
        this.results = res.results;
        this.loading = false;
      },
      error: (err) => {
        console.error('Search failed', err);
        this.loading = false;
      }
    });
  }

  getPosterUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : '';
  }
}