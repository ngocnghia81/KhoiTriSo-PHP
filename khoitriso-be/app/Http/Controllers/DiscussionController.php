<?php

namespace App\Http\Controllers;

use App\Models\LessonDiscussion;
use Illuminate\Http\Request;

class DiscussionController extends Controller
{
    public function list(int $lessonId, Request $request)
    {
        $q = LessonDiscussion::where('lesson_id', $lessonId)->whereNull('parent_id');
        $sortBy = $request->query('sortBy', 'created_at');
        $sortOrder = $request->query('sortOrder', 'desc');
        $res = $q->orderBy($sortBy, $sortOrder)->paginate((int) $request->query('pageSize', 20));
        return response()->json(['discussions' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function store(int $lessonId, Request $request)
    {
        $data = $request->validate([
            'content' => ['required','string'],
            'videoTimestamp' => ['nullable','integer','min:0'],
            'parentId' => ['nullable','integer','min:1'],
        ]);
        $d = LessonDiscussion::create([
            'lesson_id' => $lessonId,
            'user_id' => $request->user()->id,
            'content' => $data['content'],
            'video_timestamp' => $data['videoTimestamp'] ?? null,
            'parent_id' => $data['parentId'] ?? null,
        ]);
        return response()->json(['success' => true, 'discussion' => $d], 201);
    }

    public function update(int $id, Request $request)
    {
        $data = $request->validate(['content' => ['required','string']]);
        $d = LessonDiscussion::findOrFail($id);
        $d->content = $data['content'];
        $d->save();
        return response()->json(['success' => true, 'discussion' => $d]);
    }

    public function destroy(int $id)
    {
        $d = LessonDiscussion::findOrFail($id);
        $d->delete();
        return response()->json(['success' => true, 'message' => 'Discussion deleted successfully']);
    }

    public function like(int $id)
    {
        $d = LessonDiscussion::findOrFail($id);
        $d->like_count = ($d->like_count ?? 0) + 1;
        $d->save();
        return response()->json(['success' => true]);
    }

    public function replies(int $id, Request $request)
    {
        $res = LessonDiscussion::where('parent_id', $id)->orderBy('created_at', 'desc')->paginate((int) $request->query('pageSize', 10));
        return response()->json(['replies' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function reply(int $id, Request $request)
    {
        $data = $request->validate(['content' => ['required','string']]);
        $r = LessonDiscussion::create([
            'lesson_id' => LessonDiscussion::findOrFail($id)->lesson_id,
            'user_id' => $request->user()->id,
            'parent_id' => $id,
            'content' => $data['content'],
        ]);
        return response()->json(['success' => true, 'reply' => $r], 201);
    }
}


