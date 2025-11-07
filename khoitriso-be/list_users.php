<?php

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\User;

echo "Database Connection: " . config('database.default') . "\n";
echo "Database Name: " . DB::connection()->getDatabaseName() . "\n\n";

echo "All Users in Database:\n";
echo str_repeat("=", 80) . "\n";

$users = User::orderBy('id')->get(['id', 'name', 'email', 'role', 'avatar', 'is_active', 'created_at']);

foreach ($users as $user) {
    echo sprintf(
        "ID: %-5d | Email: %-35s | Name: %-20s | Role: %-10s | Avatar: %s\n",
        $user->id,
        substr($user->email, 0, 35),
        substr($user->name ?? 'N/A', 0, 20),
        $user->role ?? 'N/A',
        $user->avatar ? 'YES' : 'NO'
    );
}

echo str_repeat("=", 80) . "\n";
echo "Total users: " . $users->count() . "\n";

// Check for Google user specifically
$googleUser = User::where('email', 'ngocnghia1999nn@gmail.com')->first();
if ($googleUser) {
    echo "\n✓ Google user found:\n";
    echo "  ID: {$googleUser->id}\n";
    echo "  Name: {$googleUser->name}\n";
    echo "  Email: {$googleUser->email}\n";
    echo "  Avatar: " . ($googleUser->avatar ?: 'NULL') . "\n";
    echo "  Role: {$googleUser->role}\n";
    echo "  Created: {$googleUser->created_at}\n";
} else {
    echo "\n✗ Google user NOT found!\n";
}

