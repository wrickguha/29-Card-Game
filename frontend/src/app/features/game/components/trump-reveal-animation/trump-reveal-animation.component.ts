import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Suit } from '../../../../core/models/game.model';
import { SoundService } from '../../../../core/services/sound.service';

interface Particle {
  id: number;
  x: number;
  y: number;
  scale: number;
  delay: number;
  angle: number;
  distance: number;
}

@Component({
  selector: 'app-trump-reveal-animation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="reveal-overlay" *ngIf="active" [class.fade-out-overlay]="isEnding">
      <!-- Ambient darkness / Camera focus -->
      <div class="camera-focus-overlay"></div>
      
      <!-- Big Golden radial glow behind card -->
      <div class="glow-burst-bg" [class.active]="burstActive"></div>

      <!-- The Flipping Card -->
      <div class="card-container" [class.lift]="liftActive" [class.flip]="flipActive">
        <div class="card-3d">
          
          <!-- Back (Locked 7th Card) -->
          <div class="card-face card-back">
            <div class="card-border-gold"></div>
            <div class="back-pattern">
              <span class="lock-icon">🔒</span>
              <span class="label">7th Card</span>
            </div>
          </div>

          <!-- Front (Revealed Suit) -->
          <div class="card-face card-front" [class]="suit">
            <div class="card-inner">
              <span class="corner-rank">T</span>
              <span class="center-suit animate-suit" *ngIf="flipActive">{{ getSuitSymbol(suit) }}</span>
              <span class="corner-rank bottom-rank">T</span>
            </div>
            <div class="card-glow-inner"></div>
          </div>

        </div>
      </div>

      <!-- Particle Emitters -->
      <div class="particles-container" *ngIf="burstActive">
        <div 
          *ngFor="let p of particles" 
          class="particle"
          [style.--p-x]="p.x + 'px'"
          [style.--p-y]="p.y + 'px'"
          [style.--p-scale]="p.scale"
          [style.--p-delay]="p.delay + 's'"
          [style.--p-tx]="getTranslationX(p) + 'px'"
          [style.--p-ty]="getTranslationY(p) + 'px'"
        ></div>
      </div>

      <!-- Shockwave Flash Overlay -->
      <div class="golden-shockwave" *ngIf="shockwaveActive"></div>

      <!-- Banner Text -->
      <div class="reveal-banner" [class.visible]="bannerVisible">
        <span class="gold-glow-text title">Trump Suit Revealed!</span>
        <span class="suit-name-sub" [class]="suit">{{ getSuitName(suit) }}</span>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../../../styles/variables';
    @import '../../../../../styles/mixins';

    .reveal-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      @include flex-center;
      z-index: 10000;
      overflow: hidden;
      transition: opacity 0.5s ease;
      
      &.fade-out-overlay {
        opacity: 0;
        pointer-events: none;
      }
    }

    .camera-focus-overlay {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      backdrop-filter: blur(12px);
      transition: all 0.5s ease;
    }

    .glow-burst-bg {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.3) 0%, rgba(212, 175, 55, 0.05) 50%, transparent 70%);
      border-radius: 50%;
      pointer-events: none;
      opacity: 0;
      transform: scale(0.3);
      transition: all 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      z-index: 1;

      &.active {
        opacity: 1;
        transform: scale(1.4);
      }
    }

    .card-container {
      position: relative;
      width: 140px;
      height: 210px;
      perspective: 1000px;
      z-index: 5;
      transform: scale(0.6) translateY(50px);
      opacity: 0;
      transition: transform 0.8s cubic-bezier(0.25, 0.8, 0.25, 1.2), opacity 0.6s ease;

      @include respond-to('mobile') {
        width: 110px;
        height: 165px;
      }

      &.lift {
        transform: scale(1.2) translateY(-20px);
        opacity: 1;
        box-shadow: 0 25px 50px rgba(0, 0, 0, 0.8);
      }

      &.flip {
        .card-3d {
          transform: rotateY(180deg);
        }
      }
    }

    .card-3d {
      width: 100%;
      height: 100%;
      position: relative;
      transform-style: preserve-3d;
      transition: transform 0.8s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 12px;
      border: 2px solid rgba(212, 175, 55, 0.4);
    }

    .card-face {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      backface-visibility: hidden;
      border-radius: 10px;
      overflow: hidden;
      box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.1);
    }

    // Card Back styling (locked 7th card)
    .card-back {
      background: linear-gradient(135deg, #1e1b4b 0%, #090514 100%);
      transform: rotateY(0);
      @include flex-center;

      .card-border-gold {
        position: absolute;
        top: 6px; left: 6px; right: 6px; bottom: 6px;
        border: 2px solid rgba(212, 175, 55, 0.3);
        border-radius: 6px;
        pointer-events: none;
      }

      .back-pattern {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 15px;

        .lock-icon {
          font-size: 32px;
          filter: drop-shadow(0 0 10px rgba(212,175,55,0.4));
          animation: lockPulse 2s infinite ease-in-out;
        }

        .label {
          font-family: $font-headings;
          font-size: 14px;
          font-weight: 800;
          color: $color-gold-light;
          letter-spacing: 0.1em;
          text-transform: uppercase;
        }
      }
    }

    // Card Front styling (revealed suit)
    .card-front {
      background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
      transform: rotateY(180deg);
      border: 1px solid rgba(212, 175, 55, 0.6);

      &.H, &.D {
        color: $color-red-light;
        background: radial-gradient(circle at center, #3f151d 0%, #0f172a 100%);
      }

      .card-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 15px;
        font-family: $font-numeric;
        font-weight: 900;

        .corner-rank {
          font-size: 20px;
          line-height: 1;

          &.bottom-rank {
            align-self: flex-end;
            transform: rotate(180deg);
          }
        }

        .center-suit {
          font-size: 72px;
          align-self: center;
          line-height: 1;
          filter: drop-shadow(0 5px 15px rgba(0, 0, 0, 0.7));

          &.animate-suit {
            animation: suitScaleUp 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
            animation-delay: 0.4s;
            opacity: 0;
            transform: scale(0.3);
          }
        }
      }

      .card-glow-inner {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        box-shadow: inset 0 0 30px rgba(212, 175, 55, 0.3);
        pointer-events: none;
      }
    }

    // Golden burst flash
    .golden-shockwave {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.95);
      mix-blend-mode: overlay;
      z-index: 10;
      animation: flashFade 0.6s cubic-bezier(0.1, 0.8, 0.1, 1) forwards;
    }

    // Particle styling
    .particles-container {
      position: absolute;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 4;
    }

    .particle {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: radial-gradient(circle, #ffe699 0%, #d4af37 60%, transparent 100%);
      box-shadow: 0 0 10px #ffe699, 0 0 20px #d4af37;
      transform: translate(-50%, -50%) translate(var(--p-x), var(--p-y)) scale(var(--p-scale));
      animation: scatter 1.8s cubic-bezier(0.25, 1, 0.5, 1) forwards;
      animation-delay: var(--p-delay);
    }

    // Banner layout
    .reveal-banner {
      position: absolute;
      bottom: 12%;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      z-index: 20;
      opacity: 0;
      transform: translateY(20px);
      transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);

      &.visible {
        opacity: 1;
        transform: translateY(0);
      }

      .title {
        font-size: 28px;
        font-family: $font-headings;
        font-weight: 800;

        @include respond-to('mobile') {
          font-size: 20px;
        }
      }

      .suit-name-sub {
        font-family: $font-headings;
        font-size: 16px;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 0.15em;
        color: $color-gold-light;

        &.H, &.D {
          color: $color-red-light;
          text-shadow: 0 0 10px rgba(229, 25, 55, 0.4);
        }
        &.C, &.S {
          color: $color-silver-light;
          text-shadow: 0 0 10px rgba(255, 255, 255, 0.4);
        }
      }
    }

    // Animations
    @keyframes lockPulse {
      0%, 100% { transform: scale(1); filter: drop-shadow(0 0 10px rgba(212,175,55,0.4)); }
      50% { transform: scale(1.1); filter: drop-shadow(0 0 18px rgba(212,175,55,0.7)); }
    }

    @keyframes suitScaleUp {
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes flashFade {
      0% { opacity: 0; }
      20% { opacity: 1; }
      100% { opacity: 0; }
    }

    @keyframes scatter {
      0% {
        transform: translate(-50%, -50%) translate(var(--p-x), var(--p-y)) scale(var(--p-scale));
        opacity: 1;
      }
      100% {
        transform: translate(-50%, -50%) translate(var(--p-tx), var(--p-ty)) scale(0.1);
        opacity: 0;
      }
    }
  `]
})
export class TrumpRevealAnimationComponent implements OnInit, OnChanges {
  @Input() suit: Suit = 'H';
  @Input() active = false;

  @Output() animationComplete = new EventEmitter<void>();

  liftActive = false;
  flipActive = false;
  burstActive = false;
  shockwaveActive = false;
  bannerVisible = false;
  isEnding = false;

  particles: Particle[] = [];

  constructor(private soundService: SoundService) {}

  ngOnInit() {
    this.generateParticles();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['active'] && this.active) {
      this.runAnimation();
    }
  }

  private generateParticles() {
    this.particles = [];
    const count = 40;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 220;
      this.particles.push({
        id: i,
        x: (Math.random() - 0.5) * 50,
        y: (Math.random() - 0.5) * 50,
        scale: 0.6 + Math.random() * 0.8,
        delay: Math.random() * 0.15,
        angle,
        distance
      });
    }
  }

  getTranslationX(p: Particle): number {
    return Math.cos(p.angle) * p.distance;
  }

  getTranslationY(p: Particle): number {
    return Math.sin(p.angle) * p.distance;
  }

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

  private runAnimation() {
    // Reset flags
    this.liftActive = false;
    this.flipActive = false;
    this.burstActive = false;
    this.shockwaveActive = false;
    this.bannerVisible = false;
    this.isEnding = false;

    this.generateParticles();

    // Step 1: Lift Card
    setTimeout(() => {
      this.liftActive = true;
    }, 100);

    // Step 2: 3D Flip Card
    setTimeout(() => {
      this.flipActive = true;
    }, 900);

    // Step 3: midway flip - shockwave flash, play sound, burst particles
    setTimeout(() => {
      this.shockwaveActive = true;
      this.burstActive = true;
      this.soundService.playTrumpReveal();
    }, 1300);

    // Step 4: Show title banner
    setTimeout(() => {
      this.bannerVisible = true;
    }, 1600);

    // Step 5: Fade out overlay
    setTimeout(() => {
      this.isEnding = true;
    }, 3500);

    // Step 6: Complete
    setTimeout(() => {
      this.active = false;
      this.animationComplete.emit();
    }, 4000);
  }
}
