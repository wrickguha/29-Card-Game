<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class UserStatistic extends Model
{
    protected $fillable = [
        'user_id',
        'games_played',
        'games_won',
        'total_bids_won',
        'total_bids_lost',
        'total_tricks_won',
        'highest_bid_won',
        'pair_declarations',
        'double_wins',
        'single_hand_wins',
        'xp',
        'level',
        'rank',
    ];

    protected function casts(): array
    {
        return [
            'games_played'       => 'integer',
            'games_won'          => 'integer',
            'total_bids_won'     => 'integer',
            'total_bids_lost'    => 'integer',
            'total_tricks_won'   => 'integer',
            'highest_bid_won'    => 'integer',
            'pair_declarations'  => 'integer',
            'double_wins'        => 'integer',
            'single_hand_wins'   => 'integer',
            'xp'                 => 'integer',
            'level'              => 'integer',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function winRate(): float
    {
        if ($this->games_played === 0) {
            return 0.0;
        }
        return round(($this->games_won / $this->games_played) * 100, 1);
    }
}
