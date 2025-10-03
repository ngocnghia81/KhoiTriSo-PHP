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
            $results['courses'] = Course::select('id','title','thumbnail','rating')
                ->where('title', 'like', "%$q%")
                ->limit($pageSize)->get();
        }
        if ($type === 'all' || $type === 'books') {
            $results['books'] = Book::select('id','title','cover_image as coverImage','price')
                ->where('title', 'like', "%$q%")
                ->limit($pageSize)->get();
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


