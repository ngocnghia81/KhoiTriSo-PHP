<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\OauthAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Http;
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
            $validator = Validator::make($request->all(), [
                'idToken' => ['required','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $idToken = $request->input('idToken');

            // Verify with Google tokeninfo endpoint
            $resp = Http::asForm()->get('https://oauth2.googleapis.com/tokeninfo', [ 'id_token' => $idToken ]);
            if (!$resp->ok()) {
                return $this->error(MessageCode::UNAUTHORIZED, null, null, 401);
            }
            $payload = $resp->json();
            $aud = $payload['aud'] ?? null;
            $email = $payload['email'] ?? null;
            $name = $payload['name'] ?? 'Google User';

            $allowedAud = env('GOOGLE_CLIENT_ID') ?? env('Authentication__Google__ClientId');
            if ($allowedAud && $aud !== $allowedAud) {
                return $this->error(MessageCode::UNAUTHORIZED, null, null, 401);
            }

            // Find or create user
            $user = null;
            if ($email) {
                $user = User::where('email', $email)->first();
            }
            if (!$user) {
                $user = User::create([
                    'name' => $name,
                    'email' => $email ?: (sha1($idToken).'@google.local'),
                    'password' => Hash::make(str()->random(10)),
                    'role' => 'student',
                ]);
            }

            OauthAccount::firstOrCreate(
                ['provider' => 'google', 'provider_id' => $payload['sub'] ?? sha1($idToken)],
                ['user_id' => $user->id]
            );

            $token = $user->createToken('auth')->plainTextToken;
            $refresh = RefreshToken::create([
                'user_id' => $user->id,
                'token' => Str::random(64),
                'expires_at' => now()->addDays(30),
            ]);

            return $this->success([
                'user' => [
                    'id' => $user->id,
                    'username' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ?? 'student',
                ],
                'token' => $token,
                'refreshToken' => $refresh->token,
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in googleTokenLogin: ' . $e->getMessage());
            return $this->internalError();
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
