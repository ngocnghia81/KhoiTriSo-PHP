<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->api(prepend: [
            \App\Http\Middleware\Cors::class,
            \App\Http\Middleware\SetLocale::class,
        ]);
        
        // Enable CORS for frontend
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $messageService = app(\App\Services\MessageService::class);
                $language = $messageService->parseAcceptLanguage($request->header('Accept-Language'));
                $responseBuilder = new \App\Http\Responses\ResponseBuilder($language);

                // Handle validation exceptions
                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    $errors = [];
                    foreach ($e->errors() as $field => $messages) {
                        $errors[] = [
                            'field' => $field,
                            'messages' => $messages,
                        ];
                    }
                    return $responseBuilder->validationError(
                        $errors,
                        $messageService->getMessage(\App\Constants\MessageCode::VALIDATION_ERROR, $language)
                    );
                }

                // Handle authentication exceptions
                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    return $responseBuilder->unauthorized(
                        $messageService->getMessage(\App\Constants\MessageCode::UNAUTHORIZED, $language)
                    );
                }

                // Handle authorization exceptions
                if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    return $responseBuilder->forbidden(
                        $messageService->getMessage(\App\Constants\MessageCode::FORBIDDEN, $language)
                    );
                }

                // Handle model not found exceptions
                if ($e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    return $responseBuilder->notFound(
                        class_basename($e->getModel())
                    );
                }

                // Handle not found exceptions
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException) {
                    return $responseBuilder->error(
                        \App\Constants\MessageCode::NOT_FOUND,
                        $messageService->getMessage(\App\Constants\MessageCode::NOT_FOUND, $language),
                        null,
                        404
                    );
                }

                // Handle method not allowed exceptions
                if ($e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException) {
                    return $responseBuilder->error(
                        \App\Constants\MessageCode::FORBIDDEN,
                        'Method not allowed',
                        null,
                        405
                    );
                }

                // Handle throttle exceptions
                if ($e instanceof \Illuminate\Http\Exceptions\ThrottleRequestsException) {
                    return $responseBuilder->error(
                        \App\Constants\MessageCode::TOO_MANY_REQUESTS,
                        $messageService->getMessage(\App\Constants\MessageCode::TOO_MANY_REQUESTS, $language),
                        null,
                        429
                    );
                }

                // Handle database exceptions
                if ($e instanceof \Illuminate\Database\QueryException) {
                    \Log::error('Database error: ' . $e->getMessage());
                    return $responseBuilder->error(
                        \App\Constants\MessageCode::DATABASE_ERROR,
                        $messageService->getMessage(\App\Constants\MessageCode::DATABASE_ERROR, $language),
                        null,
                        500
                    );
                }

                // Handle all other exceptions
                \Log::error('Unexpected error: ' . $e->getMessage(), [
                    'exception' => get_class($e),
                    'file' => $e->getFile(),
                    'line' => $e->getLine(),
                    'trace' => $e->getTraceAsString(),
                ]);

                return $responseBuilder->internalError(
                    $messageService->getMessage(\App\Constants\MessageCode::INTERNAL_SERVER_ERROR, $language)
                );
            }
        });
    })->create();
