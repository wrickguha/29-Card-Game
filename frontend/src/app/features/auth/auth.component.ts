import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SoundService } from '../../core/services/sound.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page">
      <div class="spotlight"></div>
      
      <!-- Logo Header -->
      <div class="logo-header" (click)="goToSplash()">
        <h1><span class="silver">ROYAL</span><span class="gold">CLUB</span></h1>
      </div>

      <!-- Auth Container Card -->
      <div class="auth-card fade-in">
        <!-- Tabs -->
        <div class="auth-tabs">
          <button [class.active]="activeTab() === 'login'" (click)="setTab('login')">LOGIN</button>
          <button [class.active]="activeTab() === 'register'" (click)="setTab('register')">REGISTER</button>
        </div>

        <div class="tab-divider"></div>

        <!-- Login View -->
        <form class="auth-form" *ngIf="activeTab() === 'login'" (submit)="onLogin($event)">
          <div class="input-group">
            <label for="login-username">USERNAME</label>
            <input 
              id="login-username"
              type="text" 
              name="username"
              [(ngModel)]="loginUsername" 
              placeholder="Enter your gaming alias"
              required
              autocomplete="off"
            />
          </div>

          <div class="input-group">
            <label for="login-password">PASSWORD</label>
            <input 
              id="login-password"
              type="password" 
              name="password"
              [(ngModel)]="loginPassword" 
              placeholder="••••••••"
              required
            />
          </div>

          <div class="form-options">
            <label class="checkbox-container">
              <input type="checkbox" [(ngModel)]="rememberMe" name="rememberMe" />
              <span class="checkmark"></span>
              REMEMBER ME
            </label>
            <a href="javascript:void(0)" class="forgot-link" (click)="forgotPassword()">FORGOT PASSWORD?</a>
          </div>

          <button type="submit" class="btn-submit btn-gold">LAUNCH SESSION</button>
        </form>

        <!-- Register View -->
        <form class="auth-form" *ngIf="activeTab() === 'register'" (submit)="onRegister($event)">
          <div class="input-group">
            <label for="reg-username">USERNAME</label>
            <input 
              id="reg-username"
              type="text" 
              name="regUsername"
              [(ngModel)]="regUsername" 
              placeholder="Choose a unique alias"
              (input)="validateUsername()"
              required
              autocomplete="off"
            />
          </div>

          <div class="input-group">
            <label for="reg-password">PASSWORD</label>
            <input 
              id="reg-password"
              type="password" 
              name="regPassword"
              [(ngModel)]="regPassword" 
              placeholder="Minimum 6 characters"
              (input)="checkPasswordStrength()"
              required
            />
            
            <!-- Password Strength Bar -->
            <div class="strength-meter" *ngIf="regPassword.length > 0">
              <div class="strength-bar" [class]="passwordStrengthClass" [style.width.%]="passwordStrengthWidth"></div>
              <span class="strength-label">STRENGTH: {{ passwordStrengthText }}</span>
            </div>
          </div>

          <!-- Avatar Picker -->
          <div class="avatar-picker-section">
            <label>CHOOSE AVATAR</label>
            <div class="avatar-list">
              <div 
                *ngFor="let avatar of availableAvatars" 
                class="avatar-item"
                [class.selected]="selectedAvatar() === avatar.id"
                (click)="selectAvatar(avatar.id)"
              >
                <div class="avatar-icon" [class]="avatar.id">
                  {{ avatar.label }}
                </div>
              </div>
            </div>
          </div>

          <button type="submit" class="btn-submit btn-emerald">CREATE ACCOUNT</button>
        </form>

        <!-- Social login placeholder -->
        <div class="social-login-section">
          <div class="social-divider">
            <span>OR CONNECT WITH</span>
          </div>
          <div class="social-buttons">
            <button class="social-btn google" (click)="socialLogin('Google')">
              <span class="btn-icon">G</span> Google
            </button>
            <button class="social-btn discord" (click)="socialLogin('Discord')">
              <span class="btn-icon">D</span> Discord
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../styles/variables';
    @import '../../../styles/mixins';

    .auth-page {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, $color-felt-darkest 0%, $color-bg-darkest 100%);
      @include flex-center;
      flex-direction: column;
      overflow: hidden;
      padding: 20px;
    }

    .spotlight {
      position: absolute;
      width: 700px;
      height: 700px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.04) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
    }

    .logo-header {
      margin-bottom: 30px;
      z-index: 5;
      cursor: pointer;
      
      h1 {
        font-size: 28px;
        letter-spacing: 0.25em;
        text-shadow: 0 4px 10px rgba(0,0,0,0.8);
        font-family: $font-headings;
        
        .silver { color: $color-silver-light; }
        .gold { background: $gradient-gold; -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      }
    }

    .auth-card {
      width: 100%;
      max-width: 440px;
      background: linear-gradient(135deg, rgba(20, 28, 40, 0.85) 0%, rgba(10, 14, 20, 0.95) 100%);
      @include glass-panel(0.06, 16px, rgba(212, 175, 55, 0.1));
      border-radius: 12px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.8);
      z-index: 5;
      padding: 30px 40px;
      position: relative;
    }

    .auth-tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      
      button {
        flex: 1;
        background: none;
        border: none;
        color: $color-silver-dark;
        font-family: $font-headings;
        font-size: 14px;
        font-weight: 700;
        letter-spacing: 0.1em;
        padding: 10px 0;
        cursor: pointer;
        transition: all $transition-normal;
        border-bottom: 2px solid transparent;

        &.active {
          color: $color-gold-light;
          border-bottom-color: $color-gold-base;
          text-shadow: 0 0 8px rgba(212, 175, 55, 0.3);
        }

        &:hover:not(.active) {
          color: $color-silver-light;
        }
      }
    }

    .tab-divider {
      height: 1px;
      background: rgba(255, 255, 255, 0.05);
      margin-bottom: 25px;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .input-group {
      display: flex;
      flex-direction: column;
      gap: 8px;

      label {
        font-family: $font-headings;
        font-size: 10px;
        font-weight: 700;
        color: $color-silver-base;
        letter-spacing: 0.15em;
      }

      input {
        background: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 6px;
        padding: 12px 16px;
        color: $color-silver-light;
        font-family: $font-body;
        font-size: 14px;
        transition: all $transition-normal;

        &:focus {
          outline: none;
          border-color: $color-gold-base;
          background: rgba(0, 0, 0, 0.5);
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.15);
        }

        &::placeholder {
          color: rgba(255, 255, 255, 0.2);
        }
      }
    }

    .form-options {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 11px;
      font-weight: 600;
      color: $color-silver-base;
      letter-spacing: 0.05em;
    }

    .checkbox-container {
      display: flex;
      align-items: center;
      position: relative;
      padding-left: 22px;
      cursor: pointer;
      user-select: none;

      input {
        position: absolute;
        opacity: 0;
        cursor: pointer;
        height: 0; width: 0;
      }

      .checkmark {
        position: absolute;
        top: -1px; left: 0;
        height: 14px; width: 14px;
        background-color: rgba(0, 0, 0, 0.4);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 3px;
        transition: all $transition-normal;
      }

      &:hover input ~ .checkmark {
        border-color: $color-gold-light;
      }

      input:checked ~ .checkmark {
        background-color: $color-gold-base;
        border-color: $color-gold-light;
        box-shadow: 0 0 5px $color-gold-glow;
      }

      .checkmark:after {
        content: "";
        position: absolute;
        display: none;
      }

      input:checked ~ .checkmark:after {
        display: block;
      }

      .checkmark:after {
        left: 4px;
        top: 1px;
        width: 3px;
        height: 7px;
        border: solid #000;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
    }

    .forgot-link {
      color: $color-silver-base;
      text-decoration: none;
      transition: color $transition-fast;

      &:hover {
        color: $color-gold-light;
      }
    }

    .btn-submit {
      width: 100%;
      padding: 14px;
      font-size: 13px;
      margin-top: 10px;
    }

    .strength-meter {
      margin-top: 5px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .strength-bar {
      height: 3px;
      border-radius: 2px;
      background: #4b5563;
      transition: all 0.3s;

      &.weak { background: $color-red-base; }
      &.medium { background: #fbbf24; }
      &.strong { background: $color-emerald-base; }
    }

    .strength-label {
      font-size: 9px;
      font-weight: 700;
      color: $color-silver-dark;
      letter-spacing: 0.05em;
    }

    .avatar-picker-section {
      display: flex;
      flex-direction: column;
      gap: 10px;
      
      label {
        font-family: $font-headings;
        font-size: 10px;
        font-weight: 700;
        color: $color-silver-base;
        letter-spacing: 0.15em;
      }
    }

    .avatar-list {
      display: flex;
      justify-content: space-between;
      gap: 10px;
    }

    .avatar-item {
      flex: 1;
      aspect-ratio: 1;
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.1);
      cursor: pointer;
      @include flex-center;
      transition: all $transition-normal;
      overflow: hidden;

      &:hover {
        border-color: rgba(255, 255, 255, 0.4);
        transform: scale(1.05);
      }

      &.selected {
        border-color: $color-gold-light;
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
        transform: scale(1.1);
      }
    }

    .avatar-icon {
      width: 100%;
      height: 100%;
      @include flex-center;
      font-family: $font-headings;
      font-weight: 800;
      font-size: 14px;
      color: #fff;
      background-size: cover;
      
      &.avatar_gold_tiger { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; }
      &.avatar_zeus { background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); }
      &.avatar_thor { background: linear-gradient(135deg, #10b981 0%, #047857 100%); }
      &.avatar_hera { background: linear-gradient(135deg, #ec4899 0%, #be185d 100%); }
    }

    .social-login-section {
      margin-top: 25px;
      text-align: center;
    }

    .social-divider {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 20px;
      
      span {
        font-family: $font-headings;
        font-size: 9px;
        font-weight: 800;
        color: $color-silver-dark;
        letter-spacing: 0.15em;
        white-space: nowrap;
      }
      
      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: rgba(255, 255, 255, 0.05);
      }
    }

    .social-buttons {
      display: flex;
      gap: 15px;
    }

    .social-btn {
      flex: 1;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 6px;
      padding: 10px;
      color: $color-silver-base;
      font-family: $font-headings;
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.05em;
      cursor: pointer;
      @include flex-center;
      gap: 8px;
      transition: all $transition-normal;

      .btn-icon {
        font-weight: 900;
      }

      &:hover {
        background: rgba(255, 255, 255, 0.08);
        border-color: rgba(255, 255, 255, 0.2);
        color: $color-silver-light;
      }

      &:active {
        transform: translateY(1px);
      }
    }
  `]
})
export class AuthComponent {
  activeTab = signal<'login' | 'register'>('login');
  selectedAvatar = signal<string>('avatar_gold_tiger');

  // Login inputs
  loginUsername = '';
  loginPassword = '';
  rememberMe = true;

  // Register inputs
  regUsername = '';
  regPassword = '';
  
  // Password Strength indicators
  passwordStrengthWidth = 0;
  passwordStrengthText = 'NONE';
  passwordStrengthClass = '';

  availableAvatars = [
    { id: 'avatar_gold_tiger', label: 'TG' },
    { id: 'avatar_zeus', label: 'ZS' },
    { id: 'avatar_thor', label: 'TH' },
    { id: 'avatar_hera', label: 'HR' }
  ];

  constructor(
    private authService: AuthService,
    private soundService: SoundService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  setTab(tab: 'login' | 'register') {
    this.soundService.playClick();
    this.activeTab.set(tab);
  }

  selectAvatar(avatarId: string) {
    this.soundService.playClick();
    this.selectedAvatar.set(avatarId);
  }

  validateUsername() {
    // Basic formatting filter
  }

  checkPasswordStrength() {
    const len = this.regPassword.length;
    if (len === 0) {
      this.passwordStrengthWidth = 0;
      this.passwordStrengthText = 'NONE';
      this.passwordStrengthClass = '';
    } else if (len < 6) {
      this.passwordStrengthWidth = 33;
      this.passwordStrengthText = 'WEAK';
      this.passwordStrengthClass = 'weak';
    } else if (len < 10) {
      this.passwordStrengthWidth = 66;
      this.passwordStrengthText = 'MEDIUM';
      this.passwordStrengthClass = 'medium';
    } else {
      this.passwordStrengthWidth = 100;
      this.passwordStrengthText = 'STRONG';
      this.passwordStrengthClass = 'strong';
    }
  }

  onLogin(e: Event) {
    e.preventDefault();
    const success = this.authService.login(this.loginUsername, this.loginPassword);
    if (success) {
      this.soundService.playVictory();
      this.notificationService.show('Welcome back to Royal Club!', 'gold');
      this.router.navigate(['/home']);
    } else {
      this.soundService.playDefeat();
      this.notificationService.show('Please enter a valid username (min 3 chars).', 'error');
    }
  }

  onRegister(e: Event) {
    e.preventDefault();
    if (this.regPassword.length < 6) {
      this.soundService.playClick();
      this.notificationService.show('Password must be at least 6 characters.', 'warning');
      return;
    }

    const success = this.authService.register(
      this.regUsername,
      this.regPassword,
      this.selectedAvatar()
    );

    if (success) {
      this.soundService.playVictory();
      this.notificationService.show('Account created successfully!', 'success');
      this.router.navigate(['/home']);
    } else {
      this.soundService.playDefeat();
      this.notificationService.show('Invalid registration details.', 'error');
    }
  }

  socialLogin(platform: string) {
    this.soundService.playClick();
    this.notificationService.show(`Connecting to ${platform}... (Placeholder)`, 'info');
  }

  forgotPassword() {
    this.soundService.playClick();
    this.notificationService.show('Reset instructions would be sent. (Placeholder)', 'info');
  }

  goToSplash() {
    this.soundService.playClick();
    this.router.navigate(['/']);
  }
}
