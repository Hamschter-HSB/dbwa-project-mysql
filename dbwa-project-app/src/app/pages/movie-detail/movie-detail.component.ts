import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { TmdbService } from '../../services/tmdb.service';
import { BackendService } from '../../services/backend.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-movie-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './movie-detail.component.html',
  styleUrls: ['./movie-detail.component.css']
})
export class MovieDetailComponent implements OnInit {
  details: any = null;
  cast: any[] = [];
  loading = true;
  mediaType: 'movie' | 'tv' = 'movie';
  mediaId!: number;
  addedToWatchlist = false;
  isWatched = false;
  flatrateProviders: any[] = [];
  watchProvidersLoaded = false;

  // Rating
  showRatingModal = false;
  ratingInput = 5;
  commentInput = '';
  myRating: any = null;
  friendsRatings: any[] = [];

  constructor(
    private route: ActivatedRoute,
    private tmdbService: TmdbService,
    private backendService: BackendService,
    public authService: AuthService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      this.mediaType = (params.get('type') as 'movie' | 'tv') || 'movie';
      this.mediaId = Number(params.get('id'));
      this.loadDetails();
      this.checkLists();
      this.loadRatings();
    });
  }

  loadDetails(): void {
    this.loading = true;
    this.watchProvidersLoaded = false;

    const detailReq = this.mediaType === 'movie'
      ? this.tmdbService.getMovieDetails(this.mediaId)
      : this.tmdbService.getTVSeasons(this.mediaId);

    detailReq.subscribe(res => {
      this.details = res;
    });

    const creditsReq = this.mediaType === 'movie'
      ? this.tmdbService.getMovieCredits(this.mediaId)
      : this.tmdbService.getTVCredits(this.mediaId);

    creditsReq.subscribe(res => {
      this.cast = res.cast.slice(0, 10);
      this.loading = false;
    });

    const providersReq = this.mediaType === 'movie'
      ? this.tmdbService.getMovieWatchProviders(this.mediaId)
      : this.tmdbService.getTVWatchProviders(this.mediaId);

    providersReq.subscribe({
      next: (res) => {
        this.flatrateProviders = res?.results?.DE?.flatrate || [];
        this.watchProvidersLoaded = true;
      },
      error: () => {
        this.flatrateProviders = [];
        this.watchProvidersLoaded = true;
      }
    });
  }

  checkLists(): void {
    if (!this.authService.isLoggedIn()) return;
    this.backendService.getWatchlist().subscribe(items => {
      this.addedToWatchlist = items.some(i => i.tmdbId === this.mediaId && i.mediaType === this.mediaType);
    });
    this.backendService.getWatchedList().subscribe(items => {
      this.isWatched = items.some(i => i.tmdbId === this.mediaId && i.mediaType === this.mediaType);
    });
  }

  loadRatings(): void {
    if (!this.authService.isLoggedIn()) return;
    this.backendService.getMediaRatings(this.mediaType, this.mediaId).subscribe(res => {
      this.myRating = res.myRating;
      this.friendsRatings = res.friendsRatings;
    });
  }

  addToWatchlist(): void {
    if (!this.authService.isLoggedIn()) {
      this.notificationService.show('Please log in to add to your watchlist.', 'error');
      return;
    }
    this.backendService.addToWatchlist(this.mediaId, this.mediaType).subscribe({
      next: () => { 
        this.addedToWatchlist = true; 
        this.notificationService.show('Added to watchlist!');
      },
      error: (err) => { this.notificationService.show(err.error?.error || 'Failed to add to watchlist', 'error'); }
    });
  }

  markAsWatched(): void {
    if (!this.authService.isLoggedIn()) {
      this.notificationService.show('Please log in to mark as watched.', 'error');
      return;
    }
    this.backendService.addToWatched(this.mediaId, this.mediaType).subscribe({
      next: () => { 
        this.isWatched = true; 
        this.addedToWatchlist = false; // removes from watchlist automatically
        this.notificationService.show('Marked as watched!');
      },
      error: (err) => { this.notificationService.show(err.error?.error || 'Failed to mark as watched', 'error'); }
    });
  }

  clickWatchedButton(): void {
    if (confirm('Would you like to rate this media again?')) {
      this.ratingInput = this.myRating ? this.myRating.rating : 5;
      this.commentInput = this.myRating ? (this.myRating.comment || '') : '';
      this.showRatingModal = true;
    }
  }
  // Report
  showReportModal = false;
  reportRatingId: number | null = null;
  reportReason: 'spoiler' | 'other' = 'spoiler';
  reportComment = '';

  submitRating(): void {
    const title = this.details?.title || this.details?.name || '';
    this.backendService.rateMedia(this.mediaId, this.mediaType, this.ratingInput, this.commentInput, title).subscribe({
      next: (res) => {
        this.myRating = res;
        this.showRatingModal = false;
        this.notificationService.show('Rating submitted!');
      },
      error: (err) => { this.notificationService.show(err.error?.error || 'Failed to submit rating', 'error'); }
    });
  }

  openReportModal(ratingId: number): void {
    this.reportRatingId = ratingId;
    this.reportReason = 'spoiler';
    this.reportComment = '';
    this.showReportModal = true;
  }

  submitReport(): void {
    if (!this.reportRatingId) return;
    this.backendService.reportRating(this.reportRatingId, this.reportReason, this.reportComment).subscribe({
      next: () => {
        this.notificationService.show('Comment has been reported.');
        this.showReportModal = false;
      },
      error: (err) => { this.notificationService.show(err.error?.error || 'Report failed', 'error'); }
    });
  }

  getStars(rating: number): string {
    return '★'.repeat(rating) + '☆'.repeat(5 - rating);
  }

  getPosterUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : '';
  }

  getBackdropUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/original${path}` : '';
  }

  getProfileUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w185${path}` : '';
  }

  getAvatarUrl(path: string | null): string {
    return path ? `https://image.tmdb.org/t/p/w185${path}` : '';
  }

  getProviderLogoUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w92${path}` : '';
  }
}