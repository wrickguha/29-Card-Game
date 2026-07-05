import { Component, Input, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="avatar-container" [class.active]="isActive" [class.dealer]="isDealer" [class.ready]="isReady">
      <!-- Outer Timer Ring (SVG) -->
      <svg class="timer-svg" viewBox="0 0 100 100" *ngIf="isActive && timerProgress !== undefined">
        <circle 
          cx="50" cy="50" r="46" 
          class="timer-track"
        />
        <circle 
          cx="50" cy="50" r="46" 
          class="timer-progress"
          [style.strokeDashoffset]="strokeDashoffset"
          [class.critical]="timerValue <= 4"
        />
      </svg>

      <!-- Inner Avatar Image Wrapper -->
      <div class="avatar-frame">
        <div class="avatar-image-container">
          <div class="avatar-placeholder" [class]="avatarId">
            {{ initials }}
          </div>
        </div>
        
        <!-- Dealer Badge -->
        <div class="dealer-badge" *ngIf="isDealer">D</div>
        
        <!-- Ready Badge -->
        <div class="ready-badge" *ngIf="isReady">READY</div>

        <!-- Bid Display Overlay -->
        <div class="bid-badge" *ngIf="bidAmount && bidAmount > 0">{{ bidAmount }}</div>
      </div>

      <!-- Player Info Details -->
      <div class="player-info" *ngIf="showDetails">
        <span class="player-name">{{ name }}</span>
        <span class="player-subtext" *ngIf="subtext">{{ subtext }}</span>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../../styles/variables';
    @import '../../../../styles/mixins';

    :host {
      display: inline-block;
    }

    .avatar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      padding: 10px;
    }

    .timer-svg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100px;
      height: 100px;
      transform: rotate(-90deg);
      z-index: 10;
      pointer-events: none;
    }

    .timer-track {
      fill: none;
      stroke: rgba(255, 255, 255, 0.05);
      stroke-width: 3px;
    }

    .timer-progress {
      fill: none;
      stroke: $color-gold-light;
      stroke-width: 4px;
      stroke-linecap: round;
      transition: stroke-dashoffset 1s linear, stroke 0.3s ease;
      stroke-dasharray: 289; // 2 * pi * r (2 * 3.1415 * 46 = 289)

      &.critical {
        stroke: $color-red-light;
        filter: drop-shadow(0 0 4px $color-red-glow);
      }
    }

    .avatar-frame {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: radial-gradient(circle, #1a2230 0%, #0d1117 100%);
      @include flex-center;
      position: relative;
      border: 2px solid rgba(255, 255, 255, 0.1);
      box-shadow: $shadow-soft;
      transition: all $transition-normal;
      z-index: 5;

      .avatar-container.active & {
        border-color: $color-gold-light;
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.3), inset 0 0 10px rgba(212, 175, 55, 0.2);
        transform: scale(1.05);
      }

      .avatar-container.ready & {
        border-color: $color-emerald-base;
        box-shadow: 0 0 10px rgba(24, 191, 110, 0.25);
      }
    }

    .avatar-image-container {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      overflow: hidden;
      @include flex-center;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid rgba(255, 255, 255, 0.05);
    }

    .avatar-placeholder {
      width: 100%;
      height: 100%;
      @include flex-center;
      font-family: $font-headings;
      font-weight: 800;
      font-size: 20px;
      color: $color-silver-light;
      background-size: cover;

      // Color coding different avatar slots
      &.avatar_gold_tiger {
        background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
        color: #000;
      }
      &.avatar_zeus {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: #fff;
      }
      &.avatar_thor {
        background: linear-gradient(135deg, #10b981 0%, #047857 100%);
        color: #fff;
      }
      &.avatar_hera {
        background: linear-gradient(135deg, #ec4899 0%, #be185d 100%);
        color: #fff;
      }
      &[class^="avatar_default_"] {
        background: linear-gradient(135deg, #6b7280 0%, #374151 100%);
        color: #fff;
      }
    }

    .dealer-badge {
      position: absolute;
      top: -3px;
      right: -3px;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      background: $color-blue-base;
      border: 1.5px solid #fff;
      color: #fff;
      font-size: 11px;
      font-family: $font-headings;
      font-weight: 800;
      @include flex-center;
      box-shadow: $shadow-soft;
      z-index: 15;
    }

    .ready-badge {
      position: absolute;
      bottom: -6px;
      width: 60px;
      height: 16px;
      border-radius: 10px;
      background: $color-emerald-base;
      border: 1px solid rgba(255, 255, 255, 0.2);
      color: $color-bg-darkest;
      font-size: 9px;
      font-family: $font-headings;
      font-weight: 800;
      letter-spacing: 0.05em;
      @include flex-center;
      box-shadow: $shadow-soft;
      z-index: 15;
      animation: pulse 1.5s infinite;
    }

    .bid-badge {
      position: absolute;
      bottom: -6px;
      width: 40px;
      height: 20px;
      border-radius: 4px;
      background: $gradient-gold;
      border: 1px solid rgba(255, 255, 255, 0.3);
      color: $color-bg-darkest;
      font-size: 11px;
      font-family: $font-numeric;
      font-weight: 900;
      @include flex-center;
      box-shadow: $shadow-soft;
      z-index: 15;
    }

    .player-info {
      margin-top: 10px;
      text-align: center;
      max-width: 100px;
    }

    .player-name {
      display: block;
      font-size: 13px;
      font-weight: 600;
      color: $color-silver-light;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      text-shadow: 0 1px 4px rgba(0, 0, 0, 0.8);
    }

    .player-subtext {
      display: block;
      font-size: 10px;
      color: $color-gold-light;
      font-weight: 700;
      letter-spacing: 0.05em;
      margin-top: 1px;
      text-transform: uppercase;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.8);
    }

    @keyframes pulse {
      0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(24, 191, 110, 0.4); }
      70% { transform: scale(1.05); box-shadow: 0 0 8px 4px rgba(24, 191, 110, 0); }
      100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(24, 191, 110, 0); }
    }
  `]
})
export class AvatarComponent {
  @Input() name = 'Player';
  @Input() avatarId = 'avatar_default_1';
  @Input() isActive = false;
  @Input() isDealer = false;
  @Input() isReady = false;
  @Input() bidAmount = 0;
  @Input() showDetails = true;
  @Input() subtext = '';
  @Input() timerValue = 15;
  @Input() maxTimer = 15;

  get initials(): string {
    if (!this.name) return 'P';
    return this.name.slice(0, 2).toUpperCase();
  }

  // Calculate Dashoffset for SVG circle (progress indicator)
  get timerProgress(): number {
    return Math.max(0, Math.min(this.timerValue / this.maxTimer, 1));
  }

  get strokeDashoffset(): number {
    const radius = 46;
    const circumference = 2 * Math.PI * radius; // ~289
    return circumference - (this.timerProgress * circumference);
  }
}
