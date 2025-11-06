<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\App;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        // Get locale from request header, query parameter, or default
        $locale = $request->header('Accept-Language')
            ?? $request->query('lang')
            ?? $request->cookie('locale')
            ?? config('app.locale');

        // Extract just the language code if full locale is provided (e.g., 'vi-VN' -> 'vi')
        if (str_contains($locale, '-')) {
            $locale = explode('-', $locale)[0];
        }

        // Validate locale
        $supportedLocales = ['vi', 'en'];
        if (!in_array($locale, $supportedLocales)) {
            $locale = config('app.fallback_locale');
        }

        // Set the application locale
        App::setLocale($locale);

        // Add locale to response headers
        $response = $next($request);
        
        if (method_exists($response, 'header')) {
            $response->header('Content-Language', $locale);
        }

        return $response;
    }
}
