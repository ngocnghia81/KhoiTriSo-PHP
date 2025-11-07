<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\CourseEnrollment;
use App\Models\User;
use App\Models\Course;

class TestEnrollmentSeeder extends Seeder
{
    public function run()
    {
        // Get student user
        $user = User::where('email', 'student@khoitriso.edu.vn')->first();
        
        if (!$user) {
            $this->command->error('Student user not found. Please run UsersAndCouponsSeeder first.');
            return;
        }
        
        // Enroll user in first 5 courses
        $courses = Course::where('is_active', true)->take(5)->get();
        
        if ($courses->isEmpty()) {
            $this->command->error('No courses found. Please create courses first.');
            return;
        }
        
        foreach ($courses as $course) {
            $enrollment = CourseEnrollment::firstOrCreate([
                'user_id' => $user->id,
                'course_id' => $course->id,
            ], [
                'enrolled_at' => now()->subDays(rand(1, 30)),
                'progress_percentage' => rand(0, 100),
                'is_active' => true,
            ]);
            
            $this->command->info("Enrolled user {$user->email} in course {$course->title} (Progress: {$enrollment->progress_percentage}%)");
        }
        
        $this->command->info("\nTotal enrollments: " . CourseEnrollment::where('user_id', $user->id)->count());
    }
}
