<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rooms', function (Blueprint $table) {
            $table->id();
            $table->string('code', 8)->unique();
            $table->foreignId('host_id')->constrained('users')->onDelete('cascade');
            $table->enum('status', [
                'LOBBY', 'BIDDING', 'TRUMP_SELECTION', 'SINGLE_HAND',
                'PLAYING', 'ROUND_OVER', 'MATCH_OVER'
            ])->default('LOBBY');
            $table->unsignedTinyInteger('max_players')->default(4);
            $table->boolean('is_private')->default(true);
            $table->enum('trump_mode', ['SEVENTH_CARD', 'JOKER'])->default('SEVENTH_CARD');
            $table->timestamps();
            $table->softDeletes();

            $table->index('code');
            $table->index('status');
        });

        Schema::create('room_players', function (Blueprint $table) {
            $table->id();
            $table->foreignId('room_id')->constrained()->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->enum('position', ['SOUTH', 'WEST', 'NORTH', 'EAST']);
            $table->boolean('is_ready')->default(false);
            $table->boolean('is_connected')->default(true);
            $table->timestamp('last_seen_at')->nullable();
            $table->timestamps();

            $table->unique(['room_id', 'user_id']);
            $table->unique(['room_id', 'position']);
            $table->index(['room_id', 'is_connected']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('room_players');
        Schema::dropIfExists('rooms');
    }
};
