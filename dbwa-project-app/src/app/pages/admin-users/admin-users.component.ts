import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { BackendService } from '../../services/backend.service';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css']
})
export class AdminUsersComponent implements OnInit {
  activeTab: 'stats' | 'users' | 'reports' = 'stats';
  users: any[] = [];
  reports: any[] = [];
  stats: any = null;
  loading = true;
  statsInterval: any;

  editingUser: any = null;
  editUsername = '';
  editEmail = '';
  editPassword = '';
  editRole = 'member';

  showCreateUser = false;
  createUsername = '';
  createEmail = '';
  createPassword = '';
  createRole = 'member';

  currentUser: any = null;

  constructor(
    private backendService: BackendService,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/']);
      return;
    }
    
    this.backendService.getMe().subscribe({
      next: (user) => {
        this.currentUser = user;
        if (user.role !== 'admin') {
          this.router.navigate(['/']);
          return;
        }
        this.loadStats();
        this.loadUsers();
        this.loadReports();
        this.startStatsPolling();
      },
      error: () => this.router.navigate(['/'])
    });
  }

  ngOnDestroy(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
  }

  loadStats(): void {
    this.backendService.adminGetStats().subscribe(stats => {
      this.stats = stats;
    });
  }

  startStatsPolling(): void {
    this.statsInterval = setInterval(() => {
      this.loadStats();
    }, 5000);
  }

  loadReports(): void {
    this.backendService.adminGetReports().subscribe(reports => {
      this.reports = reports;
    });
  }

  resolveReport(report: any, action: 'delete' | 'keep'): void {
    this.backendService.resolveReport(report.id, action).subscribe(() => {
      this.reports = this.reports.filter(r => r.id !== report.id);
    });
  }

  loadUsers(): void {
    this.loading = true;
    this.backendService.adminGetUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  toggleBan(user: any): void {
    const isBanned = !user.isBanned;
    this.backendService.adminUpdateUser(user.id, { isBanned }).subscribe(() => {
      user.isBanned = isBanned;
    });
  }

  deleteUser(user: any): void {
    if (confirm(`Are you sure you want to permanently delete user ${user.username}? This cannot be undone.`)) {
      this.backendService.adminDeleteUser(user.id).subscribe(() => {
        this.users = this.users.filter(u => u.id !== user.id);
      });
    }
  }

  startEdit(user: any): void {
    this.editingUser = user;
    this.editUsername = user.username;
    this.editEmail = user.email;
    this.editRole = user.role || 'member';
    this.editPassword = '';
  }

  saveEdit(): void {
    if (!this.editingUser) return;
    const payload: any = {
      username: this.editUsername,
      email: this.editEmail,
      role: this.editRole
    };
    if (this.editPassword) {
      payload.password = this.editPassword;
    }

    this.backendService.adminUpdateUser(this.editingUser.id, payload).subscribe({
      next: (res) => {
        const idx = this.users.findIndex(u => u.id === this.editingUser.id);
        if (idx !== -1) {
          this.users[idx] = { ...this.users[idx], ...res.user };
        }
        this.editingUser = null;
        this.notificationService.show('User updated successfully.');
      },
      error: (err) => this.notificationService.show(err.error?.error || 'Update failed', 'error')
    });
  }

  cancelEdit(): void {
    this.editingUser = null;
  }

  submitCreateUser(): void {
    if (!this.createUsername || !this.createEmail || !this.createPassword) {
      this.notificationService.show("All fields are required.", 'error');
      return;
    }
    const payload = {
      username: this.createUsername,
      email: this.createEmail,
      password: this.createPassword,
      role: this.createRole
    };
    this.backendService.adminCreateUser(payload).subscribe({
      next: (res) => {
        this.users.push(res.user);
        this.showCreateUser = false;
        this.createUsername = '';
        this.createEmail = '';
        this.createPassword = '';
        this.createRole = 'member';
        this.notificationService.show('User created successfully.');
      },
      error: (err) => this.notificationService.show(err.error?.error || 'Failed to create user', 'error')
    });
  }
}
