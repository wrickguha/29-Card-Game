<?php

use Illuminate\Support\Facades\Broadcast;

/*
|--------------------------------------------------------------------------
| Broadcast Channels — 29 Royal Club
|--------------------------------------------------------------------------
|
| Private channels require the user to be authenticated AND authorized.
| The closure returns true to allow, false/null to deny.
|
*/

/**
 * Room channel: all players in the room (lobby + game).
 * Authorization: user must be a member of this room.
 */
Broadcast::channel('room.{roomId}', function ($user, $roomId) {
    return \App\Models\RoomPlayer::where('room_id', $roomId)
        ->where('user_id', $user->id)
        ->exists();
});

/**
 * Game channel: all 4 players during an active match.
 * Authorization: user must have a hand in this game (i.e., joined before it started).
 */
Broadcast::channel('game.{gameId}', function ($user, $gameId) {
    return \App\Models\PlayerHand::where('game_id', $gameId)
        ->where('user_id', $user->id)
        ->exists();
});

/**
 * Player-private channel: used for sending secret data like hand cards and hidden trump.
 * Authorization: only the user themselves can subscribe.
 */
Broadcast::channel('player.{userId}', function ($user, $userId) {
    return (int) $user->id === (int) $userId;
});
