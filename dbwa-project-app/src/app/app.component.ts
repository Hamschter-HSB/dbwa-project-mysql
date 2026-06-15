import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from './services/auth.service';
import { BackendService } from './services/backend.service';
import { NotificationService } from './services/notification.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  notifications: any[] = [];
  showNotifications = false;
  unreadCount = 0;

  constructor(
    public authService: AuthService,
    private backendService: BackendService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.pollNotifications();
    this.notificationService.localNotifs$.subscribe(notif => {
      this.notifications.unshift(notif);
      this.unreadCount++;
      this.showNotifications = true; // Auto-open dropdown so user sees it
    });
  }

  pollNotifications(): void {
    setInterval(() => {
      if (this.authService.isLoggedIn()) {
        this.backendService.getNotifications().subscribe(notifs => {
          // Merge with existing local notifications to preserve them
          const localNotifs = this.notifications.filter(n => n.isLocal);
          this.notifications = [...localNotifs, ...notifs];
          this.unreadCount = this.notifications.filter((n: any) => !n.read).length;
        });
      }
    }, 5000);
  }

  markRead(notif: any): void {
    if (!notif.read) {
      if (notif.isLocal) {
        notif.read = true;
        this.unreadCount = this.notifications.filter(n => !n.read).length;
      } else {
        this.backendService.markNotificationRead(notif.id).subscribe(() => {
          notif.read = true;
          this.unreadCount = this.notifications.filter(n => !n.read).length;
        });
      }
    }
  }

  acceptFriend(notif: any): void {
    if (notif.relatedUserId) {
      this.backendService.acceptFriendRequest(notif.relatedUserId).subscribe(() => {
        this.markRead(notif);
        this.notificationService.show('Friend request accepted!');
      });
    }
  }
  resolveReport(notif: any, action: 'delete' | 'keep'): void {
    if (notif.relatedReportId) {
      this.backendService.resolveReport(notif.relatedReportId, action).subscribe(() => {
        this.markRead(notif);
        this.notificationService.show(action === 'delete' ? 'Comment deleted.' : 'Comment kept.');
      });
    }
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
  }
}