<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Services\UploadService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

/**
 * Upload Controller
 */
class UploadController extends BaseController
{
    private UploadService $uploadService;

    public function __construct(UploadService $uploadService)
    {
        parent::__construct(); // Initialize BaseController's messageService
        $this->uploadService = $uploadService;
    }

    /**
     * Generate presigned upload URL
     */
    public function presign(Request $request): JsonResponse
    {
        try {
            // Accept both PascalCase (C# style) and camelCase (JS style)
            $input = $request->all();
            
            // Normalize to camelCase for internal use
            $normalized = [
                'fileName' => $input['FileName'] ?? $input['fileName'] ?? null,
                'contentType' => $input['ContentType'] ?? $input['contentType'] ?? 'application/octet-stream',
                'accessRole' => $input['AccessRole'] ?? $input['accessRole'] ?? 'GUEST',
                'folder' => $input['Folder'] ?? $input['folder'] ?? 'uploads',
            ];
            
            $validator = Validator::make($normalized, [
                'fileName' => ['required', 'string', 'max:255'],
                'contentType' => ['nullable', 'string', 'max:100'],
                'accessRole' => ['nullable', 'string', 'in:GUEST,USER,ADMIN'],
                'folder' => ['nullable', 'string', 'max:100'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $data = $validator->validated();
            $userId = $request->user()?->id;
            $language = $this->getLanguage($request);

            $result = $this->uploadService->presignUpload($data, $userId, $language);

            return $this->success($result, null, $request);
        } catch (\InvalidArgumentException $e) {
            \Log::error('Upload service configuration error: ' . $e->getMessage());
            return $this->error(
                \App\Constants\MessageCode::EXTERNAL_SERVICE_ERROR,
                $e->getMessage(),
                null,
                500
            );
        } catch (\Exception $e) {
            \Log::error('Error generating presigned URL: ' . $e->getMessage());
            \Log::error('Stack trace: ' . $e->getTraceAsString());
            return $this->internalError();
        }
    }

    /**
     * Confirm file upload
     */
    public function confirm(Request $request, string $fileKey): JsonResponse
    {
        try {
            $confirmed = $this->uploadService->confirmFile($fileKey);
            
            if ($confirmed) {
                return $this->success(['confirmed' => true]);
            }
            
            return $this->error(MessageCode::EXTERNAL_SERVICE_ERROR, 'Failed to confirm file', null, 500);
        } catch (\Exception $e) {
            \Log::error('Error confirming file: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Get file info
     */
    public function info(Request $request, string $fileKey): JsonResponse
    {
        try {
            $fileInfo = $this->uploadService->getFileInfo($fileKey);
            
            if ($fileInfo === null) {
                return $this->notFound('File');
            }
            
            return $this->success($fileInfo);
        } catch (\Exception $e) {
            \Log::error('Error getting file info: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Delete file
     */
    public function delete(Request $request, string $fileKey): JsonResponse
    {
        try {
            $deleted = $this->uploadService->deleteFile($fileKey);
            
            if ($deleted) {
                return $this->success(['deleted' => true]);
            }
            
            return $this->error(MessageCode::EXTERNAL_SERVICE_ERROR, 'Failed to delete file', null, 500);
        } catch (\Exception $e) {
            \Log::error('Error deleting file: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    /**
     * Batch delete files
     */
    public function batchDelete(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'keys' => ['required', 'array', 'min:1'],
                'keys.*' => ['required', 'string'],
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $fileKeys = $request->input('keys');
            $deletedCount = $this->uploadService->batchDeleteFiles($fileKeys);

            return $this->success(['deleted' => $deletedCount]);
        } catch (\Exception $e) {
            \Log::error('Error batch deleting files: ' . $e->getMessage());
            return $this->internalError();
        }
    }
    public function image(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => ['required', 'image', 'max:5120'], // 5MB
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $file = $request->file('file');
            
            if (!$file || !$file->isValid()) {
                return $this->error(MessageCode::FILE_UPLOAD_ERROR, null, null, 400);
            }
            
            $path = $file->store('images', 'public');
            
            return $this->success([
                'url' => Storage::disk('public')->url($path),
                'filename' => basename($path),
                'size' => $file->getSize()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in image upload: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function video(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => ['required', 'mimetypes:video/mp4,video/mpeg,video/quicktime', 'max:102400'], // 100MB
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $file = $request->file('file');
            
            if (!$file || !$file->isValid()) {
                return $this->error(MessageCode::FILE_UPLOAD_ERROR, null, null, 400);
            }
            
            $path = $file->store('videos', 'public');
            
            return $this->success([
                'url' => Storage::disk('public')->url($path),
                'filename' => basename($path),
                'size' => $file->getSize(),
                'duration' => null
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in video upload: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function document(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => ['required', 'mimes:pdf,doc,docx,ppt,pptx,xls,xlsx', 'max:10240'], // 10MB
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $file = $request->file('file');
            
            if (!$file || !$file->isValid()) {
                return $this->error(MessageCode::FILE_UPLOAD_ERROR, null, null, 400);
            }
            
            $path = $file->store('docs', 'public');
            
            return $this->success([
                'url' => Storage::disk('public')->url($path),
                'filename' => basename($path),
                'size' => $file->getSize()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in document upload: ' . $e->getMessage());
            return $this->internalError();
        }
    }

    public function ebook(Request $request): JsonResponse
    {
        try {
            $validator = Validator::make($request->all(), [
                'file' => ['required', 'mimes:pdf,epub', 'max:20480'], // 20MB
            ]);

            if ($validator->fails()) {
                $errors = [];
                foreach ($validator->errors()->toArray() as $field => $messages) {
                    $errors[] = ['field' => $field, 'messages' => $messages];
                }
                return $this->validationError($errors);
            }

            $file = $request->file('file');
            
            if (!$file || !$file->isValid()) {
                return $this->error(MessageCode::FILE_UPLOAD_ERROR, null, null, 400);
            }
            
            $path = $file->store('ebooks', 'public');
            
            return $this->success([
                'url' => Storage::disk('public')->url($path),
                'filename' => basename($path),
                'size' => $file->getSize()
            ]);

        } catch (\Exception $e) {
            \Log::error('Error in ebook upload: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
