<?php

namespace App\Http\Controllers;

use App\Models\OauthAccount;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class OauthController extends Controller
{
    public function providers(Request $request)
    {
        $accounts = OauthAccount::where('user_id', $request->user()->id)->pluck('provider');
        return response()->json(['providers' => $accounts]);
    }

    public function link(Request $request)
    {
        $data = $request->validate([
            'oauthProvider' => ['required','string','in:google,facebook'],
            'oauthToken' => ['required','string'],
        ]);
        // Simplified: trust token, in real-world verify via provider API
        OauthAccount::firstOrCreate([
            'provider' => $data['oauthProvider'],
            'provider_id' => sha1($data['oauthToken']),
        ], [
            'user_id' => $request->user()->id,
        ]);
        return response()->json(['success' => true]);
    }

    public function unlink(Request $request)
    {
        $data = $request->validate([
            'oauthProvider' => ['required','string','in:google,facebook'],
        ]);
        OauthAccount::where('user_id', $request->user()->id)->where('provider', $data['oauthProvider'])->delete();
        return response()->json(['success' => true]);
    }

    public function studentCompleteProfile(Request $request)
    {
        $data = $request->validate([
            'phone' => ['nullable','string','max:20'],
            'dateOfBirth' => ['nullable','date'],
            'gender' => ['nullable','integer','in:0,1,2'],
            'address' => ['nullable','string'],
            'interestedTopics' => ['nullable','array'],
        ]);
        return response()->json(['success' => true]);
    }

    public function studentCheckProfile()
    {
        return response()->json(['completed' => true]);
    }

    public function studentGoogle()
    {
        return response()->json(['url' => '/oauth/google']);
    }

    public function studentGoogleCallback(Request $request)
    {
        $code = $request->query('code');
        $providerId = sha1($code ?: uniqid());
        $user = User::firstOrCreate(['email' => $providerId.'@google.local'], [
            'name' => 'Google User',
            'password' => Hash::make(str()->random(10)),
        ]);
        OauthAccount::firstOrCreate(['provider' => 'google', 'provider_id' => $providerId], ['user_id' => $user->id]);
        $token = $user->createToken('auth')->plainTextToken;
        return response()->json(['success' => true, 'token' => $token]);
    }

    public function studentFacebook()
    {
        return response()->json(['url' => '/oauth/facebook']);
    }

    public function studentFacebookCallback(Request $request)
    {
        $code = $request->query('code');
        $providerId = sha1($code ?: uniqid());
        $user = User::firstOrCreate(['email' => $providerId.'@facebook.local'], [
            'name' => 'Facebook User',
            'password' => Hash::make(str()->random(10)),
        ]);
        OauthAccount::firstOrCreate(['provider' => 'facebook', 'provider_id' => $providerId], ['user_id' => $user->id]);
        $token = $user->createToken('auth')->plainTextToken;
        return response()->json(['success' => true, 'token' => $token]);
    }

    public function sessions(Request $request)
    {
        $tokens = $request->user()->tokens()->get(['id','name','last_used_at','created_at']);
        return response()->json(['sessions' => $tokens]);
    }

    public function terminateSession(Request $request, int $sessionId)
    {
        $request->user()->tokens()->where('id', $sessionId)->delete();
        return response()->json(['success' => true]);
    }

    public function terminateAll(Request $request)
    {
        $request->user()->tokens()->where('id', '!=', optional($request->user()->currentAccessToken())->id)->delete();
        return response()->json(['success' => true]);
    }
}


