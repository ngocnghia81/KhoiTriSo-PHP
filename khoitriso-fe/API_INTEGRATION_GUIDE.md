# 🎉 API Integration Complete!

## ✅ Đã Hoàn Thành

### 1. **TypeScript Types** (`src/types/index.ts`)
- ✅ 50+ interfaces cho tất cả API models
- ✅ User, Auth, Course, Book, Forum, Order, Payment
- ✅ Filters, Pagination, API Response types

### 2. **API Services** (`src/services/`)
- ✅ **authService.ts** - Authentication (login, register, profile, OAuth)
- ✅ **courseService.ts** - Courses, lessons, enrollment, reviews, discussions
- ✅ **bookService.ts** - Books, chapters, questions, activation codes
- ✅ **forumService.ts** - MongoDB forum (questions, answers, comments, votes)
- ✅ **orderService.ts** - Cart, orders, coupons, VNPay payment

### 3. **React Hooks** (`src/hooks/`)
- ✅ **useAuth.ts** - Authentication state & methods
- ✅ **useCourses.ts** - Fetch courses with filters
- ✅ **useBooks.ts** - Fetch books with filters
- ✅ **useForum.ts** - Forum questions, categories, tags
- ✅ **useCart.ts** - Shopping cart management

### 4. **API Client** (`src/lib/api.ts`)
- ✅ Axios với interceptors
- ✅ Auto token management
- ✅ Token refresh on 401
- ✅ Error handling
- ✅ Language header injection

---

## 📖 Cách Sử Dụng

### **1. Authentication**

```typescript
import { useAuth } from '@/hooks';

function LoginPage() {
  const { login, loading, error, isAuthenticated } = useAuth();

  const handleLogin = async () => {
    try {
      await login({ email: 'user@example.com', password: 'password' });
      router.push('/dashboard');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      {loading ? 'Loading...' : (
        <button onClick={handleLogin}>Login</button>
      )}
      {error && <p>{error}</p>}
    </div>
  );
}
```

### **2. Courses**

```typescript
import { useCourses, useCourse } from '@/hooks';

function CoursesPage() {
  const { courses, loading, error, pagination } = useCourses({
    categoryId: 1,
    level: 'beginner',
    sortBy: 'popular',
    page: 1,
  });

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {courses.map(course => (
        <CourseCard key={course.id} course={course} />
      ))}
    </div>
  );
}

function CourseDetailPage({ id }: { id: number }) {
  const { course, loading, error } = useCourse(id);

  if (loading) return <div>Loading...</div>;
  if (!course) return <div>Course not found</div>;

  return <div>{course.title}</div>;
}
```

### **3. Books**

```typescript
import { useBooks, useBook } from '@/hooks';
import { bookService } from '@/services';

function BooksPage() {
  const { books, loading, error } = useBooks({
    grade: '12',
    subject: 'Toán học',
  });

  return (
    <div>
      {books.map(book => (
        <BookCard key={book.id} book={book} />
      ))}
    </div>
  );
}

function ActivateCodePage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleActivate = async () => {
    setLoading(true);
    try {
      const result = await bookService.activateCode(code);
      alert('Book activated successfully!');
    } catch (err) {
      alert('Invalid code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input value={code} onChange={e => setCode(e.target.value)} />
      <button onClick={handleActivate} disabled={loading}>
        Activate
      </button>
    </div>
  );
}
```

### **4. Forum**

```typescript
import { useForumQuestions, useForumQuestion } from '@/hooks';
import { forumService } from '@/services';

function ForumPage() {
  const { questions, loading, error, refetch } = useForumQuestions({
    categoryId: 'math',
    sortBy: 'newest',
    page: 1,
  });

  return (
    <div>
      {questions.map(q => (
        <QuestionCard key={q._id} question={q} />
      ))}
    </div>
  );
}

function QuestionDetailPage({ id }: { id: string }) {
  const { question, answers, loading, refetch } = useForumQuestion(id);
  const [answerContent, setAnswerContent] = useState('');

  const handleSubmitAnswer = async () => {
    try {
      await forumService.createAnswer(id, answerContent);
      setAnswerContent('');
      refetch();
    } catch (err) {
      alert('Failed to submit answer');
    }
  };

  const handleVote = async (targetId: string, voteType: 1 | -1) => {
    try {
      await forumService.vote({
        targetType: 1, // Question
        targetId,
        voteType,
      });
      refetch();
    } catch (err) {
      alert('Failed to vote');
    }
  };

  return (
    <div>
      <h1>{question?.title}</h1>
      <p>{question?.content}</p>
      <button onClick={() => handleVote(id, 1)}>👍 Upvote</button>
      
      <div>
        {answers.map(answer => (
          <div key={answer._id}>{answer.content}</div>
        ))}
      </div>

      <textarea 
        value={answerContent} 
        onChange={e => setAnswerContent(e.target.value)} 
      />
      <button onClick={handleSubmitAnswer}>Submit Answer</button>
    </div>
  );
}
```

### **5. Cart & Orders**

