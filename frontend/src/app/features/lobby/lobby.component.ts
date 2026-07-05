import { Component, ElementRef, ViewChild, AfterViewChecked, OnInit, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LobbyService } from '../../core/services/lobby.service';
import { SoundService } from '../../core/services/sound.service';
import { NotificationService } from '../../core/services/notification.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';

@Component({
  selector: 'app-lobby',
  standalone: true,
  imports: [CommonModule, FormsModule, AvatarComponent],
  template: `
    <div class="lobby-page fade-in">
      <div class="lobby-spotlight"></div>
      
      <!-- Top Action bar -->
      <div class="top-bar">
        <button class="leave-btn btn-glass" (click)="leaveLobby()">➔ LEAVE TABLE</button>
        
        <!-- Room details -->
        <div class="room-details-card glass-panel" *ngIf="room()">
          <span class="lbl">ROOM CODE</span>
          <div class="code-copy-row">
            <h3 class="room-code">{{ room()?.code }}</h3>
            <button class="copy-btn btn-glass" (click)="copyCode()">COPY</button>
          </div>
        </div>

        <!-- Connection latency -->
        <div class="connection-status glass-panel">
          <div class="indicator-group">
            <span class="latency-dot" [class.connected]="connectionState() === 'connected'" [class.connecting]="connectionState() === 'connecting'"></span>
            <span class="status-lbl">{{ connectionState() | uppercase }}</span>
          </div>
          <span class="latency-value" *ngIf="connectionState() === 'connected'">{{ latency() }} ms</span>
        </div>
      </div>

      <!-- Main Lobby Content -->
      <div class="lobby-grid">
        <!-- Card Table Simulator View -->
        <div class="table-lounge-card glass-panel">
          <div class="table-spotlight"></div>
          
          <!-- Outer circle representation of the card table -->
          <div class="lounge-table">
            <div class="table-center-text">
              <h3>29 LOBBY</h3>
              <p>WAITING FOR PLAYERS</p>
            </div>
            
            <!-- 4 Seats -->
            <!-- TOP SEAT (PARTNER) -->
            <div class="seat seat-top">
              <ng-container *ngIf="getPlayerAtPosition('top') as p; else emptyTop">
                <app-avatar 
                  [name]="p.name" 
                  [avatarId]="p.avatarId" 
                  [isReady]="p.isReady"
                  [subtext]="'PARTNER'"
                ></app-avatar>
              </ng-container>
              <ng-template #emptyTop>
                <div class="empty-slot-card">
                  <div class="pulse-loader"></div>
                  <span>MATCHING...</span>
                </div>
              </ng-template>
            </div>

            <!-- LEFT SEAT (OPPONENT 1) -->
            <div class="seat seat-left">
              <ng-container *ngIf="getPlayerAtPosition('left') as p; else emptyLeft">
                <app-avatar 
                  [name]="p.name" 
                  [avatarId]="p.avatarId" 
                  [isReady]="p.isReady"
                  [subtext]="'OPPONENT'"
                ></app-avatar>
              </ng-container>
              <ng-template #emptyLeft>
                <div class="empty-slot-card">
                  <div class="pulse-loader"></div>
                  <span>MATCHING...</span>
                </div>
              </ng-template>
            </div>

            <!-- RIGHT SEAT (OPPONENT 2) -->
            <div class="seat seat-right">
              <ng-container *ngIf="getPlayerAtPosition('right') as p; else emptyRight">
                <app-avatar 
                  [name]="p.name" 
                  [avatarId]="p.avatarId" 
                  [isReady]="p.isReady"
                  [subtext]="'OPPONENT'"
                ></app-avatar>
              </ng-container>
              <ng-template #emptyRight>
                <div class="empty-slot-card">
                  <div class="pulse-loader"></div>
                  <span>MATCHING...</span>
                </div>
              </ng-template>
            </div>

            <!-- BOTTOM SEAT (CURRENT USER) -->
            <div class="seat seat-bottom">
              <ng-container *ngIf="getPlayerAtPosition('bottom') as p">
                <app-avatar 
                  [name]="p.name" 
                  [avatarId]="p.avatarId" 
                  [isReady]="p.isReady"
                  [isActive]="true"
                  [subtext]="'YOU'"
                ></app-avatar>
              </ng-container>
            </div>
          </div>

          <!-- Bottom Control Bar -->
          <div class="lounge-footer">
            <button 
              class="ready-toggle-btn"
              [class.btn-emerald]="!currentUser()?.isReady"
              [class.btn-red]="currentUser()?.isReady"
              [disabled]="players().length < 4"
              (click)="toggleReady()"
            >
              {{ currentUser()?.isReady ? 'CANCEL READY' : 'MARK READY' }}
            </button>
            <p class="players-count-text">PLAYERS AT TABLE: {{ players().length }} / 4</p>
          </div>
        </div>

        <!-- Chat / Match logs Panel -->
        <div class="chat-panel glass-panel">
          <div class="chat-header">
            <h4>TABLE CHAT</h4>
          </div>
          
          <div class="chat-messages-container" #chatScrollContainer>
            <div 
              *ngFor="let msg of chatMessages()" 
              class="chat-msg-row"
              [class.system]="msg.isSystem"
              [class.partner]="msg.senderPosition === 'top'"
              [class.me]="msg.senderPosition === 'bottom'"
            >
              <span class="sender">{{ msg.senderName }}:</span>
              <span class="text">{{ msg.text }}</span>
            </div>
          </div>

          <form class="chat-input-row" (submit)="sendMsg($event)">
            <input 
              type="text" 
              [(ngModel)]="chatText" 
              name="chatText"
              placeholder="Send message to table..."
              autocomplete="off"
              required
            />
            <button type="submit" class="btn-gold">SEND</button>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../styles/variables';
    @import '../../../styles/mixins';

    .lobby-page {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, $color-felt-base 0%, $color-bg-darkest 100%);
      display: flex;
      flex-direction: column;
      padding: 30px;
      overflow: hidden;
    }

    .lobby-spotlight {
      position: absolute;
      width: 700px;
      height: 700px;
      background: radial-gradient(circle, rgba(212, 175, 55, 0.03) 0%, transparent 70%);
      pointer-events: none;
      z-index: 1;
    }

    .top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 25px;
      z-index: 5;
    }

    .leave-btn {
      padding: 10px 18px;
      font-size: 11px;
    }

    .room-details-card {
      @include glass-panel(0.04, 12px, rgba(255, 255, 255, 0.05));
      padding: 6px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;

      .lbl {
        font-family: $font-headings;
        font-size: 9px;
        color: $color-silver-dark;
        font-weight: 800;
        letter-spacing: 0.15em;
      }

      .code-copy-row {
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .room-code {
        font-family: $font-headings;
        font-size: 16px;
        color: $color-gold-light;
        letter-spacing: 0.05em;
        text-shadow: 0 0 5px $color-gold-glow;
      }

      .copy-btn {
        padding: 2px 8px;
        font-size: 9px;
        border-radius: 4px;
      }
    }

    .connection-status {
      @include glass-panel(0.04, 12px, rgba(255, 255, 255, 0.05));
      padding: 8px 16px;
      display: flex;
      align-items: center;
      gap: 15px;
      
      .indicator-group {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .latency-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: $color-red-base;
        
        &.connected {
          background: $color-emerald-base;
          box-shadow: 0 0 6px $color-emerald-glow;
        }

        &.connecting {
          background: #fbbf24;
          animation: blink 1s infinite;
        }
      }

      @keyframes blink {
        50% { opacity: 0.3; }
      }

      .status-lbl {
        font-family: $font-headings;
        font-size: 9px;
        font-weight: 800;
        color: $color-silver-base;
        letter-spacing: 0.05em;
      }

      .latency-value {
        font-family: $font-numeric;
        font-size: 11px;
        font-weight: 600;
        color: $color-blue-light;
      }
    }

    .lobby-grid {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 25px;
      flex: 1;
      z-index: 5;
      
      @include respond-to('tablet') {
        grid-template-columns: 1fr;
      }
    }

    .table-lounge-card {
      @include glass-panel(0.04, 16px, rgba(255, 255, 255, 0.05));
      border-radius: 12px;
      position: relative;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8);
      min-height: 400px;
    }

    .table-spotlight {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%);
      width: 450px;
      height: 450px;
      background: radial-gradient(circle, rgba(24, 191, 110, 0.04) 0%, transparent 70%);
      pointer-events: none;
    }

    .lounge-table {
      flex: 1;
      position: relative;
      @include flex-center;
    }

    .table-center-text {
      text-align: center;
      border: 1px dashed rgba(255, 255, 255, 0.05);
      border-radius: 50%;
      width: 180px;
      height: 180px;
      @include flex-center;
      flex-direction: column;
      background: rgba(0,0,0,0.15);

      h3 {
        font-size: 14px;
        color: $color-silver-light;
        letter-spacing: 0.15em;
      }

      p {
        font-size: 8px;
        font-weight: 800;
        color: $color-gold-light;
        letter-spacing: 0.1em;
        margin-top: 5px;
      }
    }

    .seat {
      position: absolute;
      @include flex-center;
    }

    .seat-top { top: 15px; }
    .seat-left { left: 30px; }
    .seat-right { right: 30px; }
    .seat-bottom { bottom: 15px; }

    .empty-slot-card {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      border: 1.5px dashed rgba(255, 255, 255, 0.1);
      background: rgba(0,0,0,0.25);
      @include flex-center;
      flex-direction: column;
      gap: 6px;

      span {
        font-size: 8px;
        font-weight: 800;
        color: $color-silver-dark;
        letter-spacing: 0.05em;
      }
    }

    .pulse-loader {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      background: $color-silver-dark;
      animation: pulseMatch 1.5s infinite;
    }

    @keyframes pulseMatch {
      0% { transform: scale(0.8); opacity: 0.4; }
      50% { transform: scale(1.3); opacity: 0.8; }
      100% { transform: scale(0.8); opacity: 0.4; }
    }

    .lounge-footer {
      padding: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.03);
      display: flex;
      justify-content: space-between;
      align-items: center;
      background: rgba(0,0,0,0.1);

      .ready-toggle-btn {
        @include gaming-button-base;
        padding: 12px 30px;
        font-size: 12px;
      }

      .players-count-text {
        font-size: 11px;
        color: $color-silver-base;
        font-weight: 600;
      }
    }

    // Chat Panel CSS
    .chat-panel {
      @include glass-panel(0.04, 16px, rgba(255, 255, 255, 0.05));
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      box-shadow: 0 15px 40px rgba(0, 0, 0, 0.8);
    }

    .chat-header {
      padding: 15px 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.04);

      h4 {
        font-size: 12px;
        color: $color-silver-base;
        letter-spacing: 0.05em;
      }
    }

    .chat-messages-container {
      flex: 1;
      padding: 15px;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      max-height: calc(100vh - 350px);
      min-height: 250px;
    }

    .chat-msg-row {
      font-size: 12px;
      line-height: 1.4;

      .sender {
        font-weight: 700;
        margin-right: 6px;
        color: $color-silver-base;
      }

      .text {
        color: $color-silver-light;
      }

      &.system {
        .sender { display: none; }
        .text {
          color: $color-gold-light;
          font-weight: 600;
          font-style: italic;
          opacity: 0.85;
        }
      }

      &.partner {
        .sender { color: $color-blue-light; }
      }

      &.me {
        .sender { color: $color-gold-light; }
      }
    }

    .chat-input-row {
      padding: 15px;
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      display: flex;
      gap: 10px;

      input {
        flex: 1;
        background: rgba(0,0,0,0.4);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 4px;
        color: $color-silver-light;
        padding: 10px 14px;
        font-size: 12px;
        font-family: $font-body;

        &:focus {
          outline: none;
          border-color: $color-gold-base;
        }
      }

      button {
        padding: 10px 16px;
        font-size: 11px;
        border-radius: 4px;
      }
    }
  `]
})
export class LobbyComponent implements OnInit, AfterViewChecked, OnDestroy {
  @ViewChild('chatScrollContainer') private chatScrollContainer!: ElementRef;
  
