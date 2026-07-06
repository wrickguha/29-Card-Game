<?php

namespace App\Exceptions;

use Illuminate\Auth\AuthenticationException;
use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Illuminate\Validation\ValidationException;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Auth\Access\AuthorizationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;
use Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException;
use Symfony\Component\HttpKernel\Exception\TooManyRequestsHttpException;
use Throwable;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render all exceptions as consistent JSON for API requests.
     */
    public function render($request, Throwable $e)
    {
        // Always return JSON for API routes
        if ($request->is('api/*') || $request->expectsJson()) {
            return $this->renderApiException($e);
        }

        return parent::render($request, $e);
    }

    private function renderApiException(Throwable $e): \Illuminate\Http\JsonResponse
    {
        // Validation errors → 422
        if ($e instanceof ValidationException) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        }

        // Unauthenticated → 401
        if ($e instanceof AuthenticationException) {
            return response()->json([
                'success' => false,
                'message' => 'Unauthenticated. Please log in.',
            ], 401);
        }

        // Unauthorized → 403
        if ($e instanceof AuthorizationException) {
            return response()->json([
                'success' => false,
                'message' => 'You do not have permission to perform this action.',
            ], 403);
        }

        // Model not found → 404
        if ($e instanceof ModelNotFoundException || $e instanceof NotFoundHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'The requested resource was not found.',
            ], 404);
        }

        // Method not allowed → 405
        if ($e instanceof MethodNotAllowedHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'HTTP method not allowed.',
            ], 405);
        }

        // Rate limited → 429
        if ($e instanceof TooManyRequestsHttpException) {
            return response()->json([
                'success' => false,
                'message' => 'Too many requests. Please slow down.',
            ], 429);
        }

        // Game-specific exceptions (added in later phases)
        if ($e instanceof \App\Game\Exceptions\InvalidMoveException) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code'    => 'INVALID_MOVE',
            ], 422);
        }

        if ($e instanceof \App\Game\Exceptions\NotYourTurnException) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code'    => 'NOT_YOUR_TURN',
            ], 422);
        }

        if ($e instanceof \App\Game\Exceptions\InvalidBidException) {
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'code'    => 'INVALID_BID',
            ], 422);
        }

        // Generic server error → 500 (hide details in production)
        $message = config('app.debug')
            ? $e->getMessage()
            : 'An internal server error occurred.';

        return response()->json([
            'success' => false,
            'message' => $message,
        ], 500);
    }
}
