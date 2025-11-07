<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;
use App\Models\OauthAccount;

$email = 'ngocnghia1999nn@gmail.com';

echo "Checking user with email: {$email}\n\n";

$user = User::where('email', $email)->first();

if ($user) {
    echo "✓ User found!\n";
    echo "  ID: {$user->id}\n";
    echo "  Name: {$user->name}\n";
    echo "  Email: {$user->email}\n";
    echo "  Avatar: " . ($user->avatar ?: 'NULL') . "\n";
    echo "  Role: {$user->role}\n";
    echo "  Created: {$user->created_at}\n";
    echo "  Last login: " . ($user->last_login ?: 'NULL') . "\n\n";
    
    $oauth = OauthAccount::where('user_id', $user->id)->where('provider', 'google')->first();
    if ($oauth) {
        echo "✓ OAuth account linked!\n";
        echo "  Provider: {$oauth->provider}\n";
        echo "  Provider ID: {$oauth->provider_id}\n";
    } else {
        echo "✗ OAuth account NOT linked\n";
    }
} else {
    echo "✗ User NOT found!\n";
}

echo "\nTotal users in database: " . User::count() . "\n";

