<?php

namespace App\Http\Controllers\Room;

use App\Http\Controllers\Controller;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;

class RoomChatController extends Controller
{
    public function send(Request $request, string $code): JsonResponse
    {
        $request->validate([
            'message' => ['required', 'string', 'max:200'],
        ]);

        $room = Room::where('code', strtoupper($code))->firstOrFail();
        $player = $room->players()->where('user_id', $request->user()->id)->firstOrFail();

        $newMessage = [
            'id'             => 'msg_' . Str::random(10),
            'senderName'     => $request->user()->username,
            'senderPosition' => $player->position,
            'message'        => $request->input('message'),
            'timestamp'      => now()->format('h:i A'),
        ];

        // Store chat in cache for 1 hour
        $cacheKey = "room_chat:{$room->code}";
        $chats = Cache::get($cacheKey, []);
        $chats[] = $newMessage;
        
        // Keep only last 50 messages
        if (count($chats) > 50) {
            array_shift($chats);
        }
        
        Cache::put($cacheKey, $chats, now()->addHour());

        return response()->json([
            'success' => true,
            'data'    => $newMessage,
        ]);
    }
}
