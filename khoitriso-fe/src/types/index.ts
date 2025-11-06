// ==================== USER & AUTH ====================
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'instructor' | 'admin';
  avatar?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  bio?: string;
  emailVerifiedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  remember?: boolean;
}

export interface RegisterRequest {
  username: string;  // Backend expects 'username'
  email: string;
  password: string;
  password_confirmation: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  tokenType: string;
}

// ==================== COURSE ====================
export interface Course {
  id: number;
  title: string;
  static_page_path: string;
  description: string;
  thumbnail?: string;
  category_id: number;
  category?: Category;
  instructor_id: number;
  instructor?: User;
  level: number; // 1=beginner, 2=intermediate, 3=advanced
  language: string;
  price: number;
  is_free: boolean;
  estimated_duration?: number; // in hours
  total_lessons?: number;
  total_students: number;
  rating: number;
  total_reviews: number;
  is_published: boolean;
  is_active: boolean;
  approval_status: number;
  requirements?: string;
  what_you_will_learn?: string;
  quality_score?: number;
  created_at: string;
  updated_at: string;
}

export interface Lesson {
  id: number;
  courseId: number;
  title: string;
  slug: string;
  description?: string;
  content?: string;
  videoUrl?: string;
  duration: number;
  order: number;
  isFree: boolean;
  status: 'draft' | 'published';
  materials?: LessonMaterial[];
  discussions?: Discussion[];
  createdAt: string;
  updatedAt: string;
}

export interface LessonMaterial {
  id: number;
  lessonId: number;
  title: string;
  type: 'pdf' | 'video' | 'link' | 'document';
  url: string;
  size?: number;
  createdAt: string;
}

