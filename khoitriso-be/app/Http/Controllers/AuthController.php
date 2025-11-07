<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Validation\Rule;
use App\Models\RefreshToken;
use Illuminate\Support\Str;

/**
 * Auth Controller
 * Authentication, Registration, Password Reset
 */
class AuthController extends BaseController
{
    /**
     * Register new user
     */
    public function register(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => ['required', 'string', 'max:50', 'unique:users,username'],
                'email' => ['required', 'string', 'email', 'max:100', 'unique:users,email'],
                'password' => ['required', 'string', 'min:8'],
                'fullName' => ['nullable', 'string', 'max:100'],
                'phone' => ['nullable', 'string', 'max:20'],
                'dateOfBirth' => ['nullable', 'date'],
                'gender' => ['nullable', Rule::in([0,1,2])],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();

            $user = new User();
            $user->username = $data['username'];
            $user->name = $request->input('fullName') ?? $request->input('name') ?? $data['username'];
            $user->email = $data['email'];
            $user->password = Hash::make($data['password']);
            $user->role = 'student'; // Default role for new registrations
            $user->save();

            $token = $user->createToken('auth')->plainTextToken;
            $refresh = RefreshToken::create([
                'user_id' => $user->id,
                'token' => Str::random(64),
                'expires_at' => now()->addDays(30),
            ]);

            $responseData = [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->username ?? $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'student',
                ],
                'token' => $token,
                'refreshToken' => $refresh->token,
            ];

            return $this->success($responseData);

        } catch (\Exception $e) {
            \Log::error('Error in register: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Login user
     */
    public function login(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => ['required', 'email'],
                'password' => ['required', 'string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $credentials = $validator->validated();

            $user = User::where('email', $credentials['email'])->first();
            
            if (!$user || !Hash::check($credentials['password'], $user->password)) {
                return $this->error(
                    MessageCode::INVALID_CREDENTIALS,
                    null,
                    null,
                    401
                );
            }

            $user->last_login = now();
            $user->save();

            $token = $user->createToken('auth')->plainTextToken;
            $refresh = RefreshToken::create([
                'user_id' => $user->id,
                'token' => Str::random(64),
                'expires_at' => now()->addDays(30),
            ]);

            $responseData = [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'student',
                ],
                'token' => $token,
                'refreshToken' => $refresh->token,
            ];

            return $this->success($responseData);

        } catch (\Exception $e) {
            \Log::error('Error in login: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $request->user()->currentAccessToken()->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in logout: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Refresh token
     */
    public function refresh(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'refresh_token' => ['required','string']
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $rt = RefreshToken::where('token', $request->input('refresh_token'))
                ->where('revoked', false)
                ->first();

            if (!$rt || $rt->expires_at->isPast()) {
                return $this->error(MessageCode::UNAUTHORIZED, null, null, 401);
            }

            $user = User::find($rt->user_id);
            if (!$user) {
                return $this->error(MessageCode::UNAUTHORIZED, null, null, 401);
            }

            // rotate
            $rt->revoked = true;
            $rt->save();
            $newRt = RefreshToken::create([
                'user_id' => $user->id,
                'token' => Str::random(64),
                'expires_at' => now()->addDays(30),
            ]);

            $token = $user->createToken('auth')->plainTextToken;

            return $this->success([
                'token' => $token,
                'refreshToken' => $newRt->token,
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in refresh: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Forgot password
     */
    public function forgotPassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'email' => ['required', 'email'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            // TODO: Implement password reset email logic
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in forgotPassword: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Reset password
     */
    public function resetPassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'token' => ['required', 'string'],
                'password' => ['required', 'string', 'min:8', 'confirmed'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            // TODO: Implement password reset logic
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in resetPassword: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Verify email
     */
    public function verifyEmail(Request $request): JsonResponse
    {
        try {
            // TODO: Implement email verification logic
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in verifyEmail: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Resend verification email
     */
    public function resendVerification(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            // TODO: Implement resend verification email logic
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in resendVerification: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}


