<?php

namespace App\Services;

use App\Models\User;
use App\Models\UserStatistic;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthService
{
    /**
     * Register a new user and create their statistics row.
     */
    public function register(string $username, string $email, string $password, ?string $avatar = null): array
    {
        $user = User::create([
            'username' => $username,
            'email'    => $email,
            'password' => Hash::make($password),
            'avatar'   => $avatar ?? 'royal_gold',
        ]);

        // Bootstrap statistics record
        UserStatistic::create(['user_id' => $user->id]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user'  => $user->fresh('statistic'),
            'token' => $token,
        ];
    }

    /**
     * Authenticate a user by email & password.
     *
     * @throws ValidationException
     */
    public function login(string $email, string $password): array
    {
        $user = User::where('email', $email)->first();

        if (! $user || ! Hash::check($password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Revoke old tokens (single session per user)
        $user->tokens()->delete();

        $token = $user->createToken('auth_token')->plainTextToken;

        return [
            'user'  => $user->load('statistic'),
            'token' => $token,
        ];
    }

    /**
     * Revoke all tokens for the user (logout).
     */
    public function logout(User $user): void
    {
        $user->tokens()->delete();
    }

    /**
     * Update a user's avatar.
     */
    public function updateAvatar(User $user, string $avatar): User
    {
        $user->update(['avatar' => $avatar]);
        return $user->fresh();
    }

    /**
     * Update a user's password.
     *
     * @throws ValidationException
     */
    public function updatePassword(User $user, string $currentPassword, string $newPassword): void
    {
        if (! Hash::check($currentPassword, $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['Current password is incorrect.'],
            ]);
        }

        $user->update(['password' => Hash::make($newPassword)]);

        // Revoke all existing tokens to force re-login
        $user->tokens()->delete();
    }
}
