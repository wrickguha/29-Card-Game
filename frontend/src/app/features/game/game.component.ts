import { Component, OnInit, OnDestroy, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { GameService } from '../../core/services/game.service';
import { SoundService } from '../../core/services/sound.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';
import { AvatarComponent } from '../../shared/components/avatar/avatar.component';
import { ChipComponent } from '../../shared/components/chip/chip.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { Card, Suit, Player, PlayedCard, Score } from '../../core/models/game.model';
import { HiddenTrumpCardComponent } from './components/hidden-trump-card/hidden-trump-card.component';
import { TrumpSelectionModalComponent } from './components/trump-selection-modal/trump-selection-modal.component';
import { TrumpRevealAnimationComponent } from './components/trump-reveal-animation/trump-reveal-animation.component';
import { HiddenTrumpIndicatorComponent } from './components/hidden-trump-indicator/hidden-trump-indicator.component';
import gsap from 'gsap';

@Component({
  selector: 'app-game',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    AvatarComponent, 
    ChipComponent, 
    ModalComponent,
    HiddenTrumpCardComponent,
    TrumpSelectionModalComponent,
    TrumpRevealAnimationComponent,
    HiddenTrumpIndicatorComponent
  ],
  template: `
    <div class="game-page fade-in">
      <div class="table-ambient-glow"></div>
      
      <!-- Top HUD Header -->
      <div class="hud-header">
        <div class="hud-left-actions" style="display: flex; gap: 10px;">
          <button class="menu-btn btn-glass" (click)="openQuitModal()">⚙️ QUIT</button>
          <button class="menu-btn btn-glass" (click)="isTimelineOpen = !isTimelineOpen">📜 LOG</button>
        </div>
        
        <!-- Scoreboard Panel -->
        <div class="scoreboard glass-panel clickable-scoreboard" (click)="openCapturedModal()" title="Click to view captured cards breakdown">
          <div class="scoreboard-teams-row">
            <div class="scoreboard-team red">
              <span class="team-lbl">RED TEAM (YOU)</span>
              <div class="team-scores">
                <span class="match-pts">{{ state().matchScores.teamRed }}</span>
                <span class="sub-pts">Round: {{ state().roundPoints.teamRed }}</span>
              </div>
            </div>
            
            <div class="scoreboard-divider"></div>
            
            <div class="scoreboard-team black">
              <span class="team-lbl">BLACK TEAM</span>
              <div class="team-scores">
                <span class="match-pts">{{ state().matchScores.teamBlack }}</span>
                <span class="sub-pts">Round: {{ state().roundPoints.teamBlack }}</span>
              </div>
            </div>
          </div>
          <span class="scoreboard-breakdown-hint">📊 View Captured Pile</span>

          <!-- Scoreboard active states badges -->
          <div class="scoreboard-badges-row">
            <span class="badge double" *ngIf="state().doubleState === 'double'">DOUBLE</span>
            <span class="badge redouble" *ngIf="state().doubleState === 'redouble'">REDOUBLE</span>
            <span class="badge single-hand" *ngIf="state().isSingleHandActive">SINGLE HAND</span>
            <span class="badge pair-tag" *ngIf="state().pairDeclaredBy">PAIR ({{ state().pairDeclaredBy | uppercase }} TEAM)</span>
          </div>
        </div>

        <!-- Contract Details -->
        <div class="contract-card glass-panel" *ngIf="state().highestBid > 0">
          <span class="contract-lbl">CONTRACT</span>
          <div class="contract-info">
            <span class="contract-val">{{ state().highestBid }}</span>
            <span class="contract-bidder">by {{ getBidderName() }}</span>
          </div>
        </div>
      </div>

      <!-- Gaming Table Felt -->
      <div class="game-table-container">
        <div class="table-felt">
          <!-- Spotlight -->
          <div class="table-spotlight"></div>

          <!-- Seats & Players -->
          <!-- TOP (PARTNER) -->
          <div class="player-slot slot-top">
            <app-avatar 
              *ngIf="getPlayerAtPosition('top') as p"
              [name]="p.name" 
              [avatarId]="p.avatarId" 
              [isActive]="state().currentTurnId === p.id && state().phase === 'playing'"
              [timerValue]="state().timerCount"
              [subtext]="state().currentTurnId === p.id && state().phase === 'playing' ? 'THINKING' : 'PARTNER'"
            ></app-avatar>
          </div>

          <!-- LEFT (OPPONENT 1) -->
          <div class="player-slot slot-left">
            <app-avatar 
              *ngIf="getPlayerAtPosition('left') as p"
              [name]="p.name" 
              [avatarId]="p.avatarId" 
              [isActive]="state().currentTurnId === p.id && state().phase === 'playing'"
              [timerValue]="state().timerCount"
              [subtext]="state().currentTurnId === p.id && state().phase === 'playing' ? 'THINKING' : 'OPPONENT'"
            ></app-avatar>
          </div>

          <!-- RIGHT (OPPONENT 2) -->
          <div class="player-slot slot-right">
            <app-avatar 
              *ngIf="getPlayerAtPosition('right') as p"
              [name]="p.name" 
              [avatarId]="p.avatarId" 
              [isActive]="state().currentTurnId === p.id && state().phase === 'playing'"
              [timerValue]="state().timerCount"
              [subtext]="state().currentTurnId === p.id && state().phase === 'playing' ? 'THINKING' : 'OPPONENT'"
            ></app-avatar>
          </div>

          <!-- BOTTOM (YOU) -->
          <div class="player-slot slot-bottom">
            <app-avatar 
              *ngIf="getPlayerAtPosition('bottom') as p"
              [name]="p.name" 
              [avatarId]="p.avatarId" 
              [isActive]="state().currentTurnId === p.id && state().phase === 'playing'"
              [timerValue]="state().timerCount"
              [subtext]="state().currentTurnId === p.id && state().phase === 'playing' ? 'YOUR TURN' : 'YOU'"
            ></app-avatar>
          </div>

          <!-- Center Board (Played Cards Pile) -->
          <div class="board-center">
            <!-- Table felt texture lines -->
            <div class="inner-felt-circle"></div>

            <!-- Trick cards inside the pile -->
            <div 
              *ngFor="let played of state().currentTrick" 
              class="played-card-slot" 
              [class]="played.position"
            >
              <div class="rendered-card" [class]="played.card.suit">
                <div class="card-inner">
                  <span class="rank">{{ played.card.rank }}</span>
                  <span class="suit">{{ getSuitSymbol(played.card.suit) }}</span>
                  <span class="rank rank-bottom">{{ played.card.rank }}</span>
                </div>
              </div>
            </div>

            <!-- Trump card holder (placed face down next to center) -->
            <div class="trump-holder-felt" *ngIf="state().trumpSuit">
              <app-hidden-trump-indicator
                [isRevealed]="state().isTrumpRevealed"
                [suit]="state().trumpSuit"
                [bidderName]="getBidderName()"
              ></app-hidden-trump-indicator>

              <app-hidden-trump-card
                [suit]="state().trumpSuit"
                [isRevealed]="state().isTrumpRevealed"
                [isBidder]="state().bidderId === getPlayerAtPosition('bottom')?.id"
                (reveal)="requestRevealTrump()"
              ></app-hidden-trump-card>
            </div>
          </div>
        </div>
      </div>

      <!-- User Active Cards Hand (Tactical 6x6 Grid) -->
      <div class="user-cards-hand-wrapper" *ngIf="getPlayerAtPosition('bottom') as me">
        <!-- Declare Pair button slides up if available -->
        <button 
          class="pair-declare-btn btn-gold pulse-gold fade-in" 
          *ngIf="gameService.canDeclarePair(me.id) && state().phase === 'playing' && state().currentTurnId === me.id"
          (click)="openPairConfirmation()"
        >
          👑 DECLARE TRUMP PAIR (K & Q)
        </button>

        <div class="hand-grid-6x6">
          <div 
            *ngFor="let suit of getSuitsInHand(me.cards)" 
            class="suit-column"
          >
            <div class="suit-header" [class]="suit">
              <span class="symbol">{{ getSuitSymbol(suit) }}</span>
            </div>
            
            <div class="suit-cards-container">
              <div 
                *ngFor="let card of getCardsOfSuit(suit, me.cards); let idx = index" 
                class="grid-card-slot"
                [style.--card-index]="idx"
                [class.selectable]="state().phase === 'playing' && state().currentTurnId === me.id && gameService.isValidCardPlay(card, me.cards, state().currentTrick)"
                (click)="playUserCard(card)"
              >
                <div class="rendered-card" [class]="card.suit">
                  <div class="card-inner">
                    <span class="rank">{{ card.rank }}</span>
                    <span class="suit">{{ getSuitSymbol(card.suit) }}</span>
                    <span class="points-dot" *ngIf="card.points > 0">{{ '★'.repeat(card.points) }}</span>
                    <span class="rank rank-bottom">{{ card.rank }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Bidding Interface Overlay -->
      <div class="overlay-fullscreen bidding-overlay fade-in" *ngIf="state().phase === 'bidding'">
        <div class="overlay-glow"></div>
        <div class="bidding-panel glass-panel">
          <h4 class="gold-glow-text">PLACE CONTRACT BID</h4>
          <p class="sub">Minimum Bid: {{ state().highestBid > 0 ? state().highestBid + 1 : 16 }}</p>
          
          <div class="current-turn-alert" *ngIf="state().currentTurnId !== getPlayerAtPosition('bottom')?.id">
            <span class="loader-dots"></span>
            <span>Opponent is evaluating bid...</span>
          </div>

          <!-- Bidding Option Chips -->
          <div class="bidding-chips-grid" *ngIf="state().currentTurnId === getPlayerAtPosition('bottom')?.id">
            <app-chip value="16" color="blue" [disabled]="state().highestBid >= 16" (select)="placeBid(16)"></app-chip>
            <app-chip value="17" color="blue" [disabled]="state().highestBid >= 17" (select)="placeBid(17)"></app-chip>
            <app-chip value="18" color="blue" [disabled]="state().highestBid >= 18" (select)="placeBid(18)"></app-chip>
            <app-chip value="19" color="blue" [disabled]="state().highestBid >= 19" (select)="placeBid(19)"></app-chip>
            <app-chip value="20" color="gold" [disabled]="state().highestBid >= 20" (select)="placeBid(20)"></app-chip>
            <app-chip value="21" color="gold" [disabled]="state().highestBid >= 21" (select)="placeBid(21)"></app-chip>
            <app-chip value="22" color="gold" [disabled]="state().highestBid >= 22" (select)="placeBid(22)"></app-chip>
            <app-chip value="23" color="gold" [disabled]="state().highestBid >= 23" (select)="placeBid(23)"></app-chip>
            <app-chip value="24" color="red" [disabled]="state().highestBid >= 24" (select)="placeBid(24)"></app-chip>
            <app-chip value="28" color="red" [disabled]="state().highestBid >= 28" (select)="placeBid(28)"></app-chip>
          </div>

          <!-- Actions -->
          <div class="bidding-actions" *ngIf="state().currentTurnId === getPlayerAtPosition('bottom')?.id">
            <button class="pass-btn btn-red" (click)="passBid()">PASS CONTRACT</button>
          </div>
        </div>
      </div>

      <!-- Trump Suit Selection Modal -->
      <app-trump-selection-modal
        *ngIf="state().phase === 'trump_selection' && state().currentTurnId === getPlayerAtPosition('bottom')?.id"
        (select)="chooseTrump($event)"
      ></app-trump-selection-modal>

      <!-- Round End / Score Recap Overlay -->
      <div class="overlay-fullscreen recap-overlay fade-in" *ngIf="state().phase === 'round_end'">
        <div class="recap-panel glass-panel">
          <div class="gold-accent-line"></div>
          <h3 class="outcome-title" [class]="state().setOutcome || 'normal_win'">
            {{ getRoundOutcomeTitle() }}
          </h3>
          <p class="outcome-subtitle">{{ getRoundOutcomeSubtitle() }}</p>
          
          <div class="scores-table">
            <div class="score-row header">
              <span>TEAM</span>
              <span>ROUND POINTS</span>
              <span>MATCH SCORE</span>
            </div>
            <div class="score-row highlight">
              <span>RED TEAM (YOU)</span>
              <span>{{ state().roundPoints.teamRed }} / 28</span>
              <span>{{ state().matchScores.teamRed }} / 6</span>
            </div>
            <div class="score-row">
              <span>BLACK TEAM</span>
              <span>{{ state().roundPoints.teamBlack }} / 28</span>
              <span>{{ state().matchScores.teamBlack }} / 6</span>
            </div>
          </div>

          <div class="recap-action">
            <button class="btn-gold" (click)="nextRound()">DEAL NEXT ROUND</button>
          </div>
        </div>
      </div>

      <!-- Match Victory/Defeat Fullscreen Overlay -->
      <div class="overlay-fullscreen result-overlay fade-in" *ngIf="state().phase === 'match_end'">
        <div class="particles-confetti" *ngIf="isUserWinner()">
          <div *ngFor="let c of confetti" class="confetti-item" [style.left.%]="c.x" [style.background-color]="c.color" [style.animation-delay.s]="c.delay" [style.animation-duration.s]="c.duration"></div>
        </div>

        <div class="result-card glass-panel text-center">
          <div class="gold-accent-line"></div>
          <h2 class="result-title" [class.victory]="isUserWinner()" [class.defeat]="!isUserWinner()">
            {{ isUserWinner() ? 'VICTORY' : 'DEFEAT' }}
          </h2>
          <p class="result-subtitle">{{ isUserWinner() ? 'YOU CONQUERED THE CARD TABLE' : 'THE CONTRACT WAS BROKEN' }}</p>

          <div class="final-scorebox">
            <div class="final-stat">
              <span class="val">{{ state().matchScores.teamRed }}</span>
              <span class="lbl">RED TEAM</span>
            </div>
            <div class="score-v">VS</div>
            <div class="final-stat">
              <span class="val">{{ state().matchScores.teamBlack }}</span>
              <span class="lbl">BLACK TEAM</span>
            </div>
          </div>

          <!-- Rewards mockup -->
          <div class="coins-reward" *ngIf="isUserWinner()">
            <span>MATCH REWARD:</span>
            <span class="reward-val">🪙 +200 COINS</span>
          </div>

          <div class="result-actions">
            <button class="btn-glass" (click)="quitToHome()">RETURN HUB</button>
            <button class="btn-gold" (click)="playAgain()">PLAY AGAIN</button>
          </div>
        </div>
      </div>

      <!-- Quit confirmation modal -->
      <app-modal [title]="'QUIT MATCH?'" [(isOpen)]="isQuitOpen" maxWidth="380px">
        <div class="quit-content">
          <p class="quit-desc">Leaving the table now counts as an automatic defeat and forfeits match points. Are you sure you want to disconnect?</p>
          <div class="quit-actions">
            <button class="btn-glass" (click)="isQuitOpen = false">RESUME PLAY</button>
            <button class="btn-red" (click)="confirmQuit()">FORFEIT & QUIT</button>
          </div>
        </div>
      </app-modal>

      <!-- Double / Redouble Stakes Declaration Banner -->
      <div class="stakes-declaration-banner fade-in" *ngIf="state().phase === 'double_declaration'">
        <div class="banner-gold-glow"></div>
        <div class="banner-content" *ngIf="state().currentTurnId === getPlayerAtPosition('bottom')?.id">
          <h4 *ngIf="state().doubleState === 'none'">⚔️ OPPONENTS BID {{ state().highestBid }} - DECLARE DOUBLE?</h4>
          <h4 *ngIf="state().doubleState === 'double'">🔥 OPPONENTS DECLARED DOUBLE - DECLARE REDOUBLE?</h4>
          
          <div class="banner-actions">
            <button 
              *ngIf="state().doubleState === 'none'" 
              class="btn-gold pulse-gold" 
              (click)="submitDouble(true)"
            >
              DECLARE DOUBLE (2X Score)
            </button>
            <button 
              *ngIf="state().doubleState === 'none'" 
              class="btn-glass" 
              (click)="submitDouble(false)"
            >
              PASS & PLAY
            </button>

            <button 
              *ngIf="state().doubleState === 'double'" 
              class="btn-red pulse-red" 
              (click)="submitRedouble(true)"
            >
              DECLARE REDOUBLE (4X Score)
            </button>
            <button 
              *ngIf="state().doubleState === 'double'" 
              class="btn-glass" 
              (click)="submitRedouble(false)"
            >
              PASS & PLAY
            </button>
          </div>
        </div>
        <div class="banner-content thinking" *ngIf="state().currentTurnId !== getPlayerAtPosition('bottom')?.id">
          <span class="loader-dots"></span>
          <span>Opponent is evaluating Double/Redouble...</span>
        </div>
      </div>

      <!-- Single Hand Decision Modal Overlay -->
      <div class="overlay-fullscreen single-hand-overlay fade-in" *ngIf="state().phase === 'single_hand_decision'">
        <div class="overlay-glow"></div>
        <div class="single-hand-panel glass-panel">
          <div class="gold-accent-line"></div>
          
          <h3 class="gold-glow-text">PLAY SINGLE HAND?</h3>
          <p class="desc">Playing alone means you must win all 8 tricks without your partner. Winning awards double score points, losing triggers a Double Set.</p>
          
          <!-- Timer countdown -->
          <div class="timer-countdown-circle">
            <span class="time">{{ state().timerCount }}</span>
            <span class="lbl">seconds</span>
          </div>

          <!-- Player voting status grid -->
          <div class="player-votes-status">
            <div 
              *ngFor="let p of state().players" 
              class="vote-row"
              [class.user]="p.isCurrentUser"
            >
              <app-avatar [avatarId]="p.avatarId" [name]="p.name" size="sm"></app-avatar>
              <div class="vote-status-badge" [class]="state().singleHandResponses[p.id]">
                <span *ngIf="state().singleHandResponses[p.id] === 'waiting'">⏳ THINKING...</span>
                <span *ngIf="state().singleHandResponses[p.id] === 'yes'">👑 SINGLE HAND</span>
                <span *ngIf="state().singleHandResponses[p.id] === 'no'">🤝 PARTNER PLAY</span>
              </div>
            </div>
          </div>

          <!-- User actions -->
          <div 
            class="single-hand-actions" 
            *ngIf="state().singleHandResponses[getPlayerAtPosition('bottom')?.id || ''] === 'waiting'"
          >
            <button class="btn-gold" (click)="submitSingleHand(true)">👑 PLAY SINGLE HAND</button>
            <button class="btn-glass" (click)="submitSingleHand(false)">🤝 PLAY WITH PARTNER</button>
          </div>
        </div>
      </div>

      <!-- Trump Pair Confirmation Modal -->
      <app-modal [title]="'DECLARE TRUMP PAIR?'" [(isOpen)]="isPairConfirmOpen" maxWidth="380px">
        <div class="pair-confirm-content">
          <p class="desc">You hold both the King and Queen of the trump suit. Declaring a Pair alters the final points target by 4 points. Would you like to declare it now?</p>
          <div class="pair-confirm-actions">
            <button class="btn-glass" (click)="isPairConfirmOpen = false">CANCEL</button>
            <button class="btn-gold" (click)="confirmPairDeclaration()">DECLARE PAIR</button>
          </div>
        </div>
      </app-modal>

      <!-- Match Timeline Log Sidebar -->
      <div class="timeline-sidebar" [class.open]="isTimelineOpen">
        <div class="sidebar-header">
          <h4>📜 MATCH LOG</h4>
          <button class="close-sidebar-btn" (click)="isTimelineOpen = false">&times;</button>
        </div>
        
        <div class="sidebar-body">
          <div class="timeline-list">
            <div 
              *ngFor="let evt of state().timeline" 
              class="timeline-item"
              [class]="evt.type"
            >
              <div class="evt-icon-wrapper">
                <span class="evt-icon" *ngIf="evt.type === 'round_winner'">🏆</span>
                <span class="evt-icon" *ngIf="evt.type === 'trump_selected'">🔒</span>
                <span class="evt-icon" *ngIf="evt.type === 'trump_revealed'">👁️</span>
                <span class="evt-icon" *ngIf="evt.type === 'double'">⚔️</span>
                <span class="evt-icon" *ngIf="evt.type === 'redouble'">🔥</span>
                <span class="evt-icon" *ngIf="evt.type === 'single_hand'">👑</span>
                <span class="evt-icon" *ngIf="evt.type === 'pair'">💍</span>
                <span class="evt-icon" *ngIf="evt.type === 'set_outcome'">🏁</span>
              </div>
              
              <div class="evt-details">
                <span class="evt-text">{{ evt.text }}</span>
                <span class="evt-time">{{ evt.timestamp | date:'HH:mm:ss' }}</span>
              </div>
            </div>
            
            <div class="empty-timeline" *ngIf="state().timeline.length === 0">
              No events recorded yet. Match starting...
            </div>
          </div>
        </div>
      </div>

      <!-- Captured Cards Modal -->
      <app-modal [title]="'CAPTURED SCORING CARDS'" [(isOpen)]="isCapturedOpen" maxWidth="450px">
        <div class="captured-modal-content">
          <p class="captured-desc">Verify captured points from Jacks (3), 9s (2), Aces (1), and 10s (1) won in tricks.</p>
          
          <div class="team-captured-section">
            <h5 class="team-title red-glow-text">RED TEAM (YOU + PARTNER): {{ state().roundPoints.teamRed }} PTS</h5>
            <div class="captured-cards-row">
              <div 
                *ngFor="let card of getScoringCapturedCards('red')" 
                class="mini-card" 
                [class]="card.suit"
              >
                <span class="val">{{ card.rank }}</span>
                <span class="sym">{{ getSuitSymbol(card.suit) }}</span>
                <span class="pts">({{ card.points }}p)</span>
              </div>
              <span class="empty-recap" *ngIf="getScoringCapturedCards('red').length === 0">No scoring cards captured yet.</span>
            </div>
          </div>

          <div class="modal-breakdown-divider"></div>

          <div class="team-captured-section">
            <h5 class="team-title silver-glow-text">BLACK TEAM (OPPONENTS): {{ state().roundPoints.teamBlack }} PTS</h5>
            <div class="captured-cards-row">
              <div 
                *ngFor="let card of getScoringCapturedCards('black')" 
                class="mini-card" 
                [class]="card.suit"
              >
                <span class="val">{{ card.rank }}</span>
                <span class="sym">{{ getSuitSymbol(card.suit) }}</span>
                <span class="pts">({{ card.points }}p)</span>
              </div>
              <span class="empty-recap" *ngIf="getScoringCapturedCards('black').length === 0">No scoring cards captured yet.</span>
            </div>
          </div>
        </div>
      </app-modal>
      <!-- Trump Reveal Animation Screen Overlay -->
      <app-trump-reveal-animation
        [suit]="state().trumpSuit || 'H'"
        [active]="showRevealAnimation"
        (animationComplete)="showRevealAnimation = false"
      ></app-trump-reveal-animation>
    </div>
  `,
  styles: [`
    @import '../../../styles/variables';
    @import '../../../styles/mixins';

    .game-page {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, $color-felt-base 0%, $color-bg-darkest 100%);
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }

    .table-ambient-glow {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, rgba(24, 191, 110, 0.03) 0%, transparent 80%);
      pointer-events: none;
      z-index: 1;
    }

    .hud-header {
      padding: 15px 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      z-index: 10;
      position: relative;
    }

    .menu-btn {
      padding: 8px 16px;
      font-size: 11px;
    }

    .scoreboard {
      @include glass-panel(0.04, 12px, rgba(255, 255, 255, 0.05));
      border-radius: 8px;
      padding: 8px 20px 6px 20px;
      display: flex;
      flex-direction: column;
      align-items: center;
      transition: all $transition-fast;

      &.clickable-scoreboard:hover {
        @include gold-border(0.25);
        box-shadow: 0 0 15px rgba(212, 175, 55, 0.15);
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.08);
      }
    }

    .scoreboard-teams-row {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .scoreboard-breakdown-hint {
      font-size: 8px;
      font-weight: 700;
      color: $color-gold-light;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 4px;
      opacity: 0.7;
      animation: pulseHint 2s infinite;
    }

    @keyframes pulseHint {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }

    .scoreboard-team {
      text-align: center;
      
      .team-lbl {
        font-family: $font-headings;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.05em;
        display: block;
        margin-bottom: 2px;
        color: $color-silver-dark;
      }
      
      &.red {
        .match-pts { color: $color-gold-light; text-shadow: 0 0 5px $color-gold-glow; }
      }
      
      &.black {
        .match-pts { color: $color-silver-light; }
      }
    }

    .team-scores {
      display: flex;
      align-items: baseline;
      justify-content: center;
      gap: 10px;
      
      .match-pts {
        font-family: $font-numeric;
        font-size: 20px;
        font-weight: 900;
      }
      
      .sub-pts {
        font-size: 10px;
        color: $color-silver-dark;
        font-weight: 600;
      }
    }

    .scoreboard-divider {
      width: 1px;
      height: 30px;
      background: rgba(255, 255, 255, 0.08);
    }

    .contract-card {
      @include glass-panel(0.04, 12px, rgba(212, 175, 55, 0.15));
      border-radius: 8px;
      padding: 6px 16px;
      text-align: center;

      .contract-lbl {
        font-family: $font-headings;
        font-size: 8px;
        font-weight: 800;
        color: $color-gold-light;
        letter-spacing: 0.1em;
        display: block;
      }

      .contract-info {
        display: flex;
        align-items: center;
        gap: 6px;
      }

      .contract-val {
        font-family: $font-numeric;
        font-size: 16px;
        font-weight: 900;
        color: $color-gold-light;
      }

      .contract-bidder {
        font-size: 9px;
        color: $color-silver-base;
        font-weight: 600;
      }
    }

    // Gaming Table Felt
    .game-table-container {
      flex: 1;
      @include flex-center;
      position: relative;
      padding: 20px;
      margin-bottom: 120px; // space for cards hand
    }

    .table-felt {
      width: 100%;
      max-width: 800px;
      aspect-ratio: 1.5;
      background: radial-gradient(circle, $color-felt-light 0%, $color-felt-base 70%, $color-felt-darkest 100%);
      border: 6px solid #111827;
      box-shadow: 0 25px 60px rgba(0, 0, 0, 0.9), inset 0 0 50px rgba(0, 0, 0, 0.8), 0 0 0 2px rgba(212, 175, 55, 0.1);
      border-radius: 50% / 45%;
      position: relative;
      @include flex-center;
      
      @include respond-to('tablet') {
        aspect-ratio: 1.2;
      }
    }

    .table-spotlight {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, rgba(255, 255, 255, 0.05) 0%, transparent 60%);
      border-radius: 50%;
      pointer-events: none;
    }

    .player-slot {
      position: absolute;
      z-index: 10;
      transform: scale(0.9);

      @include respond-to('mobile') {
        transform: scale(0.7);
      }
    }

    .slot-top { top: -45px; left: 50%; transform: translateX(-50%) scale(0.9); }
    .slot-left { left: -35px; top: 50%; transform: translateY(-50%) scale(0.9); }
    .slot-right { right: -35px; top: 50%; transform: translateY(-50%) scale(0.9); }
    .slot-bottom { bottom: -45px; left: 50%; transform: translateX(-50%) scale(0.9); }

    .board-center {
      width: 320px;
      height: 220px;
      border-radius: 50%;
      border: 1px dashed rgba(255, 255, 255, 0.04);
      position: relative;
      @include flex-center;
      background: rgba(0,0,0,0.1);

      @include respond-to('mobile') {
        width: 180px;
        height: 120px;
      }
    }

    .inner-felt-circle {
      position: absolute;
      width: 100px;
      height: 100px;
      border: 1px solid rgba(255, 255, 255, 0.02);
      border-radius: 50%;
      pointer-events: none;
    }

    // Played cards alignment
    .played-card-slot {
      position: absolute;
      z-index: 15;
      
      .rendered-card {
        transform: scale(0.85);
        box-shadow: 0 4px 10px rgba(0,0,0,0.7);
        pointer-events: none;

        @include respond-to('mobile') {
          transform: scale(0.55);
        }
      }

      &.bottom { bottom: 10px; left: 50%; transform: translateX(-50%) rotate(3deg); }
      &.top { top: 10px; left: 50%; transform: translateX(-50%) rotate(-5deg); }
      &.left { left: 20px; top: 50%; transform: translateY(-50%) rotate(-12deg); }
      &.right { right: 20px; top: 50%; transform: translateY(-50%) rotate(8deg); }
    }

    // Secret Trump Display Felt
    .trump-holder-felt {
      position: absolute;
      top: 20px;
      right: 25px;
      @include flex-center;
      flex-direction: column;
      gap: 4px;
      z-index: 12;

      @include respond-to('mobile') {
        right: 15px;
        top: 15px;
        transform: scale(0.65);
      }

      .label {
        font-family: $font-headings;
        font-size: 8px;
        font-weight: 800;
        letter-spacing: 0.1em;
        color: $color-silver-dark;
      }
    }

    .trump-card-display {
      width: 50px;
      height: 75px;
      border-radius: 4px;
      @include glass-panel(0.08, 6px, rgba(212,175,55,0.25));
      cursor: pointer;
      position: relative;
      @include flex-center;
      box-shadow: 0 4px 10px rgba(0,0,0,0.6);
      transition: all 0.3s;

      &:hover {
        transform: scale(1.08) translateY(-2px);
        border-color: rgba(212,175,55,0.5);
      }

      &.revealed {
        border-color: $color-gold-light;
        box-shadow: 0 0 10px rgba(212, 175, 55, 0.3);
      }

      .card-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 6px;
        font-family: $font-numeric;
        font-weight: 900;
        
        .rank { font-size: 11px; }
        .suit { font-size: 24px; align-self: center; }
      }

      &.H { color: $color-red-light; background: rgba(229, 25, 55, 0.1); }
      &.D { color: $color-red-light; background: rgba(229, 25, 55, 0.1); }
      &.C { color: $color-silver-light; background: rgba(255, 255, 255, 0.05); }
      &.S { color: $color-silver-light; background: rgba(255, 255, 255, 0.05); }

      .card-back-pattern {
        @include flex-center;
        width: 100%; height: 100%;
        background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
        border: 1px solid rgba(255,255,255,0.05);
        border-radius: 3px;
        
        .lock-icon { font-size: 12px; filter: grayscale(0.5); }
      }
    }

    // Gorgeous Custom Rendered Cards CSS
    .rendered-card {
      width: $card-width-desktop;
      height: $card-height-desktop;
      border-radius: $card-border-radius;
      background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%);
      border: 1.5px solid rgba(255, 255, 255, 0.15);
      position: relative;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.2);
      color: $color-silver-light;
      
      @include respond-to('mobile') {
        width: $card-width-mobile;
        height: $card-height-mobile;
        border-radius: 5px;
      }

      .card-inner {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
        padding: 10px;
        box-sizing: border-box;

        @include respond-to('mobile') {
          padding: 6px;
        }
      }

      .rank {
        font-family: $font-numeric;
        font-weight: 900;
        font-size: 16px;
        line-height: 1;

        @include respond-to('mobile') {
          font-size: 12px;
        }
      }

      .suit {
        font-size: 38px;
        align-self: center;
        margin-top: -5px;

        @include respond-to('mobile') {
          font-size: 20px;
        }
      }

      .points-dot {
        font-size: 10px;
        color: $color-gold-light;
        position: absolute;
        bottom: 30px;
        left: 50%;
        transform: translateX(-50%);
        letter-spacing: 2px;
        text-shadow: 0 0 4px $color-gold-glow;

        @include respond-to('mobile') {
          font-size: 6px;
          bottom: 18px;
        }
      }

      .rank-bottom {
        transform: rotate(180deg);
        align-self: flex-end;
      }

      &.H, &.D {
        color: $color-red-light;
        border-color: rgba(229, 25, 55, 0.25);
        background: radial-gradient(circle at center, #27161b 0%, #0f070a 100%);
      }
    }

    // User Cards Hand HUD (at bottom)
    .user-cards-hand-wrapper {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      z-index: 30;
      width: 100%;
      max-width: 600px;
      padding: 0 20px;
      box-sizing: border-box;
      pointer-events: none;
    }

    .hand-row {
      display: flex;
      justify-content: center;
      align-items: flex-end;
      height: 180px;
      position: relative;

      @include respond-to('mobile') {
        height: 110px;
      }
    }

    .hand-card-slot {
      pointer-events: auto;
      margin-left: -40px; // Card overlapping
      transition: all 0.25s cubic-bezier(0.25, 0.8, 0.25, 1);
      cursor: pointer;
      position: relative;
      
      // Fan styling
      --angle: calc((var(--card-index) - (var(--total-cards) - 1) / 2) * 4deg);
      --y-trans: calc(abs(var(--card-index) - (var(--total-cards) - 1) / 2) * 3px);
      transform: rotate(var(--angle)) translateY(var(--y-trans));

      &:first-child {
        margin-left: 0;
      }

      &:hover.selectable {
        transform: rotate(0deg) translateY(-25px) scale(1.1);
        z-index: 50 !important;
        
        .rendered-card {
          border-color: $color-gold-light;
          box-shadow: 0 15px 35px rgba(0, 0, 0, 0.8), 0 0 15px rgba(212, 175, 55, 0.3);
        }
      }

      &:not(.selectable) {
        cursor: not-allowed;
        opacity: 0.55;
        filter: brightness(0.7);
      }

      @include respond-to('mobile') {
        margin-left: -24px;
        
        &:hover.selectable {
          transform: rotate(0deg) translateY(-15px) scale(1.1);
        }
      }
    }

    // Fullscreen Overlay bases
    .overlay-fullscreen {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(8px);
      z-index: 100;
      @include flex-center;
    }

    .overlay-glow {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      background: radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%);
      pointer-events: none;
    }

    // Bidding Panel
    .bidding-panel, .trump-panel, .recap-panel, .result-card {
      width: 90%;
      max-width: 440px;
      padding: 30px;
      text-align: center;
      background: linear-gradient(135deg, rgba(20, 28, 40, 0.95) 0%, rgba(10, 14, 20, 0.98) 100%);
      @include glass-panel(0.08, 20px, rgba(212, 175, 55, 0.15));
      border-radius: 12px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);
      
      h4 { font-size: 16px; margin-bottom: 4px; }
      .sub { font-size: 11px; color: $color-silver-dark; margin-bottom: 20px; }
    }

    .current-turn-alert {
      padding: 15px;
      background: rgba(255, 255, 255, 0.02);
      border-radius: 6px;
      font-size: 12px;
      color: $color-silver-base;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }

    .loader-dots {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: $color-gold-light;
      animation: dots 1s infinite alternate;
    }

    @keyframes dots {
      from { transform: scale(0.6); opacity: 0.3; }
      to { transform: scale(1.2); opacity: 1; }
    }

    .bidding-chips-grid {
      display: grid;
      grid-template-columns: repeat(5, 1fr);
      gap: 12px;
      justify-items: center;
      margin-bottom: 25px;

      @include respond-to('mobile') {
        grid-template-columns: repeat(4, 1fr);
      }
    }

    .bidding-actions {
      display: flex;
      justify-content: center;
    }

    .pass-btn {
      padding: 12px 30px;
      font-size: 12px;
    }

    // Trump Selection Panel
    .trump-cards-row {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
    }

    .trump-card-btn {
      aspect-ratio: 0.75;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      gap: 6px;
      transition: all $transition-normal;

      &:hover {
        transform: translateY(-5px);
        background: rgba(255, 255, 255, 0.08);
        border-color: $color-gold-light;
        box-shadow: 0 5px 15px rgba(212, 175, 55, 0.2);
      }

      .symbol { font-size: 32px; font-weight: bold; }
      .label { font-size: 9px; font-weight: 700; color: $color-silver-dark; }

      &.H, &.D { color: $color-red-light; &:hover { border-color: $color-red-light; box-shadow: 0 5px 15px $color-red-glow; } }
      &.C, &.S { color: $color-silver-light; }
    }

    // Recap Scores Table
    .scores-table {
      margin-bottom: 25px;
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 8px;
      overflow: hidden;
    }

    .score-row {
      display: grid;
      grid-template-columns: 1fr 100px 100px;
      padding: 12px 15px;
      font-size: 12px;
      background: rgba(0,0,0,0.2);
      border-bottom: 1px solid rgba(255,255,255,0.03);
      
      &.header {
        font-family: $font-headings;
        font-size: 9px;
        font-weight: 800;
        color: $color-silver-dark;
        letter-spacing: 0.05em;
        background: rgba(0,0,0,0.4);
      }

      &.highlight {
        background: rgba(212, 175, 55, 0.03);
        color: $color-gold-light;
      }

      &:last-child { border-bottom: none; }
    }

    .recap-action button {
      padding: 12px 30px;
      font-size: 12px;
    }

    // Result Overlay (Victory/Defeat)
    .result-overlay {
      z-index: 150;
    }

    .result-card {
      position: relative;
      padding: 40px 30px;
      
      .gold-accent-line {
        position: absolute;
        top: 0; left: 0; right: 0;
        height: 4px;
        background: $gradient-gold;
      }
    }

    .result-title {
      font-size: 42px;
      font-weight: 900;
      letter-spacing: 0.15em;
      margin-bottom: 8px;
      
      &.victory {
        background: $gradient-gold;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        filter: drop-shadow(0 0 12px $color-gold-glow);
      }

      &.defeat {
        color: $color-red-light;
        text-shadow: 0 0 15px $color-red-glow;
      }
    }

    .result-subtitle {
      font-family: $font-headings;
      font-size: 10px;
      font-weight: 800;
      color: $color-silver-base;
      letter-spacing: 0.2em;
      margin-bottom: 30px;
    }

    .final-scorebox {
      display: flex;
      justify-content: center;
      align-items: center;
      gap: 30px;
      background: rgba(0,0,0,0.3);
      padding: 20px;
      border-radius: 8px;
      border: 1px solid rgba(255,255,255,0.03);
      margin-bottom: 25px;

      .score-v {
        font-family: $font-headings;
        font-size: 12px;
        font-weight: 900;
        color: $color-silver-dark;
      }
    }

    .final-stat {
      display: flex;
      flex-direction: column;
      gap: 4px;
      
      .val {
        font-family: $font-numeric;
        font-size: 32px;
        font-weight: 900;
        color: $color-silver-light;
      }

      .lbl {
        font-size: 9px;
        color: $color-silver-dark;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
    }

    .coins-reward {
      font-size: 12px;
      font-weight: 700;
      color: $color-silver-base;
      margin-bottom: 30px;
      display: flex;
      justify-content: center;
      gap: 8px;

      .reward-val { color: $color-gold-light; }
    }

    .result-actions {
      display: flex;
      gap: 15px;
      justify-content: center;
      
      button {
        padding: 12px 30px;
        font-size: 12px;
      }
    }

    // Confetti Particles
    .particles-confetti {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      overflow: hidden;
    }

    .confetti-item {
      position: absolute;
      width: 6px;
      height: 12px;
      top: -20px;
      opacity: 0.8;
      border-radius: 2px;
      animation: fallDown 4s infinite linear;
    }

    @keyframes fallDown {
      0% { transform: translateY(-20px) rotate(0deg); opacity: 0.8; }
      100% { transform: translateY(105vh) rotate(720deg); opacity: 0; }
    }

    // Quit Modal
    .quit-content {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .quit-desc {
      font-size: 12px;
      color: $color-silver-base;
      line-height: 1.5;
    }

    .quit-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
      
      button {
        padding: 10px 20px;
        font-size: 11px;
      }
    }

    // Captured Cards Modal Styling
    .captured-modal-content {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }

    .captured-desc {
      font-size: 11px;
      color: $color-silver-dark;
      margin-bottom: 5px;
    }

    .team-captured-section {
      display: flex;
      flex-direction: column;
      gap: 10px;

      .team-title {
        font-size: 12px;
        font-weight: 700;
        letter-spacing: 0.05em;
      }
    }

    .captured-cards-row {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      min-height: 40px;
      background: rgba(0,0,0,0.15);
      border: 1px solid rgba(255,255,255,0.02);
      border-radius: 6px;
      padding: 10px;
    }

    .mini-card {
      width: 45px;
      height: 60px;
      border-radius: 4px;
      background: #1e293b;
      border: 1px solid rgba(255,255,255,0.1);
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
      font-family: $font-numeric;
      box-shadow: 0 2px 5px rgba(0,0,0,0.3);
      color: $color-silver-light;

      &.H, &.D {
        color: $color-red-light;
        border-color: rgba(229,25,55,0.2);
        background: #27161b;
      }

      .val {
        font-weight: 800;
        font-size: 12px;
        line-height: 1;
      }

      .sym {
        font-size: 18px;
        margin-top: -2px;
      }

      .pts {
        position: absolute;
        bottom: 2px;
        font-size: 8px;
        font-weight: 600;
        opacity: 0.8;
      }
    }

    .modal-breakdown-divider {
      height: 1px;
      background: rgba(255,255,255,0.06);
    }

    .empty-recap {
      font-size: 11px;
      color: $color-silver-dark;
      font-style: italic;
      @include flex-center;
      width: 100%;
      height: 40px;
    }

    // Tactical 6x6 Card Grid CSS
    .hand-grid-6x6 {
      display: flex;
      justify-content: center;
      gap: 12px;
      width: 100%;
      box-sizing: border-box;

      @include respond-to('mobile') {
        gap: 6px;
      }
    }

    .suit-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      background: rgba(15, 23, 42, 0.45);
      border: 1.5px solid rgba(255, 255, 255, 0.05);
      border-radius: 10px;
      padding: 8px;
      box-shadow: inset 0 0 10px rgba(0,0,0,0.5);
      backdrop-filter: blur(10px);
      
      @include respond-to('mobile') {
        padding: 4px;
        border-radius: 6px;
      }
    }

    .suit-header {
      font-size: 16px;
      font-weight: 900;
      margin-bottom: 8px;
      
      &.H, &.D { color: $color-red-light; }
      &.C, &.S { color: $color-silver-light; }

      @include respond-to('mobile') {
        font-size: 11px;
        margin-bottom: 4px;
      }
    }

    .suit-cards-container {
      position: relative;
      width: 70px;
      height: 185px;

      @include respond-to('mobile') {
        width: 46px;
        height: 110px;
      }
    }

    .grid-card-slot {
      position: absolute;
      top: calc(var(--card-index) * 22px);
      left: 0;
      transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      cursor: pointer;
      z-index: calc(var(--card-index) + 1);

      @include respond-to('mobile') {
        top: calc(var(--card-index) * 12px);
      }

      .rendered-card {
        transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;
        
        @include respond-to('mobile') {
          transform: scale(0.65);
          transform-origin: top left;
        }
      }

      &:hover {
        transform: translateY(-10px);
        z-index: 100;
        
        .rendered-card {
          border-color: $color-gold-light;
          box-shadow: 0 5px 15px $color-gold-glow;
        }
      }

      &.selectable:hover {
        .rendered-card {
          border-color: $color-gold-light;
          box-shadow: 0 0 20px $color-gold-glow;
        }
      }
    }

    // Stakes Banner CSS
    .stakes-declaration-banner {
      position: fixed;
      bottom: 240px;
      left: 50%;
      transform: translateX(-50%);
      @include glass-panel(0.08, 12px, rgba(212,175,55,0.2));
      border-radius: 10px;
      padding: 15px 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      z-index: 100;
      box-shadow: 0 10px 30px rgba(0,0,0,0.8), 0 0 20px rgba(212,175,55,0.05);
      animation: bannerSlideUp 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;

      @include respond-to('mobile') {
        bottom: 160px;
        padding: 10px 15px;
        width: 90%;
        max-width: 320px;
      }

      h4 {
        margin: 0;
        font-size: 13px;
        font-family: $font-headings;
        @include glow-text($color-silver-light, 6px);
        letter-spacing: 0.05em;

        @include respond-to('mobile') {
          font-size: 10px;
          text-align: center;
        }
      }

      .banner-actions {
        display: flex;
        gap: 12px;

        button {
          padding: 8px 18px;
          font-size: 10px;
          font-weight: 800;

          @include respond-to('mobile') {
            padding: 6px 12px;
            font-size: 8px;
          }
        }
      }

      &.thinking {
        flex-direction: row;
        gap: 10px;
        font-size: 11px;
        color: $color-silver-dark;
      }
    }

    @keyframes bannerSlideUp {
      from { opacity: 0; transform: translate(-50%, 20px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }

    // Single Hand Decision modal CSS
    .single-hand-overlay {
      background: rgba(5, 7, 10, 0.85);
      backdrop-filter: blur(10px);
      z-index: 900;
      @include flex-center;
    }

    .single-hand-panel {
      width: 100%;
      max-width: 420px;
      background: linear-gradient(135deg, rgba(20, 28, 40, 0.95) 0%, rgba(10, 14, 20, 0.98) 100%);
      @include glass-panel(0.08, 16px, rgba(212, 175, 55, 0.25));
      border-radius: 12px;
      padding: 30px;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 20px;
      box-shadow: 0 20px 50px rgba(0, 0, 0, 0.9);

      @include respond-to('mobile') {
        max-width: 320px;
        padding: 20px;
        gap: 15px;
      }

      h3 {
        font-size: 18px;
        @include glow-text($color-gold-light, 8px);
        margin: 0;
      }

      .desc {
        font-size: 11px;
        color: $color-silver-base;
        text-align: center;
        line-height: 1.5;
        margin: 0;
      }
    }

    .timer-countdown-circle {
      width: 60px;
      height: 60px;
      border-radius: 50%;
      border: 2px solid $color-gold-light;
      box-shadow: 0 0 10px $color-gold-glow;
      @include flex-center;
      flex-direction: column;
      background: rgba(212,175,55,0.05);

      .time {
        font-size: 20px;
        font-family: $font-numeric;
        font-weight: 900;
        color: $color-gold-light;
        line-height: 1;
      }

      .lbl {
        font-size: 7px;
        color: $color-silver-dark;
        text-transform: uppercase;
        font-weight: 800;
      }
    }

    .player-votes-status {
      width: 100%;
      display: flex;
      flex-direction: column;
      gap: 10px;
      background: rgba(0,0,0,0.2);
      border-radius: 8px;
      padding: 12px;
    }

    .vote-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid rgba(255,255,255,0.02);

      &:last-child { border-bottom: none; }
      
      &.user {
        background: rgba(212,175,55,0.03);
        border-radius: 4px;
        padding: 6px 8px;
      }
    }

    .vote-status-badge {
      font-size: 9px;
      font-weight: 800;
      padding: 3px 8px;
      border-radius: 4px;
      background: rgba(255,255,255,0.05);
      color: $color-silver-base;

      &.waiting {
        color: $color-silver-dark;
        animation: pulseText 1.5s infinite;
      }

      &.yes {
        background: rgba(212,175,55,0.15);
        color: $color-gold-light;
        border: 1px solid rgba(212,175,55,0.3);
      }

      &.no {
        background: rgba(255,255,255,0.06);
        color: $color-silver-light;
        border: 1px solid rgba(255,255,255,0.1);
      }
    }

    @keyframes pulseText {
      0% { opacity: 0.5; }
      50% { opacity: 1; }
      100% { opacity: 0.5; }
    }

    .single-hand-actions {
      display: flex;
      gap: 12px;
      width: 100%;

      button {
        flex: 1;
        padding: 12px;
        font-size: 11px;
        font-weight: 800;
      }
    }

    // Pair declaration CSS
    .pair-declare-btn {
      position: absolute;
      top: -45px;
      left: 50%;
      transform: translateX(-50%);
      padding: 8px 20px;
      font-size: 10px;
      font-weight: 800;
      z-index: 100;
      box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
      
      @include respond-to('mobile') {
        top: -38px;
        padding: 6px 12px;
        font-size: 8px;
      }
    }

    .pair-confirm-content {
      display: flex;
      flex-direction: column;
      gap: 20px;

      .desc {
        font-size: 12px;
        color: $color-silver-base;
        line-height: 1.5;
      }
    }

    .pair-confirm-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;

      button {
        padding: 10px 20px;
        font-size: 11px;
      }
    }

    // Bidder preview and flip animation overrides
    .trump-card-display {
      &.secret-preview {
        opacity: 0.85;
        border-color: rgba(212, 175, 55, 0.5);
        box-shadow: inset 0 0 10px rgba(212,175,55,0.2), 0 0 15px rgba(212,175,55,0.15);
      }

      .bidder-preview-label {
        position: absolute;
        bottom: 3px;
        left: 50%;
        transform: translateX(-50%);
        font-size: 6px;
        font-weight: 900;
        letter-spacing: 0.05em;
        background: rgba(212,175,55,0.2);
        color: $color-gold-light;
        padding: 1px 3px;
        border-radius: 2px;
      }
    }

    // Match timeline sidebar layout
    .timeline-sidebar {
      position: fixed;
      top: 0; left: -320px; bottom: 0;
      width: 320px;
      height: 100%;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.96) 0%, rgba(5, 7, 10, 0.98) 100%);
      border-right: 1px solid rgba(255,255,255,0.06);
      box-shadow: 10px 0 30px rgba(0,0,0,0.8);
      backdrop-filter: blur(15px);
      z-index: 500;
      transition: left 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      display: flex;
      flex-direction: column;

      &.open {
        left: 0;
      }
    }

    .sidebar-header {
      padding: 16px 20px;
      border-bottom: 1px solid rgba(255,255,255,0.06);
      display: flex;
      justify-content: space-between;
      align-items: center;

      h4 {
        margin: 0;
        font-size: 13px;
        @include glow-text($color-gold-light, 6px);
      }
    }

    .close-sidebar-btn {
      background: none;
      border: none;
      color: $color-silver-base;
      font-size: 24px;
      cursor: pointer;
      line-height: 1;
      
      &:hover { color: $color-gold-light; }
    }

    .sidebar-body {
      flex: 1;
      padding: 20px;
      overflow-y: auto;
    }

    .timeline-list {
      display: flex;
      flex-direction: column;
      gap: 15px;
    }

    .timeline-item {
      display: flex;
      gap: 12px;
      padding-bottom: 12px;
      border-bottom: 1px solid rgba(255,255,255,0.03);

      .evt-icon-wrapper {
        width: 28px;
        height: 28px;
        border-radius: 50%;
        background: rgba(255,255,255,0.03);
        @include flex-center;
        font-size: 14px;
        flex-shrink: 0;
      }

      .evt-details {
        display: flex;
        flex-direction: column;
        gap: 2px;
      }

      .evt-text {
        font-size: 11px;
        color: $color-silver-light;
        line-height: 1.4;
      }

      .evt-time {
        font-size: 8px;
        color: $color-silver-dark;
      }

      &.double .evt-icon-wrapper { background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.2); }
      &.redouble .evt-icon-wrapper { background: rgba(229,25,55,0.1); border: 1px solid rgba(229,25,55,0.2); }
      &.single_hand .evt-icon-wrapper { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.2); }
      &.pair .evt-icon-wrapper { background: rgba(16,185,129,0.1); border: 1px solid rgba(16,185,129,0.2); }
    }

    .empty-timeline {
      font-size: 11px;
      color: $color-silver-dark;
      text-align: center;
      padding: 30px 10px;
      font-style: italic;
    }

    // Scoreboard badges
    .scoreboard-badges-row {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin-top: 6px;
      justify-content: center;
    }

    .badge {
      font-size: 8px;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      box-shadow: 0 2px 4px rgba(0,0,0,0.5);

      &.double {
        background: rgba(212, 175, 55, 0.15);
        color: $color-gold-light;
        border: 1px solid rgba(212, 175, 55, 0.4);
      }

      &.redouble {
        background: rgba(229, 25, 55, 0.15);
        color: $color-red-light;
        border: 1px solid rgba(229, 25, 55, 0.4);
      }

      &.single-hand {
        background: rgba(59, 130, 246, 0.15);
        color: #60a5fa;
        border: 1px solid rgba(59, 130, 246, 0.4);
      }

      &.pair-tag {
        background: rgba(16, 185, 129, 0.15);
        color: #34d399;
        border: 1px solid rgba(16, 185, 129, 0.4);
      }
    }

    // Round outcome titles
    .outcome-title {
      font-size: 22px;
      font-family: $font-headings;
      margin-bottom: 6px;
      text-align: center;
      letter-spacing: 0.1em;
      
      &.normal_win { @include glow-text($color-gold-light, 10px); }
      &.normal_loss { @include glow-text($color-red-light, 10px); }
      &.set { @include glow-text(#3b82f6, 10px); }
      &.double_set { @include glow-text(#f97316, 10px); }
      &.redouble_set { @include glow-text(#ef4444, 10px); }
    }

    .outcome-subtitle {
      font-size: 11px;
      color: $color-silver-dark;
      text-align: center;
      margin-bottom: 20px;
    }
  `]
})
export class GameComponent implements OnInit, OnDestroy {
  isQuitOpen = false;
  isSettingsOpen = false;
  isCapturedOpen = false;
  isTimelineOpen = false;
  isPairConfirmOpen = false;
  lobbyCode = '';
  selectedSpeed = 'normal';
  showRevealAnimation = false;

