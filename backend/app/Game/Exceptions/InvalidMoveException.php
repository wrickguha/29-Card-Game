<?php

namespace App\Game\Exceptions;

use RuntimeException;

class InvalidMoveException extends RuntimeException
{
    public function __construct(string $reason = 'Invalid move.')
    {
        parent::__construct($reason);
    }
}
