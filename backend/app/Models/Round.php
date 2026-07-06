<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Round extends Model
{
    protected $fillable = [
        'game_id',
        'round_number',
        'dealer_position',
        'winner_team',
        'red_points',
        'blue_points',
        'bid_value',
        'bidder_position',
        'score_change',
        'result_reason',
    ];

    protected function casts(): array
    {
        return [
            'round_number' => 'integer',
            'red_points'   => 'integer',
            'blue_points'  => 'integer',
            'bid_value'    => 'integer',
            'score_change' => 'integer',
        ];
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function tricks(): HasMany
    {
        return $this->hasMany(Trick::class)->orderBy('trick_number');
    }
}
