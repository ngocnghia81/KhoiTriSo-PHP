<?php

require_once 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';

use Illuminate\Support\Facades\DB;

echo "Checking courses data:\n";
echo "======================\n\n";

$courses = DB::table('courses')
    ->select('id', 'title', 'is_published', 'approval_status')
    ->take(10)
    ->get();

foreach ($courses as $course) {
    echo "ID: {$course->id}\n";
    echo "Title: {$course->title}\n";
    echo "is_published: " . ($course->is_published ? 'true' : 'false') . "\n";
    echo "approval_status: {$course->approval_status}\n";
    echo "-------------------\n";
}