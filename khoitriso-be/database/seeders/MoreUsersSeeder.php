<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;

class MoreUsersSeeder extends Seeder
{
    public function run(): void
    {
        // Create 50 random users with password 'password'
        User::factory()->count(50)->create();
    }
}








