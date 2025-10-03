<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $items = CartItem::where('user_id', $request->user()->id)->get();
        return response()->json(['cartItems' => $items, 'totalItems' => $items->count()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'itemId' => ['required','integer','min:1'],
            'itemType' => ['required','integer','in:1,2,3'],
        ]);
        $existing = CartItem::where('user_id', $request->user()->id)
            ->where('item_id', $data['itemId'])
            ->where('item_type', $data['itemType'])
            ->first();
        if ($existing) {
            return response()->json(['success' => false, 'message' => 'Already in cart'], 400);
        }
        $item = CartItem::create([
            'user_id' => $request->user()->id,
            'item_id' => $data['itemId'],
            'item_type' => $data['itemType'],
        ]);
        return response()->json(['success' => true, 'cartItem' => $item], 201);
    }

    public function destroy(int $id, Request $request)
    {
        $item = CartItem::where('user_id', $request->user()->id)->where('id', $id)->firstOrFail();
        $item->delete();
        return response()->json(['success' => true, 'message' => 'Item removed from cart']);
    }

    public function clear(Request $request)
    {
        CartItem::where('user_id', $request->user()->id)->delete();
        return response()->json(['success' => true, 'message' => 'Cart cleared successfully']);
    }
}


