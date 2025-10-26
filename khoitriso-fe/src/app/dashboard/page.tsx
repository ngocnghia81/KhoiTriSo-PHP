"use client"
import {
  UserGroupIcon,
  AcademicCapIcon,
  BookOpenIcon,
  CurrencyDollarIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  EyeIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import StatsCard from '@/components/dashboard/StatsCard';
import Chart from '@/components/dashboard/Chart';
import RecentActivity from '@/components/dashboard/RecentActivity';
import TopPerformers from '@/components/dashboard/TopPerformers';
import { useEffect, useState } from 'react';
import { getDashboard } from '@/services/analytics';
import { useAuthGuard } from '@/hooks/useAuthGuard';

// Note: client components cannot export metadata

type StatCard = { name: string; value: string | number; change?: string; changeType?: 'increase' | 'decrease'; icon?: any; color?: string; description?: string };
type RevenuePoint = { month: string; revenue: number };
type UserGrowthPoint = { month: string; users: number };
type CompletionPoint = { course: string; completion: number };

export default function DashboardPage() {
  // client-side guard
  // @ts-ignore
  useAuthGuard('admin');
  const [stats, setStats] = useState<StatCard[]>([]);
  const [revenueData, setRevenueData] = useState<RevenuePoint[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<UserGrowthPoint[]>([]);
  const [courseCompletionData, setCourseCompletionData] = useState<CompletionPoint[]>([]);

  useEffect(() => {
    (async () => {
      const res = await getDashboard();
      if (res.ok) {
        const api = (res.data as any) || {};
        // Build stats cards from known keys with safe fallbacks
        const builtStats: StatCard[] = (api.stats as StatCard[]) || [
          api.totalRevenue !== undefined ? { name: 'Tổng doanh thu', value: api.totalRevenue, change: api.revenueChange, changeType: (api.revenueChange ?? 0) >= 0 ? 'increase' : 'decrease', icon: ArrowTrendingUpIcon, color: 'green' } : undefined,
          api.totalUsers !== undefined ? { name: 'Tổng người dùng', value: api.totalUsers, change: api.usersChange, changeType: (api.usersChange ?? 0) >= 0 ? 'increase' : 'decrease', icon: UserGroupIcon, color: 'blue' } : undefined,
          api.totalCourses !== undefined ? { name: 'Tổng khóa học', value: api.totalCourses, change: api.coursesChange, changeType: (api.coursesChange ?? 0) >= 0 ? 'increase' : 'decrease', icon: AcademicCapIcon, color: 'indigo' } : undefined,
          api.totalBooks !== undefined ? { name: 'Tổng sách', value: api.totalBooks, change: api.booksChange, changeType: (api.booksChange ?? 0) >= 0 ? 'increase' : 'decrease', icon: BookOpenIcon, color: 'purple' } : undefined,
        ].filter(Boolean) as StatCard[];
        setStats(builtStats);

        // Monthly revenue
        const monthlyRevenue = (api.revenueMonthly as any[])?.map((m: any) => ({ month: m.month ?? m.label ?? '', revenue: Number(m.revenue ?? m.value ?? 0) })) || (api.revenueData as RevenuePoint[]) || [];
        setRevenueData(monthlyRevenue);

        // Monthly user growth
        const monthlyUsers = (api.usersMonthly as any[])?.map((m: any) => ({ month: m.month ?? m.label ?? '', users: Number(m.users ?? m.value ?? 0) })) || (api.userGrowthData as UserGrowthPoint[]) || [];
        setUserGrowthData(monthlyUsers);

        // Course completion
        const completion = (api.courseCompletion as any[])?.map((c: any) => ({ course: c.course ?? c.name ?? '', completion: Number(c.completion ?? c.value ?? 0) })) || (api.courseCompletionData as CompletionPoint[]) || [];
        setCourseCompletionData(completion);
      }
    })();
  }, []);
  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="md:flex md:items-center md:justify-between">
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
            Dashboard
          </h1>
          <div className="mt-1 flex flex-col sm:mt-0 sm:flex-row sm:flex-wrap sm:space-x-6">
            <div className="mt-2 flex items-center text-sm text-gray-500">
              <ClockIcon className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" />
              Cập nhật lần cuối: {new Date().toLocaleString('vi-VN')}
            </div>
          </div>
        </div>
        <div className="mt-4 flex md:ml-4 md:mt-0">
          <button
            type="button"
            className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
          >
            <EyeIcon className="-ml-0.5 mr-1.5 h-5 w-5 text-gray-400" />
            Xem báo cáo chi tiết
          </button>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.length === 0 ? (
          <div className="col-span-1 sm:col-span-2 lg:col-span-3 text-sm text-gray-500">Không có dữ liệu thống kê</div>
        ) : (
          stats.map((stat) => (
            <StatsCard
              key={stat.name}
              name={stat.name}
              value={String(stat.value ?? '')}
              change={String(stat.change ?? '')}
              changeType={(stat.changeType as any) ?? 'increase'}
              icon={stat.icon ?? UserGroupIcon}
              color={(stat.color as any) ?? ('blue' as any)}
              description={stat.description ?? ''}
            />
          ))
        )}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Revenue chart */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Doanh thu theo tháng</h3>
            </div>
            <div className="mt-6">
              <Chart 
                data={revenueData} 
                type="line" 
                xKey="month" 
                yKey="revenue"
                color="#10B981"
                height={300}
              />
            </div>
          </div>
        </div>

        {/* User growth chart */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900">Tăng trưởng người dùng</h3>
            </div>
            <div className="mt-6">
              <Chart 
                data={userGrowthData} 
                type="area" 
                xKey="month" 
                yKey="users"
                color="#3B82F6"
                height={300}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Course completion and recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Course completion rates */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Tỷ lệ hoàn thành khóa học</h3>
            <div className="space-y-4">
              {courseCompletionData.length === 0 ? (
                <div className="text-sm text-gray-500">Không có dữ liệu</div>
              ) : courseCompletionData.map((course) => (
                <div key={course.course} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">{course.course}</span>
                      <span className="text-sm text-gray-500">{course.completion}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${course.completion}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent activity */}
        <RecentActivity />
      </div>

      {/* Top performers and alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopPerformers />
        
        {/* System alerts */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-6">Cảnh báo hệ thống</h3>
            <div className="space-y-4">
              <div className="flex items-start space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Server tải cao</p>
                  <p className="text-sm text-red-600">CPU usage đạt 85%, cần kiểm tra</p>
                  <p className="text-xs text-red-500 mt-1">5 phút trước</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-800">Backup chậm</p>
                  <p className="text-sm text-yellow-600">Backup database mất 2h để hoàn thành</p>
                  <p className="text-xs text-yellow-500 mt-1">1 giờ trước</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <CheckCircleIcon className="h-5 w-5 text-blue-400 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-800">Cập nhật thành công</p>
                  <p className="text-sm text-blue-600">Hệ thống đã được cập nhật lên v2.1.0</p>
                  <p className="text-xs text-blue-500 mt-1">3 giờ trước</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
