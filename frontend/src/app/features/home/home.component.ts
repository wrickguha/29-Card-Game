import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { SoundService } from '../../core/services/sound.service';
import { LobbyService } from '../../core/services/lobby.service';
import { NotificationService } from '../../core/services/notification.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent, ModalComponent],
  template: `
    <div class="home-page fade-in">
      <div class="header-bar">
        <!-- Brand logo -->
        <div class="brand">
          <span class="logo-suit">♠</span>
          <h2>ROYAL CLUB</h2>
        </div>

        <!-- User profile summary -->
        <div class="user-summary" *ngIf="user()">
          <div class="coin-display" (click)="buyCoins()">
            <span class="coin-icon">🪙</span>
            <span class="coin-count">{{ user()?.coinCount }}</span>
            <button class="add-coins-btn">+</button>
          </div>

          <div class="profile-preview" (click)="openProfileModal()">
            <app-avatar 
              [name]="user()?.username || 'Player'" 
              [avatarId]="user()?.avatarId || 'avatar_default_1'" 
              [showDetails]="false" 
              [isActive]="true"
            ></app-avatar>
            <div class="user-details">
              <span class="username">{{ user()?.username }}</span>
              <span class="rank-name">{{ user()?.stats?.currentRank }}</span>
            </div>
          </div>

          <button class="logout-btn btn-glass" (click)="onLogout()">LOGOUT</button>
        </div>
      </div>

      <!-- Main Dashboard Grid -->
      <div class="dashboard-grid">
        <!-- Left Panel: Main navigation cards -->
        <div class="main-actions-panel">
          <!-- Promo Banner -->
          <div class="promo-banner">
            <div class="banner-overlay"></div>
            <div class="banner-content">
              <span class="season-badge">SEASON 1</span>
              <h3>THE ROYAL OPENING</h3>
              <p>Climb to Grandmaster rank and win exclusive card back designs. Double XP active!</p>
            </div>
          </div>

          <!-- Actions Grid -->
          <div class="actions-row">
            <div class="action-card play" (click)="quickPlay()">
              <div class="card-bg-light"></div>
              <span class="action-icon">🎯</span>
              <h4>QUICK PLAY</h4>
              <p>Instantly jump into a match with AI partners</p>
              <div class="card-glow-line"></div>
            </div>

            <div class="action-card lobby" (click)="createLobby()">
              <div class="card-bg-light"></div>
              <span class="action-icon">👑</span>
              <h4>CREATE LOBBY</h4>
              <p>Start a private room and invite friends</p>
              <div class="card-glow-line"></div>
            </div>

            <div class="action-card code" (click)="openJoinModal()">
              <div class="card-bg-light"></div>
              <span class="action-icon">🎟️</span>
              <h4>JOIN BY CODE</h4>
              <p>Enter a room invitation code to connect</p>
              <div class="card-glow-line"></div>
            </div>
          </div>
        </div>

        <!-- Right Panels: Friends and Stats -->
        <div class="sidebar-panels">
          <!-- Friends List -->
          <div class="sidebar-panel glass-panel">
            <div class="panel-header">
              <h4>FRIENDS ONLINE</h4>
              <button class="add-friend-btn" (click)="addFriendPrompt()">+</button>
            </div>
            <div class="friends-list">
              <div *ngFor="let friend of friends" class="friend-item">
                <div class="friend-left">
                  <span class="online-indicator" [class.online]="friend.online"></span>
                  <span class="friend-name">{{ friend.name }}</span>
                </div>
                <div class="friend-right">
                  <span class="friend-status" [class.in-game]="friend.status.includes('Game')">{{ friend.status }}</span>
                  <button 
                    class="invite-btn btn-gold" 
                    *ngIf="friend.online && friend.status === 'Lobby'" 
                    (click)="inviteFriend(friend.name)"
                  >INVITE</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Fast Statistics -->
          <div class="sidebar-panel glass-panel" (click)="openProfileModal()">
            <div class="panel-header">
              <h4>MATCH STATISTICS</h4>
              <span class="arrow-indicator">➔</span>
            </div>
            <div class="stats-overview" *ngIf="user()">
              <div class="stat-box">
                <span class="stat-value">{{ user()?.stats?.gamesPlayed }}</span>
                <span class="stat-label">PLAYED</span>
              </div>
              <div class="stat-box">
                <span class="stat-value">{{ user()?.stats?.gamesWon }}</span>
                <span class="stat-label">WON</span>
              </div>
              <div class="stat-box highlight">
                <span class="stat-value">{{ user()?.stats?.winRate }}%</span>
                <span class="stat-label">WIN RATE</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Settings button on footer -->
      <div class="footer-bar">
        <button class="footer-btn btn-glass" (click)="openSettingsModal()">⚙️ SETTINGS</button>
        <span class="app-version">v1.0.4-STABLE</span>
      </div>

      <!-- Settings Modal -->
      <app-modal [title]="'GAME SETTINGS'" [(isOpen)]="isSettingsOpen" maxWidth="400px">
        <div class="settings-content">
          <div class="settings-option">
            <div class="option-info">
              <h5>SOUND EFFECTS</h5>
              <p>Play clicks, deal rustles, and win chords</p>
            </div>
            <button 
              class="toggle-switch" 
              [class.checked]="soundService.soundEnabled()"
              (click)="soundService.toggleSound()"
            >
              <span class="knob"></span>
            </button>
          </div>

          <div class="settings-option">
            <div class="option-info">
              <h5>AMBIENT MUSIC</h5>
              <p>Play soft poker table background tunes</p>
            </div>
            <button 
              class="toggle-switch" 
              [class.checked]="soundService.musicEnabled()"
              (click)="soundService.toggleMusic()"
            >
              <span class="knob"></span>
            </button>
          </div>

          <div class="settings-option">
            <div class="option-info">
              <h5>GAMEPLAY SPEED</h5>
              <p>Simulate faster bot play actions</p>
            </div>
            <select class="settings-select" [(ngModel)]="selectedSpeed" name="speed">
              <option value="normal">Normal (1.2s delay)</option>
              <option value="fast">Fast (0.6s delay)</option>
            </select>
          </div>

          <div class="settings-option">
            <div class="option-info">
              <h5>INTERFACE THEME</h5>
              <p>Default dark-forest poker felt theme</p>
            </div>
            <span class="badge-active">ROYAL FELT</span>
          </div>

          <button class="btn-submit btn-gold" (click)="isSettingsOpen = false">SAVE & CLOSE</button>
        </div>
      </app-modal>

      <!-- Join by Code Modal -->
      <app-modal [title]="'ENTER ROOM CODE'" [(isOpen)]="isJoinOpen" maxWidth="380px">
        <div class="join-content">
          <p class="join-desc">Ask your friends for the 8-digit lobby code and paste it below to enter their table.</p>
          <input 
            class="code-input"
            type="text" 
            [(ngModel)]="lobbyCode" 
            placeholder="ROYAL-1234"
            maxlength="10"
            required
          />
          <div class="join-actions">
            <button class="btn-glass" (click)="isJoinOpen = false">CANCEL</button>
            <button class="btn-gold" (click)="submitJoinCode()">CONNECT</button>
          </div>
        </div>
      </app-modal>

      <!-- User Profile Modal -->
      <app-modal [title]="'PLAYER CARD'" [(isOpen)]="isProfileOpen" maxWidth="450px">
        <div class="profile-modal-content" *ngIf="user()">
          <div class="profile-header">
            <app-avatar 
              [name]="user()?.username || 'Player'" 
              [avatarId]="user()?.avatarId || 'avatar_default_1'" 
              [showDetails]="false" 
              [isActive]="true"
            ></app-avatar>
            <div class="profile-title">
              <h4>{{ user()?.username }}</h4>
              <span class="rank-badge">{{ user()?.stats?.currentRank }} ({{ user()?.stats?.rankPoints }} RP)</span>
            </div>
          </div>

          <div class="profile-stats-grid">
            <div class="prof-stat">
              <span class="prof-val">{{ user()?.stats?.gamesPlayed }}</span>
              <span class="prof-lbl">Games Played</span>
            </div>
            <div class="prof-stat">
              <span class="prof-val">{{ user()?.stats?.gamesWon }}</span>
              <span class="prof-lbl">Games Won</span>
            </div>
            <div class="prof-stat">
              <span class="prof-val">{{ user()?.stats?.winRate }}%</span>
              <span class="prof-lbl">Win Ratio</span>
            </div>
            <div class="prof-stat">
              <span class="prof-val">{{ user()?.stats?.highestScore }}</span>
              <span class="prof-lbl">Highest Bids Met</span>
            </div>
          </div>

          <div class="badge-section">
            <h5>EARNED BADGES</h5>
            <div class="badges-row">
              <span *ngFor="let badge of user()?.stats?.badges" class="badge-tag">
                🏆 {{ badge }}
              </span>
              <span *ngIf="!user()?.stats?.badges?.length" class="empty-badges">No badges earned yet. Play matches!</span>
            </div>
          </div>

          <div class="partner-box">
            <span class="lbl">FAVORITE PARTNER:</span>
            <span class="val">{{ user()?.stats?.favoritePartner }}</span>
          </div>
        </div>
      </app-modal>
    </div>
  `,
  styles: [`
    @import '../../../styles/variables';
    @import '../../../styles/mixins';

    .home-page {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, $color-felt-base 0%, $color-bg-darkest 100%);
      display: flex;
      flex-direction: column;
      padding: 30px;
      overflow-y: auto;
    }

    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 20px;
    }

    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      
      .logo-suit {
        font-size: 28px;
        color: $color-gold-light;
        text-shadow: 0 0 10px $color-gold-glow;
      }
      
      h2 {
        font-size: 20px;
        letter-spacing: 0.1em;
      }
    }

    .user-summary {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .coin-display {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(0, 0, 0, 0.4);
      border: 1px solid rgba(212, 175, 55, 0.2);
      padding: 6px 12px;
      border-radius: 20px;
      cursor: pointer;
      transition: background 0.2s;

      &:hover {
        background: rgba(0,0,0,0.6);
      }

      .coin-icon { font-size: 14px; }
      .coin-count {
        font-family: $font-numeric;
        font-weight: 700;
        font-size: 13px;
        color: $color-gold-light;
      }
      .add-coins-btn {
        background: none;
        border: none;
        color: $color-gold-light;
        font-weight: 900;
        font-size: 12px;
        padding-left: 4px;
        cursor: pointer;
      }
    }

    .profile-preview {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 8px;
      transition: background 0.2s;

      &:hover {
        background: rgba(255, 255, 255, 0.03);
      }

      app-avatar {
        transform: scale(0.7);
        margin: -15px;
      }

      .user-details {
        display: flex;
        flex-direction: column;
      }

      .username {
        font-size: 13px;
        font-weight: 600;
        color: $color-silver-light;
      }

      .rank-name {
        font-size: 9px;
        color: $color-gold-light;
        font-weight: 800;
        letter-spacing: 0.05em;
        text-transform: uppercase;
      }
    }

    .logout-btn {
      padding: 8px 16px;
      font-size: 10px;
    }

    .dashboard-grid {
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 30px;
      flex: 1;

      @include respond-to('tablet') {
        grid-template-columns: 1fr;
      }
    }

    .main-actions-panel {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .promo-banner {
      height: 200px;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
      background: linear-gradient(135deg, $color-felt-light 0%, $color-felt-darkest 100%);
      border: 1px solid rgba(212, 175, 55, 0.15);
      @include flex-center;
      justify-content: flex-start;
      padding: 40px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);

      .banner-overlay {
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: radial-gradient(circle at right, rgba(212,175,55,0.08) 0%, transparent 60%);
        pointer-events: none;
      }

      .banner-content {
        z-index: 2;
        max-width: 450px;
      }

      .season-badge {
        font-family: $font-headings;
        font-size: 10px;
        font-weight: 900;
        color: $color-gold-light;
        letter-spacing: 0.15em;
        border: 1.5px solid $color-gold-base;
        padding: 2px 8px;
        border-radius: 4px;
        display: inline-block;
        margin-bottom: 12px;
        box-shadow: 0 0 5px $color-gold-glow;
      }

      h3 {
        font-size: 24px;
        margin-bottom: 8px;
        @include glow-text($color-silver-light, 8px);
      }

      p {
        font-size: 13px;
        color: $color-silver-base;
        line-height: 1.5;
      }
    }

    .actions-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;

      @include respond-to('mobile') {
        grid-template-columns: 1fr;
      }
    }

    .action-card {
      @include glass-panel(0.04, 12px, rgba(255, 255, 255, 0.06));
      border-radius: 10px;
      padding: 30px 24px;
      cursor: pointer;
      position: relative;
      overflow: hidden;
      transition: all $transition-normal;
      box-shadow: $shadow-soft;

      &:hover {
        transform: translateY(-5px);
        @include gold-border(0.15);
        box-shadow: 0 12px 30px rgba(0, 0, 0, 0.6);
        background: rgba(255, 255, 255, 0.05);

        .card-glow-line {
          left: 100%;
          transition: left 0.75s ease;
        }
      }

      .action-icon {
        font-size: 32px;
        display: block;
        margin-bottom: 15px;
      }

      h4 {
        font-size: 15px;
        margin-bottom: 8px;
        color: $color-silver-light;
      }

      p {
        font-size: 12px;
        color: $color-silver-dark;
        line-height: 1.4;
      }

      .card-glow-line {
        position: absolute;
        top: 0; left: -100%;
        width: 100%;
        height: 2px;
        background: $gradient-gold;
      }
    }

    .sidebar-panels {
      display: flex;
      flex-direction: column;
      gap: 30px;
    }

    .glass-panel {
      @include glass-panel(0.04, 12px, rgba(255, 255, 255, 0.05));
      border-radius: 10px;
      padding: 20px;
      box-shadow: $shadow-soft;
    }

    .panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);
      padding-bottom: 10px;

      h4 {
        font-size: 12px;
        color: $color-silver-base;
        letter-spacing: 0.05em;
      }

      .add-friend-btn, .arrow-indicator {
        background: none;
        border: none;
        color: $color-silver-dark;
        cursor: pointer;
        font-size: 16px;
        transition: color 0.2s;

        &:hover {
          color: $color-gold-light;
        }
      }
    }

    .friends-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .friend-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 13px;
    }

    .friend-left {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .online-indicator {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: $color-silver-dark;

      &.online {
        background: $color-emerald-base;
        box-shadow: 0 0 6px $color-emerald-glow;
      }
    }

    .friend-name {
      font-weight: 500;
      color: $color-silver-light;
    }

    .friend-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .friend-status {
      font-size: 11px;
      color: $color-silver-dark;
      
      &.in-game {
        color: $color-blue-light;
        font-weight: 600;
      }
    }

    .invite-btn {
      padding: 4px 10px;
      font-size: 9px;
      border-radius: 4px;
    }

    .stats-overview {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      cursor: pointer;
    }

    .stat-box {
      flex: 1;
      background: rgba(0, 0, 0, 0.25);
      border: 1px solid rgba(255,255,255,0.03);
      padding: 12px 6px;
      border-radius: 6px;
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;
      transition: border-color 0.2s;

      &.highlight {
        border-color: rgba(212, 175, 55, 0.15);
        .stat-value {
          color: $color-gold-light;
          text-shadow: 0 0 5px $color-gold-glow;
        }
      }

      .stat-value {
        font-family: $font-numeric;
        font-weight: 800;
        font-size: 18px;
        color: $color-silver-light;
      }

      .stat-label {
        font-size: 8px;
        font-weight: 700;
        color: $color-silver-dark;
        letter-spacing: 0.05em;
      }

      &:hover {
        border-color: rgba(255, 255, 255, 0.15);
      }
    }

    .footer-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-top: 30px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      padding-top: 20px;
    }

    .footer-btn {
      padding: 10px 18px;
      font-size: 11px;
    }

    .app-version {
      font-size: 9px;
      font-family: $font-numeric;
      color: $color-silver-dark;
      letter-spacing: 0.05em;
    }

    // Modal Specific Contents
    .settings-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .settings-option {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);

      .option-info {
        h5 { font-size: 12px; color: $color-silver-light; margin-bottom: 2px; }
        p { font-size: 10px; color: $color-silver-dark; }
      }
    }

    .toggle-switch {
      width: 44px;
      height: 22px;
      border-radius: 11px;
      background: #374151;
      border: none;
      cursor: pointer;
      position: relative;
      transition: background 0.3s;

      .knob {
        position: absolute;
        top: 2px; left: 2px;
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: #fff;
        transition: left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
      }

      &.checked {
        background: $color-emerald-base;
        box-shadow: 0 0 8px rgba(24, 191, 110, 0.3);
        .knob { left: 24px; }
      }
    }

    .settings-select {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 4px;
      color: $color-silver-light;
      padding: 6px 12px;
      font-size: 12px;
      font-family: $font-body;
      outline: none;
      cursor: pointer;

      &:focus {
        border-color: $color-gold-base;
      }
    }

    .badge-active {
      font-family: $font-headings;
      font-size: 9px;
      font-weight: 800;
      color: $color-emerald-light;
      background: rgba(24, 191, 110, 0.1);
      border: 1px solid rgba(24, 191, 110, 0.3);
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 0.05em;
    }

    // Join Code Modal
    .join-content {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .join-desc {
      font-size: 12px;
      color: $color-silver-base;
      line-height: 1.5;
    }

    .code-input {
      background: rgba(0,0,0,0.4);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 6px;
      padding: 12px;
      color: $color-silver-light;
      text-align: center;
      font-family: $font-headings;
      font-size: 18px;
      letter-spacing: 0.1em;
      text-transform: uppercase;

      &:focus {
        outline: none;
        border-color: $color-gold-base;
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.1);
      }
    }

    .join-actions {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
      
      button {
        padding: 10px 20px;
        font-size: 11px;
      }
    }

    // Profile Card Content
    .profile-modal-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;

      app-avatar {
        transform: scale(1.1);
      }

      .profile-title {
        display: flex;
        flex-direction: column;
        gap: 4px;
        
        h4 { font-size: 18px; }
        .rank-badge {
          font-family: $font-headings;
          font-size: 10px;
          font-weight: 800;
          color: $color-gold-light;
          letter-spacing: 0.05em;
          text-transform: uppercase;
        }
      }
    }

    .profile-stats-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      background: rgba(0,0,0,0.25);
      border: 1px solid rgba(255,255,255,0.03);
      padding: 15px;
      border-radius: 8px;
    }

    .prof-stat {
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: 4px;

      .prof-val {
        font-family: $font-numeric;
        font-weight: 800;
        font-size: 16px;
        color: $color-silver-light;
      }

      .prof-lbl {
        font-size: 9px;
        color: $color-silver-dark;
      }
    }

    .badge-section {
      display: flex;
      flex-direction: column;
      gap: 8px;

      h5 {
        font-size: 11px;
        color: $color-silver-base;
        letter-spacing: 0.05em;
      }
    }

    .badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .badge-tag {
      font-size: 10px;
      font-weight: 600;
      color: $color-silver-light;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.06);
      padding: 4px 10px;
      border-radius: 4px;
    }

    .empty-badges {
      font-size: 11px;
      color: $color-silver-dark;
      font-style: italic;
    }

    .partner-box {
      background: rgba(0,0,0,0.15);
      padding: 10px 15px;
      border-radius: 6px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 12px;
      border: 1px dashed rgba(255,255,255,0.05);

      .lbl { color: $color-silver-dark; font-weight: 600; }
      .val { color: $color-gold-light; font-weight: 800; }
    }
  `]
})
export class HomeComponent {
  isSettingsOpen = false;
  isJoinOpen = false;
  isProfileOpen = false;
  lobbyCode = '';
  selectedSpeed = 'normal';

