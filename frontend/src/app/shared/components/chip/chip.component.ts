import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chip',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="poker-chip" 
      [class]="color" 
      [class.active]="active"
      [class.disabled]="disabled"
      (click)="onClick()"
    >
      <div class="outer-ring">
        <div class="dashed-border"></div>
        <div class="inner-plate">
          <div class="value-circle">
            <span class="chip-value">{{ value }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @import '../../../../styles/variables';
    @import '../../../../styles/mixins';

    :host {
      display: inline-block;
    }

    .poker-chip {
      width: 70px;
      height: 70px;
      border-radius: 50%;
      position: relative;
      cursor: pointer;
      box-shadow: 0 6px 15px rgba(0, 0, 0, 0.6), inset 0 2px 2px rgba(255, 255, 255, 0.4);
      transition: all $transition-normal;
      user-select: none;
      @include flex-center;
      
      &:hover:not(.disabled) {
        transform: translateY(-5px) scale(1.08);
        filter: brightness(1.1);
        box-shadow: 0 12px 25px rgba(0, 0, 0, 0.8), 0 0 10px rgba(255, 255, 255, 0.1);
      }

      &:active:not(.disabled) {
        transform: translateY(1px) scale(0.98);
        box-shadow: 0 3px 8px rgba(0, 0, 0, 0.8);
      }

      &.disabled {
        opacity: 0.35;
        cursor: not-allowed;
        pointer-events: none;
        filter: grayscale(0.5);
      }
    }

    // Chip Themes
    .gold {
      background: radial-gradient(circle, #f59e0b 0%, #b45309 100%);
      border: 3px dashed #fcd34d;
      
      &.active {
        box-shadow: 0 0 20px $color-gold-glow, inset 0 2px 2px rgba(255, 255, 255, 0.4);
      }
      .chip-value { color: #fef08a; }
    }

    .blue {
      background: radial-gradient(circle, #3b82f6 0%, #1d4ed8 100%);
      border: 3px dashed #93c5fd;

      &.active {
        box-shadow: 0 0 20px $color-blue-glow, inset 0 2px 2px rgba(255, 255, 255, 0.4);
      }
      .chip-value { color: #dbeafe; }
    }

    .red {
      background: radial-gradient(circle, #ef4444 0%, #b91c1c 100%);
      border: 3px dashed #fca5a5;

      &.active {
        box-shadow: 0 0 20px $color-red-glow, inset 0 2px 2px rgba(255, 255, 255, 0.4);
      }
      .chip-value { color: #fee2e2; }
    }

    .silver {
      background: radial-gradient(circle, #9ca3af 0%, #4b5563 100%);
      border: 3px dashed #e5e7eb;

      &.active {
        box-shadow: 0 0 20px rgba(255, 255, 255, 0.25), inset 0 2px 2px rgba(255, 255, 255, 0.4);
      }
      .chip-value { color: #f3f4f6; }
    }

    .outer-ring {
      width: calc(100% - 6px);
      height: calc(100% - 6px);
      border-radius: 50%;
      border: 2px solid rgba(255, 255, 255, 0.15);
      @include flex-center;
      position: relative;
    }

    .dashed-border {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      border-radius: 50%;
      border: 1px dotted rgba(255, 255, 255, 0.4);
    }

    .inner-plate {
      width: calc(100% - 10px);
      height: calc(100% - 10px);
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.35);
      border: 2px solid rgba(0, 0, 0, 0.4);
      @include flex-center;
      box-shadow: inset 0 4px 10px rgba(0, 0, 0, 0.8);
    }

    .value-circle {
      width: calc(100% - 4px);
      height: calc(100% - 4px);
      border-radius: 50%;
      background: rgba(0, 0, 0, 0.2);
      border: 1px solid rgba(255, 255, 255, 0.05);
      @include flex-center;
    }

    .chip-value {
      font-family: $font-numeric;
      font-weight: 900;
      font-size: 18px;
      letter-spacing: -0.02em;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.9);
    }
  `]
})
export class ChipComponent {
  @Input() value = '16';
  @Input() color: 'gold' | 'blue' | 'red' | 'silver' = 'blue';
  @Input() active = false;
  @Input() disabled = false;
  
  @Output() select = new EventEmitter<string>();

  onClick() {
    if (!this.disabled) {
      this.select.emit(this.value);
    }
  }
}
