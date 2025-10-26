<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use App\Models\ForumQuestion;
use App\Models\User;

class ForumSampleSeeder extends Seeder
{
    public function run(): void
    {
        // Skip if mongodb package not installed or connection not configured
        if (!class_exists(\Jenssegers\Mongodb\Eloquent\Model::class)) {
            return; // package missing -> skip seeding forum
        }
        $mongoConfig = config('database.connections.mongodb');
        if (empty($mongoConfig)) {
            return; // no mongodb connection configured
        }

        // Ensure at least one user exists
        $user = User::query()->first();
        if (!$user) {
            $user = User::factory()->create();
        }

        // Create sample forum questions in MongoDB
        try {
            for ($i = 1; $i <= 10; $i++) {
                $title = 'Câu hỏi mẫu #' . $i;
                $exists = ForumQuestion::where('title', $title)->exists();
                if ($exists) continue;
                ForumQuestion::create([
                    'title' => $title,
                    'content' => 'Nội dung câu hỏi mẫu ' . $i,
                    'author_id' => $user->id,
                    'author_name' => $user->name,
                    'category_slug' => 'general',
                    'category_name' => 'Chung',
                    'tags' => ['mau', 'demo'],
                    'views' => rand(0, 100),
                    'votes' => rand(0, 20),
                    'answers' => [],
                    'is_solved' => false,
                ]);
            }
        } catch (\Throwable $e) {
            // If Mongo extension/connection missing, silently skip
        }
    }
}


