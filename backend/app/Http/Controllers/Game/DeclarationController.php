<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use App\Services\GameService;
use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeclarationController extends Controller
{
    public function __construct(private readonly GameService $gameService) {}

    public function singleHand(Request $request, string $gameId): JsonResponse
    {
        $request->validate([
            'play' => ['required', 'boolean'],
        ]);

        $game = Game::findOrFail($gameId);

        try {
            $this->gameService->declareSingleHand($game, $request->user(), $request->input('play'));
            return response()->json([
                'success' => true,
                'message' => 'Single hand declaration updated.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function pair(Request $request, string $gameId): JsonResponse
    {
        $game = Game::findOrFail($gameId);

        try {
            $this->gameService->declarePair($game, $request->user());
            return response()->json([
                'success' => true,
                'message' => 'Pair declared successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function double(Request $request, string $gameId): JsonResponse
    {
        $game = Game::findOrFail($gameId);

        try {
            $this->gameService->declareMultiplier($game, $request->user(), 'DOUBLE');
            return response()->json([
                'success' => true,
                'message' => 'Double declared successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }

    public function redouble(Request $request, string $gameId): JsonResponse
    {
        $game = Game::findOrFail($gameId);

        try {
            $this->gameService->declareMultiplier($game, $request->user(), 'REDOUBLE');
            return response()->json([
                'success' => true,
                'message' => 'Redouble declared successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
