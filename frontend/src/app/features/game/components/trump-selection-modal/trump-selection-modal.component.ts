import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Suit } from '../../../../core/models/game.model';

@Component({
  selector: 'app-trump-selection-modal',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="modal-overlay fade-in">
      <div class="overlay-glow"></div>
      
      <div class="selection-panel glass-panel">
        <div class="accent-line"></div>
        
        <h3 class="gold-glow-text">Select Secret Trump</h3>
        <p class="subtitle">Choose the trump suit based on your first 4 cards. It remains completely secret!</p>

        <div class="suit-cards-container">
          <!-- Hearts Card -->
          <div 
            class="suit-card card-hearts" 
            (click)="selectSuit('H')"
            (mouseenter)="onHover()"
          >
            <div class="card-glow red-glow"></div>
            <div class="card-inner">
              <span class="corner-val">♥</span>
              <span class="suit-icon animate-pop">♥</span>
              <span class="suit-name">Hearts</span>
              <span class="corner-val bottom-val">♥</span>
            </div>
          </div>

          <!-- Diamonds Card -->
          <div 
            class="suit-card card-diamonds" 
            (click)="selectSuit('D')"
            (mouseenter)="onHover()"
          >
            <div class="card-glow red-glow"></div>
            <div class="card-inner">
              <span class="corner-val">♦</span>
              <span class="suit-icon animate-pop">♦</span>
              <span class="suit-name">Diamonds</span>
              <span class="corner-val bottom-val">♦</span>
            </div>
          </div>

          <!-- Clubs Card -->
          <div 
            class="suit-card card-clubs" 
            (click)="selectSuit('C')"
            (mouseenter)="onHover()"
          >
            <div class="card-glow silver-glow"></div>
            <div class="card-inner">
              <span class="corner-val">♣</span>
              <span class="suit-icon animate-pop">♣</span>
              <span class="suit-name">Clubs</span>
              <span class="corner-val bottom-val">♣</span>
            </div>
          </div>

          <!-- Spades Card -->
          <div 
            class="suit-card card-spades" 
            (click)="selectSuit('S')"
            (mouseenter)="onHover()"
          >
            <div class="card-glow silver-glow"></div>
            <div class="card-inner">
              <span class="corner-val">♠</span>
              <span class="suit-icon animate-pop">♠</span>
              <span class="suit-name">Spades</span>
              <span class="corner-val bottom-val">♠</span>
            </div>
          </div>
        </div>
        
        <div class="modal-footer">
          <span class="hint-text">🔒 Locked secret state will be saved in your browser</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../../../styles/variables';
    @import '../../../../../styles/mixins';

    .modal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      @include flex-center;
      z-index: 1000;
      background: rgba(4, 6, 12, 0.85);
      backdrop-filter: blur(8px);
    }

    .overlay-glow {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at center, rgba(212, 175, 55, 0.06) 0%, transparent 75%);
      pointer-events: none;
    }

    .selection-panel {
      position: relative;
      @include glass-panel(0.06, 20px, rgba(212, 175, 55, 0.2));
      border-radius: 16px;
      padding: 40px 50px;
      max-width: 680px;
      width: 90%;
      text-align: center;
      box-shadow: $shadow-hard, 0 0 30px rgba(212, 175, 55, 0.1);
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 15px;

      @include respond-to('mobile') {
        padding: 25px 20px;
        width: 95%;
        gap: 10px;
      }

      .accent-line {
        position: absolute;
        top: 0; left: 50%;
        transform: translateX(-50%);
        width: 100px;
        height: 3px;
        background: $gradient-gold;
        border-radius: 0 0 4px 4px;
        box-shadow: 0 2px 10px rgba(212, 175, 55, 0.4);
      }
    }

    h3 {
      font-size: 26px;
      margin-bottom: 2px;

      @include respond-to('mobile') {
        font-size: 20px;
      }
    }

    .subtitle {
      font-size: 13px;
      color: $color-silver-base;
      max-width: 480px;
      line-height: 1.5;
      margin-bottom: 20px;

      @include respond-to('mobile') {
        font-size: 11px;
        margin-bottom: 10px;
      }
    }

    .suit-cards-container {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      width: 100%;
      margin: 10px 0;

      @include respond-to('tablet') {
        gap: 15px;
      }

      @include respond-to('mobile') {
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
      }
    }

    .suit-card {
      position: relative;
      height: 170px;
      border-radius: 12px;
      cursor: pointer;
      overflow: hidden;
      @include glass-panel(0.04, 10px, rgba(255, 255, 255, 0.08));
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.02) 0%, rgba(0, 0, 0, 0.4) 100%);
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.4);
      transition: all 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);

      @include respond-to('tablet') {
        height: 140px;
      }

      @include respond-to('mobile') {
        height: 130px;
      }

      .card-glow {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        opacity: 0;
        transition: opacity 0.35s ease;
        z-index: 1;
        pointer-events: none;
      }

      .red-glow {
        background: radial-gradient(circle at center, rgba(229, 25, 55, 0.15) 0%, transparent 75%);
      }

      .silver-glow {
        background: radial-gradient(circle at center, rgba(212, 175, 55, 0.12) 0%, transparent 75%);
      }

      &:hover {
        transform: translateY(-8px) scale(1.03);
        border-color: rgba(212, 175, 55, 0.4);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(212, 175, 55, 0.15);

        .card-glow {
          opacity: 1;
        }

        .suit-icon {
          transform: scale(1.15) rotate(5deg);
        }
        
        &.card-hearts, &.card-diamonds {
          border-color: rgba(229, 25, 55, 0.5);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.6), 0 0 20px rgba(229, 25, 55, 0.2);
        }
      }

      &:active {
        transform: translateY(-2px) scale(0.98);
        transition: all 0.1s ease;
      }

      // Suit card inner content
      .card-inner {
        position: relative;
        z-index: 2;
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        color: $color-silver-light;
        box-shadow: inset 0 1px 1px rgba(255, 255, 255, 0.05);

        .corner-val {
          align-self: flex-start;
          font-size: 14px;
          font-weight: 800;
          line-height: 1;

          &.bottom-val {
            align-self: flex-end;
            transform: rotate(180deg);
          }
        }

        .suit-icon {
          font-size: 50px;
          line-height: 1;
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.6));

          @include respond-to('tablet') {
            font-size: 38px;
          }
        }

        .suit-name {
          font-family: $font-headings;
          font-size: 11px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: $color-silver-base;
          transition: color 0.3s;

          @include respond-to('mobile') {
            font-size: 10px;
          }
        }
      }

      // Red Suits
      &.card-hearts, &.card-diamonds {
        .card-inner {
          color: $color-red-light;
          .suit-name { color: rgba(229, 25, 55, 0.6); }
        }
        &:hover {
          .suit-name { color: $color-red-light; }
        }
      }

      // Black/White Suits
      &.card-clubs, &.card-spades {
        .card-inner {
          color: $color-silver-light;
          .suit-name { color: rgba(255, 255, 255, 0.4); }
        }
        &:hover {
          .suit-name { color: $color-gold-light; }
        }
      }
    }

    .modal-footer {
      margin-top: 10px;
      font-size: 10px;
      color: $color-silver-dark;
      letter-spacing: 0.02em;
    }
  `]
})
export class TrumpSelectionModalComponent {
  @Output() select = new EventEmitter<Suit>();

  selectSuit(suit: Suit) {
    // Add micro-feedback before emitting
    setTimeout(() => {
      this.select.emit(suit);
    }, 200);
  }

  onHover() {
    // We can play a subtle hover ticking sound if needed in future
  }
}
