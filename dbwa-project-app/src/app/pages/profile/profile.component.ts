import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { BackendService } from '../../services/backend.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';
import { TmdbService } from '../../services/tmdb.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  user: any = null;
  watchlistItems: any[] = [];
  watchedItems: any[] = [];
  friends: any[] = [];
  pendingRequests: any[] = [];
  
  // Watchlist pagination
  showAllWatchlist = false;

  // Edit Mode
  editMode = false;
  bioInput = '';

  // Avatar Search
  showAvatarSearch = false;
  actorSearchQuery = '';
  actorSearchResults: any[] = [];

  // User Search
  showUserSearch = false;
  userSearchQuery = '';
  userSearchResults: any[] = [];

  // Account Settings
  showSettingsModal = false;
  settingsUsername = '';
  settingsEmail = '';
  settingsPassword = '';
  settingsError: string | null = null;
  settingsSuccess: string | null = null;
  
  availableGenres = ['Action', 'Comedy', 'Drama', 'Sci-Fi', 'Horror', 'Romance', 'Thriller', 'Documentary', 'Fantasy', 'Animation'];
  selectedGenres: string[] = [];

  // Delete Account
  deleteRecoveryCode = '';
  deleteError: string | null = null;

  constructor(
    private backendService: BackendService,
    private tmdbService: TmdbService,
    public authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/auth']);
      return;
    }
    this.loadProfile();
  }

  loadProfile(): void {
    this.backendService.getMe().subscribe(user => {
      this.user = user;
      this.bioInput = user.bio || '';
      if (user.favoriteGenres) {
        try {
          this.selectedGenres = JSON.parse(user.favoriteGenres);
        } catch(e) {
          this.selectedGenres = user.favoriteGenres.split(',');
        }
      } else {
        this.selectedGenres = [];
      }
      this.loadWatchlist();
      this.loadWatchedList();
      this.loadFriends();
    });
  }

  loadWatchlist(): void {
    this.backendService.getWatchlist().subscribe(items => {
      const requests = items.map(item => 
        item.mediaType === 'movie' 
          ? this.tmdbService.getMovieDetails(item.tmdbId) 
          : this.tmdbService.getTVSeasons(item.tmdbId) // actually /tv/:id
      );

      if (requests.length === 0) {
        this.watchlistItems = [];
        return;
      }

      forkJoin(requests).subscribe(results => {
        this.watchlistItems = results.map((res: any, index) => {
          res.mediaType = items[index].mediaType; // inject mediaType
          return res;
        });
      });
    });
  }

  loadWatchedList(): void {
    this.backendService.getWatchedList().subscribe(items => {
      const requests = items.map(item => 
        item.mediaType === 'movie' 
          ? this.tmdbService.getMovieDetails(item.tmdbId) 
          : this.tmdbService.getTVSeasons(item.tmdbId)
      );

      if (requests.length === 0) {
        this.watchedItems = [];
        return;
      }

      forkJoin(requests).subscribe(results => {
        this.watchedItems = results.map((res: any, index) => {
          res.mediaType = items[index].mediaType;
          return res;
        });
      });
    });
  }

  loadFriends(): void {
    this.backendService.getFriends().subscribe(res => {
      this.friends = res.friends;
      this.pendingRequests = res.pending;
    });
  }

  saveProfile(): void {
    this.backendService.updateProfile({ bio: this.bioInput }).subscribe(user => {
      this.user = user;
      this.editMode = false;
    });
  }

  openSettings(): void {
    this.settingsUsername = this.user.username;
    this.settingsEmail = this.user.email;
    this.settingsPassword = '';
    this.settingsError = null;
    this.settingsSuccess = null;
    this.deleteRecoveryCode = '';
    this.deleteError = null;
    if (this.user.favoriteGenres) {
      try {
        this.selectedGenres = JSON.parse(this.user.favoriteGenres);
      } catch(e) {
        this.selectedGenres = this.user.favoriteGenres.split(',');
      }
    } else {
      this.selectedGenres = [];
    }
    this.showSettingsModal = true;
  }

  toggleGenre(genre: string): void {
    const idx = this.selectedGenres.indexOf(genre);
    if (idx > -1) {
      this.selectedGenres.splice(idx, 1);
    } else {
      this.selectedGenres.push(genre);
    }
  }

  saveSettings(): void {
    this.settingsError = null;
    this.settingsSuccess = null;
    
    const payload: any = {
      username: this.settingsUsername,
      email: this.settingsEmail,
      favoriteGenres: JSON.stringify(this.selectedGenres)
    };
    if (this.settingsPassword) {
      if (this.settingsPassword.length < 6) {
        this.settingsError = 'Password must be at least 6 characters.';
        return;
      }
      payload.password = this.settingsPassword;
    }

    this.backendService.updateProfile(payload).subscribe({
      next: (user) => {
        this.user = user;
        this.settingsSuccess = 'Settings saved successfully!';
        setTimeout(() => this.showSettingsModal = false, 1500);
      },
      error: (err) => {
        this.settingsError = err.error?.error || 'Failed to save settings.';
      }
    });
  }

  deleteAccount(): void {
    this.deleteError = null;
    if (!this.deleteRecoveryCode) {
      this.deleteError = 'Please enter your recovery code.';
      return;
    }
    
    if (confirm('Are you absolutely sure you want to delete your account? This action cannot be undone.')) {
      this.backendService.deleteAccount(this.deleteRecoveryCode).subscribe({
        next: () => {
          this.logout();
        },
        error: (err) => {
          this.deleteError = err.error?.error || 'Failed to delete account.';
        }
      });
    }
  }

  // Avatar logic
  searchActor(): void {
    if (!this.actorSearchQuery) return;
    this.tmdbService.searchPerson(this.actorSearchQuery).subscribe(res => {
      this.actorSearchResults = res.results.filter((p: any) => p.profile_path);
    });
  }

  selectAvatar(profilePath: string): void {
    this.backendService.updateProfile({ avatar: profilePath }).subscribe(user => {
      this.user = user;
      this.showAvatarSearch = false;
    });
  }

  // User invite logic
  searchUsers(): void {
    if (!this.userSearchQuery) return;
    this.backendService.searchUsers(this.userSearchQuery).subscribe(users => {
      // Filter out people we are already friends with or pending
      this.userSearchResults = users;
    });
  }

  sendRequest(userId: number): void {
    this.backendService.sendFriendRequest(userId).subscribe({
      next: () => {
        this.notificationService.show('Friend request sent!');
        this.showUserSearch = false;
      },
      error: (err) => this.notificationService.show(err.error?.error || 'Failed to send request', 'error')
    });
  }

  getPosterUrl(path: string): string {
    return path ? `https://image.tmdb.org/t/p/w500${path}` : '';
  }

  getAvatarUrl(path: string | null): string {
    return path ? `https://image.tmdb.org/t/p/w185${path}` : '';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth']);
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
