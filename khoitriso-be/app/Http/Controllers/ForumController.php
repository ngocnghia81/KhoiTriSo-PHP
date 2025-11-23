<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\ForumQuestion;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

/**
 * Forum Controller
 */
class ForumController extends BaseController
{
    public function list(Request $request): JsonResponse
    {
        try {
            $page = max(1, (int) $request->query('page', 1));
            $pageSize = max(1, min(100, (int) $request->query('pageSize', 20)));
            $q = trim((string) $request->query('q', ''));
            $tag = trim((string) $request->query('tag', ''));

            $filter = [];
            if ($q !== '') {
                $filter['$or'] = [
                    ['title' => ['$regex' => $q, '$options' => 'i']],
                    ['content' => ['$regex' => $q, '$options' => 'i']],
                ];
            }
            if ($tag !== '') {
                $filter['tags'] = $tag;
            }

            $total = ForumQuestion::where($filter)->count();
            $data = ForumQuestion::where($filter)
                ->orderBy('created_at', 'desc')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($data->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in forum list: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function get($id, Request $request): JsonResponse
    {
        try {
            $q = ForumQuestion::find($id);
            
            if (!$q) {
                return $this->notFound('Forum question');
            }
            
            $q->increment('views');
            
            return $this->success($q);

        } catch (\Exception $e) {
            \Log::error('Error in forum get: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function create(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'title' => ['required','string','min:5'],
                'content' => ['required','string','min:10'],
                'tags' => ['array'],
                'tags.*' => ['string'],
                'category' => ['array'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $validated = $validator->validated();
            $user = auth()->user();
            $author = [
                'id' => $user->id ?? null,
                'name' => $user->name ?? $user->username ?? 'Thành viên',
                'email' => $user->email ?? null,
                'avatar' => $user->avatar ?? null,
            ];
            
            $doc = ForumQuestion::create([
                'title' => $validated['title'],
                'content' => $validated['content'],
                'tags' => $validated['tags'] ?? [],
                'category' => $validated['category'] ?? ['name' => 'Tổng quát', 'slug' => 'general'],
                'author' => $author,
                'user_id' => $user->id ?? null,
                'views' => 0,
                'votes' => 0,
                'answers' => [],
                'isSolved' => false,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            
            return $this->success($doc);

        } catch (\Exception $e) {
            \Log::error('Error in forum create: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function update($id, Request $request): JsonResponse
    {
        try {
            $q = ForumQuestion::find($id);
            
            if (!$q) {
                return $this->notFound('Forum question');
            }
            
            $q->fill($request->only(['title', 'content', 'tags', 'category']));
            $q->save();
            
            return $this->success($q);

        } catch (\Exception $e) {
            \Log::error('Error in forum update: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function delete($id, Request $request): JsonResponse
    {
        try {
            ForumQuestion::where('_id', $id)->delete();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in forum delete: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function vote($id, Request $request): JsonResponse
    {
        try {
            $direction = $request->input('direction');
            $q = ForumQuestion::find($id);
            
            if (!$q) {
                return $this->notFound('Forum question');
            }
            
            if ($direction === 'up') {
                $q->votes = ($q->votes ?? 0) + 1;
            } elseif ($direction === 'down') {
                $q->votes = ($q->votes ?? 0) - 1;
            }
            
            $q->save();
            
            return $this->success(['votes' => $q->votes]);

        } catch (\Exception $e) {
            \Log::error('Error in forum vote: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function listAnswers($id, Request $request): JsonResponse
    {
        try {
            $q = ForumQuestion::find($id);
            
            if (!$q) {
                return $this->notFound('Forum question');
            }
            
            return $this->success($q->answers ?? []);

        } catch (\Exception $e) {
            \Log::error('Error in forum listAnswers: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function addAnswer($id, Request $request): JsonResponse
    {
        try {
            $q = ForumQuestion::find($id);
            
            if (!$q) {
                return $this->notFound('Forum question');
            }
            
            $content = $request->input('body', $request->input('content'));
            
            if (!$content) {
                return $this->error(MessageCode::VALIDATION_ERROR, 'Content is required');
            }
            
            $user = auth()->user();
            $answers = $q->answers ?? [];
            $newAnswer = [
                '_id' => (string) Str::uuid(),
                'content' => $content,
                'author' => [
                    'id' => $user->id ?? null,
                    'name' => $user->name ?? $user->username ?? 'Thành viên',
                    'email' => $user->email ?? null,
                    'avatar' => $user->avatar ?? null,
                ],
                'user_id' => $user->id ?? null,
                'votes' => 0,
                'isAccepted' => false,
                'createdAt' => now(),
                'updatedAt' => now(),
            ];
            $answers[] = $newAnswer;
            
            $q->answers = $answers;
            $q->save();
            
            return $this->success($newAnswer);

        } catch (\Exception $e) {
            \Log::error('Error in forum addAnswer: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function updateAnswer($id, $answerId, Request $request): JsonResponse
    {
        try {
            $q = ForumQuestion::find($id);
            
            if (!$q) {
                return $this->notFound('Forum question');
            }
            
            $answers = $q->answers ?? [];
            foreach ($answers as &$a) {
                if (($a['_id'] ?? null) == $answerId) {
                    if ($request->filled('content')) {
                        $a['content'] = $request->string('content');
                    }
                }
            }
            
            $q->answers = $answers;
            $q->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in forum updateAnswer: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function deleteAnswer($id, $answerId, Request $request): JsonResponse
    {
        try {
            $q = ForumQuestion::find($id);
            
            if (!$q) {
                return $this->notFound('Forum question');
            }
            
            $q->answers = array_values(array_filter($q->answers ?? [], fn ($a) => ($a['_id'] ?? null) != $answerId));
            $q->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in forum deleteAnswer: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function voteAnswer($id, $answerId, Request $request): JsonResponse
    {
        try {
            $q = ForumQuestion::find($id);
            
            if (!$q) {
                return $this->notFound('Forum question');
            }
            
            $direction = $request->input('direction');
            $answers = $q->answers ?? [];
            
            foreach ($answers as &$a) {
                if (($a['_id'] ?? null) == $answerId) {
                    $a['votes'] = (int) ($a['votes'] ?? 0) + ($direction === 'up' ? 1 : -1);
                }
            }
            
            $q->answers = $answers;
            $q->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in forum voteAnswer: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function acceptAnswer($id, $answerId, Request $request): JsonResponse
    {
        try {
            $q = ForumQuestion::find($id);
            
            if (!$q) {
                return $this->notFound('Forum question');
            }
            
            $answers = $q->answers ?? [];
            foreach ($answers as &$a) {
                $a['isAccepted'] = (($a['_id'] ?? null) == $answerId);
            }
            
            $q->answers = $answers;
            $q->isSolved = true;
            $q->save();
            
            return $this->success(null);

        } catch (\Exception $e) {
            \Log::error('Error in forum acceptAnswer: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function tags(Request $request): JsonResponse
    {
        try {
            $pipeline = [
                ['$unwind' => '$tags'],
                ['$group' => ['_id' => '$tags', 'count' => ['$sum' => 1]]],
                ['$sort' => ['count' => -1]],
                ['$limit' => 100],
            ];
            
            $agg = ForumQuestion::raw(fn ($collection) => $collection->aggregate($pipeline));
            $tags = [];
            foreach ($agg as $t) {
                $tags[] = $t['_id'];
            }
            
            return $this->success($tags);

        } catch (\Exception $e) {
            \Log::error('Error in forum tags: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
