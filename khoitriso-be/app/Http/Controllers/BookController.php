<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookActivationCode;
use App\Models\BookChapter;
use App\Models\UserBook;
use Illuminate\Http\Request;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $q = Book::query()->where('is_active', true)->with('category:id,name','author:id,name');
        if ($request->filled('category')) $q->where('category_id', $request->integer('category'));
        if ($s = $request->query('search')) $q->where('title', 'like', "%$s%");
        if ($request->filled('approvalStatus')) $q->where('approval_status', $request->integer('approvalStatus'));
        $limit = (int) $request->query('pageSize', 20);
        $res = $q->paginate(max(1, min(100, $limit)));
        return response()->json([
            'data' => $res->items(), 
            'total' => $res->total(), 
            'current_page' => $res->currentPage(),
            'last_page' => $res->lastPage(),
            'per_page' => $res->perPage(),
            'from' => $res->firstItem(),
            'to' => $res->lastItem()
        ]);
    }

    public function show(int $id)
    {
        $book = Book::with(['author','category','chapters' => function ($q) { $q->orderBy('order_index'); }])->findOrFail($id);
        return response()->json($book);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'title' => ['required','string','max:200'],
            'description' => ['required','string'],
            'isbn' => ['required','string','max:20','unique:books,isbn'],
            'coverImage' => ['required','string','max:255'],
            'price' => ['required','numeric','min:0'],
            'categoryId' => ['nullable','integer','exists:categories,id'],
            'ebookFile' => ['required','string','max:255'],
            'staticPagePath' => ['required','string'],
            'language' => ['nullable','string','max:10'],
            'publicationYear' => ['nullable','integer'],
            'edition' => ['nullable','string','max:50'],
        ]);
        $book = Book::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'isbn' => $data['isbn'],
            'cover_image' => $data['coverImage'],
            'price' => $data['price'],
            'category_id' => $data['categoryId'] ?? null,
            'ebook_file' => $data['ebookFile'],
            'static_page_path' => $data['staticPagePath'],
            'author_id' => $request->user()->id,
            'approval_status' => 1,
            'language' => $data['language'] ?? 'vi',
            'publication_year' => $data['publicationYear'] ?? null,
            'edition' => $data['edition'] ?? null,
        ]);
        return response()->json(['success' => true, 'book' => $book], 201);
    }

    public function update(Request $request, int $id)
    {
        $book = Book::findOrFail($id);
        $data = $request->validate([
            'title' => ['sometimes','string','max:200'],
            'description' => ['sometimes','string'],
            'coverImage' => ['sometimes','string','max:255'],
            'price' => ['sometimes','numeric','min:0'],
            'categoryId' => ['sometimes','integer','exists:categories,id'],
            'ebookFile' => ['sometimes','string','max:255'],
            'language' => ['sometimes','string','max:10'],
            'publicationYear' => ['sometimes','integer'],
            'edition' => ['sometimes','string','max:50'],
        ]);
        $book->fill([
            'title' => $data['title'] ?? $book->title,
            'description' => $data['description'] ?? $book->description,
            'cover_image' => $data['coverImage'] ?? $book->cover_image,
            'price' => $data['price'] ?? $book->price,
            'category_id' => $data['categoryId'] ?? $book->category_id,
            'ebook_file' => $data['ebookFile'] ?? $book->ebook_file,
            'language' => $data['language'] ?? $book->language,
            'publication_year' => $data['publicationYear'] ?? $book->publication_year,
            'edition' => $data['edition'] ?? $book->edition,
        ])->save();
        return response()->json(['success' => true, 'book' => $book]);
    }

    public function destroy(int $id)
    {
        $book = Book::findOrFail($id);
        $book->is_active = false;
        $book->save();
        return response()->json(['success' => true, 'message' => 'Book deleted successfully']);
    }

    public function activate(Request $request)
    {
        $data = $request->validate([
            'activationCode' => ['required','string','max:50'],
        ]);
        $code = BookActivationCode::where('activation_code', $data['activationCode'])->first();
        if (! $code || $code->is_used) {
            return response()->json(['success' => false, 'message' => 'Invalid/used code'], 400);
        }
        $code->is_used = true;
        $code->used_by_id = $request->user()->id;
        $code->save();

        $userBook = UserBook::create([
            'activation_code_id' => $code->id,
            'user_id' => $request->user()->id,
            'expires_at' => now()->addYears(2),
            'is_active' => true,
        ]);
        return response()->json(['success' => true, 'userBook' => $userBook]);
    }

    public function myBooks(Request $request)
    {
        $pageSize = (int) $request->query('pageSize', 20);
        $query = UserBook::where('user_id', $request->user()->id)->with(['activationCode','activationCode.book']);
        $res = $query->paginate(max(1, min(100, $pageSize)));
        return response()->json(['userBooks' => $res->items(), 'total' => $res->total(), 'hasMore' => $res->hasMorePages()]);
    }

    public function chapters(int $id)
    {
        $chapters = BookChapter::where('book_id', $id)->orderBy('order_index')->get();
        return response()->json(['chapters' => $chapters]);
    }
}


