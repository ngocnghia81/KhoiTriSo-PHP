<?php
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;

echo "Total users in database: " . User::count() . "\n";
echo "User with email khanhsoai6@gmail.com: \n";

$user = User::where('email', 'khanhsoai6@gmail.com')->first();
if ($user) {
    echo "  - ID: " . $user->id . "\n";
    echo "  - Name: " . $user->name . "\n";  
    echo "  - Email: " . $user->email . "\n";
    echo "  - Role: " . $user->role . "\n";
    echo "  - Created: " . $user->created_at . "\n";
} else {
    echo "  - No user found with that email\n";
}

// Check latest 5 users
echo "\nLatest 5 users:\n";
$users = User::orderBy('id', 'desc')->limit(5)->get();
foreach ($users as $u) {
    echo "  - ID: {$u->id}, Email: {$u->email}, Name: {$u->name}\n";
}