<?php

namespace App\Game\Enums;

enum Team: string
{
    case Red  = 'RED';
    case Blue = 'BLUE';

    public function opposite(): self
    {
        return match($this) {
            self::Red  => self::Blue,
            self::Blue => self::Red,
        };
    }

    /** @return Position[] */
    public function positions(): array
    {
        return match($this) {
            self::Red  => [Position::South, Position::North],
            self::Blue => [Position::East,  Position::West],
        };
    }
}
