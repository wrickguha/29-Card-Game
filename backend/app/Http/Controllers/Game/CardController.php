<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use App\Services\GameService;
use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CardController extends Controller
{
    public function __construct(private readonly GameService $gameService) {}

    public function play(Request $request, string $gameId): JsonResponse
    {
        $request->validate([
            'cardId' => ['required', 'string'],
        ]);

        $game = Game::findOrFail($gameId);

        try {
            $this->gameService->playCard($game, $request->user(), $request->input('cardId'));
            return response()->json([
                'success' => true,
                'message' => 'Card played successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
