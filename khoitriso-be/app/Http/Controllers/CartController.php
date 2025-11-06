<?php

namespace App\Http\Controllers;

use App\Models\CartItem;
use App\Models\Course;
use App\Models\Book;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function index(Request $request)
    {
        $items = CartItem::where('user_id', $request->user()->id)->get();
        
        // Load course or book for each item based on item_type
        $items->each(function ($item) {
            if ($item->item_type == 1) {
                // Load course with instructor
                $item->course = Course::with('instructor')->find($item->item_id);
            } elseif ($item->item_type == 2) {
                // Load book with author
                $item->book = Book::with('author')->find($item->item_id);
            }
            
            // Transform item_type to string for frontend
            $itemTypeMap = [1 => 'course', 2 => 'book'];
            $item->item_type = $itemTypeMap[$item->item_type] ?? 'course';
        });
            
        return response()->json(['data' => $items, 'totalItems' => $items->count()]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'item_id' => ['required_without:itemId','integer','min:1'],
            'itemId' => ['required_without:item_id','integer','min:1'],
            'item_type' => ['required_without:itemType','integer','in:1,2'],
            'itemType' => ['required_without:item_type','string','in:course,book'],
            'quantity' => ['nullable','integer','min:1'],
        ]);
        
        // Support both formats: snake_case (item_id, item_type) and camelCase (itemId, itemType)
        $itemId = $data['item_id'] ?? $data['itemId'];
        
        // Handle item_type: can be integer (1,2) or string (course, book)
        if (isset($data['item_type']) && is_int($data['item_type'])) {
            $itemTypeInt = $data['item_type'];
        } else {
            $itemTypeMap = ['course' => 1, 'book' => 2];
            $itemTypeStr = $data['itemType'] ?? $data['item_type'] ?? 'course';
            $itemTypeInt = $itemTypeMap[$itemTypeStr] ?? 1;
        }
        
        $existing = CartItem::where('user_id', $request->user()->id)
            ->where('item_id', $itemId)
            ->where('item_type', $itemTypeInt)
            ->first();
            
        if ($existing) {
            // Update quantity if already exists
            $existing->quantity = ($existing->quantity ?? 1) + ($data['quantity'] ?? 1);
            $existing->save();
            return response()->json(['success' => true, 'data' => $existing], 200);
        }
        
        $item = CartItem::create([
            'user_id' => $request->user()->id,
            'item_id' => $itemId,
            'item_type' => $itemTypeInt,
            'quantity' => $data['quantity'] ?? 1,
        ]);
        return response()->json(['success' => true, 'data' => $item], 201);
    }

    public function update(int $id, Request $request)
    {
        $data = $request->validate([
            'quantity' => ['required','integer','min:1'],
        ]);
        
        $item = CartItem::where('user_id', $request->user()->id)
            ->where('id', $id)
            ->firstOrFail();
            
        $item->quantity = $data['quantity'];
        $item->save();
        
        return response()->json(['success' => true, 'data' => $item]);
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


