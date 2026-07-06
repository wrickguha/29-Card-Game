<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;

class GameController extends Controller
{
    public function state(string $gameId): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 4: Game engine not yet implemented.'], 501);
    }
}
