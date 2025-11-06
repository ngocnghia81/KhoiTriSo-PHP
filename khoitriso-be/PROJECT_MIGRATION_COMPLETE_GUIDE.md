# 🎉 PROJECT MIGRATION - Complete Guide

## 📊 PROGRESS: 50% COMPLETE

### ✅ Converted Controllers (14/28)

1. ✅ **BaseController** - Core controller với helper methods
2. ✅ **ExampleController** - Pattern examples
3. ✅ **AuthController** - Authentication & Registration  
4. ✅ **UserController** - User management
5. ✅ **BookController** - Books với activation codes
6. ✅ **CourseController** - Course management
7. ✅ **CategoryController** - Categories
8. ✅ **CartController** - Shopping cart
9. ✅ **OrderController** - Orders với coupons
10. ✅ **WishlistController** - Wishlist
11. ✅ **LessonController** - Lessons
12. ✅ **NotificationController** - Notifications
13. ✅ **ProgressController** - User progress
14. ✅ **ReviewController** - Reviews & Ratings

### ⏳ Remaining Controllers (14/28)

**Simple (Quick - ~5-10 min each)**:
- SearchController
- UploadController  
- SystemController
- CouponController

**Medium (~10-15 min each)**:
- CertificateController
- DiscussionController
- ForumController
- QuestionController
- AssignmentController

**Complex (~15-20 min each)**:
- LearningPathController
- LiveClassController
- OauthController
- AnalyticsController
- AdminController

---

## 🎯 RESPONSE FORMAT (Đã hoàn thành 100%)

### Success Response - NO messageCode
```json
{
    "success": true,
    "message": "Thành công",
    "data": {...}
}
```

### Error Response - WITH messageCode
```json
{
    "success": false,
    "messageCode": "USER_NOT_FOUND",
    "message": "Không tìm thấy người dùng"
}
```

---

## 🚀 CONVERSION TEMPLATE

Copy-paste template này cho mỗi controller còn lại:

### File Header
```php
<?php

namespace App\Http\Controllers;

use App\Constants\MessageCode;
use App\Models\YourModel;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

/**
 * Your Controller
 */
class YourController extends BaseController
{
    // methods here
}
```

