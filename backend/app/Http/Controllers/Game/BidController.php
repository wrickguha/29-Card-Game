<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BidController extends Controller
{
    public function place(Request $request, string $gameId): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 5: Bidding not yet implemented.'], 501);
    }
}
