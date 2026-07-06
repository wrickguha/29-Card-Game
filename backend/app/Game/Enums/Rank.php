<?php

namespace App\Game\Enums;

enum Rank: string
{
    case Jack  = 'J';
    case Nine  = '9';
    case Ace   = 'A';
    case Ten   = '10';
    case King  = 'K';
    case Queen = 'Q';
    case Eight = '8';
    case Seven = '7';

    /**
     * Points contributed to the round score total (J=3, 9=2, A=1, 10=1).
     * Total across 32 cards: 28 points.
     */
    public function points(): int
    {
        return match($this) {
            self::Jack  => 3,
            self::Nine  => 2,
            self::Ace   => 1,
            self::Ten   => 1,
            default     => 0,
        };
    }

    /**
     * Trick-winning power (J=8 highest → 7=1 lowest).
     */
    public function value(): int
    {
        return match($this) {
            self::Jack  => 8,
            self::Nine  => 7,
            self::Ace   => 6,
            self::Ten   => 5,
            self::King  => 4,
            self::Queen => 3,
            self::Eight => 2,
            self::Seven => 1,
        };
    }
}
