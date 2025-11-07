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
            CompleteCourseContentSeeder::class, // Add lessons, materials, assignments
            TestEnrollmentSeeder::class, // Enroll student in courses
        ]);
    }
}
