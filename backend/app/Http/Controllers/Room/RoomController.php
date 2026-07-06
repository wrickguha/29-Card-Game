<?php

namespace App\Http\Controllers\Room;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    public function create(Request $request): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 2: Room system not yet implemented.'], 501);
    }

    public function show(string $code): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 2: Room system not yet implemented.'], 501);
    }

    public function join(Request $request, string $code): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 2: Room system not yet implemented.'], 501);
    }

    public function leave(Request $request, string $code): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 2: Room system not yet implemented.'], 501);
    }

    public function toggleReady(Request $request, string $code): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 2: Room system not yet implemented.'], 501);
    }

    public function startGame(Request $request, string $code): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 2: Room system not yet implemented.'], 501);
    }
}
