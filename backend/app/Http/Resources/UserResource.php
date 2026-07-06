<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transforms User model into the exact shape the frontend UserProfile interface expects.
     */
    public function toArray(Request $request): array
    {
        $stat = $this->statistic;

        return [
            'id'                 => (string) $this->id,
            'username'           => $this->username,
            'email'              => $this->email,
            'avatar'             => $this->avatar,
            'rank'               => $stat?->rank ?? 'BRONZE',
            'level'              => $stat?->level ?? 1,
            'xp'                 => $stat?->xp ?? 0,
            'gamesPlayed'        => $stat?->games_played ?? 0,
            'gamesWon'           => $stat?->games_won ?? 0,
            'winRate'            => $stat?->winRate() ?? 0.0,
            'totalPointsEarned'  => $stat?->xp ?? 0,
            'achievements'       => [],
            'badges'             => [],
        ];
    }
}
