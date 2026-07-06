import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Suit } from '../../../../core/models/game.model';

@Component({
  selector: 'app-hidden-trump-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="trump-card-container"
      [class.bidder]="isBidder"
      [class.revealed]="isRevealed"
      [class.hidden]="!isRevealed"
      (click)="onCardClick()"
    >
      <!-- Card Element -->
      <div 
        class="card-3d" 
        [class.revealed]="isRevealed"
        [class.hearts]="isRevealed && suit === 'H'"
        [class.diamonds]="isRevealed && suit === 'D'"
        [class.clubs]="isRevealed && suit === 'C'"
        [class.spades]="isRevealed && suit === 'S'"
      >
        <!-- Card Front (Revealed Trump Suit) -->
        <div class="card-face card-front" *ngIf="isRevealed && suit" [class]="suit">
          <div class="card-inner">
            <span class="corner-rank">T</span>
            <span class="center-suit">{{ getSuitSymbol(suit) }}</span>
            <span class="corner-rank bottom-rank">T</span>
          </div>
        </div>

        <!-- Card Back (Hidden Trump / 7th Card) -->
        <div class="card-face card-back" *ngIf="!isRevealed">
          <!-- Ambient Particle/Glow in back -->
          <div class="glow-overlay"></div>
          
          <div class="back-design">
            <div class="card-border-gold"></div>
            <div class="pattern-mesh">
              <span class="lock-icon" *ngIf="!isBidder">🔒</span>
              <span class="eye-icon" *ngIf="isBidder">👁️</span>
            </div>
            
            <div class="card-label">7th Card</div>
          </div>

          <!-- Private Bidder Badge -->
          <div class="bidder-private-badge fade-in" *ngIf="isBidder && suit" [class]="suit">
            <span class="label">YOUR TRUMP</span>
            <span class="symbol">{{ getSuitSymbol(suit) }}</span>
          </div>
        </div>
      </div>

      <!-- Hover Glow Effect -->
      <div class="ambient-glow" [class.hearts]="suit === 'H' && isBidder" [class.diamonds]="suit === 'D' && isBidder"></div>
    </div>
  `,
  styles: [`
    @import '../../../../../styles/variables';
    @import '../../../../../styles/mixins';

    :host {
      display: inline-block;
      perspective: 800px;
    }

    .trump-card-container {
      position: relative;
      width: 60px;
      height: 90px;
      cursor: pointer;
      user-select: none;
      animation: idleFloat 4s ease-in-out infinite;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);

      @include respond-to('mobile') {
        width: 48px;
        height: 72px;
      }

      &:hover {
        transform: translateY(-4px) scale(1.06);
        
        .ambient-glow {
          opacity: 0.8;
          filter: blur(12px);
        }

        .card-border-gold {
          border-color: rgba(212, 175, 55, 0.8) !important;
          box-shadow: 0 0 8px rgba(212, 175, 55, 0.4);
        }
      }

      &.revealed {
        animation: none;
      }
    }

    // 3D Card flips
    .card-3d {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 6px;
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.5);
      border: 1.5px solid rgba(255, 255, 255, 0.08);

      &.revealed {
        border-color: rgba(212, 175, 55, 0.6);
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.2), 0 8px 16px rgba(0, 0, 0, 0.6);
      }
    }

    .card-face {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      backface-visibility: hidden;
      border-radius: 4px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      height: 100%;
      width: 100%;
    }

    // Card Front Styling
    .card-front {
      background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
      color: $color-silver-light;

      &.H, &.D {
        color: $color-red-light;
        border: 1px solid rgba(229, 25, 55, 0.2);
        background: radial-gradient(circle at center, #2d1318 0%, #0f172a 100%);
      }

      &.C, &.S {
        border: 1px solid rgba(255, 255, 255, 0.1);
      }

      .card-inner {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 5px;
        font-family: $font-numeric;
        font-weight: 900;

        .corner-rank {
          font-size: 10px;
          line-height: 1;
          
          &.bottom-rank {
            align-self: flex-end;
            transform: rotate(180deg);
          }
        }

        .center-suit {
          font-size: 26px;
          align-self: center;
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));

          @include respond-to('mobile') {
            font-size: 22px;
          }
        }
      }
    }

    // Card Back Styling
    .card-back {
      background: linear-gradient(135deg, #1e1b4b 0%, #090514 100%);
      border: 1px solid rgba(212, 175, 55, 0.25);

      .glow-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle at center, rgba(212, 175, 55, 0.08) 0%, transparent 70%);
        pointer-events: none;
      }

      .back-design {
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        padding: 4px;
        position: relative;

        .card-border-gold {
          position: absolute;
          top: 3px; left: 3px; right: 3px; bottom: 3px;
          border: 1px solid rgba(212, 175, 55, 0.2);
          border-radius: 3px;
          transition: all 0.3s ease;
          pointer-events: none;
        }

        .pattern-mesh {
          @include flex-center;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          margin-bottom: 4px;
          box-shadow: inset 0 2px 5px rgba(0, 0, 0, 0.5);

          @include respond-to('mobile') {
            width: 18px;
            height: 18px;
            margin-bottom: 2px;
          }

          .lock-icon, .eye-icon {
            font-size: 10px;
            color: $color-silver-base;
            opacity: 0.6;
          }
        }

        .card-label {
          font-family: $font-headings;
          font-size: 7px;
          font-weight: 800;
          letter-spacing: 0.05em;
          color: $color-gold-light;
          text-shadow: 0 0 4px rgba(212, 175, 55, 0.3);
          text-transform: uppercase;

          @include respond-to('mobile') {
            font-size: 6px;
          }
        }
      }

      // Private badge shown for Bidder only
      .bidder-private-badge {
        position: absolute;
        bottom: 4px;
        left: 50%;
        transform: translateX(-50%);
        background: rgba(15, 23, 42, 0.9);
        border: 1px solid rgba(212, 175, 55, 0.4);
        border-radius: 3px;
        padding: 1px 4px;
        display: flex;
        align-items: center;
        gap: 3px;
        white-space: nowrap;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
        z-index: 5;

        @include respond-to('mobile') {
          padding: 0 2px;
          gap: 1px;
          bottom: 2px;
        }

        .label {
          font-size: 5px;
          font-weight: 900;
          letter-spacing: 0.02em;
          color: $color-gold-light;
          font-family: $font-headings;
        }

        .symbol {
          font-size: 8px;
          font-weight: bold;
        }

        &.H, &.D {
          .symbol { color: $color-red-light; }
        }
        &.C, &.S {
          .symbol { color: $color-silver-light; }
        }
      }
    }

    // Ambient floating glow
    .ambient-glow {
      position: absolute;
      top: 5px; left: 5px; right: 5px; bottom: 5px;
      z-index: -2;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.15) 0%, transparent 70%);
      border-radius: 8px;
      opacity: 0.5;
      filter: blur(8px);
      transition: all 0.3s ease;
      pointer-events: none;

      &.hearts, &.diamonds {
        background: radial-gradient(circle, rgba(229, 25, 55, 0.2) 0%, transparent 70%);
      }
    }

    @keyframes idleFloat {
      0% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-5px);
        box-shadow: 0 12px 24px rgba(0, 0, 0, 0.4);
      }
      100% {
        transform: translateY(0);
      }
    }
  `]
})
export class HiddenTrumpCardComponent {
  @Input() suit: Suit | null = null;
  @Input() isRevealed = false;
  @Input() isBidder = false;

  @Output() reveal = new EventEmitter<void>();

  getSuitSymbol(suit: Suit): string {
    const symbols: Record<Suit, string> = {
      'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠'
    };
    return symbols[suit];
  }

  onCardClick() {
    this.reveal.emit();
  }
}
