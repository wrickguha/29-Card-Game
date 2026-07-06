<?php

namespace App\Http\Controllers\User;

use App\Http\Controllers\Controller;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProfileController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $currentUserId = $request->user()->id;
        $users = User::with('statistic')
            ->where('id', '!=', $currentUserId)
            ->limit(50)
            ->get();

        return response()->json([
            'success' => true,
            'data'    => UserResource::collection($users),
        ]);
    }

    public function show(string $id): JsonResponse
    {
        $user = User::with('statistic')->findOrFail($id);
        return response()->json([
            'success' => true,
            'data'    => new UserResource($user),
        ]);
    }

    public function statistics(string $id): JsonResponse
    {
        $user = User::with('statistic')->findOrFail($id);
        $stat = $user->statistic;

        return response()->json([
            'success' => true,
            'data'    => [
                'gamesPlayed'      => $stat?->games_played ?? 0,
                'gamesWon'         => $stat?->games_won ?? 0,
                'winRate'          => $stat?->winRate() ?? 0.0,
                'totalBidsWon'     => $stat?->total_bids_won ?? 0,
                'totalBidsLost'    => $stat?->total_bids_lost ?? 0,
                'totalTricksWon'   => $stat?->total_tricks_won ?? 0,
                'highestBidWon'    => $stat?->highest_bid_won ?? 0,
                'pairDeclarations' => $stat?->pair_declarations ?? 0,
                'doubleWins'       => $stat?->double_wins ?? 0,
                'singleHandWins'   => $stat?->single_hand_wins ?? 0,
                'xp'               => $stat?->xp ?? 0,
                'level'            => $stat?->level ?? 1,
                'rank'             => $stat?->rank ?? 'BRONZE',
            ],
        ]);
    }

    public function history(string $id): JsonResponse
    {
        // Full match history — Phase 8 implementation
        return response()->json([
            'success' => true,
            'data'    => [],
            'message' => 'Match history available after Phase 8.',
        ]);
    }
}
