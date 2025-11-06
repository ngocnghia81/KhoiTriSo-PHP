<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\MessageService;
use Symfony\Component\HttpFoundation\Response;

/**
 * Middleware để set locale dựa trên Accept-Language header
 */
class LocalizationMiddleware
{
    protected MessageService $messageService;

    /**
     * Constructor
     */
    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
    }

    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $acceptLanguage = $request->header('Accept-Language');
        $language = $this->messageService->parseAcceptLanguage($acceptLanguage);
        
        // Set app locale
        app()->setLocale($language);
        
        // Store language in request for later use
        $request->attributes->set('language', $language);
        
        return $next($request);
    }
}

