<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\CourseEnrollment;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;

class CourseController extends BaseController
{
    public function index(Request $request)
    {
        $user = $request->user();
        $userId = $user ? $user->id : null;
        
        $query = Course::with(['instructor:id,name,email', 'category:id,name'])
            ->whereRaw('is_active = true')
            ->whereRaw('is_published = true')
            ->where('approval_status', 1); // Only show approved courses
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
        
        // Get enrolled/purchased course IDs for authenticated user
        // Check both: course_enrollments and paid orders
        $enrolledCourseIds = [];
        if ($userId) {
            // Method 1: Check via course_enrollments
            $coursesViaEnrollment = CourseEnrollment::where('user_id', $userId)
                ->whereRaw('is_active = true')
                ->pluck('course_id')
                ->toArray();
            
            // Method 2: Check via paid orders (status = 2 = Paid)
            $coursesViaOrders = DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.user_id', $userId)
                ->where('orders.status', 2) // Paid
                ->where('order_items.item_type', 1) // Course
                ->distinct()
                ->pluck('order_items.item_id')
                ->toArray();
            
            // Merge both methods
            $enrolledCourseIds = array_unique(array_merge($coursesViaEnrollment, $coursesViaOrders));
        }
        
        // Add is_purchased flag to each course
        $coursesData = collect($courses->items())->map(function ($course) use ($enrolledCourseIds) {
            $courseArray = $course->toArray();
            $courseArray['is_purchased'] = in_array($course->id, $enrolledCourseIds);
            return $courseArray;
        });
        
        return response()->json([
            'data' => $coursesData->toArray(),
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
        try {
            // Only show active, published, and approved courses for regular users
            $course = Course::whereRaw('is_active = true')
                ->whereRaw('is_published = true')
                ->where('approval_status', 1)
                ->with([
                    'instructor', 
                    'category', 
                'lessons' => function ($q) {
                    $q->orderBy('lesson_order');
                },
                'lessons.materials' => function ($q) {
                    $q->orderBy('created_at');
                }
            ])->findOrFail($id);
            
            // Calculate real-time statistics
            // Count all active lessons (not just published) for public display
            $totalLessons = $course->lessons()->whereRaw('is_active = true')->count();
            
            // Calculate total duration from all active lessons (video_duration is in minutes)
            $totalDurationMinutes = $course->lessons()
                ->whereRaw('is_active = true')
                ->sum('video_duration') ?? 0;
            $estimatedDurationHours = $totalDurationMinutes > 0 ? round($totalDurationMinutes / 60, 1) : 0;
            
            // Count active enrollments
            $totalStudents = \App\Models\CourseEnrollment::where('course_id', $id)
                ->whereRaw('is_active = true')
                ->count();
            
            // Get rating and reviews (if exists in database, otherwise use defaults)
            $rating = is_numeric($course->rating) ? (float) $course->rating : 0.0;
            $totalReviews = is_numeric($course->total_reviews) ? (int) $course->total_reviews : 0;
            
            // Add calculated fields to course object
            $course->total_lessons = $totalLessons;
            $course->estimated_duration = $estimatedDurationHours;
            $course->total_students = $totalStudents;
            $course->rating = $rating;
            $course->total_reviews = $totalReviews;
            
            return response()->json($course);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['error' => 'Course not found'], 404);
        } catch (\Exception $e) {
            \Log::error('Error fetching course: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
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
            
            $user = $request->user();
            // If user is admin, auto-approve and publish. If instructor, set to pending.
            $approvalStatus = ($user->role ?? '') === 'admin' ? 1 : 0; // 0 = pending, 1 = approved
            $isPublished = ($user->role ?? '') === 'admin' ? true : false;
            
            $course = Course::create([
                'title' => $data['title'],
                'description' => $data['description'],
                'thumbnail' => $data['thumbnail'],
                'category_id' => $data['categoryId'],
                'level' => $data['level'],
                'is_free' => $data['isFree'],
                'price' => $data['price'],
                'static_page_path' => $data['staticPagePath'],
                'instructor_id' => $user->id,
                'approval_status' => $approvalStatus,
                'is_active' => \DB::raw('true'),
                'is_published' => $isPublished,
            ]);
            
            return $this->success($course, null, $request);
        } catch (\Illuminate\Validation\ValidationException $e) {
            $errors = [];
            foreach ($e->errors() as $field => $messages) {
                $errors[] = ['field' => $field, 'messages' => $messages];
            }
            return $this->validationError($errors);
        } catch (\Exception $e) {
            \Log::error('Error creating course: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
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
        // Soft delete: set is_active = false (use direct update with raw SQL for PostgreSQL boolean)
        \DB::table('courses')
            ->where('id', $id)
            ->update([
                'is_active' => \DB::raw('false'),
                'updated_at' => now(),
            ]);
        return response()->json(['success' => true, 'message' => 'Course deleted successfully']);
    }

    /**
     * Enroll user in a course
     */
    public function enroll(Request $request, int $id)
    {
        \Log::info('Enroll endpoint called', ['course_id' => $id, 'user_id' => $request->user()?->id]);
        
        $user = $request->user();
        if (!$user) {
            return $this->error('UNAUTHORIZED', null, 'User not authenticated', 401);
        }
        
        $course = Course::findOrFail($id);
        
        // Check if course is free or user already enrolled
        $existingEnrollment = CourseEnrollment::where('user_id', $user->id)
            ->where('course_id', $id)
            ->first();
            
        if ($existingEnrollment) {
            if ($existingEnrollment->is_active) {
                return $this->success(['enrollment' => $existingEnrollment, 'message' => 'Bạn đã đăng ký khóa học này rồi']);
            } else {
                // Reactivate enrollment using raw SQL for PostgreSQL boolean
                DB::table('course_enrollments')
                    ->where('id', $existingEnrollment->id)
                    ->update([
                        'is_active' => DB::raw('true'),
                        'enrolled_at' => now(),
                        'updated_at' => now(),
                    ]);
                $existingEnrollment->refresh();
                return $this->success(['enrollment' => $existingEnrollment, 'message' => 'Đã kích hoạt lại khóa học']);
            }
        }
        
        // Check if course is free
        if (!$course->is_free && $course->price > 0) {
            return $this->error('COURSE_NOT_FREE', null, 'Khóa học này không miễn phí. Vui lòng mua khóa học trước.', 400);
        }
        
        // Create enrollment using raw SQL for PostgreSQL boolean compatibility
        try {
            $enrollmentId = DB::table('course_enrollments')->insertGetId([
                'user_id' => $user->id,
                'course_id' => $id,
                'enrolled_at' => now(),
                'progress_percentage' => 0,
                'is_active' => DB::raw('true'), // Explicit boolean for PostgreSQL
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $enrollment = CourseEnrollment::find($enrollmentId);
            
            return $this->success(['enrollment' => $enrollment, 'message' => 'Đăng ký khóa học thành công']);
        } catch (\Exception $e) {
            \Log::error('Error creating enrollment: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->error('DATABASE_ERROR', null, 'Lỗi khi đăng ký khóa học: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Get user's enrolled courses (My Learning)
     */
public function myLearning(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }
            
            $enrollments = \App\Models\CourseEnrollment::where('user_id', $user->id)
                ->whereRaw('is_active = true')
                ->with(['course' => function($q) {
                    $q->with(['instructor:id,name,email', 'category:id,name'])
                      ->whereRaw('is_active = true');
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
                    'thumbnail_url' => $enrollment->course->thumbnail ?? null,
                    'thumbnail' => $enrollment->course->thumbnail ?? null,
                    'video_url' => $enrollment->course->video_url ?? null,
                    'price' => $enrollment->course->price,
                    'discount_price' => $enrollment->course->discount_price,
                    'level' => $enrollment->course->level,
                    'duration' => $enrollment->course->estimated_duration ?? $enrollment->course->duration ?? null,
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
        } catch (\Exception $e) {
            \Log::error('Error in myLearning: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->error('INTERNAL_SERVER_ERROR', 'Lỗi máy chủ nội bộ', 500);
        }
    }
}


