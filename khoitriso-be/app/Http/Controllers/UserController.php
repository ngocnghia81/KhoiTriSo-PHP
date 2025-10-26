<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;
use App\Models\User;

/**
 * User Controller
 * Sử dụng BaseController với multi-language response system
 */
class UserController extends BaseController
{
    /**
     * Get current user profile
     */
    public function profile(Request $request): JsonResponse
    {
        try {
            $u = $request->user();
            
            if (!$u) {
                return $this->unauthorized();
            }

            $data = [
                'id' => $u->id,
                'username' => $u->name,
                'email' => $u->email,
                'fullName' => $u->name,
                'avatar' => null,
                'role' => 1,
                'isActive' => true,
                'emailVerified' => (bool) $u->email_verified_at,
            ];

            return $this->success($data);
            
        } catch (\Exception $e) {
            \Log::error('Error getting profile: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'fullName' => ['nullable', 'string', 'max:100'],
                'phone' => ['nullable', 'string', 'max:20'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = [
                        'field' => $field,
                        'messages' => $messages,
                    ];
                }
                return $this->validationError($errors);
            }

            $u = $request->user();
            
            if (!$u) {
                return $this->unauthorized();
            }

            $data = $validator->validated();
            
            if (isset($data['fullName'])) {
                $u->name = $data['fullName'];
            }
            
            $u->save();

            $responseData = [
                'id' => $u->id,
                'username' => $u->name,
                'email' => $u->email,
                'fullName' => $u->name,
                'avatar' => null,
                'role' => 1,
                'isActive' => true,
                'emailVerified' => (bool) $u->email_verified_at,
            ];

            return $this->success($responseData);
            
        } catch (\Exception $e) {
            \Log::error('Error updating profile: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Change user password
     */
    public function changePassword(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'currentPassword' => ['required', 'string'],
                'newPassword' => ['required', 'string', 'min:8'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = [
                        'field' => $field,
                        'messages' => $messages,
                    ];
                }
                return $this->validationError($errors);
            }

            $user = $request->user();
            
            if (!$user) {
                return $this->unauthorized();
            }

            $data = $validator->validated();

            if (!password_verify($data['currentPassword'], $user->password)) {
                return $this->error(
                    MessageCode::INVALID_PASSWORD,
                    null,
                    null,
                    400
                );
            }

            $user->password = bcrypt($data['newPassword']);
            $user->save();

            return $this->success(null);
            
        } catch (\Exception $e) {
            \Log::error('Error changing password: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Upload user avatar
     */
    public function uploadAvatar(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => ['required', 'image', 'max:2048'], // 2MB max
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = [
                        'field' => $field,
                        'messages' => $messages,
                    ];
                }
                return $this->validationError($errors);
            }

            $file = $request->file('file');
            
            if (!$file || !$file->isValid()) {
                return $this->error(
                    MessageCode::FILE_UPLOAD_ERROR,
                    null,
                    null,
                    400
                );
            }

            $path = $file->store('avatars', 'public');
            $avatarUrl = Storage::disk('public')->url($path);

            return $this->success(['avatarUrl' => $avatarUrl]);
            
        } catch (\Exception $e) {
            \Log::error('Error uploading avatar: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get user by ID
     */
    public function getById(Request $request, int $id): JsonResponse
    {
        try {
            $user = User::select('id', 'name as username', 'email')->find($id);

            if (!$user) {
                return $this->notFound('User');
            }

            return $this->success($user);
            
        } catch (\Exception $e) {
            \Log::error('Error getting user by ID: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Search users
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $q = $request->query('q', '');
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);

            $query = User::select('id', 'name as username', 'email')
                ->where(function ($w) use ($q) {
                    $w->where('name', 'like', "%$q%")
                      ->orWhere('email', 'like', "%$q%");
                });

            $total = $query->count();
            $users = $query->skip(($page - 1) * $pageSize)
                          ->take($pageSize)
                          ->get();

            return $this->paginated(
                $users->toArray(),
                $page,
                $pageSize,
                $total
            );
            
        } catch (\Exception $e) {
            \Log::error('Error searching users: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}


