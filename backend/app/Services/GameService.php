<?php

namespace App\Services;

use App\Models\Game;
use App\Models\Round;
use App\Models\Trick;
use App\Models\TrickCard;
use App\Models\PlayerHand;
use App\Models\Bid;
use App\Models\Room;
use App\Models\User;
use App\Game\Deck\Deck;
use App\Game\Cards\Card;
use App\Game\Cards\CardCollection;
use App\Game\Enums\Suit;
use App\Game\Enums\Rank;
use App\Game\Enums\Position;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class GameService
{
    /**
     * Start a new game for a room. Fills empty seats with Bot users.
     */
    public function startGame(Room $room): Game
    {
        $room->update(['status' => 'PLAYING']);

        // 1. Get or Create Bot users for empty positions
        $positions = ['SOUTH', 'WEST', 'NORTH', 'EAST'];
        $playersByPos = [];
        foreach ($room->players as $p) {
            $playersByPos[$p->position] = $p->user;
        }

        foreach ($positions as $pos) {
            if (!isset($playersByPos[$pos])) {
                // Create or find bot user
                $botUsername = ucfirst(strtolower($pos)) . 'Bot';
                $bot = User::firstOrCreate(
                    ['email' => 'bot.' . strtolower($pos) . '@royalclub.com'],
                    [
                        'username' => $botUsername,
                        'password' => Hash::make(Str::random(16)),
                        'avatar'   => 'royal_gold',
                    ]
                );
                
                // Add to room_players
                $room->players()->create([
                    'user_id'      => $bot->id,
                    'position'     => $pos,
                    'is_ready'     => true,
                    'is_connected' => true,
                    'last_seen_at' => now(),
                ]);

                $playersByPos[$pos] = $bot;
            }
        }

        // 2. Create the Game record
        $game = Game::create([
            'room_id'                     => $room->id,
            'dealer_position'             => 'EAST', // Host is SOUTH, so EAST deals and SOUTH bids/plays first
            'turn_position'               => 'SOUTH',
            'phase'                       => 'BIDDING',
            'highest_bid'                 => 0,
            'highest_bidder_position'     => null,
            'trump_suit'                  => null,
            'trump_revealed'              => false,
            'trump_mode'                  => $room->trump_mode,
            'double_status'               => 'NONE',
            'single_hand_active'          => false,
            'red_team_match_score'        => 0,
            'blue_team_match_score'       => 0,
        ]);

        // 3. Initialize hands and start the round
        $this->initializeRound($game, $playersByPos);

        // 4. Trigger bot bidding if it is a bot's turn
        $this->runBotTurnsIfActive($game);

        return $game->fresh(['rounds.tricks', 'playerHands.user', 'bids']);
    }

    /**
     * Set up a new round of card deals, bids, and tricks.
     */
    private function initializeRound(Game $game, array $playersByPos): void
    {
        // Delete old bids/player hands for this game
        $game->bids()->delete();
        $game->playerHands()->delete();

        // Create new round record
        $roundNumber = $game->rounds()->count() + 1;
        $round = $game->rounds()->create([
            'round_number'    => $roundNumber,
            'dealer_position' => $game->dealer_position,
            'red_points'      => 0,
            'blue_points'     => 0,
            'bid_value'       => 0,
            'score_change'    => 0,
        ]);

        // Generate and deal cards
        $deck = (new Deck())->shuffle();
        $handsDealt = $deck->dealFull();

        foreach ($playersByPos as $pos => $user) {
            $cards = $handsDealt[$pos];
            // Sort cards
            $cardCollection = new CardCollection($cards);
            $sortedCards = $cardCollection->sorted();

            PlayerHand::create([
                'game_id'            => $game->id,
                'user_id'            => $user->id,
                'position'           => $pos,
                'cards_json'         => json_encode($sortedCards->toArray()),
                'initial_cards_json' => json_encode($sortedCards->toArray()),
            ]);
        }

        // Set turn position to the player next to the dealer
        $dealerEnum = Position::from($game->dealer_position);
        $game->update([
            'phase'                      => 'BIDDING',
            'turn_position'              => $dealerEnum->next()->value,
            'highest_bid'                => 0,
            'highest_bidder_position'    => null,
            'trump_suit'                 => null,
            'trump_revealed'             => false,
            'trump_card_encrypted'       => null,
            'double_status'              => 'NONE',
            'double_declarer_position'   => null,
            'redouble_declarer_position' => null,
            'single_hand_active'         => false,
            'single_hand_declarer_position' => null,
            'pair_declared_position'     => null,
            'pair_declared_suit'         => null,
        ]);

        // Create the first trick
        $round->tricks()->create([
            'trick_number'    => 1,
            'lead_position'   => $dealerEnum->next()->value,
            'points'          => 0,
        ]);
    }

    /**
     * Make a bid (or pass).
     */
    public function placeBid(Game $game, User $user, int $value, bool $isPass): Game
    {
        $playerHand = $game->playerHands()->where('user_id', $user->id)->firstOrFail();
        
        if ($game->turn_position !== $playerHand->position) {
            throw new \Exception('Not your turn to bid.');
        }

        if ($game->phase !== 'BIDDING') {
            throw new \Exception('Bidding is not active.');
        }

        // Create bid
        $game->bids()->create([
            'user_id'  => $user->id,
            'position' => $playerHand->position,
            'value'    => $isPass ? 0 : $value,
            'is_pass'  => $isPass,
        ]);

        $currentBid = $game->highest_bid;
        if (!$isPass) {
            if ($value < 16 || $value > 28) {
                throw new \Exception('Bid must be between 16 and 28.');
            }
            if ($value <= $currentBid) {
                throw new \Exception('Must outbid the current highest bid.');
            }
            $game->update([
                'highest_bid'             => $value,
                'highest_bidder_position' => $playerHand->position,
            ]);
        }

        // Move to next turn
        $posEnum = Position::from($playerHand->position);
        $nextPos = $posEnum->next();
        $game->update(['turn_position' => $nextPos->value]);

        $this->checkBiddingFinished($game);

        if ($game->phase === 'BIDDING' || $game->phase === 'TRUMP_SELECT') {
            $this->runBotTurnsIfActive($game);
        }

        return $game->fresh(['rounds.tricks', 'playerHands.user', 'bids']);
    }

    /**
     * Check if bidding phase has ended.
     */
    private function checkBiddingFinished(Game $game): void
    {
        $bids = $game->bids()->orderBy('id')->get();
        if ($bids->count() < 4) {
            return; // Everyone must act at least once
        }

        // Bidding ends when there are 3 consecutive passes after a bid is established,
        // or if all 4 players pass.
        $lastThreeBids = $bids->take(-3);
        $consecutivePasses = $lastThreeBids->every(fn($b) => $b->is_pass);

        $allPassed = $bids->count() === 4 && $bids->every(fn($b) => $b->is_pass);

        if ($consecutivePasses || $allPassed) {
            // End bidding
            if ($allPassed || !$game->highest_bidder_position) {
                // Default bidder is SOUTH with 16 if all passed
                $game->update([
                    'highest_bid'             => 16,
                    'highest_bidder_position' => 'SOUTH',
                    'phase'                   => 'TRUMP_SELECT',
                    'turn_position'           => 'SOUTH',
                ]);
            } else {
                $game->update([
                    'phase'         => 'TRUMP_SELECT',
                    'turn_position' => $game->highest_bidder_position,
                ]);
            }

            // Update current round info
            $round = $game->currentRound;
            $round->update([
                'bid_value'       => $game->highest_bid,
                'bidder_position' => $game->highest_bidder_position,
            ]);
        }
    }

    /**
     * Select Trump suit.
     */
    public function selectTrump(Game $game, User $user, string $suitStr): Game
    {
        if ($game->phase !== 'TRUMP_SELECT') {
            throw new \Exception('Not the trump selection phase.');
        }

        $playerHand = $game->playerHands()->where('user_id', $user->id)->firstOrFail();
        if ($game->highest_bidder_position !== $playerHand->position) {
            throw new \Exception('Only the highest bidder can select trump.');
        }

        $suit = Suit::from($suitStr);
        $cards = json_decode($playerHand->cards_json, true);

        if ($game->trump_mode === 'SEVENTH_CARD') {
            // Under 7th card rules, the 7th card of the bidder's dealt hand is set as the trump suit
            // The 7th card has index 6 in the initial array of 8 dealt cards
            $initialCards = json_decode($playerHand->initial_cards_json, true);
            $seventhCardData = $initialCards[6];
            $seventhCard = Card::fromArray($seventhCardData);

            $trumpSuit = $seventhCard->suit;

            // Remove it from the player's active hand
            $cardsFiltered = array_values(array_filter($cards, fn($c) => $c['id'] !== $seventhCard->id));
            $playerHand->update([
                'cards_json' => json_encode($cardsFiltered),
            ]);

            $game->update([
                'trump_suit'                  => $trumpSuit->value,
                'trump_bidder_position'       => $playerHand->position,
                'trump_card_encrypted'        => json_encode($seventhCard->toArray()),
                'trump_revealed'              => false,
                'phase'                       => 'SINGLE_HAND_PROMPT',
                'turn_position'               => Position::from($game->dealer_position)->next()->value,
            ]);
        } else {
            // Joker mode or manual choice
            $game->update([
                'trump_suit'                  => $suit->value,
                'trump_bidder_position'       => $playerHand->position,
                'trump_card_encrypted'        => null,
                'trump_revealed'              => false,
                'phase'                       => 'SINGLE_HAND_PROMPT',
                'turn_position'               => Position::from($game->dealer_position)->next()->value,
            ]);
        }

        $this->runBotTurnsIfActive($game);

        return $game->fresh(['rounds.tricks', 'playerHands.user', 'bids']);
    }

    /**
     * Declare Single Hand.
     */
    public function declareSingleHand(Game $game, User $user, bool $playSingle): Game
    {
        if ($game->phase !== 'SINGLE_HAND_PROMPT') {
            throw new \Exception('Not single hand prompt phase.');
        }

        $playerHand = $game->playerHands()->where('user_id', $user->id)->firstOrFail();
        if ($playerHand->position !== 'SOUTH') {
            throw new \Exception('Only human player SOUTH can declare single hand choices.');
        }

        $game->update([
            'single_hand_active'            => $playSingle,
            'single_hand_declarer_position' => $playSingle ? 'SOUTH' : null,
            'phase'                         => 'PLAYING',
            'turn_position'                 => Position::from($game->dealer_position)->next()->value,
        ]);

        $this->runBotTurnsIfActive($game);

        return $game->fresh(['rounds.tricks', 'playerHands.user', 'bids']);
    }

    /**
     * Play a Card.
     */
    public function playCard(Game $game, User $user, string $cardId): Game
    {
        if ($game->phase !== 'PLAYING') {
            throw new \Exception('Game is not in playing phase.');
        }

        $playerHand = $game->playerHands()->where('user_id', $user->id)->firstOrFail();
        $pos = $playerHand->position;

        if ($game->turn_position !== $pos) {
            throw new \Exception('Not your turn to play.');
        }

        $handCards = json_decode($playerHand->cards_json, true);
        $cardData = null;
        foreach ($handCards as $c) {
            if ($c['id'] === $cardId) {
                $cardData = $c;
                break;
            }
        }

        if (!$cardData) {
            throw new \Exception('Card not in hand.');
        }

        $card = Card::fromArray($cardData);
        $currentTrick = $game->currentRound->tricks()->orderBy('trick_number', 'desc')->first();

        // Rules check (Follow suit rules)
        $leadCardRecord = $currentTrick->cards()->first();
        if ($leadCardRecord) {
            $leadSuit = Suit::from($leadCardRecord->suit);
            if ($card->suit !== $leadSuit) {
                // Player did not follow suit. Check if player has lead suit in hand
                $collection = CardCollection::fromArray($handCards);
                if ($collection->hasSuit($leadSuit)) {
                    throw new \Exception("You must follow suit. Lead suit is " . $leadSuit->value);
                }
            }
        }

        // Valid play!
        $currentTrick->cards()->create([
            'position' => $pos,
            'suit'     => $card->suit->value,
            'rank'     => $card->rank->value,
        ]);

        // Remove card from player hand
        $newHandCards = array_values(array_filter($handCards, fn($c) => $c['id'] !== $cardId));
        $playerHand->update([
            'cards_json' => json_encode($newHandCards),
        ]);

        // Move turn
        $posEnum = Position::from($pos);
        $nextPos = $posEnum->next();
        $game->update(['turn_position' => $nextPos->value]);

        $this->evaluateTrickIfNeeded($game);

        if ($game->phase === 'PLAYING') {
            $this->runBotTurnsIfActive($game);
        }

        return $game->fresh(['rounds.tricks', 'playerHands.user', 'bids']);
    }

    /**
     * Reveal Trump.
     */
    public function revealTrump(Game $game, User $user): Game
    {
        if ($game->phase !== 'PLAYING') {
            throw new \Exception('Trump can only be revealed during card play.');
        }

        if ($game->trump_revealed) {
            return $game; // Already revealed
        }

        // Reveal the trump suit
        $game->update(['trump_revealed' => true]);

        // If in 7th card mode, return the 7th card back to the bidder's hand
        if ($game->trump_mode === 'SEVENTH_CARD' && $game->trump_card_encrypted) {
            $seventhCard = Card::fromArray(json_decode($game->trump_card_encrypted, true));
            $bidderHand = $game->playerHands()->where('position', $game->trump_bidder_position)->first();
            if ($bidderHand) {
                $cards = json_decode($bidderHand->cards_json, true);
                $cards[] = $seventhCard->toArray();
                $cardCollection = new CardCollection(array_map(fn($c) => Card::fromArray($c), $cards));
                $bidderHand->update([
                    'cards_json' => json_encode($cardCollection->sorted()->toArray()),
                ]);
            }
            $game->update(['trump_card_encrypted' => null]);
        }

        $this->runBotTurnsIfActive($game);

        return $game->fresh(['rounds.tricks', 'playerHands.user', 'bids']);
    }

    /**
     * Declare Double or Redouble.
     */
    public function declareMultiplier(Game $game, User $user, string $multiplierType): Game
    {
        if ($game->phase !== 'PLAYING' && $game->phase !== 'BIDDING' && $game->phase !== 'TRUMP_SELECT') {
            throw new \Exception('Cannot declare double/redouble at this stage.');
        }

        $playerHand = $game->playerHands()->where('user_id', $user->id)->firstOrFail();
        $pos = $playerHand->position;

        if ($multiplierType === 'DOUBLE') {
            if ($game->double_status !== 'NONE') {
                throw new \Exception('Double already declared.');
            }
            $game->update([
                'double_status'            => 'DOUBLE',
                'double_declarer_position' => $pos,
            ]);
        } elseif ($multiplierType === 'REDOUBLE') {
            if ($game->double_status !== 'DOUBLE') {
                throw new \Exception('Must be doubled before you can redouble.');
            }
            // Redouble can only be declared by the opposite team of the doubler
            $doublerPos = Position::from($game->double_declarer_position);
            if ($doublerPos->team() === Position::from($pos)->team()) {
                throw new \Exception('Only the defending team of the double can redouble.');
            }
            $game->update([
                'double_status'              => 'REDOUBLE',
                'redouble_declarer_position' => $pos,
            ]);
        }

        return $game->fresh(['rounds.tricks', 'playerHands.user', 'bids']);
    }

    /**
     * Declare Pair (King + Queen of trump suit in hand).
     */
    public function declarePair(Game $game, User $user): Game
    {
        if (!$game->trump_revealed) {
            throw new \Exception('Trump must be revealed to declare a pair.');
        }

        $playerHand = $game->playerHands()->where('user_id', $user->id)->firstOrFail();
        $pos = $playerHand->position;

        if ($game->pair_declared_position) {
            throw new \Exception('Pair already declared for this round.');
        }

        // Validate player has King and Queen of trump suit
        $cards = json_decode($playerHand->cards_json, true);
        $trumpSuit = $game->trump_suit;

        $hasKing = false;
        $hasQueen = false;
        foreach ($cards as $c) {
            if ($c['suit'] === $trumpSuit) {
                if ($c['rank'] === 'K') $hasKing = true;
                if ($c['rank'] === 'Q') $hasQueen = true;
            }
        }

        if (!$hasKing || !$hasQueen) {
            throw new \Exception('You must have both King and Queen of Trump suit to declare a Pair.');
        }

        $game->update([
            'pair_declared_position' => $pos,
            'pair_declared_suit'     => $trumpSuit,
        ]);

        return $game->fresh(['rounds.tricks', 'playerHands.user', 'bids']);
    }

    /**
     * Check if current trick is finished and evaluate winner.
     */
    private function evaluateTrickIfNeeded(Game $game): void
    {
        $round = $game->currentRound;
        $currentTrick = $round->tricks()->orderBy('trick_number', 'desc')->first();

        if ($currentTrick->cards()->count() < 4) {
            return;
        }

        // Evaluate trick winner
        $cardsPlayed = $currentTrick->cards()->get();
        $leadCard = $cardsPlayed->first();
        $leadSuit = Suit::from($leadCard->suit);
        
        $winnerPosition = null;
        $highestValue = -1;
        $trumpPlayed = false;

        $trumpSuit = $game->trump_revealed && $game->trump_suit ? Suit::from($game->trump_suit) : null;

        foreach ($cardsPlayed as $tc) {
            $cardSuit = Suit::from($tc->suit);
            $cardRank = Rank::from($tc->rank);
            $val = $cardRank->value();

            if ($trumpSuit && $cardSuit === $trumpSuit) {
                if (!$trumpPlayed) {
                    $trumpPlayed = true;
                    $highestValue = $val;
                    $winnerPosition = $tc->position;
                } else if ($val > $highestValue) {
                    $highestValue = $val;
                    $winnerPosition = $tc->position;
                }
            } else if (!$trumpPlayed && $cardSuit === $leadSuit) {
                if ($val > $highestValue) {
                    $highestValue = $val;
                    $winnerPosition = $tc->position;
                }
            }
        }

        // Calculate points in trick
        $trickPoints = 0;
        foreach ($cardsPlayed as $tc) {
            $trickPoints += Rank::from($tc->rank)->points();
        }

        // If 8th (last) trick, +1 point bonus
        if ($currentTrick->trick_number === 8) {
            $trickPoints += 1;
        }

        // Update trick
        $currentTrick->update([
            'winner_position' => $winnerPosition,
            'points'          => $trickPoints,
        ]);

        // Update round points
        $winnerEnum = Position::from($winnerPosition);
        if ($winnerEnum->team() === \App\Game\Enums\Team::Red) {
            $round->increment('red_points', $trickPoints);
        } else {
            $round->increment('blue_points', $trickPoints);
        }

        // Check if round is over (8 tricks)
        if ($currentTrick->trick_number === 8) {
            $this->finalizeRound($game);
        } else {
            // Start next trick
            $round->tricks()->create([
                'trick_number'  => $currentTrick->trick_number + 1,
                'lead_position' => $winnerPosition,
                'points'        => 0,
            ]);
            $game->update([
                'turn_position' => $winnerPosition,
            ]);
        }
    }

    /**
     * Conclude the round, distribute score, rotate dealer, and restart/end game.
     */
    private function finalizeRound(Game $game): void
    {
        $round = $game->currentRound;
        $bidderTeam = Position::from($game->highest_bidder_position)->team();
        $targetBid = $game->highest_bid;
        
        $pointsWon = $bidderTeam === \App\Game\Enums\Team::Red ? $round->red_points : $round->blue_points;

        // Apply pair modifier if any
        $finalTarget = $targetBid;
        if ($game->pair_declared_position) {
            $pairTeam = Position::from($game->pair_declared_position)->team();
            if ($pairTeam === $bidderTeam) {
                // Bidder team declared pair: target reduces by 4 (standard rule)
                $finalTarget = max(16, $targetBid - 4);
            } else {
                // Defending team declared pair: target increases by 4
                $finalTarget = min(28, $targetBid + 4);
            }
        }

        $isBidMet = $pointsWon >= $finalTarget;
        $roundWinnerTeam = $isBidMet ? $bidderTeam : $bidderTeam->opposite();

        // Calculate match score delta
        $scoreChange = 1;
        if ($game->double_status === 'DOUBLE') $scoreChange = 2;
        if ($game->double_status === 'REDOUBLE') $scoreChange = 4;
        if ($game->single_hand_active) $scoreChange = 3; // custom single hand points

        if ($roundWinnerTeam === \App\Game\Enums\Team::Red) {
            $game->increment('red_team_match_score', $scoreChange);
        } else {
            $game->increment('blue_team_match_score', $scoreChange);
        }

        // Log result on round
        $round->update([
            'winner_team'   => $roundWinnerTeam->value,
            'score_change'  => $scoreChange,
            'result_reason' => $game->single_hand_active ? 'SINGLE_HAND' : (
                $game->double_status === 'REDOUBLE' ? 'REDOUBLE_SET' : (
                    $game->double_status === 'DOUBLE' ? 'DOUBLE_SET' : 'COMPLETED'
                )
            ),
        ]);

        // Check if match is over
        if ($game->red_team_match_score >= 6 || $game->blue_team_match_score >= 6) {
            $game->update([
                'phase' => 'MATCH_OVER',
            ]);

            // Update user stats
            $this->updateUserStats($game);
        } else {
            // Next round: rotate dealer clockwise
            $dealerEnum = Position::from($game->dealer_position);
            $nextDealer = $dealerEnum->next();
            $game->update([
                'dealer_position' => $nextDealer->value,
            ]);

            // Deal cards and start a new round
            $playersByPos = [];
            foreach ($game->playerHands as $ph) {
                $playersByPos[$ph->position] = $ph->user;
            }
            $this->initializeRound($game, $playersByPos);
        }
    }

    /**
     * Update users' statistics after a completed match.
     */
    private function updateUserStats(Game $game): void
    {
        $winnerTeam = $game->red_team_match_score >= 6 ? 'RED' : 'BLUE';

        foreach ($game->playerHands as $ph) {
            $user = $ph->user;
            $stat = $user->statistic;
            if (!$stat) continue;

            $pos = Position::from($ph->position);
            $isWinner = $pos->team()->value === $winnerTeam;

            $stat->increment('games_played');
            if ($isWinner) {
                $stat->increment('games_won');
                $stat->increment('xp', 100);
            } else {
                $stat->increment('xp', 20);
            }

            // Recalculate rank/level based on XP
            $newLevel = intval(floor($stat->xp / 500)) + 1;
            $ranks = ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'CHAMPION'];
            $rankIdx = min(intval(floor($newLevel / 5)), count($ranks) - 1);
            $newRank = $ranks[$rankIdx];

            $stat->update([
                'level' => $newLevel,
                'rank'  => $newRank,
            ]);
        }
    }

    /**
     * Check if it's currently a Bot's turn and simulate their move.
     * Repeats recursively until it's a human's turn.
     */
    public function runBotTurnsIfActive(Game $game): void
    {
        if ($game->phase === 'MATCH_OVER') {
            return;
        }

        $turnPos = $game->turn_position;
        $ph = $game->playerHands()->where('position', $turnPos)->first();
        if (!$ph) return;

        $user = $ph->user;
        $isBot = Str::endsWith(strtolower($user->username), 'bot');

        if (!$isBot) {
            return; // Human's turn, wait
        }

        if ($game->phase === 'BIDDING') {
            // Simple Bot Bidding logic
            $currentBid = $game->highest_bid;
            $chance = rand(1, 100);
            
            if ($currentBid < 20 && $chance > 45) {
                $nextBid = $currentBid === 0 ? 16 : $currentBid + 1;
                $this->placeBid($game, $user, $nextBid, false);
            } else {
                $this->placeBid($game, $user, 0, true);
            }
        } elseif ($game->phase === 'TRUMP_SELECT') {
            // Bot Selects random suit
            $suits = ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'];
            $randomSuit = $suits[array_rand($suits)];
            $this->selectTrump($game, $user, $randomSuit);
        } elseif ($game->phase === 'SINGLE_HAND_PROMPT') {
            // Bots never play single hand (just skip/pass)
            // But wait, only SOUTH has single-hand choice in our game for simplified user prompts
            // In case a bot somehow lands here, default to false.
            $game->update([
                'phase' => 'PLAYING',
                'turn_position' => Position::from($game->dealer_position)->next()->value,
            ]);
            $this->runBotTurnsIfActive($game);
        } elseif ($game->phase === 'PLAYING') {
            // Bot plays card
            $cards = json_decode($ph->cards_json, true);
            if (empty($cards)) return;

            $currentTrick = $game->currentRound->tricks()->orderBy('trick_number', 'desc')->first();
            $leadCardRecord = $currentTrick->cards()->first();
            
            $cardToPlayData = null;

            if ($leadCardRecord) {
                // Must follow suit if possible
                $leadSuit = Suit::from($leadCardRecord->suit);
                $matching = array_values(array_filter($cards, fn($c) => $c['suit'] === $leadSuit->value));
                if (!empty($matching)) {
                    // Play random matching card
                    $cardToPlayData = $matching[array_rand($matching)];
                } else {
                    // Cannot follow suit!
                    // If trump suit is set and not revealed, reveal it 30% of the time
                    if (!$game->trump_revealed && $game->trump_suit && rand(1, 100) < 30) {
                        $this->revealTrump($game, $user);
                        // Refresh hands
                        $ph->refresh();
                        $cards = json_decode($ph->cards_json, true);
                    }

                    // Play any card (highest trump if revealed and have it, else lowest rank card)
                    $trumpSuit = $game->trump_revealed ? $game->trump_suit : null;
                    if ($trumpSuit) {
                        $trumps = array_values(array_filter($cards, fn($c) => $c['suit'] === $trumpSuit));
                        if (!empty($trumps)) {
                            $cardToPlayData = $trumps[array_rand($trumps)];
                        }
                    }

                    if (!$cardToPlayData) {
                        $cardToPlayData = $cards[array_rand($cards)];
                    }
                }
            } else {
                // Bot is lead, play any card
                $cardToPlayData = $cards[array_rand($cards)];
            }

            if ($cardToPlayData) {
                $this->playCard($game, $user, $cardToPlayData['id']);
            }
        }
    }
}