  // Confetti array for victory Screen
  confetti: { x: number; color: string; delay: number; duration: number }[] = [];

  state = this.gameService.state;

  constructor(
    public gameService: GameService,
    private soundService: SoundService,
    private notificationService: NotificationService,
    private authService: AuthService,
    private router: Router
  ) {
    this.generateConfetti();

    // Track trump reveal state to trigger cinematic animation
    let lastRevealed = false;
    effect(() => {
      const isRevealed = this.state().isTrumpRevealed;
      if (isRevealed && !lastRevealed) {
        this.showRevealAnimation = true;
      }
      lastRevealed = isRevealed;
    });
  }

  ngOnInit() {
    // If not coming from active lobby state, auto initialize mock game
    if (this.state().players.length === 0) {
      this.gameService.startNewGame();
    }
  }

  ngOnDestroy() {
    // Teardowns done internally by service
  }

  private generateConfetti() {
    const colors = ['#f59e0b', '#fbbf24', '#fcd34d', '#10b981', '#3b82f6', '#ec4899'];
    for (let i = 0; i < 60; i++) {
      this.confetti.push({
        x: Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        delay: Math.random() * 3,
        duration: 3 + Math.random() * 3
      });
    }
  }

  getPlayerAtPosition(pos: 'bottom' | 'left' | 'top' | 'right'): Player | undefined {
    return this.state().players.find(p => p.position === pos);
  }

