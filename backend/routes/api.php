<?php

use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Room\RoomController;
use App\Http\Controllers\Room\RoomChatController;
use App\Http\Controllers\Game\GameController;
use App\Http\Controllers\Game\BidController;
use App\Http\Controllers\Game\TrumpController;
use App\Http\Controllers\Game\CardController;
use App\Http\Controllers\Game\DeclarationController;
use App\Http\Controllers\User\ProfileController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes — 29 Royal Club Backend
|--------------------------------------------------------------------------
*/

Route::prefix('v1')->group(function () {

    // ── Authentication (public) ────────────────────────────────────────────
    Route::prefix('auth')->group(function () {
        Route::post('register', [AuthController::class, 'register'])
            ->middleware('throttle:10,1');         // 10 attempts per minute

        Route::post('login', [AuthController::class, 'login'])
            ->middleware('throttle:10,1');

        // Protected auth routes
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('logout',          [AuthController::class, 'logout']);
            Route::get('me',               [AuthController::class, 'me']);
            Route::put('avatar',           [AuthController::class, 'updateAvatar']);
            Route::put('password',         [AuthController::class, 'updatePassword']);
        });
    });

    // ── User profiles ──────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('users')->group(function () {
        Route::get('/',               [ProfileController::class, 'index']);
        Route::get('{id}/profile',    [ProfileController::class, 'show']);
        Route::get('{id}/statistics', [ProfileController::class, 'statistics']);
        Route::get('{id}/history',    [ProfileController::class, 'history']);
    });

    // ── Rooms ──────────────────────────────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('rooms')->group(function () {
        Route::post('/',              [RoomController::class, 'create']);
        Route::get('{code}',          [RoomController::class, 'show']);
        Route::post('{code}/join',    [RoomController::class, 'join']);
        Route::post('{code}/leave',   [RoomController::class, 'leave']);
        Route::post('{code}/ready',   [RoomController::class, 'toggleReady']);
        Route::post('{code}/chat',    [RoomChatController::class, 'send']);
        Route::post('{code}/start',   [RoomController::class, 'startGame']);
    });

    // ── Game actions (all require auth) ────────────────────────────────────
    Route::middleware('auth:sanctum')->prefix('games/{gameId}')->group(function () {
        Route::get('state',              [GameController::class,       'state']);
        Route::post('bids',              [BidController::class,        'place']);
        Route::post('trump',             [TrumpController::class,      'select']);
        Route::post('trump/reveal',      [TrumpController::class,      'reveal']);
        Route::post('single-hand',       [DeclarationController::class, 'singleHand']);
        Route::post('cards',             [CardController::class,       'play']);
        Route::post('pair',              [DeclarationController::class, 'pair']);
        Route::post('double',            [DeclarationController::class, 'double']);
        Route::post('redouble',          [DeclarationController::class, 'redouble']);
    });

});
