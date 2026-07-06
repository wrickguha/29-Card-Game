<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Game extends Model
{
    protected $fillable = [
        'room_id',
        'dealer_position',
        'highest_bid',
        'highest_bidder_position',
        'trump_suit',
        'trump_card_encrypted',
        'trump_revealed',
        'trump_mode',
        'double_status',
        'double_declarer_position',
        'redouble_declarer_position',
        'single_hand_active',
        'single_hand_declarer_position',
        'pair_declared_position',
        'pair_declared_suit',
        'phase',
        'turn_position',
        'red_team_match_score',
        'blue_team_match_score',
    ];

    protected function casts(): array
    {
        return [
            'trump_revealed'      => 'boolean',
            'single_hand_active'  => 'boolean',
            'highest_bid'         => 'integer',
            'red_team_match_score' => 'integer',
            'blue_team_match_score' => 'integer',
        ];
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function rounds(): HasMany
    {
        return $this->hasMany(Round::class)->orderBy('round_number');
    }

    public function currentRound(): HasOne
    {
        return $this->hasOne(Round::class)->latestOfMany('round_number');
    }

    public function playerHands(): HasMany
    {
        return $this->hasMany(PlayerHand::class);
    }

    public function bids(): HasMany
    {
        return $this->hasMany(Bid::class);
    }

    public function isMatchOver(): bool
    {
        $winScore = (int) config('game.match_win_score', 6);
        return $this->red_team_match_score >= $winScore
            || $this->blue_team_match_score >= $winScore;
    }
}
