<?php

namespace App\Http\Controllers\Room;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomChatController extends Controller
{
    public function send(Request $request, string $code): JsonResponse
    {
        return response()->json(['success' => false, 'message' => 'Phase 2: Chat not yet implemented.'], 501);
    }
}
