import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, ToastMessage } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-wrapper">
      <div 
        *ngFor="let toast of notificationService.toasts()" 
        class="toast-item" 
        [class]="toast.type"
        (click)="dismiss(toast.id)"
      >
        <div class="toast-glow"></div>
        <div class="toast-content">
          <span class="toast-icon" [ngSwitch]="toast.type">
            <span *ngSwitchCase="'success'">✓</span>
            <span *ngSwitchCase="'error'">✕</span>
            <span *ngSwitchCase="'warning'">⚠️</span>
            <span *ngSwitchCase="'gold'">👑</span>
            <span *ngSwitchDefault>ℹ️</span>
          </span>
          <span class="toast-text">{{ toast.text }}</span>
        </div>
        <button class="close-btn">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../../styles/variables';
    @import '../../../../styles/mixins';

    .toast-wrapper {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
      max-width: 350px;
      width: calc(100% - 40px);
    }

    .toast-item {
      pointer-events: auto;
      position: relative;
      @include glass-panel(0.08, 12px, rgba(255, 255, 255, 0.15));
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: $color-silver-light;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.6);
      cursor: pointer;
      overflow: hidden;
      animation: slideIn 0.3s cubic-bezier(0.25, 0.8, 0.25, 1) forwards;
      border-left: 4px solid #fff;
      transition: transform 0.2s ease, opacity 0.2s ease;

      &:hover {
        transform: scale(1.02);
      }

      &.success {
        border-left-color: $color-emerald-base;
        .toast-glow { background: radial-gradient(circle, rgba(24, 191, 110, 0.1) 0%, transparent 70%); }
        .toast-icon { color: $color-emerald-light; }
      }

      &.error {
        border-left-color: $color-red-base;
        .toast-glow { background: radial-gradient(circle, rgba(229, 25, 55, 0.1) 0%, transparent 70%); }
        .toast-icon { color: $color-red-light; }
      }

      &.warning {
        border-left-color: #f59e0b;
        .toast-glow { background: radial-gradient(circle, rgba(245, 158, 11, 0.1) 0%, transparent 70%); }
        .toast-icon { color: #fbbf24; }
      }

      &.gold {
        border-left-color: $color-gold-base;
        .toast-glow { background: radial-gradient(circle, rgba(212, 175, 55, 0.1) 0%, transparent 70%); }
        .toast-icon { color: $color-gold-light; text-shadow: 0 0 5px $color-gold-glow; }
      }

      &.info {
        border-left-color: $color-blue-base;
        .toast-glow { background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%); }
        .toast-icon { color: $color-blue-light; }
      }
    }

    .toast-glow {
      position: absolute;
      top: -20px; left: -20px;
      width: 100px;
      height: 100px;
      z-index: 1;
      pointer-events: none;
      opacity: 0.7;
    }

    .toast-content {
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 2;
    }

    .toast-icon {
      font-size: 16px;
      font-weight: bold;
      @include flex-center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.03);
    }

    .toast-text {
      font-size: 13px;
      font-weight: 500;
      line-height: 1.4;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
    }

    .close-btn {
      background: none;
      border: none;
      color: rgba(255, 255, 255, 0.4);
      font-size: 18px;
      cursor: pointer;
      padding: 0 0 0 10px;
      z-index: 2;
      transition: color 0.2s;

      &:hover {
        color: rgba(255, 255, 255, 0.8);
      }
    }

    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100px) scale(0.9);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
  `]
})
export class ToastComponent {
  constructor(public notificationService: NotificationService) {}

  dismiss(id: string) {
    this.notificationService.dismiss(id);
  }
}
