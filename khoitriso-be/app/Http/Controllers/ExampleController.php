<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Example Controller - Ví dụ sử dụng BaseController
 */
class ExampleController extends BaseController
{
    /**
     * Success response example
     */
    public function successExample(Request $request): JsonResponse
    {
        $data = [
            'id' => 1,
            'name' => 'Example',
            'description' => 'This is an example',
        ];

        // Cách 1: Success với message mặc định ("Thành công" hoặc "Success")
        return $this->success($data);

        // Cách 2: Override message custom
        // return $this->success($data, 'Custom success message');
    }

    /**
     * Paginated response example
     */
    public function paginatedExample(Request $request): JsonResponse
    {
        $data = [
            ['id' => 1, 'name' => 'Item 1'],
            ['id' => 2, 'name' => 'Item 2'],
            ['id' => 3, 'name' => 'Item 3'],
        ];

        $page = $request->input('page', 1);
        $limit = $request->input('limit', 10);
        $total = 100; // Tổng số items trong database

        // Success response với pagination
        return $this->paginated($data, $page, $limit, $total);
        
        // Hoặc với custom message
        // return $this->paginated($data, $page, $limit, $total, 'Custom message');
    }

    /**
     * Error response example
     */
    public function errorExample(Request $request): JsonResponse
    {
        // Cách 1: Error response cơ bản
        return $this->error(MessageCode::NOT_FOUND, null, null, 404);

        // Cách 2: Error với custom message
        // return $this->error(MessageCode::NOT_FOUND, 'Custom error message', null, 404);

        // Cách 3: Error với error code
        // return $this->error(MessageCode::INTERNAL_SERVER_ERROR, null, 'ERR_500', 500);
    }

    /**
     * Validation error example
     */
    public function validationErrorExample(Request $request): JsonResponse
    {
        $errors = [
            'email' => ['Email không hợp lệ'],
            'password' => ['Mật khẩu phải có ít nhất 6 ký tự'],
        ];

        return $this->validationError($errors);
    }

    /**
     * Not found error example
     */
    public function notFoundExample(Request $request): JsonResponse
    {
        return $this->notFound('User');
    }

    /**
     * Unauthorized error example
     */
    public function unauthorizedExample(Request $request): JsonResponse
    {
        return $this->unauthorized();
    }

    /**
     * Forbidden error example
     */
    public function forbiddenExample(Request $request): JsonResponse
    {
        return $this->forbidden();
    }

    /**
     * Example with try-catch (không throw exception)
     */
    public function tryCatchExample(Request $request): JsonResponse
    {
        try {
            // Xử lý logic
            $result = $this->someBusinessLogic();

            if (!$result) {
                // Trả về error response với message code cụ thể
                return $this->error(MessageCode::NOT_FOUND, null, null, 404);
            }

            // Success response chỉ trả "Thành công"
            return $this->success($result);

        } catch (\Exception $e) {
            // Log error
            \Log::error('Error in tryCatchExample: ' . $e->getMessage());

            // Trả về internal error response với message code
            return $this->internalError();
        }
    }

    /**
     * Example business logic
     */
    private function someBusinessLogic()
    {
        // Simulate business logic
        return ['data' => 'Some data'];
    }

    /**
     * Example với custom success message
     */
    public function customMessageExample(Request $request): JsonResponse
    {
        $data = ['id' => 1, 'name' => 'John Doe'];
        
        // Success với custom message
        return $this->success($data, 'User created successfully!');
    }
}