  getSuitSymbol(suit: Suit): string {
    const symbols: Record<Suit, string> = {
      'H': '♥', 'D': '♦', 'C': '♣', 'S': '♠'
    };
    return symbols[suit];
  }

  getBidderName(): string {
    const bidder = this.state().players.find(p => p.id === this.state().bidderId);
    return bidder ? bidder.name : 'None';
  }

  placeBid(amount: number) {
    this.gameService.submitBid(amount);
  }

  passBid() {
    this.gameService.passBid();
  }

  chooseTrump(suit: Suit) {
    this.gameService.selectTrump(suit);
  }

  requestRevealTrump() {
    const me = this.getPlayerAtPosition('bottom')!;
    const turnId = this.state().currentTurnId;
    
    // Trump can only be revealed if it's the user's turn AND the user cannot follow suit
    if (turnId === me.id && this.state().currentTrick.length > 0 && !this.state().isTrumpRevealed) {
      const leadSuit = this.state().currentTrick[0].card.suit;
      const canFollow = me.cards.some(c => c.suit === leadSuit);
      
      if (!canFollow) {
        this.gameService.revealTrump(me.id);
        this.notificationService.show('Trump Revealed!', 'gold');
      } else {
        this.soundService.playClick();
        this.notificationService.show('You must follow suit. Cannot reveal trump!', 'warning');
      }
    } else {
      this.soundService.playClick();
    }
  }