### Index Method (List/Paginated)
```php
public function index(Request $request): JsonResponse
{
    try {
        $query = Model::query();
        
        // Filters
        if ($request->filled('filter')) {
            $query->where('field', $request->input('filter'));
        }
        
        $page = (int) $request->query('page', 1);
        $limit = (int) $request->query('limit', 20);
        
        $total = $query->count();
        $items = $query->skip(($page - 1) * $limit)->take($limit)->get();
        
        return $this->paginated($items->toArray(), $page, $limit, $total);

    } catch (\Exception $e) {
        \Log::error('Error: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

### Show Method (Get Single)
```php
public function show(Request $request, int $id): JsonResponse
{
    try {
        $item = Model::find($id);
        
        if (!$item) {
            return $this->notFound('Model');
        }
        
        return $this->success($item);

    } catch (\Exception $e) {
        \Log::error('Error: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

### Store Method (Create)
```php
public function store(Request $request): JsonResponse
{
    try {
        if (!$request->user()) {
            return $this->unauthorized();
        }

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
        \Log::error('Error: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

### Update Method
```php
public function update(Request $request, int $id): JsonResponse
{
    try {
        $item = Model::find($id);
        
        if (!$item) {
            return $this->notFound('Model');
        }

        $validator = Validator::make($request->all(), [
            'field' => ['sometimes', 'string'],
        ]);

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
        \Log::error('Error: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

### Destroy Method (Delete)
```php
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
        \Log::error('Error: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

---

## 📝 STEP-BY-STEP CONVERSION

### Bước 1: Mở Controller Cần Convert
```bash
# Example:
code app/Http/Controllers/SearchController.php
```

### Bước 2: Replace Header
- Change `extends Controller` → `extends BaseController`
- Add imports:
  ```php
  use App\Constants\MessageCode;
  use Illuminate\Http\JsonResponse;
  use Illuminate\Support\Facades\Validator;
  ```

### Bước 3: Convert Từng Method

#### 3.1: Add Return Type
```php
// Before
public function index(Request $request)

// After  
public function index(Request $request): JsonResponse
```

#### 3.2: Wrap in Try-Catch
```php
public function method(Request $request): JsonResponse
{
    try {
        // existing code
    } catch (\Exception $e) {
        \Log::error('Error: ' . $e->getMessage());
        return $this->internalError();
    }
}
```

#### 3.3: Convert Validation
```php
// Before
$data = $request->validate([...]);

// After
$validator = Validator::make($request->all(), [...]);

if ($validator->fails()) {
    $errors = [];
    foreach ($validator->errors()->toArray() as $field => $messages) {
        $errors[] = ['field' => $field, 'messages' => $messages];
    }
    return $this->validationError($errors);
}

$data = $validator->validated();
```

#### 3.4: Replace findOrFail
```php
// Before
$item = Model::findOrFail($id);

// After
$item = Model::find($id);

if (!$item) {
    return $this->notFound('Model');
}
```

#### 3.5: Convert Responses
```php
// Before
return response()->json(['data' => $item]);
return response()->json(['success' => true, 'data' => $item]);

// After
return $this->success($item);
```

```php
// Before (paginated)
return response()->json([
    'items' => $res->items(),
    'total' => $res->total()
]);

// After
$page = (int) $request->query('page', 1);
$limit = (int) $request->query('limit', 20);
$total = $query->count();
$items = $query->skip(($page - 1) * $limit)->take($limit)->get();

return $this->paginated($items->toArray(), $page, $limit, $total);
```

```php
// Before (error)
return response()->json(['success' => false, 'message' => 'Error'], 400);

// After
return $this->error(MessageCode::..., null, null, 400);
```

### Bước 4: Test Controller
```bash
# Test với curl hoặc Postman
curl -H "Accept-Language: vi" http://localhost:8000/api/endpoint
```

---

## 🎓 REFERENCE CONTROLLERS

### Simple CRUD (CategoryController)
```php
// app/Http/Controllers/CategoryController.php
// - Basic CRUD operations
// - Simple validation
// - No complex business logic
```

### With Relations (BookController)
```php
// app/Http/Controllers/BookController.php
// - CRUD with relationships
// - Activation codes logic
// - User-specific data
```

### Complex Business Logic (OrderController)
```php
// app/Http/Controllers/OrderController.php
// - Multiple models interaction
// - Coupon calculations
// - Payment logic
// - Status management
```

### Progress/Tracking (ProgressController)
```php
// app/Http/Controllers/ProgressController.php
// - firstOrCreate pattern
// - Timestamp tracking
// - User-specific progress
```

---

## ✨ HELPER METHODS SUMMARY

```php
// Success
$this->success($data)
$this->success($data, 'Custom message')

// Paginated
$this->paginated($items, $page, $limit, $total)

// Error
$this->error(MessageCode::NOT_FOUND, null, null, 404)
$this->error(MessageCode::..., 'Custom message', null, 400)

// Validation Error
$this->validationError($errors)

// Not Found
$this->notFound('Resource')

// Unauthorized
$this->unauthorized()

// Forbidden
$this->forbidden()

// Internal Error
$this->internalError()

// Get Message
$this->getMessage(MessageCode::...)
```

---

## 🐛 COMMON ISSUES & FIXES

### Issue 1: "Method not found"
**Cause**: Not extending BaseController  
**Fix**: Change `extends Controller` to `extends BaseController`

### Issue 2: Pagination not working
**Cause**: Using old pagination format  
**Fix**: Use the template paginated format above

### Issue 3: Validation errors not showing correctly
**Cause**: Not using the correct validation error format  
**Fix**: Use the validation error template above

---

## 📊 REMAINING CONTROLLERS PRIORITY

### Phase 1: Simple (Do First - ~1 hour)
1. SearchController
2. UploadController
3. SystemController
4. CouponController

### Phase 2: Medium (~1.5-2 hours)
5. CertificateController
6. DiscussionController
7. ForumController
8. QuestionController
9. AssignmentController

### Phase 3: Complex (~1.5-2 hours)
10. LearningPathController
11. LiveClassController
12. OauthController
13. AnalyticsController
14. AdminController

**Total Estimated Time: 4-5 hours for remaining 14 controllers**

---

## ✅ COMPLETION CHECKLIST

### For Each Controller:
- [ ] Extends BaseController
- [ ] Imports added
- [ ] All methods have `: JsonResponse`
- [ ] All methods wrapped in try-catch
- [ ] Validation converted
- [ ] findOrFail replaced
- [ ] Responses use helper methods
- [ ] Tested with curl/Postman

### After All Controllers:
- [ ] Run linter on all controllers
- [ ] Test all API endpoints
- [ ] Test with both languages (vi, en)
- [ ] Update API documentation (if any)

---

## 🎉 WHAT YOU'VE ACHIEVED

### Core System (100% ✅)
- ✅ Message codes & templates
- ✅ MessageService
- ✅ ResponseBuilder
- ✅ BaseController
- ✅ Exception Handler
- ✅ Multi-language support

### Documentation (100% ✅)
- ✅ RESPONSE_FORMAT.md
- ✅ QUICK_START.md
- ✅ MIGRATION_PROGRESS.md
- ✅ FINAL_SUMMARY.md
- ✅ PROJECT_MIGRATION_COMPLETE_GUIDE.md

### Controllers (50% ✅)
- ✅ 14/28 controllers converted
- ⏳ 14 remaining (~4-5 hours)

---

## 🚀 NEXT STEPS

1. **Pick a controller** from Phase 1 (simple ones)
2. **Open the file** in your editor
3. **Follow the template** above
4. **Copy patterns** from converted controllers
5. **Test** after each conversion
6. **Repeat** until all done

---

## 💡 TIPS

- **Start simple**: Begin with SearchController or UploadController
- **Copy-paste**: Use templates and converted controllers as reference
- **Test frequently**: Test each controller after conversion
- **Ask for help**: If stuck, check converted controllers or ask AI

---

## 📚 KEY FILES

- `app/Http/Controllers/BaseController.php` - Helper methods
- `app/Constants/MessageCode.php` - Message codes
- `config/messages.php` - Message templates
- `RESPONSE_FORMAT.md` - Response format guide

---

**You're halfway there! Keep going! 🎉**

The hardest part (infrastructure) is done. Now it's just applying the pattern to remaining controllers.

**Estimated remaining time: 4-5 hours**

**YOU CAN DO THIS! 💪**

