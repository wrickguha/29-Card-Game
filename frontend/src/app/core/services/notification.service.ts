import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  text: string;
  type: 'success' | 'info' | 'warning' | 'error' | 'gold';
  duration: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  toasts = signal<ToastMessage[]>([]);

  show(text: string, type: 'success' | 'info' | 'warning' | 'error' | 'gold' = 'info', duration = 3000) {
    const id = 'toast_' + Math.random().toString(36).substr(2, 5);
    const newToast: ToastMessage = { id, text, type, duration };
    
    this.toasts.update(list => [...list, newToast]);

    setTimeout(() => {
      this.dismiss(id);
    }, duration);
  }

  dismiss(id: string) {
    this.toasts.update(list => list.filter(t => t.id !== id));
  }
}
