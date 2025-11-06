<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\User;
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
            
            if ($request->filled('role')) {
                $q->where('role', $request->integer('role'));
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
                ->get();
            
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
                'role' => ['nullable','integer'],
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
}
