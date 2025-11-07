<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;

class CourseController extends BaseController
{
    public function index(Request $request)
    {
        $query = Course::with(['instructor:id,name,email', 'category:id,name'])
            ->where('is_active', true);
        if ($request->filled('category')) {
            $query->where('category_id', $request->integer('category'));
        }
        if ($request->filled('level')) {
            $query->where('level', $request->integer('level'));
        }
        if ($request->filled('isFree')) {
            $query->where('is_free', filter_var($request->query('isFree'), FILTER_VALIDATE_BOOLEAN));
        }
        if ($search = $request->query('search')) {
            $query->where('title', 'LIKE', "%$search%");
        }
        $sortBy = $request->query('sortBy', 'rating');
        $sortOrder = $request->query('sortOrder', 'desc');
        $query->orderBy($sortBy, $sortOrder);
        $limit = max(1, min(100, (int) $request->query('limit', 20)));
        $courses = $query->paginate($limit);
        return response()->json([
            'data' => $courses->items(),
            'total' => $courses->total(),
            'current_page' => $courses->currentPage(),
            'last_page' => $courses->lastPage(),
            'per_page' => $courses->perPage(),
            'from' => $courses->firstItem(),
            'to' => $courses->lastItem()
        ]);
    }

    public function show(int $id)
    {
        $course = Course::with([
            'instructor', 
            'category', 
            'lessons' => function ($q) {
                $q->orderBy('lesson_order');
            },
            'lessons.materials' => function ($q) {
                $q->orderBy('created_at');
            }
        ])->findOrFail($id);
        return response()->json($course);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required','string','max:200'],
            'description' => ['required','string'],
            'thumbnail' => ['required','string','max:255'],
            'categoryId' => ['required','integer','exists:categories,id'],
            'level' => ['required','integer','in:1,2,3'],
            'isFree' => ['required','boolean'],
            'price' => ['required','numeric','min:0'],
            'staticPagePath' => ['required','string'],
        ]);
        $course = Course::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'thumbnail' => $data['thumbnail'],
            'category_id' => $data['categoryId'],
            'level' => $data['level'],
            'is_free' => $data['isFree'],
            'price' => $data['price'],
            'static_page_path' => $data['staticPagePath'],
            'instructor_id' => $request->user()->id,
            'approval_status' => 1,
        ]);
        return response()->json(['success' => true, 'course' => $course], 201);
    }

    public function update(Request $request, int $id)
    {
        $course = Course::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes','string','max:200'],
            'description' => ['sometimes','string'],
            'thumbnail' => ['sometimes','string','max:255'],
            'categoryId' => ['sometimes','integer','exists:categories,id'],
            'level' => ['sometimes','integer','in:1,2,3'],
            'isFree' => ['sometimes','boolean'],
            'price' => ['sometimes','numeric','min:0'],
        ]);
        $course->fill([
            'title' => $data['title'] ?? $course->title,
            'description' => $data['description'] ?? $course->description,
            'thumbnail' => $data['thumbnail'] ?? $course->thumbnail,
            'category_id' => $data['categoryId'] ?? $course->category_id,
            'level' => $data['level'] ?? $course->level,
            'is_free' => array_key_exists('isFree',$data) ? (bool)$data['isFree'] : $course->is_free,
            'price' => $data['price'] ?? $course->price,
        ])->save();
        return response()->json(['success' => true, 'course' => $course]);
    }

    public function destroy(int $id)
    {
        $course = Course::findOrFail($id);
        $course->is_active = false;
        $course->save();
        return response()->json(['success' => true, 'message' => 'Course deleted successfully']);
    }

    /**
     * Get user's enrolled courses (My Learning)
     */
    public function myLearning(Request $request)
    {
        $user = $request->user();
        
        $enrollments = \App\Models\CourseEnrollment::where('user_id', $user->id)
            ->where('is_active', true)
            ->with(['course' => function($q) {
                $q->with(['instructor:id,name,email', 'category:id,name'])
                  ->where('is_active', true);
            }])
            ->orderByDesc('enrolled_at')
            ->get();

        $courses = $enrollments->map(function($enrollment) {
            if (!$enrollment->course) return null;
            
            return [
                'id' => $enrollment->course->id,
                'title' => $enrollment->course->title,
                'slug' => $enrollment->course->slug,
                'description' => $enrollment->course->description,
                'thumbnail_url' => $enrollment->course->thumbnail_url,
                'video_url' => $enrollment->course->video_url,
                'price' => $enrollment->course->price,
                'discount_price' => $enrollment->course->discount_price,
                'level' => $enrollment->course->level,
                'duration' => $enrollment->course->duration,
                'rating' => $enrollment->course->rating,
                'total_students' => $enrollment->course->total_students,
                'instructor' => $enrollment->course->instructor,
                'category' => $enrollment->course->category,
                'progress_percentage' => $enrollment->progress_percentage ?? 0,
                'enrolled_at' => $enrollment->enrolled_at,
                'completed_at' => $enrollment->completed_at,
            ];
        })->filter()->values();

        return $this->success($courses);
    }
}


