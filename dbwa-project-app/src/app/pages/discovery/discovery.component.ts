import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { TmdbService } from '../../services/tmdb.service';

@Component({
  selector: 'app-discovery',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './discovery.component.html',
  styleUrls: ['./discovery.component.css']
})
export class DiscoveryComponent implements OnInit {
  trendingMovies: any[] = [];
  loading = true;

  constructor(private tmdbService: TmdbService) {}

  ngOnInit(): void {
    this.tmdbService.getTrendingMovies().subscribe({
      next: (res) => {
        this.trendingMovies = res.results;
        this.loading = false;
      },
      error: (err) => {
        console.error('Failed to load trending movies', err);
        this.loading = false;
      }
    });
  }

  getPosterUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : '';
  }
}
