<?php

namespace App\Http\Responses;

use Illuminate\Http\JsonResponse;
use App\Constants\MessageCode;

/**
 * Response Builder để tạo response chuẩn
 */
class ResponseBuilder
{
    private string $language;

    /**
     * Constructor
     *
     * @param string $language Ngôn ngữ
     */
    public function __construct(string $language = 'vi')
    {
        $this->language = $language;
    }

    /**
     * Tạo success response
     *
     * @param mixed $data Dữ liệu trả về
     * @param string $message Message (default: "success" or translated)
     * @param int $statusCode HTTP status code
     * @return JsonResponse
     */
    public function success($data = null, string $message = '', int $statusCode = 200): JsonResponse
    {
        // Nếu không có message, dùng message mặc định theo ngôn ngữ
        if (empty($message)) {
            $message = $this->language === 'vi' ? 'Thành công' : 'Success';
        }

        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
        ], $statusCode);
    }

    /**
     * Tạo paginated success response
     *
     * @param array $data Dữ liệu trả về
     * @param int $page Trang hiện tại
     * @param int $limit Số lượng mỗi trang
     * @param int $total Tổng số items
     * @param string $message Message (default: "success" or translated)
     * @return JsonResponse
     */
    public function paginated(array $data, int $page, int $limit, int $total, string $message = ''): JsonResponse
    {
        // Nếu không có message, dùng message mặc định theo ngôn ngữ
        if (empty($message)) {
            $message = $this->language === 'vi' ? 'Thành công' : 'Success';
        }

        $totalPages = ceil($total / $limit);
        
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => $totalPages,
                'hasNextPage' => $page < $totalPages,
                'hasPreviousPage' => $page > 1,
            ],
        ], 200);
    }

    /**
     * Tạo error response
     *
     * @param string $messageCode Message code
     * @param string $message Message
     * @param string|null $errorCode Error code (optional)
     * @param int $statusCode HTTP status code
     * @return JsonResponse
     */
    public function error(string $messageCode, string $message, ?string $errorCode = null, int $statusCode = 400): JsonResponse
    {
        $response = [
            'success' => false,
            'messageCode' => $messageCode,
            'message' => $message,
        ];

        if ($errorCode !== null) {
            $response['errorCode'] = $errorCode;
        }

        return response()->json($response, $statusCode);
    }

    /**
     * Tạo validation error response
     *
     * @param array $errors Danh sách lỗi validation
     * @param string|null $message Message (optional)
     * @return JsonResponse
     */
    public function validationError(array $errors, ?string $message = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'messageCode' => MessageCode::VALIDATION_ERROR,
            'message' => $message ?? 'Validation error',
            'errors' => $errors,
        ], 422);
    }

    /**
     * Tạo not found error response
     *
     * @param string $resource Resource name
     * @return JsonResponse
     */
    public function notFound(string $resource): JsonResponse
    {
        return response()->json([
            'success' => false,
            'messageCode' => MessageCode::NOT_FOUND,
            'message' => "{$resource} not found",
        ], 404);
    }

    /**
     * Tạo unauthorized error response
     *
     * @param string|null $message Message (optional)
     * @return JsonResponse
     */
    public function unauthorized(?string $message = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'messageCode' => MessageCode::UNAUTHORIZED,
            'message' => $message ?? 'Unauthorized',
        ], 401);
    }

    /**
     * Tạo forbidden error response
     *
     * @param string|null $message Message (optional)
     * @return JsonResponse
     */
    public function forbidden(?string $message = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'messageCode' => MessageCode::FORBIDDEN,
            'message' => $message ?? 'Forbidden',
        ], 403);
    }

    /**
     * Tạo internal server error response
     *
     * @param string|null $message Message (optional)
     * @return JsonResponse
     */
    public function internalError(?string $message = null): JsonResponse
    {
        return response()->json([
            'success' => false,
            'messageCode' => MessageCode::INTERNAL_SERVER_ERROR,
            'message' => $message ?? 'Internal server error',
        ], 500);
    }
}

