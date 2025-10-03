<?php

namespace App\Http\Controllers;

use App\Models\LearningPath;
use App\Models\LearningPathCourse;
use App\Models\UserLearningPath;
use Illuminate\Http\Request;

class LearningPathController extends Controller
{
    public function index(Request $request)
    {
        $q = LearningPath::query()->where('is_active', true);
        if ($request->filled('category')) $q->where('category_id', $request->integer('category'));
        if ($request->filled('level')) $q->where('difficulty_level', $request->integer('level'));
        $res = $q->orderBy($request->query('sortBy', 'price'), $request->query('sortOrder', 'asc'))
            ->paginate((int) $request->query('pageSize', 20));
        return response()->json(['learningPaths' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function show(int $id)
    {
        $lp = LearningPath::with(['courses' => function ($q) { $q->orderBy('order_index'); }])->findOrFail($id);
        return response()->json($lp);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required','string','max:200'],
            'description' => ['required','string'],
            'thumbnail' => ['nullable','string','max:255'],
            'categoryId' => ['nullable','integer','exists:categories,id'],
            'estimatedDuration' => ['nullable','integer','min:1'],
            'difficultyLevel' => ['required','integer','in:1,2,3'],
            'price' => ['required','numeric','min:0'],
        ]);
        $lp = LearningPath::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'thumbnail' => $data['thumbnail'] ?? null,
            'instructor_id' => $request->user()->id,
            'category_id' => $data['categoryId'] ?? null,
            'estimated_duration' => $data['estimatedDuration'] ?? null,
            'difficulty_level' => $data['difficultyLevel'],
            'price' => $data['price'],
            'approval_status' => 1,
        ]);
        return response()->json(['success' => true, 'learningPath' => $lp], 201);
    }

    public function update(Request $request, int $id)
    {
        $lp = LearningPath::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes','string','max:200'],
            'description' => ['sometimes','string'],
            'thumbnail' => ['sometimes','string','max:255'],
            'categoryId' => ['sometimes','integer','exists:categories,id'],
            'estimatedDuration' => ['sometimes','integer','min:1'],
            'difficultyLevel' => ['sometimes','integer','in:1,2,3'],
            'price' => ['sometimes','numeric','min:0'],
        ]);
        $lp->fill([
            'title' => $data['title'] ?? $lp->title,
            'description' => $data['description'] ?? $lp->description,
            'thumbnail' => $data['thumbnail'] ?? $lp->thumbnail,
            'category_id' => $data['categoryId'] ?? $lp->category_id,
            'estimated_duration' => $data['estimatedDuration'] ?? $lp->estimated_duration,
            'difficulty_level' => $data['difficultyLevel'] ?? $lp->difficulty_level,
            'price' => $data['price'] ?? $lp->price,
        ])->save();
        return response()->json(['success' => true, 'learningPath' => $lp]);
    }

    public function destroy(int $id)
    {
        $lp = LearningPath::findOrFail($id);
        $lp->is_active = false;
        $lp->save();
        return response()->json(['success' => true, 'message' => 'Learning path deleted successfully']);
    }

    public function courses(int $id)
    {
        $courses = LearningPathCourse::where('learning_path_id', $id)->orderBy('order_index')->get();
        return response()->json(['courses' => $courses]);
    }

    public function addCourse(int $id, Request $request)
    {
        $data = $request->validate([
            'courseId' => ['required','integer','exists:courses,id'],
            'orderIndex' => ['required','integer','min:0'],
            'isRequired' => ['required','boolean'],
        ]);
        $lpc = LearningPathCourse::create([
            'learning_path_id' => $id,
            'course_id' => $data['courseId'],
            'order_index' => $data['orderIndex'],
            'is_required' => $data['isRequired'],
        ]);
        return response()->json(['success' => true, 'item' => $lpc], 201);
    }

    public function enroll(int $id, Request $request)
    {
        $ulp = UserLearningPath::firstOrCreate([
            'learning_path_id' => $id,
            'user_id' => $request->user()->id,
        ]);
        return response()->json(['success' => true, 'enrollment' => $ulp]);
    }

    public function myPaths(Request $request)
    {
        $res = UserLearningPath::where('user_id', $request->user()->id)->orderByDesc('enrolled_at')
            ->paginate((int) $request->query('pageSize', 20));
        return response()->json(['learningPaths' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }
}


