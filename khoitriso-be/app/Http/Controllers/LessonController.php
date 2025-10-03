<?php

namespace App\Http\Controllers;

use App\Models\Lesson;
use Illuminate\Http\Request;

class LessonController extends Controller
{
    public function show(int $id)
    {
        $lesson = Lesson::with(['materials'])->findOrFail($id);
        return response()->json($lesson);
    }

    public function byCourse(int $courseId)
    {
        $lessons = Lesson::where('course_id', $courseId)->orderBy('lesson_order')->with('materials')->get();
        return response()->json(['lessons' => $lessons]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'courseId' => ['required','integer','exists:courses,id'],
            'title' => ['required','string','max:200'],
            'description' => ['required','string'],
            'videoUrl' => ['required','string','max:255'],
            'videoDuration' => ['nullable','integer','min:0'],
            'contentText' => ['required','string'],
            'lessonOrder' => ['required','integer','min:1'],
            'staticPagePath' => ['required','string'],
        ]);
        $lesson = Lesson::create([
            'course_id' => $data['courseId'],
            'title' => $data['title'],
            'description' => $data['description'],
            'video_url' => $data['videoUrl'],
            'video_duration' => $data['videoDuration'] ?? null,
            'content_text' => $data['contentText'],
            'lesson_order' => $data['lessonOrder'],
            'static_page_path' => $data['staticPagePath'],
        ]);
        return response()->json(['success' => true, 'lesson' => $lesson], 201);
    }

    public function update(Request $request, int $id)
    {
        $lesson = Lesson::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes','string','max:200'],
            'description' => ['sometimes','string'],
            'videoUrl' => ['sometimes','string','max:255'],
            'videoDuration' => ['sometimes','integer','min:0'],
            'contentText' => ['sometimes','string'],
            'lessonOrder' => ['sometimes','integer','min:1'],
            'isPublished' => ['sometimes','boolean'],
        ]);
        $lesson->fill([
            'title' => $data['title'] ?? $lesson->title,
            'description' => $data['description'] ?? $lesson->description,
            'video_url' => $data['videoUrl'] ?? $lesson->video_url,
            'video_duration' => $data['videoDuration'] ?? $lesson->video_duration,
            'content_text' => $data['contentText'] ?? $lesson->content_text,
            'lesson_order' => $data['lessonOrder'] ?? $lesson->lesson_order,
            'is_published' => array_key_exists('isPublished',$data) ? (bool)$data['isPublished'] : $lesson->is_published,
        ])->save();
        return response()->json(['success' => true, 'lesson' => $lesson]);
    }

    public function destroy(int $id)
    {
        $lesson = Lesson::findOrFail($id);
        $lesson->delete();
        return response()->json(['success' => true, 'message' => 'Lesson deleted successfully']);
    }
}


