<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Course;
use App\Models\Book;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Search Controller
 */
class SearchController extends BaseController
{
    public function search(Request $request): JsonResponse
    {
        try {
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
            
            return $this->success(['results' => $results]);

        } catch (\Exception $e) {
            \Log::error('Error in search: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function suggestions(Request $request): JsonResponse
    {
        try {
            $q = trim((string) $request->query('q', ''));
            
            $suggestions = Course::where('title','like',"%$q%")
                ->limit(10)->pluck('title');
            
            return $this->success([
                'suggestions' => $suggestions,
                'popular' => ['calculus','algebra','geometry']
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in suggestions: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
