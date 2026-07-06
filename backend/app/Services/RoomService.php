<?php

namespace App\Services;

use App\Models\Room;
use App\Models\RoomPlayer;
use App\Models\User;
use Illuminate\Support\Str;

class RoomService
{
    /**
     * Create a new room with the host as the first player at SOUTH.
     */
    public function createRoom(User $host, array $options = []): Room
    {
        $code = Room::generateCode();

        $room = Room::create([
            'code'        => $code,
            'host_id'     => $host->id,
            'status'      => 'LOBBY',
            'max_players' => 4,
            'is_private'  => $options['is_private'] ?? true,
            'trump_mode'  => $options['trump_mode'] ?? 'SEVENTH_CARD',
        ]);

        RoomPlayer::create([
            'room_id'      => $room->id,
            'user_id'      => $host->id,
            'position'     => 'SOUTH',
            'is_ready'     => false,
            'is_connected' => true,
            'last_seen_at' => now(),
        ]);

        return $room->load('players.user');
    }

    /**
     * Join an existing room, assigning the player to the first empty position.
     */
    public function joinRoom(User $user, string $code): Room
    {
        $room = Room::where('code', strtoupper($code))->firstOrFail();

        if ($room->status !== 'LOBBY') {
            throw new \Exception('Game has already started in this room.');
        }

        // Check if player is already in the room
        $existingPlayer = $room->players()->where('user_id', $user->id)->first();
        if ($existingPlayer) {
            $existingPlayer->update([
                'is_connected' => true,
                'last_seen_at' => now(),
            ]);
            return $room->load('players.user');
        }

        if ($room->isFull()) {
            throw new \Exception('Room is full.');
        }

        // Determine next free position
        $takenPositions = $room->players->pluck('position')->toArray();
        $allPositions = ['SOUTH', 'WEST', 'NORTH', 'EAST'];
        $assignedPosition = null;

        foreach ($allPositions as $pos) {
            if (!in_array($pos, $takenPositions)) {
                $assignedPosition = $pos;
                break;
            }
        }

        if (!$assignedPosition) {
            throw new \Exception('No seats available.');
        }

        RoomPlayer::create([
            'room_id'      => $room->id,
            'user_id'      => $user->id,
            'position'     => $assignedPosition,
            'is_ready'     => false,
            'is_connected' => true,
            'last_seen_at' => now(),
        ]);

        return $room->fresh('players.user');
    }

    /**
     * Toggle the ready state of a player in a room.
     */
    public function toggleReady(User $user, string $code): Room
    {
        $room = Room::where('code', strtoupper($code))->firstOrFail();
        $player = $room->players()->where('user_id', $user->id)->firstOrFail();

        $player->update([
            'is_ready' => !$player->is_ready,
        ]);

        return $room->fresh('players.user');
    }

    /**
     * Leave a room. If the host leaves, transfer host or soft delete room.
     */
    public function leaveRoom(User $user, string $code): Room
    {
        $room = Room::where('code', strtoupper($code))->firstOrFail();
        $player = $room->players()->where('user_id', $user->id)->first();

        if ($player) {
            $player->delete();
        }

        $remainingPlayers = $room->players()->get();
        if ($remainingPlayers->isEmpty()) {
            $room->delete();
        } elseif ($room->host_id === $user->id) {
            // Reassign host
            $newHost = $remainingPlayers->first();
            $room->update(['host_id' => $newHost->user_id]);
        }

        return $room->fresh('players.user');
    }
}
