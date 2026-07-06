<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Room extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'code',
        'host_id',
        'status',
        'max_players',
        'is_private',
        'trump_mode',
    ];

    protected function casts(): array
    {
        return [
            'is_private'  => 'boolean',
            'max_players' => 'integer',
        ];
    }

    public function host(): BelongsTo
    {
        return $this->belongsTo(User::class, 'host_id');
    }

    public function players(): HasMany
    {
        return $this->hasMany(RoomPlayer::class)->with('user');
    }

    public function game(): HasOne
    {
        return $this->hasOne(Game::class);
    }

    public function isFull(): bool
    {
        return $this->players()->count() >= $this->max_players;
    }

    public function isInLobby(): bool
    {
        return $this->status === 'LOBBY';
    }

    public function allPlayersReady(): bool
    {
        $players = $this->players;
        return $players->count() === $this->max_players
            && $players->every(fn($p) => $p->is_ready);
    }

    /**
     * Generate a unique 6-character room code.
     */
    public static function generateCode(): string
    {
        do {
            $code = strtoupper(substr(bin2hex(random_bytes(4)), 0, 6));
        } while (self::where('code', $code)->exists());

        return $code;
    }
}
