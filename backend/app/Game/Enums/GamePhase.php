<?php

namespace App\Game\Enums;

enum GamePhase: string
{
    case Bidding         = 'BIDDING';
    case TrumpSelect     = 'TRUMP_SELECT';
    case SingleHandPrompt = 'SINGLE_HAND_PROMPT';
    case Playing         = 'PLAYING';
    case RoundOver       = 'ROUND_OVER';
    case MatchOver       = 'MATCH_OVER';
}
