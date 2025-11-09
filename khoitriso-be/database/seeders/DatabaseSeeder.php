<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->call([
            SystemSettingsSeeder::class,
            CategoriesSeeder::class,
            UsersAndCouponsSeeder::class,
            CoursesSeeder::class,
            BooksSeeder::class,
            BookActivationCodesSeeder::class, // Create activation codes for books
            BookContentSeeder::class, // Create chapters, questions, options, and solutions for books
            CompleteCourseContentSeeder::class, // Add lessons, materials, assignments
            TestEnrollmentSeeder::class, // Enroll student in courses
            StaticPagesSeeder::class, // Create static pages with SEO
        ]);
    }
}
