import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SoundService } from '../../core/services/sound.service';
import { AuthService } from '../../core/services/auth.service';
import gsap from 'gsap';

@Component({
  selector: 'app-splash',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="splash-screen">
      <!-- Ambient Lighting & Gradients -->
      <div class="spotlight"></div>
      
      <!-- Particle Background -->
      <div class="particles">
        <div *ngFor="let p of particlesArray" class="particle" [style.left.%]="p.x" [style.top.%]="p.y" [style.animation-delay.s]="p.delay" [style.animation-duration.s]="p.duration"></div>
      </div>

      <div class="logo-box">
        <!-- Shield/Card emblem -->
        <div class="logo-emblem">
          <span class="suit-icon red">♥</span>
          <span class="suit-icon gold">♠</span>
          <span class="suit-icon red">♦</span>
          <span class="suit-icon gold">♣</span>
        </div>
        
        <h1 class="logo-text">
          <span class="royal">ROYAL</span>
          <span class="club">CLUB</span>
        </h1>
        <p class="subtitle">29 CARD GAME</p>
      </div>

      <!-- Loading Section -->
      <div class="loading-section" *ngIf="loadingProgress() < 100">
        <div class="progress-bar-container">
          <div class="progress-bar" [style.width.%]="loadingProgress()"></div>
        </div>
        <span class="loading-percentage">{{ loadingProgress() }}% INITIALIZING</span>
      </div>

      <!-- Enter Section -->
      <div class="enter-section" *ngIf="loadingProgress() === 100">
        <button class="btn-enter btn-gold" (click)="enterGame()">
          ENTER CLUB
        </button>
      </div>

      <!-- Footer Info -->
      <div class="footer-info">
        <span>© 2026 ROYAL CLUB ENTERTAINMENT</span>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../styles/variables';
    @import '../../../styles/mixins';

    .splash-screen {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, $color-felt-darkest 0%, $color-bg-darkest 100%);
      @include flex-center;
      flex-direction: column;
      overflow: hidden;
    }

    .spotlight {
      position: absolute;
      width: 600px;
      height: 600px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.05) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
    }

    .particles {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 2;
    }

    .particle {
      position: absolute;
      width: 4px;
      height: 4px;
      background: $color-gold-light;
      border-radius: 50%;
      opacity: 0.15;
      animation: floatUp 8s infinite linear;
    }

    @keyframes floatUp {
      0% { transform: translateY(100vh) scale(0.8); opacity: 0; }
      50% { opacity: 0.3; }
      100% { transform: translateY(-10vh) scale(1.2); opacity: 0; }
    }

    .logo-box {
      text-align: center;
      margin-bottom: 50px;
      z-index: 5;
    }

    .logo-emblem {
      display: flex;
      justify-content: center;
      gap: 12px;
      font-size: 24px;
      margin-bottom: 15px;
      opacity: 0.9;
      
      .suit-icon {
        text-shadow: 0 0 10px rgba(0,0,0,0.5);
        &.red { color: $color-red-light; }
        &.gold { color: $color-gold-light; }
      }
    }

    .logo-text {
      font-size: 56px;
      font-weight: 900;
      line-height: 1.1;
      letter-spacing: 0.15em;
      margin-bottom: 8px;
      font-family: $font-headings;
      display: flex;
      justify-content: center;
      gap: 15px;
      
      .royal {
        color: $color-silver-light;
        text-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
      }
      
      .club {
        background: $gradient-gold;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(0 0 10px $color-gold-glow);
      }
    }

    .subtitle {
      font-family: $font-headings;
      font-size: 14px;
      color: $color-silver-base;
      letter-spacing: 0.4em;
      text-indent: 0.4em;
      font-weight: 600;
      opacity: 0.8;
    }

    .loading-section {
      width: 250px;
      text-align: center;
      z-index: 5;
    }

    .progress-bar-container {
      width: 100%;
      height: 4px;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 2px;
      overflow: hidden;
      margin-bottom: 12px;
      border: 1px solid rgba(255, 255, 255, 0.02);
    }

    .progress-bar {
      height: 100%;
      background: $gradient-gold;
      box-shadow: 0 0 8px $color-gold-light;
      width: 0%;
      transition: width 0.1s linear;
    }

    .loading-percentage {
      font-family: $font-numeric;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.2em;
      color: $color-silver-dark;
    }

    .enter-section {
      z-index: 5;
      animation: pulseEnter 2s infinite ease-in-out;
    }

    .btn-enter {
      padding: 14px 40px;
      font-size: 14px;
    }

    .footer-info {
      position: absolute;
      bottom: 25px;
      font-size: 10px;
      color: $color-silver-dark;
      letter-spacing: 0.15em;
      z-index: 5;
    }

    @keyframes pulseEnter {
      0% { transform: scale(1); filter: brightness(1); }
      50% { transform: scale(1.03); filter: brightness(1.15); }
      100% { transform: scale(1); filter: brightness(1); }
    }
  `]
})
export class SplashComponent implements OnInit {
  loadingProgress = signal<number>(0);
  particlesArray: { x: number; y: number; delay: number; duration: number }[] = [];

  constructor(
    private soundService: SoundService,
    private authService: AuthService,
    private router: Router
  ) {
    this.generateParticles();
  }

  ngOnInit() {
    this.startLoading();
  }

  private generateParticles() {
    for (let i = 0; i < 40; i++) {
      this.particlesArray.push({
        x: Math.random() * 100,
        y: Math.random() * 80 + 20,
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 5
      });
    }
  }

  private startLoading() {
    const interval = setInterval(() => {
      this.loadingProgress.update(val => {
        if (val >= 100) {
          clearInterval(interval);
          this.animateLogo();
          return 100;
        }
        
        // Random incremental steps
        const step = Math.floor(Math.random() * 8) + 2;
        
        // Play deal sound at key loading spots
        if (val % 25 < step) {
          this.soundService.playCardDeal();
        }

        return Math.min(100, val + step);
      });
    }, 120);
  }

  private animateLogo() {
    gsap.from('.logo-text', {
      scale: 0.95,
      opacity: 0.8,
      duration: 1,
      ease: 'elastic.out(1, 0.3)'
    });
  }

  enterGame() {
    this.soundService.playClick();
    
    // Redirect to home if logged in, otherwise auth
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/auth']);
    }
  }
}
