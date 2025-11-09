'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useSidebar } from '@/contexts/SidebarContext';
import ResizablePanel from './ResizablePanel';
import { getCourses, AdminCourse } from '@/services/admin';
import { authService } from '@/services/authService';
import {
  HomeIcon,
  AcademicCapIcon,
  BookOpenIcon,
  UserGroupIcon,
  ChartBarIcon,
  CogIcon,
  BellIcon,
  ShoppingCartIcon,
  CurrencyDollarIcon,
  DocumentTextIcon,
  ChatBubbleLeftRightIcon,
  VideoCameraIcon,
  ClipboardDocumentListIcon,
  TagIcon,
  ExclamationTriangleIcon,
  UserIcon,
  Bars3Icon,
  XMarkIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/react/24/outline';
import Logo from '@/components/Logo';

const navigation = [
  {
    name: 'Tổng quan',
    href: '/dashboard',
    icon: HomeIcon,
    current: true,
  },
  {
    name: 'Quản lý người dùng',
    icon: UserGroupIcon,
    children: [
      { name: 'Danh sách người dùng', href: '/dashboard/users' },
    ],
  },
  {
    name: 'Khóa học',
    icon: AcademicCapIcon,
    children: [], // Will be populated dynamically from database
  },
  {
    name: 'Sách điện tử',
    icon: BookOpenIcon,
    children: [
      { name: 'Danh sách sách', href: '/dashboard/books' },
      { name: 'Mã kích hoạt', href: '/dashboard/activation-codes' },
    ],
  },
  {
    name: 'Đơn hàng & Thanh toán',
    icon: ShoppingCartIcon,
    children: [
      { name: 'Đơn hàng', href: '/dashboard/orders' },
      { name: 'Mã giảm giá', href: '/dashboard/coupons' },
    ],
  },
  {
    name: 'Báo cáo & Thống kê',
    icon: ChartBarIcon,
    children: [
      { name: 'Báo cáo tổng hợp', href: '/dashboard/reports' },
    ],
  },
  {
    name: 'Nội dung',
    icon: DocumentTextIcon,
    children: [
      { name: 'Danh mục', href: '/dashboard/categories' },
      { name: 'Trang tĩnh', href: '/dashboard/static-pages' },
    ],
  },
  {
    name: 'Phê duyệt',
    icon: ExclamationTriangleIcon,
    children: [
      { name: 'Khóa học', href: '/dashboard/approvals/courses' },
      { name: 'Sách điện tử', href: '/dashboard/approvals/books' },
    ],
  },
  {
    name: 'Chiết khấu',
    icon: CurrencyDollarIcon,
    children: [
      { name: 'Tổng quan', href: '/dashboard/commissions' },
      { name: 'Thanh toán chờ', href: '/dashboard/commissions/pending' },
      { name: 'Lịch sử thanh toán', href: '/dashboard/commissions/history' },
    ],
  },
  {
    name: 'Hệ thống',
    icon: CogIcon,
    children: [
      { name: 'Cài đặt', href: '/dashboard/settings' },
      { name: 'Audit Logs', href: '/dashboard/audit-logs' },
      { name: 'Notifications', href: '/dashboard/notifications' },
      { name: 'Backup & Restore', href: '/dashboard/backup' },
    ],
  },
];

export default function DashboardSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const { 
    sidebarOpen, 
    sidebarCollapsed, 
    sidebarWidth,
    setSidebarOpen, 
    setSidebarWidth,
    toggleCollapse 
  } = useSidebar();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Tổng quan']);
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Get current user from localStorage
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Error getting user:', error);
    }
  }, []);

  const handleLogout = async () => {
    try {
      // Call logout API
      await authService.logout();
      
      // Clear local storage
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      
      // Redirect to home page
      router.push('/');
      window.location.reload();
    } catch (error) {
      console.error('Logout error:', error);
      // Force clear and redirect even if API fails
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      router.push('/');
      window.location.reload();
    }
  };

  // Fetch courses from database
  useEffect(() => {
    const fetchCourses = async () => {
      setCoursesLoading(true);
      try {
        const response = await getCourses({ page: 1, pageSize: 10 });
        setCourses(response.courses);
      } catch (error) {
        console.error('Error fetching courses:', error);
      } finally {
        setCoursesLoading(false);
      }
    };
    fetchCourses();
  }, []);

  // Build courses menu items dynamically
  const coursesMenuItems = [
    { name: 'Danh sách khóa học', href: '/dashboard/courses' },
    { name: 'Lớp học trực tuyến', href: '/dashboard/live-classes' },
  ];

  // Build navigation with dynamic courses menu
  const dynamicNavigation = navigation.map(item => {
    if (item.name === 'Khóa học') {
      return {
        ...item,
        children: coursesMenuItems,
      };
    }
    return item;
  });

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(item => item !== itemName)
        : [...prev, itemName]
    );
  };

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  const handleWidthChange = (newWidth: number) => {
    setSidebarWidth(newWidth);
  };

  return (
    <>
      {/* Mobile menu button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          type="button"
          className="bg-white p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          onClick={() => setSidebarOpen(true)}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-40">
          <div
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          />
        </div>
      )}

      {/* Sidebar */}
      <ResizablePanel
        initialWidth={sidebarWidth}
        minWidth={sidebarCollapsed ? 80 : 200}
        maxWidth={400}
        onWidthChange={handleWidthChange}
        className={`bg-white border-r border-gray-200 shadow-sm flex flex-col h-screen ${sidebarOpen ? '' : 'hidden lg:flex'}`}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">KT</span>
            </div>
            {!sidebarCollapsed && (
              <div className="text-gray-900 font-semibold text-sm">Khởi Trí Số</div>
            )}
          </div>
          <div className="flex items-center space-x-1">
            {/* Collapse/Expand button */}
            <button
              type="button"
              className="hidden lg:block p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={toggleCollapse}
              title={sidebarCollapsed ? 'Mở rộng sidebar' : 'Thu gọn sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRightIcon className="h-4 w-4" />
              ) : (
                <ChevronLeftIcon className="h-4 w-4" />
              )}
            </button>
            {/* Mobile close button */}
            <button
              type="button"
              className="lg:hidden p-1.5 rounded-md text-gray-500 hover:text-gray-900 hover:bg-gray-100"
              onClick={() => setSidebarOpen(false)}
            >
              <XMarkIcon className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <div className="space-y-1">
            {dynamicNavigation.map((item) => (
              <div key={item.name}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleExpanded(item.name)}
                      className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 rounded-md hover:text-gray-900 hover:bg-gray-100 group transition-all duration-200"
                    >
                      <div className="flex items-center">
                        <item.icon className={`h-4 w-4 text-gray-500 group-hover:text-blue-600 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                        {!sidebarCollapsed && item.name}
                      </div>
                      {!sidebarCollapsed && (
                        <svg
                          className={`ml-2 h-4 w-4 transform transition-transform ${
                            expandedItems.includes(item.name) ? 'rotate-90' : ''
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </button>
                    {!sidebarCollapsed && expandedItems.includes(item.name) && (
                      <div className="ml-5 mt-1 space-y-0.5">
                        {item.children.map((child) => (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                              isActive(child.href)
                                ? 'text-blue-700 bg-blue-50 border-l-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                            }`}
                            onClick={() => setSidebarOpen(false)}
                          >
                            {child.name}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <Link
                    href={item.href}
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive(item.href)
                        ? 'text-blue-700 bg-blue-50 border-l-2 border-blue-600'
                        : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <item.icon className={`h-4 w-4 text-gray-500 ${sidebarCollapsed ? 'mx-auto' : 'mr-3'}`} />
                    {!sidebarCollapsed && item.name}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Sidebar footer */}
        <div className="border-t border-gray-200 p-3 space-y-2">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                <UserIcon className="h-4 w-4 text-white" />
              </div>
            </div>
            {!sidebarCollapsed && (
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.username || user?.name || 'Admin User'}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {user?.email || 'admin@khoitriso.com'}
                </p>
              </div>
            )}
          </div>
          {!sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5 mr-2" />
              Đăng xuất
            </button>
          )}
          {sidebarCollapsed && (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              title="Đăng xuất"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
            </button>
          )}
        </div>
      </ResizablePanel>
    </>
  );
}
