<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

class UploadService
{
    private MessageService $messageService;
    private string $uploadWorkerBaseUrl;
    private string $jwtKey;
    private string $backendJwtKey;

    public function __construct(MessageService $messageService)
    {
        $this->messageService = $messageService;
        
        // Set default values - can be overridden by .env
        $this->uploadWorkerBaseUrl = config('services.upload_worker.base_url') 
            ?: env('UPLOAD_WORKER_BASE_URL') 
            ?: 'https://khoitriso-upload-worker.quang159258.workers.dev'; // Default fallback
        
        $this->jwtKey = config('services.upload_worker.jwt_key') 
            ?: env('UPLOAD_WORKER_JWT_KEY') 
            ?: 'your-local-jwt-secret-key-min-32-chars'; // Default fallback - hardcoded
        
        $this->backendJwtKey = config('services.upload_worker.backend_jwt_key') 
            ?: env('UPLOAD_WORKER_BACKEND_JWT_KEY') 
            ?: 'default-backend-jwt-secret-key-change-in-production'; // Default fallback
        
        // Log warning if using defaults
        if (!config('services.upload_worker.base_url') && !env('UPLOAD_WORKER_BASE_URL')) {
            Log::warning('UploadService: Using default upload worker base URL. Please configure UPLOAD_WORKER_BASE_URL in .env');
        }
    }

    /**
     * Generate presigned upload URL
     */
    public function presignUpload(array $data, ?string $userId = null, ?string $language = null): array
    {
        $isPublic = ($data['accessRole'] ?? null) === 'GUEST' || !isset($data['accessRole']);
        $folder = $data['folder'] ?? 'uploads';
        
        $uploadId = Str::uuid()->toString();
        $slugFileName = $this->generateSlug($data['fileName'] ?? 'file');
        $fileKey = $slugFileName;
        $accessRole = $data['accessRole'] ?? 'GUEST';
        
        $payload = [
            'fileKey' => $fileKey,
            'contentType' => $data['contentType'] ?? 'application/octet-stream',
            'uploadId' => $uploadId,
            'accessRole' => $accessRole,
        ];

        $uploadToken = $this->generateJwt($payload, 15); // 15 minutes

        $uploadUrl = "{$this->uploadWorkerBaseUrl}/upload/{$fileKey}?token={$uploadToken}";

        return [
            'uploadUrl' => $uploadUrl,
            'key' => $fileKey,
            'uploadId' => $uploadId,
            'accessRole' => $accessRole,
            'expiresIn' => 900, // 15 minutes in seconds
        ];
    }

    /**
     * Generate JWT token for upload worker
     */
    public function generateJwt(array $payload, int $expiresInMinutes = 15): string
    {
        if (empty($this->jwtKey)) {
            throw new \InvalidArgumentException('JWT key is not configured');
        }

        $now = time();
        $expires = $now + ($expiresInMinutes * 60);

        $tokenPayload = array_merge($payload, [
            'iat' => $now,
            'exp' => $expires,
        ]);

        return JWT::encode($tokenPayload, $this->jwtKey, 'HS256');
    }

    /**
     * Generate backend JWT token
     */
    public function generateBackendJwt(array $payload, int $expiresInMinutes = 15): string
    {
        if (empty($this->backendJwtKey)) {
            throw new \InvalidArgumentException('Backend JWT key is not configured');
        }

        $now = time();
        $expires = $now + ($expiresInMinutes * 60);

        $tokenPayload = array_merge($payload, [
            'iat' => $now,
            'exp' => $expires,
        ]);

        return JWT::encode($tokenPayload, $this->backendJwtKey, 'HS256');
    }

