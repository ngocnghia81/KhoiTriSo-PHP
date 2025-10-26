# Migration Progress - Multi-Language Response System

## ✅ Đã hoàn thành (8/28 controllers)

### Core System
- ✅ **BaseController** - Base controller với helper methods
- ✅ **ExampleController** - Controller ví dụ

### Main Controllers
- ✅ **AuthController** - Authentication & Registration
- ✅ **UserController** - User management  
- ✅ **BookController** - Book management
- ✅ **CourseController** - Course management
- ✅ **CategoryController** - Category management
- ✅ **CartController** - Shopping cart
- ✅ **OrderController** - Order management

## ⏳ Còn lại (20 controllers)

### Cần convert
- ⏳ **LessonController** - Lesson management
- ⏳ **NotificationController** - Notifications
- ⏳ **ProgressController** - User progress tracking
- ⏳ **ReviewController** - Reviews & ratings
- ⏳ **SearchController** - Search functionality
- ⏳ **SystemController** - System settings
- ⏳ **UploadController** - File uploads
- ⏳ **WishlistController** - Wishlist management
- ⏳ **CouponController** - Coupon management
- ⏳ **CertificateController** - Certificates
- ⏳ **DiscussionController** - Discussions
- ⏳ **ForumController** - Forum
- ⏳ **LearningPathController** - Learning paths
- ⏳ **LiveClassController** - Live classes
- ⏳ **OauthController** - OAuth authentication
- ⏳ **QuestionController** - Questions/Quiz
- ⏳ **AssignmentController** - Assignments
- ⏳ **AnalyticsController** - Analytics
- ⏳ **AdminController** - Admin functions
- ⏳ **Controller** - Base Laravel controller (có thể bỏ qua)

## 📋 Quick Conversion Guide

### Bước 1: Chuẩn bị file

```php
// TRƯỚC
<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\YourModel;

class YourController extends Controller
{
    // methods...
}
```

```php
// SAU
<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;
use App\Models\YourModel;

/**
 * Your Controller
 * Description here
 */
class YourController extends BaseController
{
    // methods...
}
```

### Bước 2: Convert từng method

#### Pattern: Index (List with pagination)

```php
// TRƯỚC
public function index(Request $request)
{
    $query = Model::query();
    // filters...
    $res = $query->paginate(20);
    return response()->json([
        'data' => $res->items(),
        'total' => $res->total()
    ]);
}

// SAU
public function index(Request $request): JsonResponse
{
    try {
        $query = Model::query();
        // filters...
        
        $page = (int) $request->query('page', 1);
        $limit = (int) $request->query('limit', 20);
        
        $total = $query->count();
        $items = $query->skip(($page - 1) * $limit)->take($limit)->get();
        
        return $this->paginated($items->toArray(), $page, $limit, $total);

    } catch (\Exception $e) {
        \Log::error('Error in index: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

#### Pattern: Show (Get single item)

```php
// TRƯỚC
public function show(int $id)
{
    $item = Model::findOrFail($id);
    return response()->json($item);
}

