<?php

namespace App\Http\Controllers\Room;

use App\Http\Controllers\Controller;
use App\Services\RoomService;
use App\Services\GameService;
use App\Models\Room;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function __construct(
        private readonly RoomService $roomService,
        private readonly GameService $gameService
    ) {}

    public function create(Request $request): JsonResponse
    {
        $options = $request->validate([
            'is_private' => ['nullable', 'boolean'],
            'trump_mode' => ['nullable', 'string', 'in:SEVENTH_CARD,JOKER'],
        ]);

        try {
            $room = $this->roomService->createRoom($request->user(), $options);
            return response()->json([
                'success' => true,
                'data'    => $room,
                'message' => 'Room created successfully.',
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function show(string $code): JsonResponse
    {
        $room = Room::where('code', strtoupper($code))->with(['players.user', 'game'])->firstOrFail();
        $chats = \Illuminate\Support\Facades\Cache::get("room_chat:{$room->code}", []);
        
        $data = $room->toArray();
        $data['chats'] = $chats;

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    public function join(Request $request, string $code): JsonResponse
    {
        try {
            $room = $this->roomService->joinRoom($request->user(), $code);
            $chats = \Illuminate\Support\Facades\Cache::get("room_chat:{$room->code}", []);
            
            // Reload room with players and game
            $room->load(['players.user', 'game']);
            
            $data = $room->toArray();
            $data['chats'] = $chats;

            return response()->json([
                'success' => true,
                'data'    => $data,
                'message' => 'Joined room successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function leave(Request $request, string $code): JsonResponse
    {
        try {
            $room = $this->roomService->leaveRoom($request->user(), $code);
            return response()->json([
                'success' => true,
                'data'    => $room,
                'message' => 'Left room successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function toggleReady(Request $request, string $code): JsonResponse
    {
        try {
            $room = $this->roomService->toggleReady($request->user(), $code);
            return response()->json([
                'success' => true,
                'data'    => $room,
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function startGame(Request $request, string $code): JsonResponse
    {
        $room = Room::where('code', strtoupper($code))->firstOrFail();
        
        if ($room->host_id !== $request->user()->id) {
            return response()->json([
                'success' => false,
                'message' => 'Only the host can start the game.',
            ], 403);
        }

        try {
            $game = $this->gameService->startGame($room);
            return response()->json([
                'success' => true,
                'data'    => [
                    'gameId' => $game->id,
                ],
                'message' => 'Game started.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
