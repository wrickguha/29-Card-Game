<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PlayerHand extends Model
{
    protected $fillable = [
        'game_id',
        'user_id',
        'position',
        'cards_json',
        'initial_cards_json',
    ];

    protected function casts(): array
    {
        return [
            'cards_json'         => 'array',
            'initial_cards_json' => 'array',
        ];
    }

    public function game(): BelongsTo
    {
        return $this->belongsTo(Game::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