// SAU
public function show(Request $request, int $id): JsonResponse
{
    try {
        $item = Model::find($id);
        
        if (!$item) {
            return $this->notFound('Model');
        }
        
        return $this->success($item);

    } catch (\Exception $e) {
        \Log::error('Error in show: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

#### Pattern: Store (Create)

```php
// TRƯỚC
public function store(Request $request)
{
    $data = $request->validate([
        'field' => ['required', 'string'],
    ]);
    
    $item = Model::create($data);
    return response()->json(['success' => true, 'data' => $item], 201);
}

// SAU
public function store(Request $request): JsonResponse
{
    try {
        $validator = Validator::make($request->all(), [
            'field' => ['required', 'string'],
        ]);

        if ($validator->fails()) {
            $errors = [];
            foreach ($validator->errors()->toArray() as $field => $messages) {
                $errors[] = ['field' => $field, 'messages' => $messages];
            }
            return $this->validationError($errors);
        }

        $data = $validator->validated();
        
        $item = Model::create($data);
        
        return $this->success($item);

    } catch (\Exception $e) {
        \Log::error('Error in store: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

#### Pattern: Update

```php
// TRƯỚC
public function update(Request $request, int $id)
{
    $item = Model::findOrFail($id);
    $data = $request->validate([...]);
    $item->update($data);
    return response()->json(['success' => true, 'data' => $item]);
}

// SAU
public function update(Request $request, int $id): JsonResponse
{
    try {
        $item = Model::find($id);
        
        if (!$item) {
            return $this->notFound('Model');
        }

        $validator = Validator::make($request->all(), [...]);

        if ($validator->fails()) {
            $errors = [];
            foreach ($validator->errors()->toArray() as $field => $messages) {
                $errors[] = ['field' => $field, 'messages' => $messages];
            }
            return $this->validationError($errors);
        }

        $data = $validator->validated();
        
        $item->update($data);
        
        return $this->success($item);

    } catch (\Exception $e) {
        \Log::error('Error in update: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

#### Pattern: Destroy (Delete)

```php
// TRƯỚC
public function destroy(int $id)
{
    $item = Model::findOrFail($id);
    $item->delete();
    return response()->json(['success' => true, 'message' => 'Deleted']);
}

// SAU
public function destroy(Request $request, int $id): JsonResponse
{
    try {
        $item = Model::find($id);
        
        if (!$item) {
            return $this->notFound('Model');
        }
        
        $item->delete();
        
        return $this->success(null);

    } catch (\Exception $e) {
        \Log::error('Error in destroy: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

#### Pattern: Check Auth

```php
// Thêm vào đầu method nếu cần auth
if (!$request->user()) {
    return $this->unauthorized();
}
```

#### Pattern: Business Logic Errors

```php
// Check business rule
if ($order->status !== 1) {
    return $this->error(
        MessageCode::ORDER_CANNOT_CANCEL,
        null,
        null,
        400
    );
}
```

## 🚀 Conversion Steps (cho mỗi controller)

1. **Mở file controller**
2. **Thay đổi extends**: `Controller` → `BaseController`
3. **Thêm imports** ở đầu file:
   ```php
   use App\Constants\MessageCode;
   use Illuminate\Http\JsonResponse;
   use Illuminate\Support\Facades\Validator;
   ```
4. **Với từng method**:
   - Add return type: `: JsonResponse`
   - Wrap trong `try { ... } catch`
   - Convert validation
   - Replace `findOrFail` → `find` + check null
   - Convert response statements
   - Add `\Log::error` trong catch

5. **Test controller** sau khi convert

## ⏱️ Time Estimate

- Simple controller (< 5 methods): **5-10 phút**
- Medium controller (5-10 methods): **10-20 phút**
- Complex controller (> 10 methods): **20-30 phút**

**Tổng estimate cho 20 controllers còn lại: ~4-6 giờ**

## 🎯 Quick Checklist per Controller

- [ ] Extends BaseController
- [ ] Added imports (MessageCode, JsonResponse, Validator)
- [ ] All methods have `: JsonResponse` return type
- [ ] All methods wrapped in try-catch
- [ ] Validation converted to Validator::make
- [ ] Replace findOrFail with find + notFound check
- [ ] Response statements use helper methods
- [ ] Log errors in catch blocks
- [ ] Test the controller

## 📝 Response Helper Methods

```php
// Success
$this->success($data)
$this->success($data, 'Custom message')

// Paginated
$this->paginated($items, $page, $limit, $total)

// Error
$this->error(MessageCode::NOT_FOUND, null, null, 404)

// Validation Error
$this->validationError($errors)

// Not Found
$this->notFound('Resource')

// Unauthorized
$this->unauthorized()

// Forbidden
$this->forbidden()

// Internal Server Error
$this->internalError()
```

## 📚 Reference Controllers

Xem các controllers đã converted làm reference:
- `app/Http/Controllers/AuthController.php` - Full auth flow
- `app/Http/Controllers/BookController.php` - CRUD with relations
- `app/Http/Controllers/CourseController.php` - Complex queries
- `app/Http/Controllers/OrderController.php` - Business logic
- `app/Http/Controllers/CategoryController.php` - Simple CRUD

## 🐛 Common Issues & Solutions

### Issue 1: Linter error "Method not found"
**Solution**: Make sure BaseController is imported and class extends it

### Issue 2: Validation error format
**Solution**: Use the exact validation error format:
```php
$errors = [];
foreach ($validator->errors()->toArray() as $field => $messages) {
    $errors[] = ['field' => $field, 'messages' => $messages];
}
return $this->validationError($errors);
```

### Issue 3: Pagination không hoạt động
**Solution**: Đảm bảo convert đúng pagination:
```php
$page = (int) $request->query('page', 1);
$limit = (int) $request->query('limit', 20);
$total = $query->count();
$items = $query->skip(($page - 1) * $limit)->take($limit)->get();
return $this->paginated($items->toArray(), $page, $limit, $total);
```

## ✅ Final Steps

Sau khi convert xong tất cả controllers:

1. **Test API endpoints** - Dùng Postman/curl để test
2. **Check linter errors** - Run linter trên toàn bộ controllers
3. **Test với different languages** - Test với Accept-Language: vi và en
4. **Update documentation** - Nếu có API docs

## 🎉 Done!

Sau khi hoàn thành migration:
- ✅ Tất cả controllers dùng format mới
- ✅ Response nhất quán
- ✅ Multi-language support
- ✅ Error handling tốt hơn
- ✅ Code clean và maintainable hơn

**Happy Coding! 🚀**

