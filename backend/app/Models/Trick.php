<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Trick extends Model
{
    protected $fillable = [
        'round_id',
        'trick_number',
        'lead_position',
        'winner_position',
        'points',
    ];

    protected function casts(): array
    {
        return [
            'trick_number' => 'integer',
            'points'       => 'integer',
        ];
    }

    public function round(): BelongsTo
    {
        return $this->belongsTo(Round::class);
    }

    public function cards(): HasMany
    {
        return $this->hasMany(TrickCard::class);
    }
}
