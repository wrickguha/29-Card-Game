<?php

namespace App\Game\Deck;

use App\Game\Cards\Card;
use App\Game\Cards\CardCollection;
use App\Game\Enums\Suit;
use App\Game\Enums\Rank;

/**
 * A standard 29-card game deck of 32 cards (8 ranks × 4 suits).
 */
final class Deck
{
    private CardCollection $cards;

    public function __construct()
    {
        $this->cards = $this->generate();
    }

    private function generate(): CardCollection
    {
        $collection = new CardCollection();
        foreach (Suit::cases() as $suit) {
            foreach (Rank::cases() as $rank) {
                $collection->add(new Card($suit, $rank));
            }
        }
        return $collection;
    }

    public function shuffle(): self
    {
        $shuffled = clone $this;
        $cards = $shuffled->cards->all();

        // Fisher-Yates shuffle
        for ($i = count($cards) - 1; $i > 0; $i--) {
            $j = random_int(0, $i);
            [$cards[$i], $cards[$j]] = [$cards[$j], $cards[$i]];
        }

        $shuffled->cards = new CardCollection($cards);
        return $shuffled;
    }

    public function getCards(): CardCollection
    {
        return $this->cards;
    }

    /**
     * Deal cards for all 4 positions, returning first N cards per player.
     * In 29, dealing is done in 2 rounds of 4 cards each (first 4 during bidding,
     * remaining 4 after trump selection).
     *
     * @return array<string, Card[]> keyed by position value
     */
    public function dealFirstRound(): array
    {
        $all = $this->cards->all();
        return [
            'SOUTH' => array_slice($all, 0,  4),
            'WEST'  => array_slice($all, 4,  4),
            'NORTH' => array_slice($all, 8,  4),
            'EAST'  => array_slice($all, 12, 4),
        ];
    }

    /**
     * @return array<string, Card[]> second 4 cards per position
     */
    public function dealSecondRound(): array
    {
        $all = $this->cards->all();
        return [
            'SOUTH' => array_slice($all, 16, 4),
            'WEST'  => array_slice($all, 20, 4),
            'NORTH' => array_slice($all, 24, 4),
            'EAST'  => array_slice($all, 28, 4),
        ];
    }

    /**
     * Full 8-card deal per position (for internal game state storage).
     * @return array<string, Card[]>
     */
    public function dealFull(): array
    {
        $all = $this->cards->all();
        return [
            'SOUTH' => array_slice($all, 0,  8),
            'WEST'  => array_slice($all, 8,  8),
            'NORTH' => array_slice($all, 16, 8),
            'EAST'  => array_slice($all, 24, 8),
        ];
    }
}
