import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { BackendService } from '../../services/backend.service';
import { TmdbService } from '../../services/tmdb.service';
import { AuthService } from '../../services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-watchlist',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './watchlist.component.html',
  styleUrls: ['./watchlist.component.css']
})
export class WatchlistComponent implements OnInit {
  watchlistItems: any[] = [];
  loading = true;

  constructor(
    private backendService: BackendService,
    private tmdbService: TmdbService,
    public authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadWatchlist();
  }

  loadWatchlist(): void {
    this.backendService.getWatchlist().subscribe({
      next: (items) => {
        if (items.length === 0) {
          this.watchlistItems = [];
          this.loading = false;
          return;
        }

        const observables = items.map(item => {
          const req = item.mediaType === 'movie'
            ? this.tmdbService.getMovieDetails(item.tmdbId)
            : this.tmdbService.getTVSeasons(item.tmdbId);
          
          return req.pipe(
            catchError(err => {
              console.error(`Failed to load details for ${item.tmdbId}`, err);
              return of(null);
            })
          );
        });

        forkJoin(observables).subscribe(results => {
          this.watchlistItems = results
            .map((res: any, index: number) => {
              if (!res) return null;
              return {
                ...res,
                watchlistId: items[index].id,
                mediaType: items[index].mediaType
              };
            })
            .filter(item => item !== null);
          this.loading = false;
        });
      },
      error: (err) => {
        console.error('Failed to load watchlist', err);
        this.loading = false;
      }
    });
  }

  removeFromWatchlist(watchlistId: number, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    this.backendService.removeFromWatchlist(watchlistId).subscribe(() => {
      this.watchlistItems = this.watchlistItems.filter(i => i.watchlistId !== watchlistId);
    });
  }

  getPosterUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : '';
  }
}
