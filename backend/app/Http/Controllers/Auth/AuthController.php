<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\UpdatePasswordRequest;
use App\Http\Resources\UserResource;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuthController extends Controller
{
    public function __construct(private readonly AuthService $authService) {}

    /**
     * POST /api/v1/auth/register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register(
            $request->validated('username'),
            $request->validated('email'),
            $request->validated('password'),
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => new UserResource($result['user']),
                'token' => $result['token'],
            ],
            'message' => 'Registration successful.',
        ], 201);
    }

    /**
     * POST /api/v1/auth/login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $result = $this->authService->login(
            $request->validated('email'),
            $request->validated('password'),
        );

        return response()->json([
            'success' => true,
            'data'    => [
                'user'  => new UserResource($result['user']),
                'token' => $result['token'],
            ],
            'message' => 'Login successful.',
        ]);
    }

    /**
     * POST /api/v1/auth/logout
     */
    public function logout(Request $request): JsonResponse
    {
        $this->authService->logout($request->user());

        return response()->json([
            'success' => true,
            'message' => 'Logged out successfully.',
        ]);
    }

    /**
     * GET /api/v1/auth/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => new UserResource($request->user()->load('statistic')),
        ]);
    }

    /**
     * PUT /api/v1/auth/avatar
     */
    public function updateAvatar(Request $request): JsonResponse
    {
        $request->validate([
            'avatar' => ['required', 'string', 'max:50'],
        ]);

        $user = $this->authService->updateAvatar(
            $request->user(),
            $request->input('avatar'),
        );

        return response()->json([
            'success' => true,
            'data'    => new UserResource($user->load('statistic')),
            'message' => 'Avatar updated.',
        ]);
    }

    /**
     * PUT /api/v1/auth/password
     */
    public function updatePassword(UpdatePasswordRequest $request): JsonResponse
    {
        $this->authService->updatePassword(
            $request->user(),
            $request->validated('current_password'),
            $request->validated('password'),
        );

        return response()->json([
            'success' => true,
            'message' => 'Password updated. Please log in again.',
        ]);
    }
}
