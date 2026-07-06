<?php

namespace App\Game\Exceptions;

use RuntimeException;

class InvalidBidException extends RuntimeException
{
    public function __construct(string $reason = 'Invalid bid.')
    {
        parent::__construct($reason);
    }
}
