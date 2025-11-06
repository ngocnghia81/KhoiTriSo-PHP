<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Lesson;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Lesson Controller
 */
class LessonController extends BaseController
{
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $lesson = Lesson::with(['materials'])->find($id);
            
            if (!$lesson) {
                return $this->notFound('Lesson');
            }
            
            return $this->success($lesson);

        } catch (\Exception $e) {
            \Log::error('Error in lesson show: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function byCourse(Request $request, int $courseId): JsonResponse
    {
        try {
            $lessons = Lesson::where('course_id', $courseId)
                ->orderBy('lesson_order')
                ->with('materials')
                ->get();
            
            return $this->success(['lessons' => $lessons]);

        } catch (\Exception $e) {
            \Log::error('Error in byCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'courseId' => ['required','integer','exists:courses,id'],
                'title' => ['required','string','max:200'],
                'description' => ['required','string'],
                'videoUrl' => ['required','string','max:255'],
                'videoDuration' => ['nullable','integer','min:0'],
                'contentText' => ['required','string'],
                'lessonOrder' => ['required','integer','min:1'],
                'staticPagePath' => ['required','string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
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
            
            return $this->success($lesson);

        } catch (\Exception $e) {
            \Log::error('Error in lesson store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $lesson = Lesson::find($id);
            
            if (!$lesson) {
                return $this->notFound('Lesson');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['sometimes','string','max:200'],
                'description' => ['sometimes','string'],
                'videoUrl' => ['sometimes','string','max:255'],
                'videoDuration' => ['sometimes','integer','min:0'],
                'contentText' => ['sometimes','string'],
                'lessonOrder' => ['sometimes','integer','min:1'],
                'isPublished' => ['sometimes','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $lesson->fill([
                'title' => $data['title'] ?? $lesson->title,
                'description' => $data['description'] ?? $lesson->description,
                'video_url' => $data['videoUrl'] ?? $lesson->video_url,
                'video_duration' => $data['videoDuration'] ?? $lesson->video_duration,
                'content_text' => $data['contentText'] ?? $lesson->content_text,
                'lesson_order' => $data['lessonOrder'] ?? $lesson->lesson_order,
                'is_published' => array_key_exists('isPublished',$data) ? (bool)$data['isPublished'] : $lesson->is_published,
            ])->save();
            
            return $this->success($lesson);

        } catch (\Exception $e) {
            \Log::error('Error in lesson update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $lesson = Lesson::find($id);
            
            if (!$lesson) {
                return $this->notFound('Lesson');
            }
            
            $lesson->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in lesson destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
