<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class UpdateCoursesApprovalStatusSeeder extends Seeder
{
    public function run(): void
    {
        echo "Updating courses approval status...\n";
        
        // Update all courses that are published to approved status
        $updated = DB::table('courses')
            ->whereRaw('is_published = true')
            ->update(['approval_status' => 1]);
        
        echo "Updated {$updated} courses to approved status\n";
        
        // Show current status
        $courses = DB::table('courses')
            ->select('id', 'title', 'is_published', 'approval_status')
            ->get();
        
        echo "\nCourse Status Summary:\n";
        $published = $courses->where('is_published', true)->count();
        $approved = $courses->where('approval_status', 1)->count();
        $pending = $courses->where('approval_status', 0)->count();
        $rejected = $courses->where('approval_status', 2)->count();
        
        echo "Total courses: {$courses->count()}\n";
        echo "Published: {$published}\n";
        echo "Approved: {$approved}\n";
        echo "Pending: {$pending}\n";
        echo "Rejected: {$rejected}\n";
    }
}