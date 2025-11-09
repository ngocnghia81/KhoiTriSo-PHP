<?php

require_once __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(\Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use App\Models\Course;
use App\Models\Book;
use Illuminate\Support\Facades\DB;

echo "=== KhoiTriSo Admin Approval Tool ===\n\n";

// Check current courses status
echo "📚 COURSES STATUS:\n";
$courses = Course::select('id', 'title', 'is_published', 'approval_status', 'is_active')
    ->orderBy('id')
    ->get();

if ($courses->isEmpty()) {
    echo "No courses found.\n";
} else {
    foreach ($courses as $course) {
        $approvalText = match($course->approval_status) {
            0 => 'Pending',
            1 => 'Approved', 
            2 => 'Rejected',
            default => 'Unknown'
        };
        $publishedText = $course->is_published ? 'Published' : 'Not Published';
        $activeText = $course->is_active ? 'Active' : 'Inactive';
        
        echo "ID {$course->id}: {$course->title}\n";
        echo "  Status: {$approvalText} | {$publishedText} | {$activeText}\n";
    }
}

echo "\n📖 BOOKS STATUS:\n";
$books = DB::table('books')
    ->select('id', 'title', 'is_published', 'approval_status', 'is_active')
    ->orderBy('id')
    ->get();

if ($books->isEmpty()) {
    echo "No books found.\n";
} else {
    foreach ($books as $book) {
        $approvalText = match($book->approval_status) {
            0 => 'Pending',
            1 => 'Approved', 
            2 => 'Rejected',
            default => 'Unknown'
        };
        $publishedText = $book->is_published ? 'Published' : 'Not Published';
        $activeText = $book->is_active ? 'Active' : 'Inactive';
        
        echo "ID {$book->id}: {$book->title}\n";
        echo "  Status: {$approvalText} | {$publishedText} | {$activeText}\n";
    }
}

echo "\n" . str_repeat('=', 50) . "\n";
echo "🎯 APPROVAL ACTIONS:\n";
echo "1. Approve course: Course::find(ID)->update(['approval_status' => 1]);\n";
echo "2. Reject course:  Course::find(ID)->update(['approval_status' => 2, 'review_notes' => 'reason']);\n";
echo "3. Publish course: Course::find(ID)->update(['is_published' => DB::raw('true')]);\n";
echo "4. Same for books but use DB::table('books')\n";

echo "\n🚀 API ENDPOINTS (if server running):\n";
echo "PUT /api/admin/courses/{id}/approve\n";
echo "PUT /api/admin/courses/{id}/reject (with {\"reason\": \"text\"})\n";
echo "PUT /api/admin/courses/{id}/publish\n";
echo "PUT /api/admin/courses/{id}/unpublish\n";
echo "PUT /api/admin/books/{id}/approve\n";
echo "PUT /api/admin/books/{id}/reject\n";
echo "PUT /api/admin/books/{id}/publish\n";
echo "PUT /api/admin/books/{id}/unpublish\n";

echo "\n⚠️  Remember: Content must be APPROVED before it can be PUBLISHED\n";