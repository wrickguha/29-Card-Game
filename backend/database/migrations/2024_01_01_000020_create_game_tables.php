<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('games', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->unique()->constrained()->onDelete('cascade');

            // Dealing & turn state
            $table->enum('dealer_position', ['SOUTH', 'WEST', 'NORTH', 'EAST']);
            $table->enum('turn_position',   ['SOUTH', 'WEST', 'NORTH', 'EAST']);
            $table->enum('phase', [
                'BIDDING', 'TRUMP_SELECT', 'SINGLE_HAND_PROMPT', 'PLAYING', 'ROUND_OVER', 'MATCH_OVER'
            ])->default('BIDDING');

            // Bidding
            $table->unsignedTinyInteger('highest_bid')->default(0);
            $table->enum('highest_bidder_position', ['SOUTH', 'WEST', 'NORTH', 'EAST'])->nullable();

            // Trump
            $table->enum('trump_suit', ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'])->nullable();
            $table->enum('trump_bidder_position', ['SOUTH', 'WEST', 'NORTH', 'EAST'])->nullable();
            $table->boolean('trump_revealed')->default(false);
            $table->text('trump_card_encrypted')->nullable();          // AES-256 encrypted Card JSON
            $table->enum('trump_mode', ['SEVENTH_CARD', 'JOKER'])->default('SEVENTH_CARD');

            // Double / Redouble
            $table->enum('double_status', ['NONE', 'DOUBLE', 'REDOUBLE'])->default('NONE');
            $table->enum('double_declarer_position',   ['SOUTH', 'WEST', 'NORTH', 'EAST'])->nullable();
            $table->enum('redouble_declarer_position', ['SOUTH', 'WEST', 'NORTH', 'EAST'])->nullable();

            // Single Hand
            $table->boolean('single_hand_active')->default(false);
            $table->enum('single_hand_declarer_position', ['SOUTH', 'WEST', 'NORTH', 'EAST'])->nullable();

            // Pair
            $table->enum('pair_declared_position', ['SOUTH', 'WEST', 'NORTH', 'EAST'])->nullable();
            $table->enum('pair_declared_suit',     ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES'])->nullable();

            // Match scores (game points, out of 6)
            $table->unsignedTinyInteger('red_team_match_score')->default(0);
            $table->unsignedTinyInteger('blue_team_match_score')->default(0);

            $table->timestamps();

            $table->index('phase');
        });

        Schema::create('rounds', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('round_number');
            $table->enum('dealer_position', ['SOUTH', 'WEST', 'NORTH', 'EAST']);
            $table->enum('winner_team', ['RED', 'BLUE'])->nullable();
            $table->unsignedTinyInteger('red_points')->default(0);
            $table->unsignedTinyInteger('blue_points')->default(0);
            $table->unsignedTinyInteger('bid_value')->default(0);
            $table->enum('bidder_position', ['SOUTH', 'WEST', 'NORTH', 'EAST'])->nullable();
            $table->unsignedTinyInteger('score_change')->default(0);
            $table->enum('result_reason', [
                'COMPLETED', 'SINGLE_HAND', 'DOUBLE', 'REDOUBLE',
                'SET', 'DOUBLE_SET', 'REDOUBLE_SET'
            ])->nullable();
            $table->timestamps();

            $table->unique(['game_id', 'round_number']);
            $table->index('game_id');
        });

        Schema::create('tricks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('round_id')->constrained()->onDelete('cascade');
            $table->unsignedTinyInteger('trick_number');
            $table->enum('lead_position',   ['SOUTH', 'WEST', 'NORTH', 'EAST']);
            $table->enum('winner_position', ['SOUTH', 'WEST', 'NORTH', 'EAST'])->nullable();
            $table->unsignedTinyInteger('points')->default(0);
            $table->timestamps();

            $table->unique(['round_id', 'trick_number']);
        });

        Schema::create('trick_cards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('trick_id')->constrained()->onDelete('cascade');
            $table->enum('position', ['SOUTH', 'WEST', 'NORTH', 'EAST']);
            $table->enum('suit', ['HEARTS', 'DIAMONDS', 'CLUBS', 'SPADES']);
            $table->enum('rank', ['J', '9', 'A', '10', 'K', 'Q', '8', '7']);
            $table->timestamps();

            $table->unique(['trick_id', 'position']);
        });

        Schema::create('player_hands', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('position', ['SOUTH', 'WEST', 'NORTH', 'EAST']);
            $table->json('cards_json');          // Current remaining cards
            $table->json('initial_cards_json');  // All 8 dealt cards (for history)
            $table->timestamps();

            $table->unique(['game_id', 'user_id']);
            $table->unique(['game_id', 'position']);
            $table->index('game_id');
        });

        Schema::create('bids', function (Blueprint $table) {
            $table->id();
            $table->foreignId('game_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('position', ['SOUTH', 'WEST', 'NORTH', 'EAST']);
            $table->unsignedTinyInteger('value')->default(0);
            $table->boolean('is_pass')->default(false);
            $table->timestamps();

            $table->index('game_id');
        });

        Schema::create('personal_access_tokens', function (Blueprint $table) {
            $table->id();
            $table->morphs('tokenable');
            $table->string('name');
            $table->string('token', 64)->unique();
            $table->text('abilities')->nullable();
            $table->timestamp('last_used_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('personal_access_tokens');
        Schema::dropIfExists('bids');
        Schema::dropIfExists('player_hands');
        Schema::dropIfExists('trick_cards');
        Schema::dropIfExists('tricks');
        Schema::dropIfExists('rounds');
        Schema::dropIfExists('games');
    }
};
