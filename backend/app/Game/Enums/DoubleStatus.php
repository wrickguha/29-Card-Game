<?php

namespace App\Game\Enums;

enum DoubleStatus: string
{
    case None     = 'NONE';
    case Double   = 'DOUBLE';
    case Redouble = 'REDOUBLE';
}
