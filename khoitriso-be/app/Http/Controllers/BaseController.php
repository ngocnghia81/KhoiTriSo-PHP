<?php

namespace App\Http\Controllers;

use App\Services\MessageService;
use App\Http\Responses\ResponseBuilder;
use App\Constants\MessageCode;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Base Controller để các controller khác kế thừa
 * Cung cấp các method tiện ích để tạo response chuẩn
 */
abstract class BaseController extends Controller
{
    protected MessageService $messageService;

    /**
     * Constructor
     */
    public function __construct()
    {
        $this->messageService = app(MessageService::class);
    }

    /**
     * Tạo ResponseBuilder với language từ request
     *
     * @param Request|null $request
     * @return ResponseBuilder
     */
    protected function createResponseBuilder(?Request $request = null): ResponseBuilder
    {
        $language = $this->getLanguage($request);
        return new ResponseBuilder($language);
    }

    /**
     * Lấy language từ request
     *
     * @param Request|null $request
     * @return string
     */
    protected function getLanguage(?Request $request = null): string
    {
        if ($request === null) {
            $request = request();
        }

        $acceptLanguage = $request->header('Accept-Language');
        return $this->messageService->parseAcceptLanguage($acceptLanguage);
    }

    /**
     * Tạo success response
     *
     * @param mixed $data Dữ liệu
     * @param string|null $message Custom message (optional, default: "Thành công" hoặc "Success")
     * @param Request|null $request
     * @return JsonResponse
     */
    protected function success($data = null, ?string $message = null, ?Request $request = null): JsonResponse
    {
        $responseBuilder = $this->createResponseBuilder($request);
        
        return $responseBuilder->success($data, $message ?? '');
    }

    /**
     * Tạo paginated success response
     *
     * @param array $data Dữ liệu
     * @param int $page Trang hiện tại
     * @param int $limit Số lượng mỗi trang
     * @param int $total Tổng số items
     * @param string|null $message Custom message (optional, default: "Thành công" hoặc "Success")
     * @param Request|null $request
     * @return JsonResponse
     */
    protected function paginated(array $data, int $page, int $limit, int $total, ?string $message = null, ?Request $request = null): JsonResponse
    {
        $responseBuilder = $this->createResponseBuilder($request);
        
        return $responseBuilder->paginated($data, $page, $limit, $total, $message ?? '');
    }

    /**
     * Tạo error response
     *
     * @param string $messageCode Message code
     * @param string|null $message Custom message (optional)
     * @param string|null $errorCode Error code (optional)
     * @param int $statusCode HTTP status code
     * @param Request|null $request
     * @return JsonResponse
     */
    protected function error(string $messageCode, ?string $message = null, ?string $errorCode = null, int $statusCode = 400, ?Request $request = null): JsonResponse
    {
        $language = $this->getLanguage($request);
        $responseBuilder = $this->createResponseBuilder($request);
        $finalMessage = $message ?? $this->messageService->getMessage($messageCode, $language);
        
        return $responseBuilder->error($messageCode, $finalMessage, $errorCode, $statusCode);
    }

    /**
     * Tạo validation error response
     *
     * @param array $errors Danh sách lỗi validation
     * @param string|null $message Custom message (optional)
     * @param Request|null $request
     * @return JsonResponse
     */
    protected function validationError(array $errors, ?string $message = null, ?Request $request = null): JsonResponse
    {
        $language = $this->getLanguage($request);
        $responseBuilder = $this->createResponseBuilder($request);
        $finalMessage = $message ?? $this->messageService->getMessage(MessageCode::VALIDATION_ERROR, $language);
        
        return $responseBuilder->validationError($errors, $finalMessage);
    }

    /**
     * Tạo not found error response
     *
     * @param string $resource Resource name
     * @param Request|null $request
     * @return JsonResponse
     */
    protected function notFound(string $resource, ?Request $request = null): JsonResponse
    {
        $responseBuilder = $this->createResponseBuilder($request);
        return $responseBuilder->notFound($resource);
    }

    /**
     * Tạo unauthorized error response
     *
     * @param string|null $message Custom message (optional)
     * @param Request|null $request
     * @return JsonResponse
     */
    protected function unauthorized(?string $message = null, ?Request $request = null): JsonResponse
    {
        $language = $this->getLanguage($request);
        $responseBuilder = $this->createResponseBuilder($request);
        $finalMessage = $message ?? $this->messageService->getMessage(MessageCode::UNAUTHORIZED, $language);
        
        return $responseBuilder->unauthorized($finalMessage);
    }

    /**
     * Tạo forbidden error response
     *
     * @param string|null $message Custom message (optional)
     * @param Request|null $request
     * @return JsonResponse
     */
    protected function forbidden(?string $message = null, ?Request $request = null): JsonResponse
    {
        $language = $this->getLanguage($request);
        $responseBuilder = $this->createResponseBuilder($request);
        $finalMessage = $message ?? $this->messageService->getMessage(MessageCode::FORBIDDEN, $language);
        
        return $responseBuilder->forbidden($finalMessage);
    }

    /**
     * Tạo internal server error response
     *
     * @param string|null $message Custom message (optional)
     * @param Request|null $request
     * @return JsonResponse
     */
    protected function internalError(?string $message = null, ?Request $request = null): JsonResponse
    {
        $language = $this->getLanguage($request);
        $responseBuilder = $this->createResponseBuilder($request);
        $finalMessage = $message ?? $this->messageService->getMessage(MessageCode::INTERNAL_SERVER_ERROR, $language);
        
        return $responseBuilder->internalError($finalMessage);
    }

    /**
     * Lấy message theo message code và language
     *
     * @param string $messageCode Message code
     * @param array $params Tham số để thay thế trong message
     * @param Request|null $request
     * @return string
     */
    protected function getMessage(string $messageCode, array $params = [], ?Request $request = null): string
    {
        $language = $this->getLanguage($request);
        return $this->messageService->getMessage($messageCode, $language, $params);
    }
}

