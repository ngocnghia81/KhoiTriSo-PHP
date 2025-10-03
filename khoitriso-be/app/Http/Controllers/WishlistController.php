<?php

namespace App\Http\Controllers;

use App\Models\Wishlist;
use Illuminate\Http\Request;

class WishlistController extends Controller
{
    public function index(Request $request)
    {
        $q = Wishlist::where('user_id', $request->user()->id);
        if ($request->filled('itemType')) $q->where('item_type', $request->integer('itemType'));
        $res = $q->orderByDesc('created_at')->paginate((int) $request->query('pageSize', 20));
        return response()->json(['items' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'itemType' => ['required','integer','in:1,2,3'],
            'itemId' => ['required','integer','min:1'],
        ]);
        $exists = Wishlist::where('user_id', $request->user()->id)
            ->where('item_type', $data['itemType'])->where('item_id', $data['itemId'])->first();
        if ($exists) return response()->json(['success' => true, 'item' => $exists]);
        $w = Wishlist::create([
            'user_id' => $request->user()->id,
            'item_type' => $data['itemType'],
            'item_id' => $data['itemId'],
        ]);
        return response()->json(['success' => true, 'item' => $w], 201);
    }

    public function destroy(int $id, Request $request)
    {
        $w = Wishlist::where('user_id', $request->user()->id)->findOrFail($id);
        $w->delete();
        return response()->json(['success' => true, 'message' => 'Removed from wishlist']);
    }

    public function clear(Request $request)
    {
        Wishlist::where('user_id', $request->user()->id)->delete();
        return response()->json(['success' => true, 'message' => 'Wishlist cleared']);
    }
}


