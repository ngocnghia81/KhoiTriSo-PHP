<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

/**
 * Upload Controller
 */
class UploadController extends BaseController
{
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
