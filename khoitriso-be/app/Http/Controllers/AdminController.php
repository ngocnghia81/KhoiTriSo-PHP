<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\User;
use App\Models\Course;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Hash;

/**
 * Admin Controller
 */
class AdminController extends BaseController
{
    public function listUsers(Request $request): JsonResponse
    {
        try {
            $q = User::query();
            
            // Filter by role from database
            if ($request->filled('role')) {
                $q->where('role', $request->query('role'));
            }
            
            if ($request->filled('isActive')) {
                $q->where('is_active', filter_var($request->query('isActive'), FILTER_VALIDATE_BOOLEAN));
            }
            if ($s = $request->query('search')) {
                $q->where(function ($w) use ($s) {
                    $w->where('name','like',"%$s%")->orWhere('email','like',"%$s%");
                });
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $users = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get()
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'username' => $user->username ?? $user->name,
                        'role' => $user->role ?? 'student',
                        'isActive' => $user->is_active ?? true,
                        'emailVerified' => (bool) $user->email_verified_at,
                        'lastLogin' => $user->last_login ? $user->last_login->toISOString() : null,
                        'createdAt' => $user->created_at->toISOString(),
                    ];
                });
            
            return $this->paginated($users->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in admin listUsers: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function updateUser(int $id, Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'role' => ['nullable','string','in:admin,instructor,student'],
                'isActive' => ['nullable','boolean'],
                'emailVerified' => ['nullable','boolean'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            $u = User::find($id);
            
            if (!$u) {
                return $this->notFound('User');
            }
            
            $u->is_active = array_key_exists('isActive', $data) ? (bool)$data['isActive'] : $u->is_active;
            
            if (array_key_exists('role', $data)) {
                $u->role = $data['role'];
            }
            
            if (array_key_exists('emailVerified', $data) && $data['emailVerified']) {
                $u->email_verified_at = now();
            }
            
            $u->save();
            
            return $this->success($u);

        } catch (\Exception $e) {
            \Log::error('Error in admin updateUser: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function createInstructor(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'username' => ['required','string','max:50'],
                'email' => ['required','string','email','max:100','unique:users,email'],
                'password' => ['required','string','min:8'],
                'fullName' => ['required','string','max:100'],
                'phone' => ['nullable','string','max:20'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $u = new User();
            $u->name = $data['fullName'] ?: $data['username'];
            $u->email = $data['email'];
            $u->password = Hash::make($data['password']);
            $u->role = 'instructor';
            $u->is_active = true;
            $u->email_verified_at = now();
            $u->save();
            
            return $this->success($u);

        } catch (\Exception $e) {
            \Log::error('Error in admin createInstructor: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function resetInstructorPassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'instructorId' => ['required','integer','exists:users,id'],
                'newPassword' => ['required','string','min:8'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            $u = User::find($data['instructorId']);
            
            if (!$u) {
                return $this->notFound('Instructor');
            }
            
            $u->password = Hash::make($data['newPassword']);
            $u->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in admin resetInstructorPassword: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function listCourses(Request $request): JsonResponse
    {
        try {
            $q = Course::with(['instructor:id,name,email', 'category:id,name']);
            
            // Filter by status
            if ($request->filled('status')) {
                $status = $request->query('status');
                if ($status === 'active') {
                    $q->where('is_active', true);
                } elseif ($status === 'inactive') {
                    $q->where('is_active', false);
                }
            }
            
            // Filter by approval status
            if ($request->filled('approvalStatus')) {
                $q->where('approval_status', $request->integer('approvalStatus'));
            }
            
            // Search
            if ($s = $request->query('search')) {
                $q->where(function ($w) use ($s) {
                    $w->where('title', 'like', "%$s%")
                      ->orWhere('description', 'like', "%$s%");
                });
            }
            
            // Filter by instructor
            if ($request->filled('instructorId')) {
                $q->where('instructor_id', $request->integer('instructorId'));
            }
            
            // Filter by category
            if ($request->filled('categoryId')) {
                $q->where('category_id', $request->integer('categoryId'));
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $courses = $q->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->orderBy('created_at', 'desc')
                ->get()
                ->map(function ($course) {
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'description' => $course->description,
                        'thumbnail' => $course->thumbnail,
                        'price' => $course->price,
                        'isFree' => $course->is_free,
                        'isActive' => $course->is_active,
                        'approvalStatus' => $course->approval_status,
                        'rating' => $course->rating,
                        'totalStudents' => $course->total_students,
                        'instructor' => $course->instructor ? [
                            'id' => $course->instructor->id,
                            'name' => $course->instructor->name,
                            'email' => $course->instructor->email,
                        ] : null,
                        'category' => $course->category ? [
                            'id' => $course->category->id,
                            'name' => $course->category->name,
                        ] : null,
                        'createdAt' => $course->created_at->toISOString(),
                        'updatedAt' => $course->updated_at->toISOString(),
                    ];
                });
            
            return $this->paginated($courses->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in admin listCourses: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