```typescript
import { useCart } from '@/hooks';
import { orderService } from '@/services';

function CartPage() {
  const { 
    items, 
    totalAmount, 
    totalItems, 
    loading, 
    removeFromCart 
  } = useCart();

  const handleCheckout = async () => {
    try {
      const order = await orderService.createOrder();
      
      // Create VNPay payment
      const payment = await orderService.createVNPayPayment(order.id);
      
      // Redirect to payment URL
      window.location.href = payment.paymentUrl;
    } catch (err) {
      alert('Checkout failed');
    }
  };

  return (
    <div>
      <h1>Cart ({totalItems} items)</h1>
      {items.map(item => (
        <div key={item.id}>
          {item.item?.title}
          <button onClick={() => removeFromCart(item.id)}>Remove</button>
        </div>
      ))}
      <p>Total: {totalAmount} VND</p>
      <button onClick={handleCheckout}>Checkout</button>
    </div>
  );
}

function AddToCartButton({ courseId }: { courseId: number }) {
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    try {
      await addToCart('course', courseId);
      alert('Added to cart!');
    } catch (err) {
      alert('Failed to add to cart');
    }
  };

  return <button onClick={handleAddToCart}>Add to Cart</button>;
}
```

### **6. Direct Service Usage**

```typescript
import { 
  authService, 
  courseService, 
  bookService, 
  forumService, 
  orderService 
} from '@/services';

// Login
const { user, token } = await authService.login({
  email: 'user@example.com',
  password: 'password',
});

// Get featured courses
const featuredCourses = await courseService.getFeatured(6);

// Search books
const searchResults = await bookService.search('Toán học 12');

// Create forum question
const question = await forumService.createQuestion({
  title: 'How to solve this?',
  content: 'Detailed question...',
  categoryId: 'math',
  categoryName: 'Mathematics',
  tags: ['algebra', 'grade-12'],
});

// Validate coupon
const couponResult = await orderService.validateCoupon('SUMMER2024', 500000);
```

---

## 🔥 Tính Năng Chính

### **Authentication**
- ✅ Login / Register / Logout
- ✅ Profile management
- ✅ Password change
- ✅ Email verification
- ✅ OAuth (Google, Facebook)
- ✅ Auto token refresh

### **Courses**
- ✅ Browse with filters (category, level, price, rating)
- ✅ Course details with lessons
- ✅ Enrollment
- ✅ Progress tracking
- ✅ Reviews & ratings
- ✅ Lesson discussions
- ✅ Mark lessons complete

### **Books**
- ✅ Browse with filters (grade, subject, price)
- ✅ Book details with chapters
- ✅ Questions & solutions
- ✅ Activation codes
- ✅ My books library
- ✅ Reviews & ratings

### **Forum (MongoDB)**
- ✅ Questions CRUD
- ✅ Answers with accept best answer
- ✅ Comments on questions/answers
- ✅ Vote system (upvote/downvote)
- ✅ Bookmark questions
- ✅ Categories & tags
- ✅ Search & filters
- ✅ Statistics

### **Cart & Orders**
- ✅ Add/remove items
- ✅ Cart management
- ✅ Coupon validation
- ✅ Create orders
- ✅ VNPay payment integration
- ✅ Order history
- ✅ Payment verification

---

## 🚀 Next Steps

### **1. Update Pages với Real API**
- [ ] Update `src/app/auth/login/page.tsx` với `useAuth`
- [ ] Update `src/app/courses/page.tsx` với `useCourses`
- [ ] Update `src/app/forum/page.tsx` với `useForumQuestions`
- [ ] Update `src/app/cart/page.tsx` với `useCart`

### **2. Add Loading States**
- [ ] Skeleton components
- [ ] Loading spinners
- [ ] Error boundaries

### **3. Add Error Handling**
- [ ] Toast notifications
- [ ] Error pages
- [ ] Retry logic

### **4. Optimize Performance**
- [ ] Add React Query / SWR for caching
- [ ] Implement infinite scroll
- [ ] Add debounce to search

---

## 📝 API Endpoints Summary

### **Auth**
- POST `/api/auth/login`
- POST `/api/auth/register`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- PUT `/api/auth/profile`

### **Courses**
- GET `/api/courses`
- GET `/api/courses/{id}`
- GET `/api/courses/featured`
- POST `/api/courses/{id}/enroll`
- GET `/api/courses/enrolled`

### **Books**
- GET `/api/books`
- GET `/api/books/{id}`
- POST `/api/books/activation-codes/validate`
- POST `/api/books/activation-codes/activate`

### **Forum**
- GET `/api/forum/questions`
- POST `/api/forum/questions`
- GET `/api/forum/questions/{id}/answers`
- POST `/api/forum/votes`
- POST `/api/forum/bookmarks`

### **Cart & Orders**
- GET `/api/cart`
- POST `/api/cart`
- POST `/api/orders`
- POST `/api/payments/vnpay/create`

---

## ✨ Kết Luận

**Toàn bộ API đã được ghép nối hoàn chỉnh!** 🎉

Bạn có thể:
1. ✅ Sử dụng hooks để fetch data dễ dàng
2. ✅ Gọi services trực tiếp khi cần
3. ✅ Có TypeScript types đầy đủ
4. ✅ Auto token management & refresh
5. ✅ Error handling tập trung

**Giờ chỉ cần thay mock data bằng real API hooks là xong!** 🚀
