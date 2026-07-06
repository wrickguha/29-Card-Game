<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class TrickCard extends Model
{
    protected $fillable = [
        'trick_id',
        'position',
        'suit',
        'rank',
    ];

    public function trick(): BelongsTo
    {
        return $this->belongsTo(Trick::class);
    }
}