  playUserCard(card: Card) {
    const me = this.getPlayerAtPosition('bottom')!;
    if (this.state().currentTurnId !== me.id) {
      this.soundService.playClick();
      return;
    }
    
    this.gameService.playCard(me.id, card.id);
  }

  nextRound() {
    this.gameService.startNewGame();
  }

  isUserWinner(): boolean {
    const score = this.state().matchScores;
    // Team Red contains bottom (User) and top
    return score.teamRed >= 6;
  }

  isUserWinnerOfRound(): boolean {
    const bidder = this.state().players.find(p => p.id === this.state().bidderId);
    if (!bidder) return false;
    const isBidderRed = bidder.position === 'bottom' || bidder.position === 'top';
    const won = this.state().roundPoints.teamRed >= this.state().highestBid;
    return isBidderRed ? won : !won;
  }

  playAgain() {
    this.gameService.resetMatchScore();
    this.gameService.startNewGame();
  }

  quitToHome() {
    this.gameService.returnToHome();
    this.router.navigate(['/home']);
  }

  openQuitModal() {
    this.soundService.playClick();
    this.isQuitOpen = true;
  }

  confirmQuit() {
    this.soundService.playClick();
    this.isQuitOpen = false;
    this.gameService.returnToHome();
    this.router.navigate(['/home']);
  }