  chatText = '';
  
  room = this.lobbyService.room;
  players = this.lobbyService.players;
  chatMessages = this.lobbyService.chatMessages;
  latency = this.lobbyService.latency;
  connectionState = this.lobbyService.connectionState;

  currentUser = computed(() => 
    this.players().find(p => p.isCurrentUser)
  );

  constructor(
    private lobbyService: LobbyService,
    private soundService: SoundService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit() {
    // If no room initialized, return to home
    if (!this.room()) {
      this.router.navigate(['/home']);
    }
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  ngOnDestroy() {
    // No explicit teardowns needed as service handles intervals
  }

  getPlayerAtPosition(pos: 'bottom' | 'left' | 'top' | 'right') {
    return this.players().find(p => p.position === pos);
  }

  toggleReady() {
    this.lobbyService.toggleCurrentUserReady();
  }

  copyCode() {
    this.soundService.playClick();
    const code = this.room()?.code;
    if (code) {
      navigator.clipboard.writeText(code).then(() => {
        this.notificationService.show('Room code copied to clipboard!', 'success');
      });
    }
  }

  sendMsg(e: Event) {
    e.preventDefault();
    if (this.chatText.trim().length > 0) {
      this.lobbyService.sendUserMessage(this.chatText);
      this.chatText = '';
    }
  }

  leaveLobby() {
    this.lobbyService.leaveRoom();
  }

  private scrollToBottom(): void {
    try {
      this.chatScrollContainer.nativeElement.scrollTop = this.chatScrollContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }
}
