<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Match Win Score
    |--------------------------------------------------------------------------
    | The number of game points a team must reach to win the match.
    | Standard 29 rules: first to 6 wins.
    */
    'match_win_score' => (int) env('GAME_MATCH_WIN_SCORE', 6),

    /*
    |--------------------------------------------------------------------------
    | Default Trump Mode
    |--------------------------------------------------------------------------
    | SEVENTH_CARD: The 7th dealt card determines trump (hidden).
    | JOKER:        A Joker card is placed as the hidden trump indicator.
    */
    'trump_mode' => env('GAME_TRUMP_MODE', 'SEVENTH_CARD'),

    /*
    |--------------------------------------------------------------------------
    | Server-Side Timers (seconds)
    |--------------------------------------------------------------------------
    */
    'timers' => [
        'turn'        => (int) env('GAME_TURN_TIMEOUT', 15),
        'bid'         => (int) env('GAME_BID_TIMEOUT', 15),
        'trump'       => (int) env('GAME_TRUMP_TIMEOUT', 30),
        'single_hand' => (int) env('GAME_SINGLE_HAND_TIMEOUT', 10),
    ],

    /*
    |--------------------------------------------------------------------------
    | Disconnection Grace Period (seconds)
    |--------------------------------------------------------------------------
    | How long a disconnected player has to reconnect before being forfeited.
    */
    'reconnect_grace' => (int) env('GAME_RECONNECT_GRACE', 60),

    /*
    |--------------------------------------------------------------------------
    | Bidding Rules
    |--------------------------------------------------------------------------
    */
    'bidding' => [
        'min_bid'    => 16,
        'max_bid'    => 28,
        'increment'  => 1,   // Must outbid by at least 1
    ],

    /*
    |--------------------------------------------------------------------------
    | Scoring
    |--------------------------------------------------------------------------
    | Total card points per round = 28 (J×3 + 9×2 + A×1 + 10×1 = 28, ×4 suits)
    | Last trick bonus = 1 point.
    */
    'scoring' => [
        'total_round_points' => 28,
        'last_trick_bonus'   => 1,
        'double_multiplier'  => 2,
        'redouble_multiplier' => 4,
        'single_hand_points' => 3,  // Game points awarded for single hand win
    ],

    /*
    |--------------------------------------------------------------------------
    | Pair Rule
    |--------------------------------------------------------------------------
    | Declaring a pair (K+Q of trump suit) adjusts the target bid by ±4.
    */
    'pair' => [
        'bid_modifier' => 4,   // +4 for defending, -4 for bidding team
    ],
];
