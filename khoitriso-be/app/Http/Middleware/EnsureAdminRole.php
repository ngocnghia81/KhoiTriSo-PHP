<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Ensure user has admin role
 */
class EnsureAdminRole
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        
        if (!$user) {
            return response()->json([
                'success' => false,
                'messageCode' => 'UNAUTHORIZED',
                'message' => 'Unauthorized',
                'errorCode' => 'UNAUTHORIZED',
            ], 401);
        }
        
        if ($user->role !== 'admin') {
            return response()->json([
                'success' => false,
                'messageCode' => 'FORBIDDEN',
                'message' => 'Forbidden: Admin access required',
                'errorCode' => 'FORBIDDEN',
            ], 403);
        }
        
        return $next($request);
    }
}