export interface CourseEnrollment {
  id: number;
  userId: number;
  courseId: number;
  progress: number;
  completedLessons: number;
  lastAccessedAt?: string;
  completedAt?: string;
  certificateId?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== BOOK ====================
export interface Book {
  id: number;
  title: string;
  static_page_path: string;
  description: string;
  cover_image?: string;
  author_id: number;
  author?: User;
  category_id: number;
  category?: Category;
  isbn?: string;
  language?: string;
  publication_year?: number;
  edition?: string;
  price: number;
  ebook_file?: string;
  total_questions: number;
  is_active: boolean;
  approval_status: number;
  quality_score?: number;
  rating: number;
  total_reviews: number;
  created_at: string;
  updated_at: string;
}

export interface BookChapter {
  id: number;
  bookId: number;
  title: string;
  order: number;
  description?: string;
  questions?: Question[];
  createdAt: string;
}

export interface Question {
  id: number;
  bookId?: number;
  chapterId?: number;
  lessonId?: number;
  assignmentId?: number;
  content: string;
  type: 'multiple_choice' | 'essay' | 'true_false' | 'fill_blank';
  options?: QuestionOption[];
  correctAnswer?: string;
  explanation?: string;
  videoSolutionUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  points: number;
  order?: number;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  questionId: number;
  content: string;
  isCorrect: boolean;
  order: number;
}

export interface BookActivationCode {
  id: number;
  bookId: number;
  code: string;
  type: 'single' | 'multiple';
  maxActivations: number;
  currentActivations: number;
  expiresAt?: string;
  status: 'active' | 'expired' | 'used';
  createdAt: string;
}

export interface UserBook {
  id: number;
  userId: number;
  bookId: number;
  book?: Book;
  activationCodeId?: number;
  activatedAt: string;
  expiresAt?: string;
  createdAt: string;
}

// ==================== ORDER & PAYMENT ====================
export interface Order {
  id: number;
  userId: number;
  orderNumber: string;
  totalAmount: number;
  discountAmount: number;
  finalAmount: number;
  status: 'pending' | 'paid' | 'cancelled' | 'refunded';
  paymentMethod?: string;
  paymentStatus?: string;
  transactionId?: string;
  items: OrderItem[];
  couponId?: number;
  coupon?: Coupon;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  itemType: 'course' | 'book';
  itemId: number;
  itemTitle: string;
  price: number;
  discountPrice?: number;
  quantity: number;
}

export interface CartItem {
  id: number;
  userId: number;
  itemType: 'course' | 'book';
  itemId: number;
  item?: Course | Book;
  quantity: number;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minAmount?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string;
  status: 'active' | 'inactive' | 'expired';
  createdAt: string;
}

// ==================== ASSIGNMENT ====================
export interface Assignment {
  id: number;
  courseId?: number;
  lessonId?: number;
  title: string;
  description?: string;
  dueDate?: string;
  maxAttempts?: number;
  passingScore: number;
  timeLimit?: number; // in minutes
  questions: Question[];
  totalPoints: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

export interface UserAssignmentAttempt {
  id: number;
  userId: number;
  assignmentId: number;
  attemptNumber: number;
  score: number;
  totalPoints: number;
  percentage: number;
  status: 'in_progress' | 'submitted' | 'graded';
  startedAt: string;
  submittedAt?: string;
  gradedAt?: string;
  timeSpent?: number;
  answers: UserAssignmentAnswer[];
}

export interface UserAssignmentAnswer {
  id: number;
  attemptId: number;
  questionId: number;
  answer: string;
  isCorrect?: boolean;
  pointsEarned?: number;
  feedback?: string;
}

// ==================== REVIEW ====================
export interface Review {
  id: number;
  userId: number;
  user?: User;
  itemType: 'course' | 'book';
  itemId: number;
  rating: number;
  comment?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

// ==================== CATEGORY ====================
export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  parentId?: number;
  order: number;
  isActive: boolean;
  coursesCount?: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== LIVE CLASS ====================
export interface LiveClass {
  id: number;
  courseId: number;
  course?: Course;
  instructorId: number;
  instructor?: User;
  title: string;
  description?: string;
  scheduledAt: string;
  duration: number;
  meetingUrl?: string;
  recordingUrl?: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  maxParticipants?: number;
  currentParticipants: number;
  createdAt: string;
  updatedAt: string;
}

export interface LiveClassParticipant {
  id: number;
  liveClassId: number;
  userId: number;
  joinedAt?: string;
  leftAt?: string;
  duration?: number;
}

// ==================== CERTIFICATE ====================
export interface Certificate {
  id: number;
  userId: number;
  user?: User;
  courseId: number;
  course?: Course;
  certificateNumber: string;
  issuedAt: string;
  validUntil?: string;
  pdfUrl?: string;
  status: 'active' | 'revoked';
  createdAt: string;
}

// ==================== NOTIFICATION ====================
export interface Notification {
  id: number;
  userId: number;
  type: string;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// ==================== DISCUSSION ====================
export interface Discussion {
  id: number;
  lessonId: number;
  userId: number;
  user?: User;
  content: string;
  parentId?: number;
  replies?: Discussion[];
  likesCount: number;
  createdAt: string;
  updatedAt: string;
}

// ==================== LEARNING PATH ====================
export interface LearningPath {
  id: number;
  title: string;
  slug: string;
  description: string;
  thumbnail?: string;
  categoryId: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedDuration: number;
  courses: Course[];
  totalCourses: number;
  totalStudents: number;
  status: 'draft' | 'published' | 'archived';
  createdAt: string;
  updatedAt: string;
}

// ==================== API RESPONSE ====================
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    currentPage: number;
    lastPage: number;
    perPage: number;
    total: number;
    from: number;
    to: number;
  };
}

// ==================== FILTER & SORT ====================
export interface CourseFilters {
  categoryId?: number;
  level?: string;
  priceMin?: number;
  priceMax?: number;
  rating?: number;
  search?: string;
  sortBy?: 'newest' | 'popular' | 'rating' | 'price_low' | 'price_high';
  page?: number;
  perPage?: number;
}

export interface BookFilters {
  categoryId?: number;
  grade?: string;
  subject?: string;
  priceMin?: number;
  priceMax?: number;
  search?: string;
  sortBy?: 'newest' | 'popular' | 'rating' | 'price_low' | 'price_high';
  page?: number;
  perPage?: number;
}
