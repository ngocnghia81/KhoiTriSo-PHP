<?php

namespace App\Http\Controllers;

use App\Models\Book;
use App\Models\BookActivationCode;
use App\Models\BookChapter;
use App\Models\UserBook;
use App\Models\Question;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class BookController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $userId = $user ? $user->id : null;
        
        $q = Book::query()
            ->whereRaw('is_active = true')
            ->whereRaw('is_published = true')
            ->where('approval_status', 1) // Only show approved books
            ->with('category:id,name','author:id,name');
        if ($request->filled('category')) $q->where('category_id', $request->integer('category'));
        if ($s = $request->query('search')) $q->where('title', 'like', "%$s%");
        if ($request->filled('approvalStatus')) $q->where('approval_status', $request->integer('approvalStatus'));
        $limit = (int) $request->query('pageSize', 20);
        $res = $q->paginate(max(1, min(100, $limit)));
        
        // Get purchased book IDs for authenticated user
        // Check both: user_books (via activation codes) and paid orders
        $purchasedBookIds = [];
        if ($userId) {
            // Method 1: Check via user_books (activation codes)
            $booksViaActivation = DB::table('user_books')
                ->join('book_activation_codes', 'user_books.activation_code_id', '=', 'book_activation_codes.id')
                ->where('user_books.user_id', $userId)
                ->whereRaw('user_books.is_active = true')
                ->whereNotNull('book_activation_codes.book_id')
                ->distinct()
                ->pluck('book_activation_codes.book_id')
                ->toArray();
            
            // Method 2: Check via paid orders (status = 2 = Paid)
            $booksViaOrders = DB::table('orders')
                ->join('order_items', 'orders.id', '=', 'order_items.order_id')
                ->where('orders.user_id', $userId)
                ->where('orders.status', 2) // Paid
                ->where('order_items.item_type', 2) // Book
                ->distinct()
                ->pluck('order_items.item_id')
                ->toArray();
            
            // Merge both methods
            $purchasedBookIds = array_unique(array_merge($booksViaActivation, $booksViaOrders));
        }
        
        // Add is_purchased flag to each book
        $booksData = collect($res->items())->map(function ($book) use ($purchasedBookIds) {
            $bookArray = $book->toArray();
            $bookArray['is_purchased'] = in_array($book->id, $purchasedBookIds);
            return $bookArray;
        });
        
        return response()->json([
            'data' => $booksData->toArray(), 
            'total' => $res->total(), 
            'current_page' => $res->currentPage(),
            'last_page' => $res->lastPage(),
            'per_page' => $res->perPage(),
            'from' => $res->firstItem(),
            'to' => $res->lastItem()
        ]);
    }

    public function show(int $id, Request $request)
    {
        // Only show active, published, and approved books for regular users
        $book = Book::whereRaw('is_active = true')
            ->whereRaw('is_published = true')
            ->where('approval_status', 1)
            ->with(['author','category','chapters' => function ($q) { $q->orderBy('order_index'); }])
            ->findOrFail($id);
        
        // Check if user owns this book
        // Try to authenticate user if token is provided (for public route)
        $user = null;
        $token = $request->bearerToken();
        
        if ($token) {
            try {
                // Use Sanctum's personal access token to authenticate
                $personalAccessToken = \Laravel\Sanctum\PersonalAccessToken::findToken($token);
                if ($personalAccessToken) {
                    $user = $personalAccessToken->tokenable;
                }
            } catch (\Exception $e) {
                // Token invalid or expired, continue as guest
                \Log::warning('Failed to authenticate user in BookController::show: ' . $e->getMessage());
            }
        }
        
        $isOwned = false;
        if ($user) {
            // Check via UserBook -> activationCode -> book_id
            $userBook = \App\Models\UserBook::where('user_id', $user->id)
                ->whereRaw('is_active = true')
                ->whereHas('activationCode', function($q) use ($id) {
                    $q->where('book_id', $id);
                })
                ->first();
            
            $isOwned = $userBook !== null;
        }
        
        // Add question count to each chapter
        $chapters = $book->chapters->map(function($chapter) {
            $questionCount = Question::where('context_type', 2)
                ->where('context_id', $chapter->id)
                ->whereRaw('is_active = true')
                ->count();
            
            $chapterData = $chapter->toArray();
            $chapterData['question_count'] = $questionCount;
            return $chapterData;
        });
        
        $bookData = $book->toArray();
        $bookData['is_owned'] = $isOwned;
        $bookData['chapters'] = $chapters;
        
        return response()->json($bookData);
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
        $user = $request->user();
        // If user is admin, auto-approve and publish. If instructor, set to pending.
        $approvalStatus = ($user->role ?? '') === 'admin' ? 1 : 0; // 0 = pending, 1 = approved
        $isPublished = ($user->role ?? '') === 'admin' ? true : false;
        
        $book = Book::create([
            'title' => $data['title'],
            'description' => $data['description'],
            'isbn' => $data['isbn'],
            'cover_image' => $data['coverImage'],
            'price' => $data['price'],
            'category_id' => $data['categoryId'] ?? null,
            'ebook_file' => $data['ebookFile'],
            'static_page_path' => $data['staticPagePath'],
            'author_id' => $user->id,
            'approval_status' => $approvalStatus,
            'is_published' => $isPublished,
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
        // Soft delete: set is_active = false (use direct update with raw SQL for PostgreSQL boolean)
        \DB::table('books')
            ->where('id', $id)
            ->update([
                'is_active' => \DB::raw('false'),
                'updated_at' => now(),
            ]);
        return response()->json(['success' => true, 'message' => 'Book deleted successfully']);
    }

    public function activate(Request $request)
    {
        try {
            $data = $request->validate([
                'activationCode' => ['required','string','max:50'],
            ]);
            // Use whereRaw for PostgreSQL boolean compatibility
            $code = BookActivationCode::where('activation_code', $data['activationCode'])
                ->whereRaw('is_used = false')
                ->whereNull('used_by_id')
                ->first();
            
            if (! $code) {
                return response()->json(['success' => false, 'message' => 'Mã kích hoạt không hợp lệ hoặc đã được sử dụng'], 400);
            }
            
            // Use DB::table for PostgreSQL boolean compatibility
            DB::table('book_activation_codes')
                ->where('id', $code->id)
                ->update([
                    'is_used' => DB::raw('true'),
                    'used_by_id' => $request->user()->id,
                    'updated_at' => now(),
                ]);
            
            // Refresh the code model to get updated values
            $code->refresh();

            // Use DB::table for PostgreSQL compatibility
            $userBookId = DB::table('user_books')->insertGetId([
                'activation_code_id' => $code->id,
                'user_id' => $request->user()->id,
                'expires_at' => now()->addYears(2),
                'is_active' => DB::raw('true'),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            $userBook = UserBook::find($userBookId);
            
            // Load relationships
            $userBook->load(['activationCode.book']);
            
            return response()->json([
                'success' => true, 
                'userBook' => $userBook,
                'message' => 'Kích hoạt sách thành công'
            ]);
        } catch (\Exception $e) {
            \Log::error('Error activating book: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => 'Có lỗi xảy ra khi kích hoạt sách'], 500);
        }
    }

    public function myBooks(Request $request)
    {
        try {
            $user = $request->user();
            if (!$user) {
                return response()->json(['error' => 'Unauthorized'], 401);
            }

            $pageSize = (int) $request->query('pageSize', 20);
            $query = UserBook::where('user_id', $user->id)
                ->whereRaw('is_active = true')
                ->with(['activationCode', 'activationCode.book']);
            
            $res = $query->paginate(max(1, min(100, $pageSize)));
            
            return response()->json([
                'userBooks' => $res->items(),
                'total' => $res->total(),
                'hasMore' => $res->hasMorePages()
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in myBooks: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return response()->json(['error' => 'Internal server error'], 500);
        }
    }

    public function chapters(int $id)
    {
        $chapters = BookChapter::where('book_id', $id)->orderBy('order_index')->get();
        return response()->json(['chapters' => $chapters]);
    }

    public function chapterQuestions(int $bookId, int $chapterId, Request $request)
    {
        try {
            // Verify chapter belongs to book
            $chapter = BookChapter::where('id', $chapterId)
                ->where('book_id', $bookId)
                ->firstOrFail();
            
            // Check if user owns the book
            $isOwned = false;
            if ($request->user()) {
                $userBook = \App\Models\UserBook::where('user_id', $request->user()->id)
                    ->whereRaw('is_active = true')
                    ->whereHas('activationCode', function($q) use ($bookId) {
                        $q->where('book_id', $bookId);
                    })
                    ->first();
                
                $isOwned = $userBook !== null;
            }
            
            if (!$isOwned) {
                return response()->json(['error' => 'Bạn cần mua sách để xem nội dung'], 403);
            }
            
            // Get questions for this chapter (context_type = 2 for book_chapter)
            $questions = Question::where('context_type', 2)
                ->where('context_id', $chapterId)
                ->whereRaw('is_active = true')
                ->with(['options', 'bookSolutions'])
                ->orderBy('order_index')
                ->get();
            
            // Format questions with solutions
            $formattedQuestions = $questions->map(function($question) {
                $solution = $question->bookSolutions->first();
                
                return [
                    'id' => $question->id,
                    'content' => $question->question_content,
                    'type' => $question->question_type, // 1 = multiple choice, 2 = essay
                    'difficulty' => $question->difficulty_level,
                    'points' => $question->default_points,
                    'explanation' => $question->explanation_content,
                    'image' => $question->question_image,
                    'video_url' => $question->video_url,
                    'order_index' => $question->order_index,
                    'options' => $question->options->map(function($option) {
                        return [
                            'id' => $option->id,
                            'content' => $option->option_content,
                            'image' => $option->option_image,
                            'is_correct' => $option->is_correct,
                            'points' => $option->points_value,
                            'explanation' => $option->explanation_text,
                            'order_index' => $option->order_index,
                        ];
                    })->sortBy('order_index')->values(),
                    'solution' => $solution ? [
                        'id' => $solution->id,
                        'type' => $solution->solution_type, // 1 = video, 2 = text, 3 = latex, 4 = image
                        'content' => $solution->content,
                        'video_url' => $solution->video_url,
                        'image_url' => $solution->image_url,
                        'latex_content' => $solution->latex_content,
                    ] : null,
                ];
            });
            
            return response()->json([
                'chapter' => [
                    'id' => $chapter->id,
                    'title' => $chapter->title,
                    'description' => $chapter->description,
                    'order_index' => $chapter->order_index,
                ],
                'questions' => $formattedQuestions,
            ]);
        } catch (\Exception $e) {
            \Log::error('Error in chapterQuestions: ' . $e->getMessage());
            return response()->json(['error' => 'Lỗi khi tải câu hỏi'], 500);
        }
    }
}


