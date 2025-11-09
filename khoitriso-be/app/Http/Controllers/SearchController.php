<?php

namespace App\Http\Controllers;

use App\Models\Course;
use App\Models\Book;
use App\Models\User;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $pageSize = (int) $request->query('pageSize', 20);
        $type = $request->query('type', 'all');

        $results = [
            'courses' => [],
            'books' => [],
            'instructors' => [],
        ];
        if ($type === 'all' || $type === 'courses') {
            $results['courses'] = Course::select(
                'id',
                'title',
                'thumbnail',
                'rating',
                'price',
                'description',
                'level',
                'total_students',
                'estimated_duration',
                'instructor_id'
            )
                ->where('title', 'like', "%$q%")
                ->whereRaw('is_published = true')
                ->whereRaw('is_active = true')
                ->limit($pageSize)
                ->get()
                ->map(function($course) {
                    return [
                        'id' => $course->id,
                        'title' => $course->title,
                        'thumbnail' => $course->thumbnail,
                        'rating' => $course->rating,
                        'price' => $course->price,
                        'description' => $course->description,
                        'level' => $course->level,
                        'students' => $course->total_students,
                        'duration' => $course->estimated_duration,
                    ];
                });
        }
        if ($type === 'all' || $type === 'books') {
            $results['books'] = Book::select(
                'id',
                'title',
                'cover_image',
                'price',
                'description',
                'author_id'
            )
                ->where('title', 'like', "%$q%")
                ->whereRaw('is_active = true')
                ->limit($pageSize)
                ->get()
                ->map(function($book) {
                    return [
                        'id' => $book->id,
                        'title' => $book->title,
                        'cover_image' => $book->cover_image,
                        'price' => $book->price,
                        'description' => $book->description,
                    ];
                });
        }
        if ($type === 'all' || $type === 'instructors') {
            $results['instructors'] = User::select('id','name as name')
                ->where('name', 'like', "%$q%")
                ->limit($pageSize)->get();
        }
        return response()->json(['results' => $results, 'total' => null, 'hasMore' => null]);
    }

    public function suggestions(Request $request)
    {
        $q = trim((string) $request->query('q', ''));
        $suggestions = Course::where('title','like',"%$q%")
            ->limit(10)->pluck('title');
        return response()->json(['suggestions' => $suggestions, 'popular' => ['calculus','algebra','geometry']]);
    }
}


