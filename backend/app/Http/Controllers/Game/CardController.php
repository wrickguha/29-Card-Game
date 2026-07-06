<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CardController extends Controller
{
    public function play(Request $request, string $gameId): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 6: Card play not yet implemented.'], 501);
    }
}
