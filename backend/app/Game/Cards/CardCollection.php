<?php

namespace App\Game\Cards;

use App\Game\Enums\Suit;
use Countable;
use IteratorAggregate;
use ArrayIterator;

/**
 * Typed collection of Card objects with game-specific operations.
 */
final class CardCollection implements Countable, IteratorAggregate
{
    /** @param Card[] $cards */
    public function __construct(private array $cards = []) {}

    public static function fromArray(array $data): self
    {
        return new self(array_map(fn($c) => Card::fromArray($c), $data));
    }

    public function toArray(): array
    {
        return array_map(fn(Card $c) => $c->toArray(), $this->cards);
    }

    public function add(Card $card): void
    {
        $this->cards[] = $card;
    }

    public function remove(string $cardId): self
    {
        return new self(array_values(
            array_filter($this->cards, fn(Card $c) => $c->id !== $cardId)
        ));
    }

    public function findById(string $cardId): ?Card
    {
        foreach ($this->cards as $card) {
            if ($card->id === $cardId) {
                return $card;
            }
        }
        return null;
    }

    public function hasCard(string $cardId): bool
    {
        return $this->findById($cardId) !== null;
    }

    public function hasSuit(Suit $suit): bool
    {
        foreach ($this->cards as $card) {
            if ($card->suit === $suit) {
                return true;
            }
        }
        return false;
    }

    /** @return Card[] */
    public function ofSuit(Suit $suit): array
    {
        return array_values(
            array_filter($this->cards, fn(Card $c) => $c->suit === $suit)
        );
    }

    public function count(): int
    {
        return count($this->cards);
    }

    public function getIterator(): ArrayIterator
    {
        return new ArrayIterator($this->cards);
    }

    /** @return Card[] */
    public function all(): array
    {
        return $this->cards;
    }

    public function isEmpty(): bool
    {
        return empty($this->cards);
    }

    /**
     * Sort by suit order (SPADES→DIAMONDS→CLUBS→HEARTS) then by rank value desc.
     * Matches the frontend sortCards() function exactly.
     */
    public function sorted(): self
    {
        $suitOrder = [
            'SPADES'   => 0,
            'DIAMONDS' => 1,
            'CLUBS'    => 2,
            'HEARTS'   => 3,
        ];

        $cards = $this->cards;
        usort($cards, function (Card $a, Card $b) use ($suitOrder) {
            if ($a->suit !== $b->suit) {
                return $suitOrder[$a->suit->value] <=> $suitOrder[$b->suit->value];
            }
            return $b->value <=> $a->value;
        });

        return new self($cards);
    }

    /**
     * Split this collection into N chunks (for dealing rounds).
     * Returns array of CardCollection.
     *
     * @return self[]
     */
    public function chunk(int $size): array
    {
        $chunks = array_chunk($this->cards, $size);
        return array_map(fn($chunk) => new self($chunk), $chunks);
    }
}