  openCapturedModal() {
    this.soundService.playClick();
    this.isCapturedOpen = true;
  }

  getScoringCapturedCards(team: 'red' | 'black'): Card[] {
    const cards = team === 'red' ? this.state().capturedCardsRed : this.state().capturedCardsBlack;
    return cards.filter(c => c.points > 0).sort((a, b) => b.points - a.points);
  }

  getSuitsInHand(cards: Card[]): Suit[] {
    const suits = new Set<Suit>();
    cards.forEach(c => suits.add(c.suit));
    const suitOrder: Record<Suit, number> = { 'S': 4, 'H': 3, 'D': 2, 'C': 1 };
    return Array.from(suits).sort((a, b) => suitOrder[b] - suitOrder[a]);
  }

  getCardsOfSuit(suit: Suit, cards: Card[]): Card[] {
    return cards.filter(c => c.suit === suit);
  }

  submitDouble(isDouble: boolean) {
    const me = this.getPlayerAtPosition('bottom')!;
    this.gameService.declareDouble(me.id, isDouble);
  }

  submitRedouble(isRedouble: boolean) {
    const me = this.getPlayerAtPosition('bottom')!;
    this.gameService.declareRedouble(me.id, isRedouble);
  }

  submitSingleHand(playSingle: boolean) {
    const me = this.getPlayerAtPosition('bottom')!;
    this.gameService.submitSingleHandResponse(me.id, playSingle ? 'yes' : 'no');
  }

