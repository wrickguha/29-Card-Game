<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DeclarationController extends Controller
{
    public function singleHand(Request $request, string $gameId): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 7: Single hand not yet implemented.'], 501);
    }

    public function pair(Request $request, string $gameId): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 7: Pair rule not yet implemented.'], 501);
    }

    public function double(Request $request, string $gameId): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 7: Double not yet implemented.'], 501);
    }

    public function redouble(Request $request, string $gameId): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 7: Redouble not yet implemented.'], 501);
    }
}
