import { Routes } from '@angular/router';
import { DiscoveryComponent } from './pages/discovery/discovery.component';
import { SearchComponent } from './pages/search/search.component';
import { MovieDetailComponent } from './pages/movie-detail/movie-detail.component';
import { SeasonDetailComponent } from './pages/season-detail/season-detail.component';
import { AuthComponent } from './pages/auth/auth.component';
import { WatchlistComponent } from './pages/watchlist/watchlist.component';
import { ProfileComponent } from './pages/profile/profile.component';
import { UserProfileComponent } from './pages/user-profile/user-profile.component';
import { AdminUsersComponent } from './pages/admin-users/admin-users.component';
import { ImpressumComponent } from './pages/legal/impressum/impressum.component';
import { TermsComponent } from './pages/legal/terms/terms.component';
import { PrivacyComponent } from './pages/legal/privacy/privacy.component';
import { SupportComponent } from './pages/legal/support/support.component';

export const routes: Routes = [
  { path: '', component: DiscoveryComponent },
  { path: 'auth', component: AuthComponent },
  { path: 'search', component: SearchComponent },
  { path: 'watchlist', component: WatchlistComponent },
  { path: 'profile', component: ProfileComponent },
  { path: 'user/:id', component: UserProfileComponent },
  { path: 'admin/users', component: AdminUsersComponent },
  { path: 'impressum', component: ImpressumComponent },
  { path: 'agb', component: TermsComponent },
  { path: 'datenschutz', component: PrivacyComponent },
  { path: 'support', component: SupportComponent },
  { path: 'details/tv/:id/season/:season_number', component: SeasonDetailComponent },
  { path: 'details/:type/:id', component: MovieDetailComponent },
  { path: 'movie/:id', redirectTo: 'details/movie/:id', pathMatch: 'full' }
];