import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { BackendService } from '../../services/backend.service';
import { TmdbService } from '../../services/tmdb.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.css']
})
export class UserProfileComponent implements OnInit {
  user: any = null;
  watchlistItems: any[] = [];
  showAllWatchlist = false;
  loading = true;

  constructor(
    private route: ActivatedRoute,
    private backendService: BackendService,
    private tmdbService: TmdbService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const userId = Number(params.get('id'));
      this.loadUser(userId);
    });
  }

  loadUser(id: number): void {
    this.loading = true;
    this.backendService.getUserProfile(id).subscribe(user => {
      this.user = user;
      this.loadWatchlist(id);
    });
  }

  loadWatchlist(userId: number): void {
    this.backendService.getWatchlist(userId).subscribe(items => {
      if (items.length === 0) {
        this.watchlistItems = [];
        this.loading = false;
        return;
      }

      const requests = items.map(item =>
        item.mediaType === 'movie'
          ? this.tmdbService.getMovieDetails(item.tmdbId)
          : this.tmdbService.getTVSeasons(item.tmdbId)
      );

      forkJoin(requests).subscribe(results => {
        this.watchlistItems = results.map((res: any, index) => {
          res.mediaType = items[index].mediaType;
          return res;
        });
        this.loading = false;
      });
    });
  }

  getPosterUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : '';
  }

  getAvatarUrl(path: string | null): string {
    return path ? `https://image.tmdb.org/t/p/w185${path}` : '';
  }

  getParsedGenres(): string[] {
    if (!this.user || !this.user.favoriteGenres) return [];
    try {
      return JSON.parse(this.user.favoriteGenres);
    } catch(e) {
      return this.user.favoriteGenres.split(',');
    }
  }
}
