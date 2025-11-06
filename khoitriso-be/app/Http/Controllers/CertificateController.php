<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\Certificate;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Certificate Controller
 */
class CertificateController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $q = Certificate::where('user_id', $request->user()->id);
            
            if ($request->filled('itemType')) {
                $q->where('item_type', $request->integer('itemType'));
            }
            
            $page = (int) $request->query('page', 1);
            $pageSize = (int) $request->query('pageSize', 20);
            
            $total = $q->count();
            $certificates = $q->orderByDesc('issued_at')
                ->skip(($page - 1) * $pageSize)
                ->take($pageSize)
                ->get();
            
            return $this->paginated($certificates->toArray(), $page, $pageSize, $total);

        } catch (\Exception $e) {
            \Log::error('Error in certificates index: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function show(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $c = Certificate::where('user_id', $request->user()->id)->find($id);
            
            if (!$c) {
                return $this->notFound('Certificate');
            }
            
            return $this->success($c);

        } catch (\Exception $e) {
            \Log::error('Error in certificate show: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function generate(Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $validator = Validator::make($request->all(), [
                'itemType' => ['required','integer','in:1,2'],
                'itemId' => ['required','integer','min:1'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            
            $c = Certificate::create([
                'user_id' => $request->user()->id,
                'item_type' => $data['itemType'],
                'item_id' => $data['itemId'],
                'certificate_number' => 'CERT-'.date('Y').'-'.str_pad((string) (Certificate::max('id') + 1), 6, '0', STR_PAD_LEFT),
                'completion_percentage' => 100,
                'final_score' => 100,
                'certificate_url' => null,
                'is_valid' => true,
            ]);
            
            return $this->success($c);

        } catch (\Exception $e) {
            \Log::error('Error in certificate generate: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function download(int $id, Request $request): JsonResponse
    {
        try {
            if (!$request->user()) {
                return $this->unauthorized();
            }

            $c = Certificate::where('user_id', $request->user()->id)->find($id);
            
            if (!$c) {
                return $this->notFound('Certificate');
            }
            
            return $this->success(['url' => $c->certificate_url]);

        } catch (\Exception $e) {
            \Log::error('Error in certificate download: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function verify(string $number, Request $request): JsonResponse
    {
        try {
            $c = Certificate::where('certificate_number', $number)->first();
            
            return $this->success([
                'valid' => (bool) $c,
                'certificate' => $c
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in certificate verify: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