  user = this.authService.currentUser;

  friends = [
    { name: 'ZeusAI', online: true, status: 'Lobby' },
    { name: 'HeraAI', online: true, status: 'Lobby' },
    { name: 'ThorAI', online: true, status: 'In Game' },
    { name: 'OdinAI', online: false, status: 'Offline' },
    { name: 'FreyaAI', online: false, status: 'Offline' }
  ];

  constructor(
    private authService: AuthService,
    public soundService: SoundService,
    private lobbyService: LobbyService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  quickPlay() {
    this.soundService.playClick();
    this.lobbyService.createRoom();
    
    // Auto toggle user ready to speed up simulation
    setTimeout(() => {
      this.lobbyService.toggleCurrentUserReady();
    }, 1000);

    this.router.navigate(['/lobby']);
  }

  createLobby() {
    this.lobbyService.createRoom();
    this.router.navigate(['/lobby']);
  }

  openJoinModal() {
    this.soundService.playClick();
    this.lobbyCode = '';
    this.isJoinOpen = true;
  }

  submitJoinCode() {
    if (this.lobbyCode.trim().length > 0) {
      this.isJoinOpen = false;
      this.lobbyService.joinRoom(this.lobbyCode);
      this.router.navigate(['/lobby']);
    } else {
      this.soundService.playClick();
      this.notificationService.show('Please enter a valid code.', 'warning');
    }
  }

  openSettingsModal() {
    this.soundService.playClick();
    this.isSettingsOpen = true;
  }

  openProfileModal() {
    this.soundService.playClick();
    this.isProfileOpen = true;
  }

  buyCoins() {
    this.soundService.playVictory();
    this.authService.addCoins(1000);
    this.notificationService.show('+1,000 Coins Reward Added!', 'gold');
  }

  addFriendPrompt() {
    this.soundService.playClick();
    this.notificationService.show('Adding friends is a mock visual feature.', 'info');
  }

  inviteFriend(name: string) {
    this.soundService.playClick();
    this.notificationService.show(`Invitation sent to ${name}!`, 'success');
  }

  onLogout() {
    this.soundService.playClick();
    this.authService.logout();
    this.notificationService.show('Logged out successfully.', 'info');
    this.router.navigate(['/auth']);
  }
}
