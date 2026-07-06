<?php

namespace App\Game\Enums;

enum Suit: string
{
    case Hearts  = 'HEARTS';
    case Diamonds = 'DIAMONDS';
    case Clubs   = 'CLUBS';
    case Spades  = 'SPADES';

    public function label(): string
    {
        return match($this) {
            self::Hearts  => 'Hearts',
            self::Diamonds => 'Diamonds',
            self::Clubs   => 'Clubs',
            self::Spades  => 'Spades',
        };
    }

    public function symbol(): string
    {
        return match($this) {
            self::Hearts  => '♥',
            self::Diamonds => '♦',
            self::Clubs   => '♣',
            self::Spades  => '♠',
        };
    }

    public function isRed(): bool
    {
        return in_array($this, [self::Hearts, self::Diamonds]);
    }
}
