<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $data = $request->validate([
            'username' => ['required', 'string', 'max:50', 'unique:users,username'],
            'email' => ['required', 'string', 'email', 'max:100', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8'],
            'fullName' => ['nullable', 'string', 'max:100'],
            'phone' => ['nullable', 'string', 'max:20'],
            'dateOfBirth' => ['nullable', 'date'],
            'gender' => ['nullable', Rule::in([0,1,2])],
        ]);

        $user = new User();
        $user->name = $data['username'];
        $user->email = $data['email'];
        $user->password = Hash::make($data['password']);
        $user->save();

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'code' => 201,
            'message' => 'User registered successfully',
            'result' => [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->name,
                    'email' => $user->email,
                    'role' => 1,
                ],
                'token' => $token,
            ],
        ], 201);
    }

    public function login(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        $user = User::where('email', $credentials['email'])->first();
        if (! $user || ! Hash::check($credentials['password'], $user->password)) {
            return response()->json(['success' => false, 'message' => 'Invalid credentials'], 401);
        }

        $user->last_login = now();
        $user->save();

        $token = $user->createToken('auth')->plainTextToken;

        return response()->json([
            'success' => true,
            'user' => [
                'id' => $user->id,
                'username' => $user->name,
                'email' => $user->email,
                'role' => 1,
            ],
            'token' => $token,
            'refreshToken' => null,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->json(['success' => true, 'message' => 'Logged out successfully']);
    }

    public function refresh(Request $request)
    {
        return response()->json(['success' => true, 'token' => $request->user()?->createToken('auth')->plainTextToken, 'refreshToken' => null]);
    }

    public function forgotPassword()
    {
        return response()->json(['success' => true, 'message' => 'Reset link sent to email']);
    }

    public function resetPassword()
    {
        return response()->json(['success' => true, 'message' => 'Password reset successfully']);
    }

    public function verifyEmail()
    {
        return response()->json(['success' => true, 'message' => 'Email verified successfully']);
    }

    public function resendVerification()
    {
        return response()->json(['success' => true, 'message' => 'Verification email sent']);
    }
}


