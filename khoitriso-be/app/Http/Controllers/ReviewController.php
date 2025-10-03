<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;

class ReviewController extends Controller
{
    public function index(Request $request)
    {
        $q = Review::query();
        if ($request->filled('itemType')) $q->where('item_type', $request->integer('itemType'));
        if ($request->filled('itemId')) $q->where('item_id', $request->integer('itemId'));
        if ($request->filled('rating')) $q->where('rating', $request->integer('rating'));
        $res = $q->orderBy($request->query('sortBy', 'created_at'), $request->query('sortOrder', 'desc'))
            ->paginate((int) $request->query('pageSize', 20));
        return response()->json(['reviews' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'itemType' => ['required','integer','in:1,2,3'],
            'itemId' => ['required','integer','min:1'],
            'rating' => ['required','integer','min:1','max:5'],
            'reviewTitle' => ['nullable','string','max:200'],
            'reviewContent' => ['nullable','string'],
        ]);
        $exists = Review::where('user_id', $request->user()->id)
            ->where('item_type', $data['itemType'])->where('item_id', $data['itemId'])->first();
        if ($exists) return response()->json(['success' => false, 'message' => 'Already reviewed'], 400);
        $r = Review::create([
            'user_id' => $request->user()->id,
            'item_type' => $data['itemType'],
            'item_id' => $data['itemId'],
            'rating' => $data['rating'],
            'review_title' => $data['reviewTitle'] ?? null,
            'review_content' => $data['reviewContent'] ?? null,
            'is_verified_purchase' => false,
        ]);
        return response()->json(['success' => true, 'review' => $r], 201);
    }

    public function update(int $id, Request $request)
    {
        $r = Review::where('user_id', $request->user()->id)->findOrFail($id);
        $data = $request->validate([
            'rating' => ['sometimes','integer','min:1','max:5'],
            'reviewTitle' => ['sometimes','string','max:200'],
            'reviewContent' => ['sometimes','string'],
        ]);
        $r->fill([
            'rating' => $data['rating'] ?? $r->rating,
            'review_title' => $data['reviewTitle'] ?? $r->review_title,
            'review_content' => $data['reviewContent'] ?? $r->review_content,
        ])->save();
        return response()->json(['success' => true, 'review' => $r]);
    }

    public function destroy(int $id, Request $request)
    {
        $r = Review::where('user_id', $request->user()->id)->findOrFail($id);
        $r->delete();
        return response()->json(['success' => true, 'message' => 'Review deleted successfully']);
    }

    public function helpful(int $id)
    {
        $r = Review::findOrFail($id);
        $r->helpful_count = ($r->helpful_count ?? 0) + 1;
        $r->save();
        return response()->json(['success' => true]);
    }
}


