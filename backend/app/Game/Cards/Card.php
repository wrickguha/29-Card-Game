<?php

namespace App\Game\Cards;

use App\Game\Enums\Suit;
use App\Game\Enums\Rank;

/**
 * Immutable card value object.
 * Matches the frontend Card interface exactly.
 */
final readonly class Card
{
    public readonly string $id;
    public readonly int $points;
    public readonly int $value;

    public function __construct(
        public readonly Suit $suit,
        public readonly Rank $rank,
    ) {
        $this->id     = "{$suit->value}_{$rank->value}";
        $this->points = $rank->points();
        $this->value  = $rank->value();
    }

    /**
     * Serialize to the exact shape the frontend Card interface expects.
     */
    public function toArray(): array
    {
        return [
            'id'     => $this->id,
            'suit'   => $this->suit->value,
            'rank'   => $this->rank->value,
            'points' => $this->points,
            'value'  => $this->value,
        ];
    }

    public function equals(Card $other): bool
    {
        return $this->id === $other->id;
    }

    public function isTrump(Suit $trumpSuit): bool
    {
        return $this->suit === $trumpSuit;
    }

    public static function fromId(string $id): self
    {
        [$suit, $rank] = explode('_', $id, 2);
        return new self(
            Suit::from($suit),
            Rank::from($rank),
        );
    }

    /**
     * Reconstruct from array (stored in DB JSON column).
     */
    public static function fromArray(array $data): self
    {
        return new self(
            Suit::from($data['suit']),
            Rank::from($data['rank']),
        );
    }
}
