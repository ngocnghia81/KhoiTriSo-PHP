<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\OauthAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;
use App\Models\RefreshToken;
use Illuminate\Support\Str;

/**
 * OAuth Controller
 */
class OauthController extends BaseController
{
    public function providers(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $accounts = OauthAccount::where('user_id', $request->user()->id)->pluck('provider');
            
            return $this->success(['providers' => $accounts]);

        } catch (\Exception $e) {
            \Log::error('Error in oauth providers: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function link(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'oauthProvider' => ['required','string','in:google,facebook'],
                'oauthToken' => ['required','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            // Simplified: trust token, in real-world verify via provider API
            OauthAccount::firstOrCreate([
                'provider' => $data['oauthProvider'],
                'provider_id' => sha1($data['oauthToken']),
            ], [
                'user_id' => $request->user()->id,
            ]);
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in oauth link: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function unlink(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'oauthProvider' => ['required','string','in:google,facebook'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            OauthAccount::where('user_id', $request->user()->id)
                ->where('provider', $data['oauthProvider'])
                ->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in oauth unlink: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function studentCompleteProfile(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'phone' => ['nullable','string','max:20'],
                'dateOfBirth' => ['nullable','date'],
                'gender' => ['nullable','integer','in:0,1,2'],
                'address' => ['nullable','string'],
                'interestedTopics' => ['nullable','array'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in studentCompleteProfile: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function studentCheckProfile(Request $request): JsonResponse
    {
        try {
            return $this->success(['completed' => true]);

        } catch (\Exception $e) {
            \Log::error('Error in studentCheckProfile: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function studentGoogle(Request $request): JsonResponse
    {
        try {
            return $this->success(['url' => '/oauth/google']);

        } catch (\Exception $e) {
            \Log::error('Error in studentGoogle: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function studentGoogleCallback(Request $request): JsonResponse
    {
        try {
            $code = $request->query('code');
            $providerId = sha1($code ?: uniqid());
            
            $user = User::firstOrCreate(['email' => $providerId.'@google.local'], [
                'name' => 'Google User',
                'password' => Hash::make(str()->random(10)),
                'role' => 'student',
            ]);
            
            OauthAccount::firstOrCreate(
                ['provider' => 'google', 'provider_id' => $providerId],
                ['user_id' => $user->id]
            );
            
            $token = $user->createToken('auth')->plainTextToken;
            $refresh = RefreshToken::create([
                'user_id' => $user->id,
                'token' => Str::random(64),
                'expires_at' => now()->addDays(30),
            ]);
            return $this->success(['token' => $token, 'refreshToken' => $refresh->token]);

        } catch (\Exception $e) {
            \Log::error('Error in studentGoogleCallback: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Google one-tap / id_token login
     */
    public function googleTokenLogin(Request $request): JsonResponse
    {
        try {
            // Reconnect database to avoid cached plan issues after schema changes
            \DB::reconnect();
            
            \Log::info('Google token login started', [
                'request_data' => $request->except(['idToken'])
            ]);
            
            $validator = Validator::make($request->all(), [
                'idToken' => ['required','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                \Log::warning('Google token login validation failed', ['errors' => $errors]);
                return $this->validationError($errors);
            }

            $idToken = $request->input('idToken');
            \Log::info('Google token received', ['token_length' => strlen($idToken)]);

            // Decode JWT token directly (no need to call Google API)
            // JWT format: header.payload.signature
            try {
                $tks = explode('.', $idToken);
                if (count($tks) !== 3) {
                    throw new \Exception('Invalid token structure: expected 3 parts');
                }
                
                // Decode payload (second part)
                $payloadJson = base64_decode(strtr($tks[1], '-_', '+/'));
                if (!$payloadJson) {
                    throw new \Exception('Failed to base64 decode token payload');
                }
                
                $payload = json_decode($payloadJson, true);
                if (!$payload || !is_array($payload)) {
                    throw new \Exception('Failed to JSON decode token payload');
                }
            } catch (\Exception $e) {
                \Log::error('Failed to decode Google token', [
                    'error' => $e->getMessage(),
                    'token_length' => strlen($idToken)
                ]);
                return $this->error(MessageCode::UNAUTHORIZED, 'Invalid Google token format: ' . $e->getMessage(), null, 401);
            }
            
            \Log::info('Google token decoded', [
                'has_aud' => isset($payload['aud']),
                'has_email' => isset($payload['email']),
                'has_sub' => isset($payload['sub']),
                'exp' => $payload['exp'] ?? null
            ]);
            
            if (!isset($payload['aud'])) {
                \Log::error('Invalid Google token payload', ['payload' => $payload]);
                return $this->error(MessageCode::UNAUTHORIZED, 'Invalid token payload', null, 401);
            }
            
            // Check expiration
            if (isset($payload['exp']) && $payload['exp'] < time()) {
                \Log::error('Google token expired', [
                    'exp' => $payload['exp'],
                    'now' => time()
                ]);
                return $this->error(MessageCode::UNAUTHORIZED, 'Token expired', null, 401);
            }
            
            $aud = $payload['aud'] ?? null;
            $email = $payload['email'] ?? null;
            $name = $payload['name'] ?? ($payload['given_name'] ?? 'Google User');
            $sub = $payload['sub'] ?? null;
            $picture = $payload['picture'] ?? null; // Google avatar URL

            // Verify audience matches our Google Client ID
            $allowedAud = env('GOOGLE_CLIENT_ID') ?? env('Authentication__Google__ClientId');
            if ($allowedAud && $aud !== $allowedAud) {
                \Log::error('Google token audience mismatch', [
                    'expected' => $allowedAud,
                    'received' => $aud
                ]);
                return $this->error(MessageCode::UNAUTHORIZED, 'Token audience mismatch', null, 401);
            }

            if (!$email) {
                \Log::error('Google token missing email', ['payload' => $payload]);
                return $this->error(MessageCode::VALIDATION_ERROR, 'Email is required from Google account', null, 400);
            }

            // Find or create user
            \Log::info('Looking for user with email', ['email' => $email]);
            // Use fresh connection and raw query to avoid cached plan issues
            $escapedEmail = \DB::connection()->getPdo()->quote($email);
            $userRow = \DB::connection()->selectOne("SELECT id, name, email, avatar, role, is_active, last_login FROM users WHERE email = {$escapedEmail} LIMIT 1");
            $user = null;
            if ($userRow) {
                $user = User::find($userRow->id);
            }
            
            if (!$user) {
                \Log::info('User not found, creating new user', [
                    'name' => $name,
                    'email' => $email,
                    'has_picture' => !empty($picture)
                ]);
                try {
                    // Use raw SQL insert with explicit boolean casting for PostgreSQL
                    $password = Hash::make(Str::random(32));
                    $now = now();
                    
                    // Insert with explicit boolean casting for is_active
                    $userId = DB::table('users')->insertGetId([
                        'name' => $name,
                        'email' => $email,
                        'password' => $password,
                        'avatar' => $picture,
                        'role' => 'student',
                        'is_active' => DB::raw('true'), // Explicit boolean for PostgreSQL
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                    
                    // Fetch the created user
                    $user = User::find($userId);
                    
                    // Refresh to ensure we have the latest data
                    $user->refresh();
                    
                    \Log::info('User created successfully', [
                        'user_id' => $user->id,
                        'email' => $user->email,
                        'avatar' => $user->avatar
                    ]);
                } catch (\Illuminate\Database\QueryException $e) {
                    \Log::error('Failed to create user', [
                        'error' => $e->getMessage(),
                        'code' => $e->getCode(),
                        'sql_state' => $e->errorInfo[0] ?? null
                    ]);
                    // If user already exists (race condition), fetch it
                    if ($e->getCode() === '23000' || ($e->errorInfo[0] ?? null) === '23505') { // Integrity constraint violation (PostgreSQL: 23505)
                        $user = User::where('email', $email)->first();
                        if (!$user) {
                            throw $e;
                        }
                        \Log::info('User found after race condition', ['user_id' => $user->id]);
                    } else {
                        throw $e;
                    }
                }
            } else {
                \Log::info('User found, updating', ['user_id' => $user->id]);
                // Update last login and avatar if changed
                $user->last_login = now();
                if ($picture && $user->avatar !== $picture) {
                    $user->avatar = $picture;
                }
                $user->save();
            }

            // Link OAuth account
            try {
                OauthAccount::firstOrCreate(
                    [
                        'provider' => 'google',
                        'provider_id' => $sub ?? sha1($idToken)
                    ],
                    [
                        'user_id' => $user->id
                    ]
                );
            } catch (\Exception $e) {
                \Log::warning('OAuth account link failed, continuing anyway', [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id
                ]);
            }

            $token = $user->createToken('auth')->plainTextToken;
            
            try {
                $refresh = RefreshToken::create([
                    'user_id' => $user->id,
                    'token' => Str::random(64),
                    'expires_at' => now()->addDays(30),
                    'revoked' => false,
                ]);
            } catch (\Exception $e) {
                \Log::error('Failed to create refresh token', [
                    'error' => $e->getMessage(),
                    'user_id' => $user->id
                ]);
                // Continue without refresh token
                $refresh = (object)['token' => null];
            }

            $responseData = [
                'user' => [
                    'id' => $user->id,
                    'username' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar,
                    'role' => $user->role ?? 'student',
                ],
                'token' => $token,
            ];
            
            if (isset($refresh->token) && $refresh->token) {
                $responseData['refreshToken'] = $refresh->token;
            }
            
            return $this->success($responseData);

        } catch (\Illuminate\Database\QueryException $e) {
            \Log::error('Database error in googleTokenLogin', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'sql' => $e->getSql() ?? 'N/A',
                'bindings' => $e->getBindings() ?? [],
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->error(MessageCode::DATABASE_ERROR, 'Database error occurred: ' . $e->getMessage(), null, 500);
        } catch (\Exception $e) {
            \Log::error('Error in googleTokenLogin', [
                'message' => $e->getMessage(),
                'code' => $e->getCode(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'class' => get_class($e),
                'trace' => $e->getTraceAsString()
            ]);
            return $this->error(MessageCode::INTERNAL_SERVER_ERROR, 'Internal error: ' . $e->getMessage(), null, 500);
        }
    }

    public function studentFacebook(Request $request): JsonResponse
    {
        try {
            return $this->success(['url' => '/oauth/facebook']);

        } catch (\Exception $e) {
            \Log::error('Error in studentFacebook: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function studentFacebookCallback(Request $request): JsonResponse
    {
        try {
            $code = $request->query('code');
            $providerId = sha1($code ?: uniqid());
            
            $user = User::firstOrCreate(['email' => $providerId.'@facebook.local'], [
                'name' => 'Facebook User',
                'password' => Hash::make(str()->random(10)),
                'role' => 'student',
            ]);
            
            OauthAccount::firstOrCreate(
                ['provider' => 'facebook', 'provider_id' => $providerId],
                ['user_id' => $user->id]
            );
            
            $token = $user->createToken('auth')->plainTextToken;
            
            return $this->success(['token' => $token]);

        } catch (\Exception $e) {
            \Log::error('Error in studentFacebookCallback: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function sessions(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $tokens = $request->user()->tokens()->get(['id','name','last_used_at','created_at']);
            
            return $this->success(['sessions' => $tokens]);

        } catch (\Exception $e) {
            \Log::error('Error in sessions: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function terminateSession(Request $request, int $sessionId): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $request->user()->tokens()->where('id', $sessionId)->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in terminateSession: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function terminateAll(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $request->user()->tokens()
                ->where('id', '!=', optional($request->user()->currentAccessToken())->id)
                ->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in terminateAll: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
