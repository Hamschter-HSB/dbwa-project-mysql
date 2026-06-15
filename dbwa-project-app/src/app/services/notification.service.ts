import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private localNotifsSource = new Subject<any>();
  localNotifs$ = this.localNotifsSource.asObservable();

  show(message: string, type: string = 'system_msg') {
    this.localNotifsSource.next({
      id: 'local_' + Date.now() + Math.random(),
      message,
      type,
      read: false,
      createdAt: new Date(),
      isLocal: true
    });
  }
}
