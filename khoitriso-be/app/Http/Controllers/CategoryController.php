<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        $query = Category::query();
        if ($request->filled('parentId')) {
            $query->where('parent_id', $request->integer('parentId'));
        }
        if (! filter_var($request->query('includeInactive', 'false'), FILTER_VALIDATE_BOOLEAN)) {
            $query->where('is_active', true);
        }
        $categories = $query->orderBy('order_index')->with('children')->get();
        return response()->json(['categories' => $categories]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => ['required','string','max:100'],
            'description' => ['required','string'],
            'parentId' => ['nullable','integer','exists:categories,id'],
            'icon' => ['required','string','max:50'],
        ]);
        $category = Category::create([
            'name' => $data['name'],
            'description' => $data['description'],
            'parent_id' => $data['parentId'] ?? null,
            'icon' => $data['icon'],
            'is_active' => true,
        ]);
        return response()->json(['success' => true, 'category' => $category], 201);
    }

    public function show(int $id)
    {
        $cat = Category::with(['children','courses','books'])->findOrFail($id);
        return response()->json($cat);
    }

    public function update(Request $request, int $id)
    {
        $cat = Category::findOrFail($id);
        $data = $request->validate([
            'name' => ['sometimes','string','max:100'],
            'description' => ['sometimes','string'],
            'parentId' => ['nullable','integer','exists:categories,id'],
            'icon' => ['sometimes','string','max:50'],
            'isActive' => ['sometimes','boolean'],
        ]);
        $cat->fill([
            'name' => $data['name'] ?? $cat->name,
            'description' => $data['description'] ?? $cat->description,
            'parent_id' => array_key_exists('parentId',$data) ? $data['parentId'] : $cat->parent_id,
            'icon' => $data['icon'] ?? $cat->icon,
            'is_active' => array_key_exists('isActive',$data) ? (bool)$data['isActive'] : $cat->is_active,
        ])->save();
        return response()->json(['success' => true, 'category' => $cat]);
    }

    public function destroy(int $id)
    {
        $cat = Category::withCount(['children','courses','books'])->findOrFail($id);
        if ($cat->children_count > 0 || $cat->courses_count > 0 || $cat->books_count > 0) {
            return response()->json(['success' => false, 'message' => 'Has children/content'], 400);
        }
        $cat->delete();
        return response()->json(['success' => true, 'message' => 'Category deleted successfully']);
    }
}


