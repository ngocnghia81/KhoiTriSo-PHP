<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Book;

class BookActivationCodesSeeder extends Seeder
{
    public function run(): void
    {
        $now = now();
        
        // Get all active books
        $books = Book::whereRaw('is_active = true')->get();
        
        if ($books->isEmpty()) {
            $this->command->warn('No active books found. Please run BooksSeeder first.');
            return;
        }
        
        $this->command->info("Creating activation codes for {$books->count()} books...");
        
        foreach ($books as $book) {
            // Create 10 activation codes per book
            for ($i = 0; $i < 10; $i++) {
                $code = 'BOOK-' . strtoupper(substr(md5(uniqid() . $book->id . $i), 0, 8));
                
                try {
                    DB::table('book_activation_codes')->insert([
                        'book_id' => $book->id,
                        'activation_code' => $code,
                        'is_used' => DB::raw('false'),
                        'used_by_id' => null,
                        'created_at' => $now,
                        'updated_at' => $now,
                    ]);
                } catch (\Exception $e) {
                    $this->command->error("Failed to create activation code for book {$book->id}: " . $e->getMessage());
                }
            }
            
            $this->command->info("Created 10 activation codes for: {$book->title}");
        }
        
        $this->command->info('Activation codes created successfully!');
    }
}

