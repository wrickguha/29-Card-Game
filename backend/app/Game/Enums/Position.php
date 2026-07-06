<?php

namespace App\Game\Enums;

enum Position: string
{
    case South = 'SOUTH';
    case West  = 'WEST';
    case North = 'NORTH';
    case East  = 'EAST';

    /**
     * The next player in turn order (clockwise: S→W→N→E→S).
     */
    public function next(): self
    {
        return match($this) {
            self::South => self::West,
            self::West  => self::North,
            self::North => self::East,
            self::East  => self::South,
        };
    }

    /**
     * Returns the team this position belongs to.
     */
    public function team(): Team
    {
        return match($this) {
            self::South, self::North => Team::Red,
            self::East,  self::West  => Team::Blue,
        };
    }

    /**
     * Opposite/partner position (S↔N, E↔W).
     */
    public function partner(): self
    {
        return match($this) {
            self::South => self::North,
            self::North => self::South,
            self::East  => self::West,
            self::West  => self::East,
        };
    }
}
