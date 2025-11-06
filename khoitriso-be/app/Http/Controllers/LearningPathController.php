<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\LearningPath;
use App\Models\LearningPathCourse;
use App\Models\UserLearningPath;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Learning Path Controller
 */
class LearningPathController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $q = LearningPath::query()->where('is_active', true);
            
            if ($request->filled('category')) {
                $q->where('category_id', $request->integer('category'));
            }
            if ($request->filled('level')) {
                $q->where('difficulty_level', $request->integer('level'));
            }
            
            $sortBy = $request->query('sortBy', 'price');
            $sortOrder = $request->query('sortOrder', 'asc');
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $learningPaths = $q->orderBy($sortBy, $sortOrder)
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($learningPaths->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in learningPaths index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function show(int $id, Request $request): JsonResponse
    {
        try {
            $lp = LearningPath::with(['courses' => function ($q) {
                $q->orderBy('order_index');
            }])->find($id);
            
            if (!$lp) {
                return $this->notFound('Learning path');
            }
            
            return $this->success($lp);

        } catch (\Exception $e) {
            \Log::error('Error in learningPath show: ' . $e->getMessage());
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
                'title' => ['required','string','max:200'],
                'description' => ['required','string'],
                'thumbnail' => ['nullable','string','max:255'],
                'categoryId' => ['nullable','integer','exists:categories,id'],
                'estimatedDuration' => ['nullable','integer','min:1'],
                'difficultyLevel' => ['required','integer','in:1,2,3'],
                'price' => ['required','numeric','min:0'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
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
            
            return $this->success($lp);

        } catch (\Exception $e) {
            \Log::error('Error in learningPath store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $lp = LearningPath::find($id);
            
            if (!$lp) {
                return $this->notFound('Learning path');
            }

            $validator = Validator::make($request->all(), [
                'title' => ['sometimes','string','max:200'],
                'description' => ['sometimes','string'],
                'thumbnail' => ['sometimes','string','max:255'],
                'categoryId' => ['sometimes','integer','exists:categories,id'],
                'estimatedDuration' => ['sometimes','integer','min:1'],
                'difficultyLevel' => ['sometimes','integer','in:1,2,3'],
                'price' => ['sometimes','numeric','min:0'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $lp->fill([
                'title' => $data['title'] ?? $lp->title,
                'description' => $data['description'] ?? $lp->description,
                'thumbnail' => $data['thumbnail'] ?? $lp->thumbnail,
                'category_id' => $data['categoryId'] ?? $lp->category_id,
                'estimated_duration' => $data['estimatedDuration'] ?? $lp->estimated_duration,
                'difficulty_level' => $data['difficultyLevel'] ?? $lp->difficulty_level,
                'price' => $data['price'] ?? $lp->price,
            ])->save();
            
            return $this->success($lp);

        } catch (\Exception $e) {
            \Log::error('Error in learningPath update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function destroy(int $id, Request $request): JsonResponse
    {
        try {
            $lp = LearningPath::find($id);
            
            if (!$lp) {
                return $this->notFound('Learning path');
            }
            
            $lp->is_active = false;
            $lp->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in learningPath destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function courses(int $id, Request $request): JsonResponse
    {
        try {
            $courses = LearningPathCourse::where('learning_path_id', $id)
                ->orderBy('order_index')
                ->get();
            
            return $this->success(['courses' => $courses]);

        } catch (\Exception $e) {
            \Log::error('Error in learningPath courses: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function addCourse(int $id, Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'courseId' => ['required','integer','exists:courses,id'],
                'orderIndex' => ['required','integer','min:0'],
                'isRequired' => ['required','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $lpc = LearningPathCourse::create([
                'learning_path_id' => $id,
                'course_id' => $data['courseId'],
                'order_index' => $data['orderIndex'],
                'is_required' => $data['isRequired'],
            ]);
            
            return $this->success($lpc);

        } catch (\Exception $e) {
            \Log::error('Error in learningPath addCourse: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function enroll(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $ulp = UserLearningPath::firstOrCreate([
                'learning_path_id' => $id,
                'user_id' => $request->user()->id,
            ]);
            
            return $this->success(['enrollment' => $ulp]);

        } catch (\Exception $e) {
            \Log::error('Error in learningPath enroll: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function myPaths(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $q = UserLearningPath::where('user_id', $request->user()->id);
            $total = $q->count();
            $learningPaths = $q->orderByDesc('enrolled_at')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($learningPaths->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in myPaths: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
