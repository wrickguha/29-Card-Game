import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-backdrop" *ngIf="isOpen" (click)="closeOnBackdrop($event)">
      <div class="modal-container fade-in" [style.max-width]="maxWidth">
        <!-- Gold Trim Accent Glow -->
        <div class="gold-accent-line"></div>
        
        <!-- Header -->
        <div class="modal-header">
          <h3>{{ title }}</h3>
          <button class="close-modal-btn" (click)="close()">&times;</button>
        </div>
        
        <!-- Content -->
        <div class="modal-body">
          <ng-content></ng-content>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../../styles/variables';
    @import '../../../../styles/mixins';

    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(5, 7, 10, 0.8);
      backdrop-filter: blur(8px);
      z-index: 1000;
      @include flex-center;
      padding: 20px;
    }

    .modal-container {
      width: 100%;
      background: linear-gradient(135deg, rgba(20, 28, 40, 0.95) 0%, rgba(10, 14, 20, 0.98) 100%);
      @include glass-panel(0.08, 20px, rgba(212, 175, 55, 0.15));
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9), 0 0 30px rgba(212, 175, 55, 0.05);
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      animation: modalScaleIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
    }

    .gold-accent-line {
      height: 3px;
      width: 100%;
      background: $gradient-gold;
      box-shadow: 0 2px 10px $color-gold-glow;
    }

    .modal-header {
      padding: 16px 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.06);

      h3 {
        font-size: 16px;
        @include glow-text($color-silver-light, 6px);
      }
    }

    .close-modal-btn {
      background: none;
      border: none;
      color: $color-silver-base;
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
      padding: 5px;
      transition: color 0.2s, transform 0.2s;
      @include flex-center;

      &:hover {
        color: $color-gold-light;
        transform: rotate(90deg);
      }
    }

    .modal-body {
      padding: 20px;
      max-height: 75vh;
      overflow-y: auto;
    }

    @keyframes modalScaleIn {
      from {
        opacity: 0;
        transform: scale(0.9) translateY(20px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }
  `]
})
export class ModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Settings';
  @Input() maxWidth = '500px';
  @Input() closeOnBackdropClick = true;

  @Output() isOpenChange = new EventEmitter<boolean>();

  close() {
    this.isOpen = false;
    this.isOpenChange.emit(false);
  }

  closeOnBackdrop(event: MouseEvent) {
    if (this.closeOnBackdropClick && (event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }
}