    /**
     * Delete file
     */
    public function deleteFile(string $fileKey): bool
    {
        try {
            $backendToken = $this->generateBackendJwt([
                'action' => 'delete',
                'key' => $fileKey,
            ], 5);

            $deleteUrl = "{$this->uploadWorkerBaseUrl}/files/{$fileKey}";
            
            $response = Http::withToken($backendToken)
                ->delete($deleteUrl);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Error deleting file: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Batch delete files
     */
    public function batchDeleteFiles(array $fileKeys): int
    {
        try {
            $backendToken = $this->generateBackendJwt([
                'action' => 'batch-delete',
                'keys' => $fileKeys,
            ], 5);

            $deleteUrl = "{$this->uploadWorkerBaseUrl}/files/batch-delete";
            
            $response = Http::withToken($backendToken)
                ->post($deleteUrl, ['keys' => $fileKeys]);

            if ($response->successful()) {
                $data = $response->json('data');
                return $data['deleted'] ?? 0;
            }
            
            return 0;
        } catch (\Exception $e) {
            Log::error('Error batch deleting files: ' . $e->getMessage());
            return 0;
        }
    }

    /**
     * Get file info
     */
    public function getFileInfo(string $fileKey): ?array
    {
        try {
            $backendToken = $this->generateBackendJwt([
                'action' => 'get-info',
                'key' => $fileKey,
            ], 5);

            $infoUrl = "{$this->uploadWorkerBaseUrl}/files/info/{$fileKey}";
            
            $response = Http::withToken($backendToken)
                ->get($infoUrl);

            if ($response->successful()) {
                $data = $response->json('data');
                return [
                    'key' => $data['key'] ?? $fileKey,
                    'size' => $data['size'] ?? 0,
                    'contentType' => $data['contentType'] ?? 'application/octet-stream',
                    'lastModified' => $data['lastModified'] ?? null,
                    'accessRole' => $data['accessRole'] ?? 'GUEST',
                    'exists' => $data['exists'] ?? false,
                ];
            }
            
            return null;
        } catch (\Exception $e) {
            Log::error('Error getting file info: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Check if file exists
     */
    public function fileExists(string $fileKey): bool
    {
        try {
            $fileInfo = $this->getFileInfo($fileKey);
            return $fileInfo['exists'] ?? false;
        } catch (\Exception $e) {
            Log::error('Error checking file existence: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Create file (simple upload)
     */
    public function createFileSimple(
        string $fileContent,
        string $fileName,
        string $contentType = 'application/octet-stream',
        string $accessRole = 'GUEST',
        ?string $folder = null
    ): ?string {
        try {
            $isPublic = $accessRole === 'GUEST' || empty($accessRole);
            $targetFolder = $isPublic ? "public/" . ($folder ?? 'uploads') : "private/" . ($folder ?? 'uploads');
            
            $slugFileName = $this->generateSlug($fileName);
            $fileKey = "{$targetFolder}/" . Str::uuid()->toString() . "-{$slugFileName}";
            
            $backendToken = $this->generateBackendJwt([
                'action' => 'create',
                'key' => $fileKey,
                'contentType' => $contentType,
                'accessRole' => $accessRole,
            ], 5);

            $createUrl = "{$this->uploadWorkerBaseUrl}/files";
            
            $response = Http::withToken($backendToken)
                ->asMultipart()
                ->attach('file', $fileContent, $fileName)
                ->attach('key', $fileKey)
                ->attach('contentType', $contentType)
                ->attach('accessRole', $accessRole)
                ->post($createUrl);

            return $response->successful() ? $fileKey : null;
        } catch (\Exception $e) {
            Log::error('Error creating file: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Update file
     */
    public function updateFileSimple(
        string $fileKey,
        ?string $newContent = null,
        ?string $newContentType = null,
        ?string $newAccessRole = null
    ): bool {
        try {
            $payload = [
                'action' => 'update',
                'key' => $fileKey,
            ];
            
            if ($newContentType) {
                $payload['newContentType'] = $newContentType;
            }
            if ($newAccessRole) {
                $payload['newAccessRole'] = $newAccessRole;
            }

            $backendToken = $this->generateBackendJwt($payload, 5);

            $updateUrl = "{$this->uploadWorkerBaseUrl}/files/{$fileKey}";
            
            $request = Http::withToken($backendToken);
            
            if ($newContent) {
                $request = $request->asMultipart()
                    ->attach('file', $newContent, 'file');
            } else {
                $request = $request->asForm();
            }
            
            if ($newContentType) {
                $request = $request->attach('contentType', $newContentType);
            }
            if ($newAccessRole) {
                $request = $request->attach('accessRole', $newAccessRole);
            }

            $response = $request->put($updateUrl);
            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Error updating file: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Delete file (simple)
     */
    public function deleteFileSimple(string $fileKey): bool
    {
        return $this->deleteFile($fileKey);
    }

    /**
     * Copy file
     */
    public function copyFileSimple(
        string $sourceFileKey,
        string $newFileName,
        string $accessRole = 'GUEST'
    ): ?string {
        try {
            $slugFileName = $this->generateSlug($newFileName);
            $targetKey = Str::uuid()->toString() . "-{$slugFileName}";
            
            $backendToken = $this->generateBackendJwt([
                'action' => 'copy',
                'sourceKey' => $sourceFileKey,
                'targetKey' => $targetKey,
                'accessRole' => $accessRole,
            ], 5);

            $copyUrl = "{$this->uploadWorkerBaseUrl}/files/copy";
            
            $response = Http::withToken($backendToken)
                ->post($copyUrl, [
                    'sourceKey' => $sourceFileKey,
                    'targetKey' => $targetKey,
                    'accessRole' => $accessRole,
                ]);

            return $response->successful() ? $targetKey : null;
        } catch (\Exception $e) {
            Log::error('Error copying file: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Confirm file upload
     */
    public function confirmFile(string $fileKey): bool
    {
        try {
            $backendToken = $this->generateBackendJwt([
                'action' => 'confirm',
                'key' => $fileKey,
            ], 5);

            $confirmUrl = "{$this->uploadWorkerBaseUrl}/files/{$fileKey}/confirm";
            
            $response = Http::withToken($backendToken)
                ->post($confirmUrl);

            return $response->successful();
        } catch (\Exception $e) {
            Log::error('Error confirming file: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Validate and extract file key from URL
     */
    public function validateAndExtractFileKey(string $fileUrl): array
    {
        if (empty($fileUrl)) {
            return [false, null, 'FileUrl is required'];
        }

        if (empty($this->uploadWorkerBaseUrl)) {
            return [false, null, 'UploadWorker BaseUrl is not configured'];
        }

        if (!str_starts_with($fileUrl, $this->uploadWorkerBaseUrl)) {
            return [false, null, "FileUrl must start with {$this->uploadWorkerBaseUrl}"];
        }

        try {
            $parsedUrl = parse_url($fileUrl);
            $pathParts = array_filter(explode('/', $parsedUrl['path'] ?? ''));
            $pathParts = array_values($pathParts);
            
            if (count($pathParts) >= 3 && 
                $pathParts[0] === 'files' && 
                in_array($pathParts[1], ['public', 'private'])) {
                $fileKey = implode('/', array_slice($pathParts, 1));
                return [true, $fileKey, null];
            } else {
                return [false, null, 'Invalid file URL format. Expected: {baseUrl}/files/{public|private}/...'];
            }
        } catch (\Exception $e) {
            return [false, null, "Invalid URL: {$e->getMessage()}"];
        }
    }

    /**
     * Validate and confirm file in one step
     */
    public function validateAndConfirmFile(string $fileUrl): bool
    {
        [$isValid, $fileKey, ] = $this->validateAndExtractFileKey($fileUrl);
        if (!$isValid || empty($fileKey)) {
            return false;
        }

        return $this->confirmFile($fileKey);
    }

    /**
     * List orphan files
     */
    public function listOrphanFiles(int $maxAgeDays = 7): ?array
    {
        try {
            $backendToken = $this->generateBackendJwt([
                'action' => 'list-orphans',
                'maxAge' => $maxAgeDays,
            ], 5);

            $orphansUrl = "{$this->uploadWorkerBaseUrl}/files/orphans?maxAge={$maxAgeDays}";
            
            $response = Http::withToken($backendToken)
                ->get($orphansUrl);

            if ($response->successful()) {
                $data = $response->json('data');
                $orphans = $data['orphans'] ?? [];
                
                return array_map(function ($orphan) {
                    return [
                        'key' => $orphan['key'] ?? null,
                        'size' => $orphan['size'] ?? 0,
                        'uploaded' => $orphan['uploaded'] ?? null,
                        'orphanSince' => $orphan['orphanSince'] ?? null,
                    ];
                }, $orphans);
            }
            
            return null;
        } catch (\Exception $e) {
            Log::error('Error listing orphan files: ' . $e->getMessage());
            return null;
        }
    }

    /**
     * Cleanup orphan files
     */
    public function cleanupOrphanFiles(int $maxAgeDays = 7): array
    {
        try {
            $backendToken = $this->generateBackendJwt([
                'action' => 'cleanup-orphans',
                'maxAge' => $maxAgeDays,
            ], 5);

            $cleanupUrl = "{$this->uploadWorkerBaseUrl}/files/cleanup-orphans?maxAge={$maxAgeDays}";
            
            $response = Http::withToken($backendToken)
                ->delete($cleanupUrl);

            if ($response->successful()) {
                $data = $response->json('data');
                return [
                    'deleted' => $data['deleted'] ?? 0,
                    'failed' => $data['failed'] ?? 0,
                ];
            }
            
            return ['deleted' => 0, 'failed' => 0];
        } catch (\Exception $e) {
            Log::error('Error cleaning up orphan files: ' . $e->getMessage());
            return ['deleted' => 0, 'failed' => 0];
        }
    }

    /**
     * Generate slug from filename
     */
    public function generateSlug(string $fileName): string
    {
        if (empty($fileName)) {
            return 'file';
        }

        $lastDotIndex = strrpos($fileName, '.');
        $nameWithoutExtension = $fileName;
        $extension = '';

        if ($lastDotIndex !== false && $lastDotIndex > 0) {
            $nameWithoutExtension = substr($fileName, 0, $lastDotIndex);
            $extension = substr($fileName, $lastDotIndex);
        }

        // Vietnamese character mapping
        $vietnameseMap = [
            'á' => 'a', 'à' => 'a', 'ả' => 'a', 'ã' => 'a', 'ạ' => 'a',
            'ă' => 'a', 'ắ' => 'a', 'ằ' => 'a', 'ẳ' => 'a', 'ẵ' => 'a', 'ặ' => 'a',
            'â' => 'a', 'ấ' => 'a', 'ầ' => 'a', 'ẩ' => 'a', 'ẫ' => 'a', 'ậ' => 'a',
            'é' => 'e', 'è' => 'e', 'ẻ' => 'e', 'ẽ' => 'e', 'ẹ' => 'e',
            'ê' => 'e', 'ế' => 'e', 'ề' => 'e', 'ể' => 'e', 'ễ' => 'e', 'ệ' => 'e',
            'í' => 'i', 'ì' => 'i', 'ỉ' => 'i', 'ĩ' => 'i', 'ị' => 'i',
            'ó' => 'o', 'ò' => 'o', 'ỏ' => 'o', 'õ' => 'o', 'ọ' => 'o',
            'ô' => 'o', 'ố' => 'o', 'ồ' => 'o', 'ổ' => 'o', 'ỗ' => 'o', 'ộ' => 'o',
            'ơ' => 'o', 'ớ' => 'o', 'ờ' => 'o', 'ở' => 'o', 'ỡ' => 'o', 'ợ' => 'o',
            'ú' => 'u', 'ù' => 'u', 'ủ' => 'u', 'ũ' => 'u', 'ụ' => 'u',
            'ư' => 'u', 'ứ' => 'u', 'ừ' => 'u', 'ử' => 'u', 'ữ' => 'u', 'ự' => 'u',
            'ý' => 'y', 'ỳ' => 'y', 'ỷ' => 'y', 'ỹ' => 'y', 'ỵ' => 'y',
            'đ' => 'd',
            'Á' => 'a', 'À' => 'a', 'Ả' => 'a', 'Ã' => 'a', 'Ạ' => 'a',
            'Ă' => 'a', 'Ắ' => 'a', 'Ằ' => 'a', 'Ẳ' => 'a', 'Ẵ' => 'a', 'Ặ' => 'a',
            'Â' => 'a', 'Ấ' => 'a', 'Ầ' => 'a', 'Ẩ' => 'a', 'Ẫ' => 'a', 'Ậ' => 'a',
            'É' => 'e', 'È' => 'e', 'Ẻ' => 'e', 'Ẽ' => 'e', 'Ẹ' => 'e',
            'Ê' => 'e', 'Ế' => 'e', 'Ề' => 'e', 'Ể' => 'e', 'Ễ' => 'e', 'Ệ' => 'e',
            'Í' => 'i', 'Ì' => 'i', 'Ỉ' => 'i', 'Ĩ' => 'i', 'Ị' => 'i',
            'Ó' => 'o', 'Ò' => 'o', 'Ỏ' => 'o', 'Õ' => 'o', 'Ọ' => 'o',
            'Ô' => 'o', 'Ố' => 'o', 'Ồ' => 'o', 'Ổ' => 'o', 'Ỗ' => 'o', 'Ộ' => 'o',
            'Ơ' => 'o', 'Ớ' => 'o', 'Ờ' => 'o', 'Ở' => 'o', 'Ỡ' => 'o', 'Ợ' => 'o',
            'Ú' => 'u', 'Ù' => 'u', 'Ủ' => 'u', 'Ũ' => 'u', 'Ụ' => 'u',
            'Ư' => 'u', 'Ứ' => 'u', 'Ừ' => 'u', 'Ử' => 'u', 'Ữ' => 'u', 'Ự' => 'u',
            'Ý' => 'y', 'Ỳ' => 'y', 'Ỷ' => 'y', 'Ỹ' => 'y', 'Ỵ' => 'y',
            'Đ' => 'd',
        ];

        $slug = strtolower($nameWithoutExtension);
        $slug = strtr($slug, $vietnameseMap);
        $slug = str_replace([' ', '_'], '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        
        // Remove invalid filename characters
        $invalidChars = ['<', '>', ':', '"', '/', '\\', '|', '?', '*'];
        foreach ($invalidChars as $char) {
            $slug = str_replace($char, '', $slug);
        }
        
        // Remove non-alphanumeric except hyphens and dots
        $slug = preg_replace('/[^a-z0-9\-\.]/', '', $slug);
        $slug = trim($slug, '-');
        
        if (empty($slug)) {
            $slug = 'file';
        }

        if (strlen($slug) > 100) {
            $slug = substr($slug, 0, 100);
            $slug = rtrim($slug, '-');
        }

        return $slug . $extension;
    }
}

