<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Book;
use App\Models\BookActivationCode;
use App\Models\BookChapter;
use App\Models\UserBook;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Book Controller
 * Manage books, chapters, activation codes
 */
class BookController extends BaseController
{
    /**
     * Get list of books
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $q = Book::query()->where('is_active', true)->with('category:id,name','author:id,name');
            
            if ($request->filled('category')) {
                $q->where('category_id', $request->integer('category'));
            }
            
            if ($s = $request->query('search')) {
                $q->where('title', 'like', "%$s%");
            }
            
            if ($request->filled('approvalStatus')) {
                $q->where('approval_status', $request->integer('approvalStatus'));
            }
            
            $page = (int) $request->query('page', 1);
            $limit = (int) $request->query('pageSize', 20);
            $limit = max(1, min(100, $limit));
            
            $total = $q->count();
            $books = $q->skip(($page - 1) * $limit)->take($limit)->get();
            
            return $this->paginated($books->toArray(), $page, $limit, $total);

        } catch (\Exception $e) {
            \Log::error('Error in books index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get book details
     */
    public function show(Request $request, int $id): JsonResponse
    {
        try {
            $book = Book::with(['author','category','chapters' => function ($q) {
                $q->orderBy('order_index');
            }])->find($id);
            
            if (!$book) {
                return $this->notFound('Book');
            }
            
            return $this->success($book);

        } catch (\Exception $e) {
            \Log::error('Error in book show: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Create new book
     */
    public function store(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
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

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
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
            
            return $this->success($book);

        } catch (\Exception $e) {
            \Log::error('Error in book store: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Update book
     */
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $book = Book::find($id);
            
            if (!$book) {
                return $this->notFound('Book');
            }

            $validator = Validator::make($request->all(), [
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

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
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
            
            return $this->success($book);

        } catch (\Exception $e) {
            \Log::error('Error in book update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Delete book (soft delete)
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        try {
            $book = Book::find($id);
            
            if (!$book) {
                return $this->notFound('Book');
            }
            
            $book->is_active = false;
            $book->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in book destroy: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Activate book with code
     */
    public function activate(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'activationCode' => ['required','string','max:50'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $code = BookActivationCode::where('activation_code', $data['activationCode'])->first();
            
            if (!$code) {
                return $this->error(
                    MessageCode::INVALID_ACTIVATION_CODE,
                    null,
                    null,
                    400
                );
            }
            
            if ($code->is_used) {
                return $this->error(
                    MessageCode::ACTIVATION_CODE_ALREADY_USED,
                    null,
                    null,
                    400
                );
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
            
            return $this->success($userBook);

        } catch (\Exception $e) {
            \Log::error('Error in book activate: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get user's books
     */
    public function myBooks(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            $pageSize = max(1, min(100, $pageSize));
            
            $query = UserBook::where('user_id', $request->user()->id)
                ->with(['activationCode','activationCode.book']);
            
            $total = $query->count();
            $userBooks = $query->skip(($page - 1) * $pageSize)->take($pageSize)->get();
            
            return $this->paginated($userBooks->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in myBooks: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get book chapters
     */
    public function chapters(Request $request, int $id): JsonResponse
    {
        try {
            $chapters = BookChapter::where('book_id', $id)->orderBy('order_index')->get();
            
            return $this->success(['chapters' => $chapters]);

        } catch (\Exception $e) {
            \Log::error('Error in book chapters: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}








