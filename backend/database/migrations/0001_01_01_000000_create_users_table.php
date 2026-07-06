<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Drop the default Laravel users table and recreate with game fields
        Schema::dropIfExists('users');

        Schema::create('users', function (Blueprint $table) {
            $table->id();
            $table->string('username', 30)->unique();
            $table->string('email')->unique();
            $table->timestamp('email_verified_at')->nullable();
            $table->string('password');
            $table->string('avatar', 50)->default('default_avatar');
            $table->rememberToken();
            $table->timestamps();

            $table->index('username');
            $table->index('email');
        });

        Schema::create('user_statistics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->unsignedInteger('games_played')->default(0);
            $table->unsignedInteger('games_won')->default(0);
            $table->unsignedInteger('total_bids_won')->default(0);
            $table->unsignedInteger('total_bids_lost')->default(0);
            $table->unsignedInteger('total_tricks_won')->default(0);
            $table->unsignedTinyInteger('highest_bid_won')->default(0);
            $table->unsignedInteger('pair_declarations')->default(0);
            $table->unsignedInteger('double_wins')->default(0);
            $table->unsignedInteger('single_hand_wins')->default(0);
            $table->unsignedInteger('xp')->default(0);
            $table->unsignedTinyInteger('level')->default(1);
            $table->enum('rank', ['BRONZE', 'SILVER', 'GOLD', 'PLATINUM', 'DIAMOND', 'CHAMPION'])
                  ->default('BRONZE');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('user_statistics');
        Schema::dropIfExists('users');
    }
};
