<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use App\Services\GameService;
use App\Models\Game;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BidController extends Controller
{
    public function __construct(private readonly GameService $gameService) {}

    public function place(Request $request, string $gameId): JsonResponse
    {
        $request->validate([
            'value'   => ['required', 'integer'],
            'is_pass' => ['required', 'boolean'],
        ]);

        $game = Game::findOrFail($gameId);

        try {
            $updatedGame = $this->gameService->placeBid(
                $game,
                $request->user(),
                $request->input('value'),
                $request->input('is_pass')
            );

            return response()->json([
                'success' => true,
                'message' => 'Bid processed successfully.',
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], 400);
        }
    }
}
