<?php

namespace App\Http\Controllers\Game;

use App\Http\Controllers\Controller;
use App\Models\Game;
use App\Models\PlayerHand;
use App\Game\Enums\Position;
use App\Game\Cards\Card;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GameController extends Controller
{
    /**
     * Get the rotated game state for the authenticated user.
     */
    public function state(Request $request, string $gameId): JsonResponse
    {
        $game = Game::with(['rounds.tricks.cards', 'playerHands.user', 'bids', 'room'])->findOrFail($gameId);
        
        // Find requesting user's position
        $playerHand = $game->playerHands()->where('user_id', $request->user()->id)->first();
        
        if (!$playerHand) {
            return response()->json([
                'success' => false,
                'message' => 'You are not a player in this game.',
            ], 403);
        }

        $userPos = $playerHand->position;
        $state = $this->serializeGameState($game, $userPos);

        return response()->json([
            'success' => true,
            'data'    => $state,
        ]);
    }

    /**
     * Serialize and rotate the game state relative to $userPos.
     */
    private function serializeGameState(Game $game, string $userPos): array
    {
        $positions = ['SOUTH', 'WEST', 'NORTH', 'EAST'];
        
        // Helper to rotate a position string
        $rotate = function (?string $dbPos) use ($userPos, $positions) {
            if (!$dbPos) return null;
            $dbIdx = array_search($dbPos, $positions);
            $userIdx = array_search($userPos, $positions);
            $rotatedIdx = ($dbIdx - $userIdx + 4) % 4;
            return $positions[$rotatedIdx];
        };

        // Get player's hand
        $playerHand = $game->playerHands()->where('position', $userPos)->first();
        $cards = json_decode($playerHand->cards_json, true);
        $initialCards = json_decode($playerHand->initial_cards_json, true);

        // Bidding history mapping
        $biddingHistory = $game->bids()->orderBy('id')->get()->map(function ($bid) use ($rotate) {
            return [
                'playerId' => $rotate($bid->position),
                'value'    => (int) $bid->value,
                'isPass'   => (bool) $bid->is_pass,
            ];
        })->toArray();

        // Played cards in the current trick
        $playedCards = [
            'SOUTH' => null,
            'WEST'  => null,
            'NORTH' => null,
            'EAST'  => null,
        ];

        $currentRound = $game->currentRound;
        if ($currentRound) {
            $currentTrick = $currentRound->tricks()->orderBy('trick_number', 'desc')->first();
            if ($currentTrick) {
                foreach ($currentTrick->cards as $tc) {
                    $uiPos = $rotate($tc->position);
                    $card = Card::fromId($tc->suit . '_' . $tc->rank);
                    $playedCards[$uiPos] = $card->toArray();
                }
            }
        }

        // Visible hand: 4 cards during bidding/trump selection, full hand during play
        $visibleHand = $cards;
        if (in_array($game->phase, ['BIDDING', 'TRUMP_SELECT'])) {
            $visibleHand = array_slice($cards, 0, 4);
        }

        // Build the hands object, ensuring SOUTH maps to the user's initial/full hand so index 6 works
        $hands = [
            'SOUTH' => $initialCards,
            'WEST'  => [],
            'NORTH' => [],
            'EAST'  => [],
        ];

        // Tricks won count
        $tricksWon = [
            'RED'  => 0,
            'BLUE' => 0,
        ];
        if ($currentRound) {
            $tricks = $currentRound->tricks()->whereNotNull('winner_position')->get();
            foreach ($tricks as $t) {
                $winPos = Position::from($t->winner_position);
                // In rotated terms, is the winning team Red or Blue?
                // Red team is SOUTH and NORTH. Blue team is WEST and EAST.
                // We rotate the winner position to UI position, then check team.
                $uiWinPos = Position::from($rotate($t->winner_position));
                if ($uiWinPos->team()->value === 'RED') {
                    $tricksWon['RED']++;
                } else {
                    $tricksWon['BLUE']++;
                }
            }
        }

        // Round results
        $roundResult = null;
        if ($game->phase === 'ROUND_OVER' || ($currentRound && $currentRound->winner_team)) {
            // Get the last completed round
            $lastRound = $game->rounds()->whereNotNull('winner_team')->orderBy('round_number', 'desc')->first();
            if ($lastRound) {
                $roundResult = [
                    'winner'      => $lastRound->winner_team,
                    'scoreChange' => (int) $lastRound->score_change,
                    'reason'      => $lastRound->result_reason,
                ];
            }
        }

        // Calculate scores based on team rotation
        // If the user's team is Blue (WEST/EAST), we swap RED/BLUE labels for UI scores
        // because the UI expects "RED" to be the bottom-top team (which is always "our" team)
        $userPosEnum = Position::from($userPos);
        $userTeam = $userPosEnum->team()->value; // RED or BLUE

        $roundScores = [
            'redTeam'  => (int) ($currentRound ? $currentRound->red_points : 0),
            'blueTeam' => (int) ($currentRound ? $currentRound->blue_points : 0),
        ];

        $matchScores = [
            'redTeam'  => (int) $game->red_team_match_score,
            'blueTeam' => (int) $game->blue_team_match_score,
        ];

        if ($userTeam === 'BLUE') {
            // Swap scores for UI alignment (so the user's team is always "redTeam" in UI terms)
            $roundScores = [
                'redTeam'  => $roundScores['blueTeam'],
                'blueTeam' => $roundScores['redTeam'],
            ];
            $matchScores = [
                'redTeam'  => $matchScores['blueTeam'],
                'blueTeam' => $matchScores['redTeam'],
            ];
        }

        // Seventh card representation for indicator
        $seventhCard = null;
        if ($game->trump_mode === 'SEVENTH_CARD' && $game->trump_card_encrypted && $game->trump_bidder_position === $userPos) {
            $seventhCard = json_decode($game->trump_card_encrypted, true);
        }

        return [
            'roomId'                     => (string) $game->room_id,
            'roomCode'                   => $game->room->code,
            'dealerPosition'             => $rotate($game->dealer_position),
            'turnPosition'               => $rotate($game->turn_position),
            'biddingActive'              => $game->phase === 'BIDDING',
            'highestBid'                 => (int) $game->highest_bid,
            'highestBidder'              => $rotate($game->highest_bidder_position),
            'biddingHistory'             => $biddingHistory,
            'trumpSuit'                  => $game->trump_revealed ? $game->trump_suit : null,
            'isTrumpRevealed'            => (bool) $game->trump_revealed,
            'trumpBidder'                => $rotate($game->trump_bidder_position),
            'hand'                       => $visibleHand,
            'hands'                      => $hands,
            'playedCards'                => $playedCards,
            'tricksWon'                  => $tricksWon,
            'roundScores'                => $roundScores,
            'matchScores'                => $matchScores,
            'doubleStatus'               => $game->double_status,
            'doubleDeclarer'             => $rotate($game->double_declarer_position),
            'redoubleDeclarer'           => $rotate($game->redouble_declarer_position),
            'singleHandActive'           => (bool) $game->single_hand_active,
            'singleHandDeclarer'         => $rotate($game->single_hand_declarer_position),
            'pairDeclared'               => $game->pair_declared_position ? [
                'position' => $rotate($game->pair_declared_position),
                'suit'     => $game->pair_declared_suit,
            ] : null,
            'roundResult'                => $roundResult,
            'isPairDeclarationAvailable' => (bool) ($game->trump_revealed && !$game->pair_declared_position),
            'isJokerTrump'               => $game->trump_mode === 'JOKER',
            'seventhCard'                => $seventhCard,
            'phase'                      => $game->phase,
        ];
    }
}
