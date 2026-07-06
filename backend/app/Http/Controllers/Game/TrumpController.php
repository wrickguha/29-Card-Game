<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TrumpController extends Controller
{
    public function select(Request $request, string $gameId): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 5: Trump selection not yet implemented.'], 501);
    }

    public function reveal(Request $request, string $gameId): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 5: Trump reveal not yet implemented.'], 501);
    }
}
