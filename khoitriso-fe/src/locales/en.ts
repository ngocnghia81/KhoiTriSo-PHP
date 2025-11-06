/**
 * English Translations
 */

import { TranslationKeys } from './vi';

export const en: TranslationKeys = {
  // Common
  common: {
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    submit: 'Submit',
    back: 'Back',
    next: 'Next',
    previous: 'Previous',
    confirm: 'Confirm',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    info: 'Information',
    yes: 'Yes',
    no: 'No',
  },

  // Navigation
  nav: {
    home: 'Home',
    courses: 'Courses',
    books: 'Books',
    forum: 'Forum',
    about: 'About',
    contact: 'Contact',
    cart: 'Cart',
    profile: 'Profile',
    dashboard: 'Dashboard',
    logout: 'Logout',
    login: 'Login',
    register: 'Register',
  },

  // Auth
  auth: {
    login: 'Login',
    register: 'Register',
    logout: 'Logout',
    email: 'Email',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot Password?',
    rememberMe: 'Remember Me',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",
    loginSuccess: 'Login successful',
    registerSuccess: 'Registration successful',
    logoutSuccess: 'Logout successful',
  },

  // Error Messages (from backend messageCode)
  errors: {
    // Generic
    VALIDATION_ERROR: 'Validation error',
    NOT_FOUND: 'Not found',
    UNAUTHORIZED: 'Unauthorized',
    FORBIDDEN: 'Forbidden',
    INTERNAL_ERROR: 'Internal server error',
    BAD_REQUEST: 'Bad request',
    
    // Auth
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Session expired',
    TOKEN_INVALID: 'Invalid token',
    EMAIL_ALREADY_EXISTS: 'Email already exists',
    
    // User
    USER_NOT_FOUND: 'User not found',
    USER_INACTIVE: 'Account not activated',
    EMAIL_NOT_VERIFIED: 'Email not verified',
    
    // Course
    COURSE_NOT_FOUND: 'Course not found',
    ALREADY_ENROLLED: 'Already enrolled in this course',
    COURSE_FULL: 'Course is full',
    
    // Book
    BOOK_NOT_FOUND: 'Book not found',
    INVALID_ACTIVATION_CODE: 'Invalid activation code',
    ACTIVATION_CODE_ALREADY_USED: 'Activation code already used',
    
    // Order
    ORDER_NOT_FOUND: 'Order not found',
    ORDER_CANNOT_CANCEL: 'Cannot cancel this order',
    INVALID_STATUS: 'Invalid status',
    
    // Cart
    CART_ITEM_EXISTS: 'Item already in cart',
    CART_ITEM_NOT_FOUND: 'Item not found in cart',
    
    // Wishlist
    WISHLIST_ITEM_EXISTS: 'Item already in wishlist',
    WISHLIST_ITEM_NOT_FOUND: 'Item not found in wishlist',
    
    // File
    FILE_UPLOAD_ERROR: 'File upload error',
    FILE_TOO_LARGE: 'File too large',
    INVALID_FILE_TYPE: 'Invalid file type',
    
    // Payment
    PAYMENT_FAILED: 'Payment failed',
    INVALID_COUPON: 'Invalid coupon',
    COUPON_EXPIRED: 'Coupon expired',
    
    // Other
    RESOURCE_NOT_FOUND: 'Resource not found',
    PERMISSION_DENIED: 'Permission denied',
    TOO_MANY_REQUESTS: 'Too many requests, please try again later',
    
    // Default
    UNKNOWN_ERROR: 'An error occurred',
    NETWORK_ERROR: 'Network error',
  },

  // Success Messages
  success: {
    SUCCESS: 'Success',
    CREATED_SUCCESS: 'Created successfully',
    UPDATED_SUCCESS: 'Updated successfully',
    DELETED_SUCCESS: 'Deleted successfully',
  },

  // Course
  course: {
    title: 'Courses',
    allCourses: 'All Courses',
    myCourses: 'My Courses',
    enrolledCourses: 'Enrolled Courses',
    instructor: 'Instructor',
    duration: 'Duration',
    students: 'Students',
    lessons: 'Lessons',
    enroll: 'Enroll',
    enrolled: 'Enrolled',
    rating: 'Rating',
    price: 'Price',
    free: 'Free',
    addToCart: 'Add to Cart',
    buyNow: 'Buy Now',
  },

  // Book
  book: {
    title: 'Books',
    allBooks: 'All Books',
    myBooks: 'My Books',
    author: 'Author',
    publisher: 'Publisher',
    pages: 'Pages',
    activationCode: 'Activation Code',
    enterCode: 'Enter activation code',
    activate: 'Activate',
    download: 'Download',
    read: 'Read',
  },

  // Cart
  cart: {
    title: 'Shopping Cart',
    empty: 'Cart is empty',
    total: 'Total',
    subtotal: 'Subtotal',
    discount: 'Discount',
    checkout: 'Checkout',
    continueShopping: 'Continue Shopping',
    remove: 'Remove',
    quantity: 'Quantity',
  },

  // Order
  order: {
    title: 'Orders',
    myOrders: 'My Orders',
    orderHistory: 'Order History',
    orderNumber: 'Order Number',
    orderDate: 'Order Date',
    status: 'Status',
    pending: 'Pending',
    processing: 'Processing',
    completed: 'Completed',
    cancelled: 'Cancelled',
    cancel: 'Cancel Order',
  },

  // Forum
  forum: {
    title: 'Forum',
    askQuestion: 'Ask Question',
    answer: 'Answer',
    answers: 'answers',
    views: 'views',
    votes: 'votes',
    tags: 'Tags',
    recent: 'Recent',
    popular: 'Popular',
    unanswered: 'Unanswered',
  },

  // Profile
  profile: {
    title: 'Profile',
    editProfile: 'Edit Profile',
    changePassword: 'Change Password',
    settings: 'Settings',
    name: 'Name',
    email: 'Email',
    phone: 'Phone',
    address: 'Address',
    bio: 'Bio',
    avatar: 'Avatar',
    uploadAvatar: 'Upload Avatar',
  },

  // Pagination
  pagination: {
    page: 'Page',
    of: 'of',
    showing: 'Showing',
    to: 'to',
    results: 'results',
    previous: 'Previous',
    next: 'Next',
  },
};

