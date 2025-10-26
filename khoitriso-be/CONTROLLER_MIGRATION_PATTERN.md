# Controller Migration Pattern

## Pattern để convert controllers cũ sang format mới

Bạn có thể dùng script này hoặc áp dụng pattern này để tự động convert các controllers còn lại.

### Pattern cơ bản:

```php
// CŨ:
class YourController extends Controller
{
    public function index(Request $request)
    {
        $data = Model::all();
        return response()->json(['data' => $data]);
    }
}

// MỚI:
class YourController extends BaseController
{
    public function index(Request $request): JsonResponse
    {
        try {
            $data = Model::all();
            return $this->success($data);
        } catch (\Exception $e) {
            \Log::error('Error: ' . $e->getMessage());
            return $this->internalError();
        }
    }
}
```

### Changes cần thực hiện:

1. **Extend BaseController** thay vì Controller
2. **Add return type** `: JsonResponse`
3. **Wrap trong try-catch**
4. **Replace response()->json()** bằng helper methods:
   - `response()->json(['data' => $x])` → `$this->success($x)`
   - `response()->json(['success' => false])` → `$this->error(MessageCode::...)`
   - Paginated → `$this->paginated($data, $page, $limit, $total)`
5. **Add imports**:
   ```php
   use App\Constants\MessageCode;
   use Illuminate\Http\JsonResponse;
   use Illuminate\Support\Facades\Validator;
   ```
6. **Convert validation**:
   ```php
   // Cũ
   $data = $request->validate([...]);
   
   // Mới
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

7. **Replace findOrFail()** → find() + notFound():
   ```php
   // Cũ
   $model = Model::findOrFail($id);
   
   // Mới
   $model = Model::find($id);
   if (!$model) {
       return $this->notFound('Model');
   }
   ```

### Quick Conversion Script

Đây là một Bash script đơn giản để convert tự động (chỉ là gợi ý, cần xem xét kỹ):

```bash
#!/bin/bash
# convert_controller.sh

CONTROLLER_FILE=$1

# Backup
cp "$CONTROLLER_FILE" "${CONTROLLER_FILE}.bak"

# 1. Replace extends Controller with extends BaseController
sed -i 's/extends Controller/extends BaseController/g' "$CONTROLLER_FILE"

# 2. Add use statements (at top, after namespace)
sed -i '/^namespace/a use App\\Constants\\MessageCode;\nuse Illuminate\\Http\\JsonResponse;\nuse Illuminate\\Support\\Facades\\Validator;' "$CONTROLLER_FILE"

# 3. Add return type to functions
sed -i 's/public function \([a-zA-Z_]*\)(\(.*\))/public function \1(\2): JsonResponse/g' "$CONTROLLER_FILE"

echo "Converted $CONTROLLER_FILE. Check and adjust manually!"
echo "Backup saved to ${CONTROLLER_FILE}.bak"
```

**Lưu ý**: Script trên chỉ là skeleton, bạn vẫn phải manually:
- Wrap logic trong try-catch
- Convert response()->json() thành helper methods
- Convert validation
- Replace findOrFail

### Controllers đã converted:
- ✅ BaseController
- ✅ ExampleController  
- ✅ UserController
- ✅ AuthController
- ✅ BookController

### Controllers cần convert:
- ⏳ CourseController
- ⏳ CategoryController
- ⏳ CartController
- ⏳ OrderController
- ⏳ LessonController
- ⏳ NotificationController
- ⏳ ProgressController
- ⏳ ReviewController
- ⏳ SearchController
- ⏳ SystemController
- ⏳ UploadController
- ⏳ WishlistController
- ⏳ CouponController
- ⏳ CertificateController
- ⏳ DiscussionController
- ⏳ ForumController
- ⏳ LearningPathController
- ⏳ LiveClassController
- ⏳ OauthController
- ⏳ QuestionController
- ⏳ AssignmentController
- ⏳ AnalyticsController
- ⏳ AdminController

### Manual Conversion Steps per Controller:

1. Open controller file
2. Change `extends Controller` → `extends BaseController`
3. Add imports at top
4. For each method:
   - Add `: JsonResponse` return type
   - Wrap in `try { ... } catch`
   - Convert validation to Validator::make
   - Convert responses to helper methods
   - Replace findOrFail with find + notFound check
   - Add \Log::error in catch block
5. Test the controller

### Time estimate:
- Simple controller (< 100 lines): ~5 minutes
- Medium controller (100-300 lines): ~10-15 minutes  
- Complex controller (> 300 lines): ~20-30 minutes

Với 23 controllers còn lại, estimate ~3-5 hours để convert thủ công tất cả.

