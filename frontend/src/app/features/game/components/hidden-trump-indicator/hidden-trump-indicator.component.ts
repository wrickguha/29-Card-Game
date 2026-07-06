import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Suit } from '../../../../core/models/game.model';

@Component({
  selector: 'app-hidden-trump-indicator',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="indicator-wrapper">
      <div 
        class="indicator-pill" 
        [class.revealed]="isRevealed"
        [class.hearts]="isRevealed && suit === 'H'"
        [class.diamonds]="isRevealed && suit === 'D'"
        [class.clubs]="isRevealed && suit === 'C'"
        [class.spades]="isRevealed && suit === 'S'"
      >
        <!-- Status Content: Hidden -->
        <ng-container *ngIf="!isRevealed">
          <span class="status-icon pulse-gold">🔒</span>
          <span class="status-text">Trump Not Revealed</span>
          <span class="info-trigger">?</span>
        </ng-container>

        <!-- Status Content: Revealed -->
        <ng-container *ngIf="isRevealed && suit">
          <span class="status-icon suit-color">{{ getSuitSymbol(suit) }}</span>
          <span class="status-text uppercase">Trump: {{ getSuitName(suit) }}</span>
        </ng-container>

        <!-- Premium Tooltip (shows on hover) -->
        <div class="premium-tooltip glass-panel fade-in" *ngIf="!isRevealed">
          <div class="tooltip-header">
            <span>🔒 SECRET TRUMP CONTRACT</span>
          </div>
          <div class="tooltip-body">
            <p>The winning bidder (<strong>{{ bidderName }}</strong>) has chosen a secret trump suit.</p>
            <p class="rule-hint">💡 <strong>How to Reveal:</strong> When a player cannot follow the lead suit in a trick, they can click the hidden card to request a trump reveal.</p>
          </div>
          <div class="tooltip-footer">
            <span>29 Game Rules &bull; Royal Club</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../../../styles/variables';
    @import '../../../../../styles/mixins';

    .indicator-wrapper {
      position: relative;
      display: inline-block;
    }

    .indicator-pill {
      @include flex-center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 20px;
      @include glass-panel(0.05, 10px, rgba(212, 175, 55, 0.2));
      box-shadow: 0 4px 10px rgba(0, 0, 0, 0.4);
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      cursor: help;
      position: relative;

      @include respond-to('mobile') {
        padding: 4px 10px;
        gap: 5px;
      }

      &:hover {
        @include gold-border(0.4);
        box-shadow: 0 6px 15px rgba(212, 175, 55, 0.15);
        transform: translateY(-1px);

        .premium-tooltip {
          opacity: 1;
          visibility: visible;
          transform: translateX(-50%) translateY(0);
        }
      }

      .status-icon {
        font-size: 13px;

        @include respond-to('mobile') {
          font-size: 11px;
        }

        &.suit-color {
          font-size: 16px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.5));
        }
      }

      .status-text {
        font-family: $font-headings;
        font-size: 9px;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: $color-silver-light;

        @include respond-to('mobile') {
          font-size: 8px;
        }
      }

      .info-trigger {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        background: rgba(212, 175, 55, 0.15);
        border: 1px solid rgba(212, 175, 55, 0.3);
        color: $color-gold-light;
        font-family: $font-headings;
        font-size: 8px;
        font-weight: 900;
        @include flex-center;
        
        @include respond-to('mobile') {
          width: 12px;
          height: 12px;
          font-size: 7px;
        }
      }

      // States
      &.revealed {
        cursor: default;
        background: rgba(255, 255, 255, 0.03);
        border-color: rgba(255, 255, 255, 0.1);

        &.hearts, &.diamonds {
          border-color: rgba(229, 25, 55, 0.3);
          box-shadow: 0 0 10px rgba(229, 25, 55, 0.15);
          .status-icon { color: $color-red-light; }
        }

        &.clubs, &.spades {
          border-color: rgba(212, 175, 55, 0.3);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.15);
          .status-icon { color: $color-gold-light; }
        }
      }
    }

    // Premium Tooltip Layout
    .premium-tooltip {
      position: absolute;
      bottom: calc(100% + 10px);
      left: 50%;
      transform: translateX(-50%) translateY(5px);
      width: 250px;
      padding: 12px 14px;
      border-radius: 8px;
      @include glass-panel(0.08, 15px, rgba(212, 175, 55, 0.3));
      box-shadow: $shadow-hard, 0 0 20px rgba(212, 175, 55, 0.1);
      display: flex;
      flex-direction: column;
      gap: 8px;
      text-align: left;
      opacity: 0;
      visibility: hidden;
      pointer-events: none;
      transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 100;

      &::after {
        content: '';
        position: absolute;
        top: 100%;
        left: 50%;
        transform: translateX(-50%);
        border-width: 6px;
        border-style: solid;
        border-color: rgba(212, 175, 55, 0.3) transparent transparent transparent;
      }

      .tooltip-header {
        font-family: $font-headings;
        font-size: 9px;
        font-weight: 900;
        color: $color-gold-light;
        letter-spacing: 0.05em;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        padding-bottom: 5px;
      }

      .tooltip-body {
        font-size: 10px;
        line-height: 1.4;
        color: $color-silver-base;
        display: flex;
        flex-direction: column;
        gap: 6px;

        strong {
          color: $color-silver-light;
        }

        .rule-hint {
          background: rgba(212, 175, 55, 0.05);
          border-left: 2px solid $color-gold-base;
          padding: 4px 6px;
          border-radius: 0 4px 4px 0;
        }
      }

      .tooltip-footer {
        font-size: 8px;
        color: $color-silver-dark;
        text-transform: uppercase;
        letter-spacing: 0.02em;
        text-align: right;
      }
    }

    .pulse-gold {
      animation: pulseGold 2s infinite;
    }

    @keyframes pulseGold {
      0% { opacity: 0.7; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.1); }
      100% { opacity: 0.7; transform: scale(1); }
    }
  `]
})
export class HiddenTrumpIndicatorComponent {
  @Input() isRevealed = false;
  @Input() suit: Suit | null = null;
  @Input() bidderName = 'Bidder';

  getSuitSymbol(suit: Suit): string {
    const symbols: Record<Suit, string> = {
      'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠'
    };
    return symbols[suit];
  }

  getSuitName(suit: Suit): string {
    const names: Record<Suit, string> = {
      'H': 'Hearts', 'D': 'Diamonds', 'C': 'Clubs', 'S': 'Spades'
    };
    return names[suit];
  }
}
