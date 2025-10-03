<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $q = Notification::where('user_id', $request->user()->id);
        if ($request->filled('isRead')) $q->where('is_read', filter_var($request->query('isRead'), FILTER_VALIDATE_BOOLEAN));
        if ($request->filled('type')) $q->where('type', $request->integer('type'));
        if ($request->filled('priority')) $q->where('priority', $request->integer('priority'));
        $res = $q->orderByDesc('created_at')->paginate((int) $request->query('pageSize', 20));
        $unreadCount = Notification::where('user_id', $request->user()->id)->where('is_read', false)->count();
        return response()->json(['notifications' => $res->items(), 'total' => $res->total(), 'unreadCount' => $unreadCount, 'hasMore' => $res->hasMorePages()]);
    }

    public function markRead(int $id, Request $request)
    {
        $n = Notification::where('user_id', $request->user()->id)->findOrFail($id);
        $n->is_read = true;
        $n->save();
        return response()->json(['success' => true]);
    }

    public function markAllRead(Request $request)
    {
        Notification::where('user_id', $request->user()->id)->update(['is_read' => true]);
        return response()->json(['success' => true]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'userId' => ['required','integer','exists:users,id'],
            'title' => ['required','string','max:200'],
            'message' => ['required','string'],
            'type' => ['required','integer','in:1,2,3,4,5'],
            'actionUrl' => ['nullable','string','max:500'],
            'priority' => ['nullable','integer','in:1,2,3,4'],
        ]);
        $n = Notification::create([
            'user_id' => $data['userId'],
            'title' => $data['title'],
            'message' => $data['message'],
            'type' => $data['type'],
            'action_url' => $data['actionUrl'] ?? null,
            'priority' => $data['priority'] ?? 2,
        ]);
        return response()->json(['success' => true, 'notification' => $n], 201);
    }
}