  openPairConfirmation() {
    this.soundService.playClick();
    this.isPairConfirmOpen = true;
  }

  confirmPairDeclaration() {
    const me = this.getPlayerAtPosition('bottom')!;
    this.gameService.declarePair(me.id);
    this.isPairConfirmOpen = false;
  }

  getRoundOutcomeTitle(): string {
    const outcome = this.state().setOutcome;
    const bidder = this.state().players.find(p => p.id === this.state().bidderId);
    if (!bidder) return 'ROUND COMPLETED';
    const isBidderRed = bidder.position === 'bottom' || bidder.position === 'top';

    switch (outcome) {
      case 'redouble_set': return '🔴 REDOUBLE SET!';
      case 'double_set': return '🟠 DOUBLE SET!';
      case 'set': return '🔵 CONTRACT SET!';
      case 'normal_win': return isBidderRed ? '👑 ROUND WON!' : '🤝 OPPONENTS WON!';
      case 'normal_loss': return isBidderRed ? '💔 ROUND LOST!' : '🛡️ CONTRACT DEFENDED!';
      default: return 'ROUND COMPLETED';
    }
  }

  getRoundOutcomeSubtitle(): string {
    const outcome = this.state().setOutcome;
    const bid = this.state().highestBid;
    switch (outcome) {
      case 'redouble_set': return `Opponents declared redouble and completely crushed the contract of ${bid}!`;
      case 'double_set': return `The contract stakes were doubled, resulting in a +/- 2 match score change!`;
      case 'set': return `Defenders successfully prevented the bidder from making their ${bid} contract!`;
      default: return `Stakes resolved. Round points calculated out of 28/29 points.`;
    }
  }
}
