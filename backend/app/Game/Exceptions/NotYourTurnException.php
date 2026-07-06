<?php

namespace App\Game\Exceptions;

use RuntimeException;

class NotYourTurnException extends RuntimeException
{
    public function __construct()
    {
        parent::__construct('It is not your turn to play.');
    }
}
