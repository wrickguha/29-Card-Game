<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web:       __DIR__.'/../routes/web.php',
        api:       __DIR__.'/../routes/api.php',
        channels:  __DIR__.'/../routes/channels.php',
        commands:  __DIR__.'/../routes/console.php',
        health:    '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Append Sanctum's stateful middleware for SPA auth
        $middleware->statefulApi();

        // Trust all proxies (useful if behind nginx/reverse proxy)
        $middleware->trustProxies(at: '*');

        // Add CORS headers to all API responses
        $middleware->api(prepend: [
            \Illuminate\Http\Middleware\HandleCors::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        // Render all exceptions as JSON for API requests
        $exceptions->render(function (\Throwable $e, Request $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return (new \App\Exceptions\Handler(app()))
                    ->render($request, $e);
            }
        });
    })->create();
