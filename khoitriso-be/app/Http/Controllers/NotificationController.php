<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

/**
 * Notification Controller
 */
class NotificationController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $q = Notification::where('user_id', $request->user()->id);
            
            if ($request->filled('isRead')) {
                $isRead = filter_var($request->query('isRead'), FILTER_VALIDATE_BOOLEAN);
                $q->whereRaw('is_read = ?', [$isRead ? 'true' : 'false']);
            }
            
            if ($request->filled('type')) {
                $q->where('type', $request->integer('type'));
            }
            
            if ($request->filled('priority')) {
                $q->where('priority', $request->integer('priority'));
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $notifications = $q->orderByDesc('created_at')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            // Use whereRaw for PostgreSQL boolean compatibility
            $unreadCount = Notification::where('user_id', $request->user()->id)
                ->whereRaw('is_read = false')
                ->count();
            
            return response()->json([
                'success' => true,
                'message' => $this->getLanguage($request) === 'vi' ? 'Thành công' : 'Success',
                'data' => [
                    'notifications' => $notifications,
                    'unreadCount' => $unreadCount,
                ],
                'pagination' => [
                    'page' => $page,
                    'limit' => $pageSize,
                    'total' => $total,
                    'totalPages' => ceil($total / $pageSize),
                    'hasNextPage' => $page < ceil($total / $pageSize),
                    'hasPreviousPage' => $page > 1,
                ],
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in notifications index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function markRead(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $n = Notification::where('user_id', $request->user()->id)->find($id);
            
            if (!$n) {
                return $this->notFound('Notification');
            }
            
            // Use DB::statement for PostgreSQL boolean compatibility
            DB::statement('UPDATE notifications SET is_read = true::boolean WHERE id = ?', [$id]);
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in markRead: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function markAllRead(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            // Use DB::statement for PostgreSQL boolean compatibility
            DB::statement('UPDATE notifications SET is_read = true::boolean WHERE user_id = ?', [$request->user()->id]);
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in markAllRead: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'userId' => ['required','integer','exists:users,id'],
                'title' => ['required','string','max:200'],
                'message' => ['required','string'],
                'type' => ['required','integer','in:1,2,3,4,5'],
                'actionUrl' => ['nullable','string','max:500'],
                'priority' => ['nullable','integer','in:1,2,3,4'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $n = Notification::create([
                'user_id' => $data['userId'],
                'title' => $data['title'],
                'message' => $data['message'],
                'type' => $data['type'],
                'action_url' => $data['actionUrl'] ?? null,
                'priority' => $data['priority'] ?? 2,
            ]);
            
            return $this->success($n);

        } catch (\Exception $e) {
            \Log::error('Error in notification store: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
