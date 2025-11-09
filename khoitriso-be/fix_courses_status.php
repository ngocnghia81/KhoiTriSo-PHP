<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

use Illuminate\Support\Facades\DB;

echo "Updating courses approval_status...\n";

try {
    // Update all courses that are published to have approval_status = 1 (Approved)
    $updated = DB::table('courses')
        ->where('is_published', true)
        ->update(['approval_status' => 1]);
    
    echo "Updated {$updated} courses to approval_status = 1 (Approved)\n";
    
    // Show current status
    $courses = DB::table('courses')
        ->select('id', 'title', 'is_published', 'approval_status', 'is_active')
        ->get();
    
    echo "\nCurrent courses status:\n";
    echo "======================\n";
    
    foreach ($courses as $course) {
        $publishedText = $course->is_published ? 'Published' : 'Not Published';
        $approvalText = match($course->approval_status) {
            0 => 'Pending',
            1 => 'Approved', 
            2 => 'Rejected',
            default => 'Unknown'
        };
        $activeText = $course->is_active ? 'Active' : 'Inactive';
        
        echo "ID: {$course->id} | {$course->title}\n";
        echo "  - Published: {$publishedText}\n";
        echo "  - Approval: {$approvalText}\n"; 
        echo "  - Active: {$activeText}\n";
        echo "---\n";
    }
    
} catch (Exception $e) {
    echo "Error: " . $e->getMessage() . "\n";
}