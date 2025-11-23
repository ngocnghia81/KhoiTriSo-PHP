'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpenIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  PencilIcon,
  TrashIcon,
  EyeIcon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';
import { bookService } from '@/services/bookService';
import { getInstructorBooks, createInstructorBook, updateInstructorBook, deleteInstructorBook } from '@/services/instructor';
import { getBooks } from '@/services/admin';
import { getCategories, Category } from '@/services/categories';
import { uploadFile } from '@/services/uploads';
import { useToast } from '@/components/ToastProvider';
import RichTextEditor from '@/components/RichTextEditor';

interface Book {
  id: number;
  title: string;
  description: string;
  isbn: string;
  cover_image: string;
  price: number;
  category_id?: number;
  category?: { id: number; name: string };
  author_id?: number;
  author?: { id: number; name: string; email: string };
  is_active: boolean;
  approval_status: number;
  language: string;
  publication_year?: number;
  edition?: string;
  chapters?: any[];
}

export default function BooksPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [user, setUser] = useState<any>(null);
  const [isInstructor, setIsInstructor] = useState(false);
  
  // Search & Filter
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<number | ''>('');
  const [statusFilter, setStatusFilter] = useState<boolean | ''>('');
  const [approvalFilter, setApprovalFilter] = useState<number | ''>('');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [total, setTotal] = useState(0);
  const [lastPage, setLastPage] = useState(1);
  
  // Modals
  const [showCreateBookModal, setShowCreateBookModal] = useState(false);
  const [showEditBookModal, setShowEditBookModal] = useState(false);
  const [showViewBookModal, setShowViewBookModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showCreateChapterModal, setShowCreateChapterModal] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);
  
  // Forms
  const [bookForm, setBookForm] = useState({
    title: '',
    description: '',
    coverImage: '',
    price: '',
    categoryId: '',
    language: 'vi',
    publicationYear: '',
    edition: '',
    isActive: true,
    approvalStatus: 3,
  });
  
  const [chapterForm, setChapterForm] = useState({
    title: '',
    description: '',
    orderIndex: '',
  });
  
  const [coverPreview, setCoverPreview] = useState<string>('');
  const [uploadingCover, setUploadingCover] = useState(false);

  // Check user role
  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        const userData = JSON.parse(userStr);
        console.log('Books: User loaded from localStorage:', userData);
        setUser(userData);
        const isInstructorRole = userData.role === 'instructor';
        console.log('Books: Setting isInstructor to:', isInstructorRole);
        setIsInstructor(isInstructorRole);
      } else {
        console.log('Books: No user found in localStorage');
        setUser(null); // Explicitly set to null if no user
      }
    } catch (error) {
      console.error('Error getting user:', error);
      setUser(null); // Set to null on error
    }
  }, []);

  // Fetch books with filters and pagination
  const fetchBooks = async () => {
    // Don't fetch if user is not loaded yet
    if (user === null) {
      console.log('Books: User not loaded yet, skipping fetch');
      return;
    }
    
    try {
      setLoading(true);
      console.log('Books: Fetching books, isInstructor:', isInstructor, 'user role:', user?.role);
      
      const params: any = {
        page: currentPage,
        pageSize: perPage,
      };
      
      if (search) params.search = search;
      if (categoryFilter) params.categoryId = categoryFilter;
      if (statusFilter !== '') params.status = statusFilter === true ? 'active' : 'inactive';
      if (approvalFilter !== '') params.approvalStatus = approvalFilter;
      
      let response;
      if (isInstructor) {
        // Use instructor service
        console.log('Books: Using instructor API');
        const instructorResponse = await getInstructorBooks(params);
        response = {
          data: instructorResponse.books.map(book => ({
            ...book,
            cover_image: book.coverImage,
            is_active: true, // Default for instructor
          })),
          pagination: instructorResponse.pagination,
        };
      } else {
        // Use admin service
        console.log('Books: Using admin API');
        const adminResponse = await getBooks(params);
        response = {
          data: adminResponse.books,
          pagination: adminResponse.pagination,
        };
      }
      
      const mappedBooks = (response.data || []).map((book: any) => {
        // Debug log to see what we're getting
        console.log('Book data:', book.id, 'is_active:', book.is_active, 'isActive:', book.isActive);
        
        return {
          id: book.id,
          title: book.title,
          description: book.description,
          isbn: book.isbn,
          cover_image: book.cover_image || book.coverImage,
          price: typeof book.price === 'string' ? parseFloat(book.price) : book.price,
          category_id: book.category_id || book.category?.id,
          category: book.category,
          author_id: book.author_id || book.author?.id,
          author: book.author,
          // Check is_active from multiple possible field names
          is_active: book.is_active !== undefined 
            ? Boolean(book.is_active) 
            : (book.isActive !== undefined 
              ? Boolean(book.isActive) 
              : true),
          approval_status: book.approval_status !== undefined ? book.approval_status : (book.approvalStatus !== undefined ? book.approvalStatus : 0),
          language: book.language || 'vi',
          publication_year: book.publication_year || book.publicationYear,
          edition: book.edition,
          chapters: book.chapters || [],
        };
      }) as Book[];
      console.log('Fetched books:', mappedBooks.length, 'pagination:', response.pagination);
      console.log('Sample book is_active values:', mappedBooks.slice(0, 3).map(b => ({ id: b.id, title: b.title, is_active: b.is_active })));
      setBooks(mappedBooks);
      setTotal(response.pagination?.total || 0);
      setLastPage(response.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching books:', error);
      notify('Lỗi tải danh sách sách', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user !== null) { // Only fetch when user is loaded (including null check)
      fetchBooks();
    }
  }, [currentPage, perPage, search, categoryFilter, statusFilter, approvalFilter, isInstructor, user]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const cats = await getCategories();
      setCategories(cats);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  // Search handler with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      fetchBooks();
    }, 500);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchBooks();
  };

  const handleCoverFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      notify('Vui lòng chọn file ảnh', 'error');
      return;
    }

    setUploadingCover(true);

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCoverPreview(reader.result as string);
      };
      reader.readAsDataURL(file);

      const fileUrl = await uploadFile(file, 'books/covers');
      setBookForm(prev => ({ ...prev, coverImage: fileUrl }));
      notify('Upload ảnh bìa thành công', 'success');
    } catch (error) {
      console.error('Error uploading cover:', error);
      notify('Lỗi upload ảnh bìa', 'error');
    } finally {
      setUploadingCover(false);
    }
  };

  const handleCreateBook = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!bookForm.title || !bookForm.description || !bookForm.coverImage || !bookForm.price) {
      notify('Vui lòng điền đầy đủ thông tin bắt buộc', 'error');
      return;
    }

    try {
      console.log('Books: Creating book, isInstructor:', isInstructor, 'user role:', user?.role);
      
      // Generate ISBN if not provided (max 20 characters)
      // Format: ISBN + timestamp (last 8 digits) + random (4 chars) = 4 + 8 + 4 = 16 chars
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substr(2, 4).toUpperCase();
      const isbn = `ISBN${timestamp}${random}`;
      const staticPagePath = bookForm.title.toLowerCase().replace(/\s+/g, '-');
      
      let newBook;
      if (isInstructor) {
        // Use instructor API
        console.log('Books: Using instructor API to create book');
        const bookData: any = {
          title: bookForm.title,
          description: bookForm.description,
          isbn: isbn,
          coverImage: bookForm.coverImage,
          price: parseFloat(bookForm.price),
          staticPagePath: staticPagePath,
          language: bookForm.language || 'vi',
        };
        
        if (bookForm.categoryId) bookData.categoryId = parseInt(bookForm.categoryId);
        if (bookForm.publicationYear) bookData.publicationYear = parseInt(bookForm.publicationYear);
        if (bookForm.edition) bookData.edition = bookForm.edition;
        // ebookFile is optional, don't send if not provided
        
        newBook = await createInstructorBook(bookData);
        notify('Tạo sách thành công! Sách đang chờ phê duyệt từ admin.', 'success');
      } else {
        // Use admin API
        console.log('Books: Using admin API to create book');
        newBook = await bookService.createBook({
          title: bookForm.title,
          description: bookForm.description,
          coverImage: bookForm.coverImage,
          price: parseFloat(bookForm.price),
          categoryId: bookForm.categoryId ? parseInt(bookForm.categoryId) : undefined,
          language: bookForm.language,
          publicationYear: bookForm.publicationYear ? parseInt(bookForm.publicationYear) : undefined,
          edition: bookForm.edition || undefined,
        });
        notify('Tạo sách thành công!', 'success');
      }
      setShowCreateBookModal(false);
      resetBookForm();
      fetchBooks();
      
      // Redirect to book detail page to create chapter
      if (newBook.id) {
        router.push(`/dashboard/books/${newBook.id}`);
      }
    } catch (error: any) {
      console.error('Error creating book:', error);
      notify(error.message || 'Lỗi tạo sách', 'error');
    }
  };

  const handleEditBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedBook) return;

    try {
      const bookData = {
        title: bookForm.title,
        description: bookForm.description,
        coverImage: bookForm.coverImage,
        price: parseFloat(bookForm.price),
        categoryId: bookForm.categoryId ? parseInt(bookForm.categoryId) : undefined,
        language: bookForm.language || 'vi',
        publicationYear: bookForm.publicationYear ? parseInt(bookForm.publicationYear) : undefined,
        edition: bookForm.edition || undefined,
      };

      if (isInstructor) {
        // Use instructor API
        await updateInstructorBook(selectedBook.id, bookData);
      } else {
        // Use admin API
        await bookService.updateBook(selectedBook.id, {
          ...bookData,
          categoryId: bookForm.categoryId ? parseInt(bookForm.categoryId) : null,
          isActive: bookForm.isActive,
          approvalStatus: bookForm.approvalStatus,
        });
      }

      notify('Cập nhật sách thành công', 'success');
      setShowEditBookModal(false);
      resetBookForm();
      fetchBooks();
    } catch (error: any) {
      console.error('Error updating book:', error);
      notify(error.message || 'Lỗi cập nhật sách', 'error');
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;

    try {
      if (isInstructor) {
        // Use instructor API
        await deleteInstructorBook(selectedBook.id);
      } else {
        // Use admin API
        await bookService.deleteBook(selectedBook.id);
      }
      
      notify('Xóa sách thành công', 'success');
      setShowDeleteConfirm(false);
      setSelectedBook(null);
      fetchBooks();
    } catch (error: any) {
      console.error('Error deleting book:', error);
      
      // Extract error message from API response
      let errorMessage = 'Lỗi xóa sách';
      
      if (error.response?.data?.message) {
        // Backend returns { success: false, message: "..." }
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      } else if (error.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      notify(errorMessage, 'error');
    }
  };

  const handleViewBook = async (id: number) => {
    router.push(`/dashboard/books/${id}`);
  };

  const handleEditClick = (book: Book) => {
    setSelectedBook(book);
    setBookForm({
      title: book.title,
      description: book.description,
      coverImage: book.cover_image,
      price: book.price.toString(),
      categoryId: book.category_id?.toString() || '',
      language: book.language,
      publicationYear: book.publication_year?.toString() || '',
      edition: book.edition || '',
      isActive: book.is_active,
      approvalStatus: book.approval_status,
    });
    setCoverPreview(book.cover_image);
    setShowEditBookModal(true);
  };

  const handleDeleteClick = (book: Book) => {
    setSelectedBook(book);
    setShowDeleteConfirm(true);
  };

  const handleCreateChapter = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedBookId || !chapterForm.title || !chapterForm.description) {
      notify('Vui lòng điền đầy đủ thông tin', 'error');
      return;
    }

    try {
      await bookService.createChapter(selectedBookId, {
        title: chapterForm.title,
        description: chapterForm.description,
        orderIndex: chapterForm.orderIndex ? parseInt(chapterForm.orderIndex) : undefined,
      });

      notify('Tạo chương thành công', 'success');
      setShowCreateChapterModal(false);
      resetChapterForm();
      fetchBooks();
    } catch (error: any) {
      console.error('Error creating chapter:', error);
      notify(error.message || 'Lỗi tạo chương', 'error');
    }
  };

  const resetBookForm = () => {
    setBookForm({
      title: '',
      description: '',
      coverImage: '',
      price: '',
      categoryId: '',
      language: 'vi',
      publicationYear: '',
      edition: '',
    isActive: true,
      approvalStatus: 3,
    });
    setCoverPreview('');
    setSelectedBook(null);
  };

  const resetChapterForm = () => {
    setChapterForm({
      title: '',
      description: '',
      orderIndex: '',
    });
    setSelectedBookId(null);
  };

  const openCreateChapterModal = (bookId: number) => {
    router.push(`/dashboard/books/${bookId}/chapters/create`);
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý sách điện tử</h1>
          <p className="mt-2 text-sm text-gray-700">
            Quản lý sách điện tử, mã kích hoạt và nội dung số
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <button
            type="button"
            onClick={() => setShowCreateBookModal(true)}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
            Thêm sách mới
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
          {/* Search */}
          <div className="md:col-span-2">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Tìm kiếm theo tên, mô tả, ISBN..."
                value={search}
                onChange={handleSearch}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value ? parseInt(e.target.value) : '');
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả danh mục</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter === '' ? '' : statusFilter ? 'true' : 'false'}
              onChange={(e) => {
                setStatusFilter(e.target.value === '' ? '' : e.target.value === 'true');
                handleFilterChange();
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Tất cả trạng thái</option>
              <option value="true">Đang bán</option>
              <option value="false">Tạm dừng</option>
            </select>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <div className="bg-white overflow-hidden shadow rounded-lg p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <BookOpenIcon className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="ml-4">
                <dt className="text-sm font-medium text-gray-500">Tổng sách</dt>
              <dd className="text-2xl font-bold text-gray-900">{total}</dd>
            </div>
          </div>
        </div>
      </div>

      {/* Books grid */}
      {loading ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Đang tải...</div>
        </div>
      ) : books.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-500">Không tìm thấy sách nào</div>
        </div>
      ) : (
        <>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {books.map((book) => (
          <div key={book.id} className="bg-white overflow-hidden shadow-lg rounded-xl hover:shadow-xl transition-all duration-300">
            <div className="aspect-[3/4] bg-gradient-to-br from-blue-500 to-purple-600 relative">
                  {book.cover_image ? (
                    <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                  ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <BookOpenIcon className="h-20 w-20 text-white opacity-80" />
              </div>
                  )}
              
                  <div className="absolute top-3 left-3 flex flex-col gap-2">
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      book.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                      {book.is_active ? 'Đang bán' : 'Đã vô hiệu hóa'}
                </span>
                {(() => {
                  const approvalStatus = book.approval_status ?? (book as any).approvalStatus ?? 0;
                  if (approvalStatus === 0) {
                    return (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        <span className="w-1.5 h-1.5 bg-yellow-500 rounded-full mr-1.5 animate-pulse"></span>
                        Chờ duyệt
                      </span>
                    );
                  } else if (approvalStatus === 1) {
                    return (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></span>
                        Đã duyệt
                      </span>
                    );
                  } else if (approvalStatus === 2) {
                    return (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mr-1.5"></span>
                        Từ chối
                      </span>
                    );
                  }
                  return null;
                })()}
              </div>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-blue-600 font-medium">
                      {book.category?.name || 'Chưa phân loại'}
                    </span>
                <span className="text-sm text-gray-500">ISBN: {book.isbn}</span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                {book.title}
              </h3>

              <p 
                className="text-sm text-gray-600 mb-4 line-clamp-2"
                dangerouslySetInnerHTML={{ 
                  __html: book.description 
                    ? book.description.replace(/<[^>]*>/g, '').substring(0, 150) + (book.description.length > 150 ? '...' : '')
                    : '' 
                }}
              />

                  {book.author && (
              <div className="flex items-center mb-4">
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center mr-3">
                  <span className="text-sm font-medium text-white">
                          {book.author.name?.charAt(0) || 'A'}
                  </span>
                </div>
                <span className="text-sm text-gray-700">{book.author.name}</span>
              </div>
                  )}

              <div className="flex items-center justify-between mb-4">
                  <span className="text-lg font-bold text-gray-900">
                      {parseFloat(book.price?.toString() || '0').toLocaleString()}₫
                  </span>
                </div>
                
                {/* Approval Status Badge */}
                <div className="mb-4">
                  {(() => {
                    const approvalStatus = book.approval_status ?? (book as any).approvalStatus ?? 0;
                    if (approvalStatus === 0) {
                      return (
                        <div className="flex items-center text-xs text-yellow-700 bg-yellow-50 px-3 py-2 rounded-lg">
                          <span className="w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                          <span>Đang chờ phê duyệt từ admin</span>
                        </div>
                      );
                    } else if (approvalStatus === 1) {
                      return (
                        <div className="flex items-center text-xs text-green-700 bg-green-50 px-3 py-2 rounded-lg">
                          <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                          <span>Đã được phê duyệt và xuất bản</span>
                        </div>
                      );
                    } else if (approvalStatus === 2) {
                      return (
                        <div className="flex items-center text-xs text-red-700 bg-red-50 px-3 py-2 rounded-lg">
                          <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
                          <span>Đã bị từ chối - Vui lòng chỉnh sửa và gửi lại</span>
                        </div>
                      );
                    }
                    return null;
                  })()}
                </div>
              </div>

            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <div className="flex justify-between items-center">
                    <button
                      onClick={() => openCreateChapterModal(book.id)}
                      className="px-3 py-1.5 text-xs bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
                    >
                      Thêm chương
                  </button>
                    <div className="flex space-x-1">
                      <button
                        onClick={() => handleViewBook(book.id)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Xem chi tiết"
                      >
                        <EyeIcon className="h-4 w-4" />
                  </button>
                      <button
                        onClick={() => handleEditClick(book)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Sửa"
                      >
                    <PencilIcon className="h-4 w-4" />
                  </button>
                      <button
                        onClick={() => handleDeleteClick(book)}
                        className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
                        title="Xóa"
                      >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
          {lastPage > 1 && (
            <div className="flex items-center justify-between bg-white px-4 py-3 border-t border-gray-200 sm:px-6 rounded-lg">
        <div className="flex-1 flex justify-between sm:hidden">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
            Trước
          </button>
                <button
                  onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                  disabled={currentPage === lastPage}
                  className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                >
            Sau
          </button>
        </div>
        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
                    Hiển thị <span className="font-medium">{(currentPage - 1) * perPage + 1}</span> đến{' '}
                    <span className="font-medium">{Math.min(currentPage * perPage, total)}</span> trong tổng{' '}
                    <span className="font-medium">{total}</span> kết quả
            </p>
          </div>
          <div>
                  <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronLeftIcon className="h-5 w-5" />
              </button>
                    {[...Array(Math.min(5, lastPage))].map((_, i) => {
                      let pageNum: number;
                      if (lastPage <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= lastPage - 2) {
                        pageNum = lastPage - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={pageNum}
                          onClick={() => setCurrentPage(pageNum)}
                          className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                            currentPage === pageNum
                              ? 'z-10 bg-blue-50 border-blue-500 text-blue-600'
                              : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                          }`}
                        >
                          {pageNum}
              </button>
                      );
                    })}
                    <button
                      onClick={() => setCurrentPage(p => Math.min(lastPage, p + 1))}
                      disabled={currentPage === lastPage}
                      className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <ChevronRightIcon className="h-5 w-5" />
              </button>
            </nav>
          </div>
        </div>
      </div>
          )}
        </>
      )}

      {/* Create Book Modal */}
      {showCreateBookModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowCreateBookModal(false);
              resetBookForm();
            }}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Tạo sách mới</h3>
                  <button onClick={() => {
                    setShowCreateBookModal(false);
                    resetBookForm();
                  }} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleCreateBook} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Tiêu đề *</label>
                      <input type="text" required value={bookForm.title}
                        onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                      <RichTextEditor
                        value={bookForm.description}
                        onChange={(value) => setBookForm(prev => ({ ...prev, description: value }))}
                        placeholder="Mô tả chi tiết về sách... (Sử dụng thanh công cụ để định dạng văn bản)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giá (₫) *</label>
                      <input type="number" required min="0" step="1000" value={bookForm.price}
                        onChange={(e) => setBookForm(prev => ({ ...prev, price: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                      <select value={bookForm.categoryId}
                        onChange={(e) => setBookForm(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Ngôn ngữ</label>
                      <select value={bookForm.language}
                        onChange={(e) => setBookForm(prev => ({ ...prev, language: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="vi">Tiếng Việt</option>
                        <option value="en">English</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Năm xuất bản</label>
                      <input type="number" min="1900" max={new Date().getFullYear()} value={bookForm.publicationYear}
                        onChange={(e) => setBookForm(prev => ({ ...prev, publicationYear: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phiên bản</label>
                      <input type="text" value={bookForm.edition}
                        onChange={(e) => setBookForm(prev => ({ ...prev, edition: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Ảnh bìa *</label>
                      {coverPreview && (
                        <div className="mt-2 mb-2">
                          <img src={coverPreview} alt="Preview" className="h-32 w-auto rounded-md" />
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleCoverFileChange} disabled={uploadingCover}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      {uploadingCover && <p className="mt-1 text-sm text-gray-500">Đang upload...</p>}
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm">
                      Tạo sách
                    </button>
                    <button type="button" onClick={() => {
                      setShowCreateBookModal(false);
                      resetBookForm();
                    }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Book Modal */}
      {showEditBookModal && selectedBook && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowEditBookModal(false);
              resetBookForm();
            }}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Sửa sách</h3>
                  <button onClick={() => {
                    setShowEditBookModal(false);
                    resetBookForm();
                  }} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleEditBook} className="space-y-4">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Tiêu đề *</label>
                      <input type="text" required value={bookForm.title}
                        onChange={(e) => setBookForm(prev => ({ ...prev, title: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Mô tả *</label>
                      <RichTextEditor
                        value={bookForm.description}
                        onChange={(value) => setBookForm(prev => ({ ...prev, description: value }))}
                        placeholder="Mô tả chi tiết về sách... (Sử dụng thanh công cụ để định dạng văn bản)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Giá (₫) *</label>
                      <input type="number" required min="0" step="1000" value={bookForm.price}
                        onChange={(e) => setBookForm(prev => ({ ...prev, price: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Danh mục</label>
                      <select value={bookForm.categoryId}
                        onChange={(e) => setBookForm(prev => ({ ...prev, categoryId: e.target.value }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="">Chọn danh mục</option>
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Trạng thái</label>
                      <select value={bookForm.isActive ? 'true' : 'false'}
                        onChange={(e) => setBookForm(prev => ({ ...prev, isActive: e.target.value === 'true' }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="true">Đang bán</option>
                        <option value="false">Tạm dừng</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Trạng thái duyệt</label>
                      <select value={bookForm.approvalStatus}
                        onChange={(e) => setBookForm(prev => ({ ...prev, approvalStatus: parseInt(e.target.value) }))}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500">
                        <option value="1">Chờ duyệt</option>
                        <option value="2">Từ chối</option>
                        <option value="3">Đã duyệt</option>
                      </select>
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Ảnh bìa *</label>
                      {coverPreview && (
                        <div className="mt-2 mb-2">
                          <img src={coverPreview} alt="Preview" className="h-32 w-auto rounded-md" />
                        </div>
                      )}
                      <input type="file" accept="image/*" onChange={handleCoverFileChange} disabled={uploadingCover}
                        className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                      {uploadingCover && <p className="mt-1 text-sm text-gray-500">Đang upload...</p>}
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm">
                      Cập nhật
                    </button>
                    <button type="button" onClick={() => {
                      setShowEditBookModal(false);
                      resetBookForm();
                    }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Book Modal */}
      {showViewBookModal && selectedBook && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowViewBookModal(false);
              setSelectedBook(null);
            }}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-4xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Chi tiết sách</h3>
                  <button onClick={() => {
                    setShowViewBookModal(false);
                    setSelectedBook(null);
                  }} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedBook.cover_image && (
                      <div>
                        <img src={selectedBook.cover_image} alt={selectedBook.title} className="w-full rounded-lg" />
                      </div>
                    )}
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tiêu đề</label>
                        <p className="text-lg font-semibold text-gray-900">{selectedBook.title}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">ISBN</label>
                        <p className="text-gray-900">{selectedBook.isbn}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Giá</label>
                        <p className="text-gray-900">{parseFloat(selectedBook.price?.toString() || '0').toLocaleString()}₫</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Danh mục</label>
                        <p className="text-gray-900">{selectedBook.category?.name || 'Chưa phân loại'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Tác giả</label>
                        <p className="text-gray-900">{selectedBook.author?.name || 'Chưa có'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-500">Trạng thái</label>
                        <p className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                          selectedBook.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {selectedBook.is_active ? 'Đang bán' : 'Đã vô hiệu hóa'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mô tả</label>
                    {selectedBook.description && (
                      <div 
                        className="prose prose-sm max-w-none text-gray-900 rich-text-content"
                        dangerouslySetInnerHTML={{ __html: selectedBook.description }}
                      />
                    )}
                  </div>
                  {selectedBook.chapters && selectedBook.chapters.length > 0 && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">Chương ({selectedBook.chapters.length})</label>
                      <div className="mt-2 space-y-2">
                        {selectedBook.chapters.map((chapter: any) => (
                          <div key={chapter.id} className="p-3 bg-gray-50 rounded-lg">
                            <p className="font-medium text-gray-900">Chương {chapter.order_index}: {chapter.title}</p>
                            {chapter.description && (
                              <div 
                                className="text-sm text-gray-600 mt-1 prose prose-xs max-w-none"
                                dangerouslySetInnerHTML={{ __html: chapter.description }}
                              />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {showDeleteConfirm && selectedBook && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowDeleteConfirm(false);
              setSelectedBook(null);
            }}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <TrashIcon className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-gray-900">Xóa sách</h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Bạn có chắc chắn muốn xóa sách "{selectedBook.title}"? Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                  <button type="button" onClick={handleDeleteBook}
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm">
                    Xóa
                  </button>
                  <button type="button" onClick={() => {
                    setShowDeleteConfirm(false);
                    setSelectedBook(null);
                  }}
                    className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm">
                    Hủy
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Chapter Modal */}
      {showCreateChapterModal && selectedBookId && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => {
              setShowCreateChapterModal(false);
              resetChapterForm();
            }}></div>
            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg z-10">
              <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium text-gray-900">Tạo chương mới</h3>
                  <button onClick={() => {
                    setShowCreateChapterModal(false);
                    resetChapterForm();
                  }} className="text-gray-400 hover:text-gray-500">
                    <XMarkIcon className="h-6 w-6" />
                  </button>
                </div>
                <form onSubmit={handleCreateChapter} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Tiêu đề chương *</label>
                    <input type="text" required value={chapterForm.title}
                      onChange={(e) => setChapterForm(prev => ({ ...prev, title: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Mô tả *</label>
                    <textarea required rows={4} value={chapterForm.description}
                      onChange={(e) => setChapterForm(prev => ({ ...prev, description: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Thứ tự chương</label>
                    <input type="number" min="1" value={chapterForm.orderIndex}
                      onChange={(e) => setChapterForm(prev => ({ ...prev, orderIndex: e.target.value }))}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                      placeholder="Để trống để tự động tăng" />
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-cols-2 sm:gap-3 sm:grid-flow-row-dense">
                    <button type="submit"
                      className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:col-start-2 sm:text-sm">
                      Tạo chương
                    </button>
                    <button type="button" onClick={() => {
                      setShowCreateChapterModal(false);
                      resetChapterForm();
                    }}
                      className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:col-start-1 sm:text-sm">
                      Hủy
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
