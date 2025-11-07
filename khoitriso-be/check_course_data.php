<?php

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

use App\Models\Course;
use App\Models\Lesson;
use App\Models\Assignment;
use App\Models\LessonMaterial;

echo "=== COURSE CONTENT CHECK ===\n\n";

$course = Course::with(['lessons' => function($q) {
    $q->orderBy('lesson_order')->limit(5);
}])->first();

echo "Course: {$course->title}\n";
echo "Total Lessons: " . Lesson::where('course_id', $course->id)->count() . "\n";
echo "Total Assignments: " . Assignment::whereHas('lesson', function($q) use ($course) {
    $q->where('course_id', $course->id);
})->count() . "\n\n";

echo "First 5 Lessons:\n";
foreach($course->lessons as $lesson) {
    $materials = LessonMaterial::where('lesson_id', $lesson->id)->count();
    echo "  {$lesson->lesson_order}. {$lesson->title}\n";
    echo "     - Duration: {$lesson->video_duration} minutes\n";
    echo "     - Free: " . ($lesson->is_free ? 'Yes' : 'No') . "\n";
    echo "     - Video: {$lesson->video_url}\n";
    echo "     - Materials: {$materials}\n";
}

echo "\n=== SUMMARY ===\n";
echo "Total Courses: " . Course::count() . "\n";
echo "Total Lessons: " . Lesson::count() . "\n";
echo "Total Materials: " . LessonMaterial::count() . "\n";
echo "Total Assignments: " . Assignment::count() . "\n";
