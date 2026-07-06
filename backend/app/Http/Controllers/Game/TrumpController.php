<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use App\Services\GameService;
use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrumpController extends Controller
{
    public function __construct(private readonly GameService $gameService) {}

    public function select(Request $request, string $gameId): JsonResponse
    {
        $request->validate([
            'suit' => ['required', 'string', 'in:HEARTS,DIAMONDS,CLUBS,SPADES'],
        ]);

        $game = Game::findOrFail($gameId);

        try {
            $this->gameService->selectTrump($game, $request->user(), $request->input('suit'));
            return response()->json([
                'success' => true,
                'message' => 'Trump suit selected successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function reveal(Request $request, string $gameId): JsonResponse
    {
        $game = Game::findOrFail($gameId);

        try {
            $this->gameService->revealTrump($game, $request->user());
            return response()->json([
                'success' => true,
                'message' => 'Trump revealed successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
