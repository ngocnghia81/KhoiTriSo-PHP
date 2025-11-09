'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getDashboard } from '@/services/analytics';
import { getInstructorDashboard } from '@/services/instructor';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ShoppingCartIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
} from '@heroicons/react/24/outline';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function DashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userData = raw ? JSON.parse(raw) : null;
      if (!userData) {
        router.replace('/');
        return;
      }
      setUser(userData);
      setIsInstructor(userData.role === 'instructor');
      
      if (userData.role === 'admin') {
        // Load admin dashboard
        (async () => {
          try {
            const statsData = await getDashboard();
            if (statsData) {
              setStats(statsData);
            }
          } catch (error) {
            console.error('Error fetching dashboard stats:', error);
          } finally {
            setLoading(false);
          }
        })();
      } else if (userData.role === 'instructor') {
        // Load instructor dashboard
        (async () => {
          try {
            const statsData = await getInstructorDashboard();
            if (statsData) {
              setStats(statsData);
            }
          } catch (error) {
            console.error('Error fetching instructor dashboard:', error);
          } finally {
            setLoading(false);
          }
        })();
      } else {
        router.replace('/');
      }
    } catch {
      router.replace('/');
      return;
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen p-8">
        <div className="text-center py-12">
          <p className="text-gray-500">Không thể tải dữ liệu dashboard</p>
        </div>
      </div>
    );
  }

  const dashboardTitle = isInstructor ? 'Bảng điều khiển Giảng viên' : 'Bảng điều khiển Admin';

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">{dashboardTitle}</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isInstructor ? (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng khóa học</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.coursesCount || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Khóa học của tôi</p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <AcademicCapIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng sách</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.booksCount || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Sách của tôi</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BookOpenIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng học viên</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalStudents || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Học viên đã đăng ký</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stats.totalRevenue 
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)
                        : '0 ₫'}
                    </p>
                    <div className="flex items-center mt-1">
                      {stats.revenueToday >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <p className="text-xs text-gray-500">
                        {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenueToday || 0)} hôm nay
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng người dùng</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalUsers || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.activeUsers || 0} đang hoạt động
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <UserGroupIcon className="h-8 w-8 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng khóa học</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalCourses || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {stats.newRegistrations || 0} đăng ký mới hôm nay
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-lg">
                    <AcademicCapIcon className="h-8 w-8 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng sách</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">{stats.totalBooks || 0}</p>
                    <p className="text-xs text-gray-500 mt-1">Sách điện tử</p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <BookOpenIcon className="h-8 w-8 text-purple-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {stats.totalRevenue 
                        ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.totalRevenue)
                        : '0 ₫'}
                    </p>
                    <div className="flex items-center mt-1">
                      {stats.revenueGrowth >= 0 ? (
                        <ArrowTrendingUpIcon className="h-4 w-4 text-green-500 mr-1" />
                      ) : (
                        <ArrowTrendingDownIcon className="h-4 w-4 text-red-500 mr-1" />
                      )}
                      <p className={`text-xs ${stats.revenueGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {Math.abs(stats.revenueGrowth || 0).toFixed(1)}% so với hôm qua
                      </p>
                    </div>
                  </div>
                  <div className="p-3 bg-yellow-100 rounded-lg">
                    <CurrencyDollarIcon className="h-8 w-8 text-yellow-600" />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Secondary Stats */}
        {isInstructor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Doanh thu hôm nay</h3>
                <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-blue-600">
                {stats.revenueToday 
                  ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenueToday)
                  : '0 ₫'}
              </p>
              <p className="text-sm text-gray-500 mt-2">{stats.ordersToday || 0} đơn hàng</p>
            </div>
          </div>
        )}

        {/* Charts */}
        {isInstructor && stats.revenueChart && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu 7 ngày qua</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats.revenueChart || []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis 
                    dataKey="label" 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                  />
                  <YAxis 
                    stroke="#6b7280"
                    style={{ fontSize: '12px' }}
                    tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value: number) => [
                      new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value),
                      'Doanh thu'
                    ]}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name="Doanh thu"
                    dot={{ fill: '#3b82f6', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 khóa học phổ biến</h3>
              {stats.topCourses && stats.topCourses.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart 
                    data={stats.topCourses.map((c: any) => ({
                      name: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
                      students: c.students,
                      fullName: c.title,
                    }))}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                    <YAxis 
                      type="category" 
                      dataKey="name" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      width={150}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `${value} học viên - ${props.payload.fullName}`,
                        'Học viên'
                      ]}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Bar 
                      dataKey="students" 
                      fill="#3b82f6" 
                      name="Học viên"
                      radius={[0, 8, 8, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-500">
                  <p>Chưa có dữ liệu</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Admin charts - keep existing admin dashboard code */}
        {!isInstructor && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Doanh thu hôm nay</h3>
                  <ShoppingCartIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {stats.revenueToday 
                    ? new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(stats.revenueToday)
                    : '0 ₫'}
                </p>
                <p className="text-sm text-gray-500 mt-2">{stats.ordersToday || 0} đơn hàng</p>
              </div>

              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">Đăng ký mới</h3>
                  <UserGroupIcon className="h-6 w-6 text-gray-400" />
                </div>
                <p className="text-3xl font-bold text-green-600">{stats.newRegistrations || 0}</p>
                <p className="text-sm text-gray-500 mt-2">Người dùng mới hôm nay</p>
              </div>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Revenue Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Doanh thu 7 ngày qua</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats.revenueChart || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      formatter={(value: number) => [
                        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value),
                        'Doanh thu'
                      ]}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Doanh thu"
                      dot={{ fill: '#3b82f6', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* User Growth Chart */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Tăng trưởng người dùng 7 ngày qua</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats.userGrowth || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis 
                      dataKey="label" 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#6b7280"
                      style={{ fontSize: '12px' }}
                    />
                    <Tooltip 
                      formatter={(value: number) => [value, 'Người dùng']}
                      contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="users" 
                      fill="#10b981" 
                      name="Người dùng mới"
                      radius={[8, 8, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Top Courses */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 khóa học phổ biến</h3>
                {stats.topCourses && stats.topCourses.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart 
                      data={stats.topCourses.map((c: any) => ({
                        name: c.title.length > 20 ? c.title.substring(0, 20) + '...' : c.title,
                        students: c.students,
                        fullName: c.title,
                      }))}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis type="number" stroke="#6b7280" style={{ fontSize: '12px' }} />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="#6b7280"
                        style={{ fontSize: '12px' }}
                        width={150}
                      />
                      <Tooltip 
                        formatter={(value: number, name: string, props: any) => [
                          `${value} học viên - ${props.payload.fullName}`,
                          'Học viên'
                        ]}
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                      />
                      <Bar 
                        dataKey="students" 
                        fill="#3b82f6" 
                        name="Học viên"
                        radius={[0, 8, 8, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <p>Chưa có dữ liệu</p>
                  </div>
                )}
              </div>

              {/* Top Books */}
              <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 5 sách phổ biến</h3>
                {stats.topBooks && stats.topBooks.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topBooks.map((book: any, index: number) => (
                      <div key={book.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold mr-3">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 text-sm">
                              {book.title.length > 40 ? book.title.substring(0, 40) + '...' : book.title}
                            </p>
                            <p className="text-xs text-gray-500">{book.questions} câu hỏi</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-blue-600">
                            {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(book.price)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64 text-gray-500">
                    <p>Chưa có dữ liệu</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
