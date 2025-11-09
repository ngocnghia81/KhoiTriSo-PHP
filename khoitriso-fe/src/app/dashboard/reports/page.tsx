'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  getAdminTotalRevenue,
  getInstructorRevenue,
  getRevenueReport,
  type AdminTotalRevenue,
  type InstructorRevenue,
  type RevenueReport,
} from '@/services/reports';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  CurrencyDollarIcon,
  UserGroupIcon,
  ChartBarIcon,
  ArrowTrendingUpIcon,
  CalendarIcon,
  AcademicCapIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#8b5cf6'];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

export default function ReportsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'admin' | 'instructors' | 'detailed'>(() => {
    // Check role on mount
    if (typeof window !== 'undefined') {
      try {
        const raw = localStorage.getItem('user');
        const userData = raw ? JSON.parse(raw) : null;
        if (userData?.role === 'instructor') {
          return 'instructors';
        }
      } catch {}
    }
    return 'admin';
  });
  const [loading, setLoading] = useState(false);
  
  // Admin Total Revenue
  const [adminRevenue, setAdminRevenue] = useState<AdminTotalRevenue | null>(null);
  const [adminDateRange, setAdminDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Instructor Revenue
  const [instructorRevenue, setInstructorRevenue] = useState<InstructorRevenue[]>([]);
  const [instructorDateRange, setInstructorDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });

  // Detailed Report
  const [detailedReport, setDetailedReport] = useState<RevenueReport | null>(null);
  const [detailedDateRange, setDetailedDateRange] = useState({
    from: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0],
  });
  const [itemType, setItemType] = useState<1 | 2 | undefined>(undefined);

  const [user, setUser] = useState<any>(null);
  const [isInstructor, setIsInstructor] = useState(false);

  useEffect(() => {
    // Check user role
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      const userData = raw ? JSON.parse(raw) : null;
      if (!userData || (userData.role !== 'admin' && userData.role !== 'instructor')) {
        router.replace('/');
        return;
      }
      setUser(userData);
      setIsInstructor(userData.role === 'instructor');
      // Set default tab for instructor
      if (userData.role === 'instructor') {
        setActiveTab('instructors');
      }
    } catch {
      router.replace('/');
      return;
    }
  }, [router]);

  useEffect(() => {
    if (activeTab === 'admin') {
      fetchAdminRevenue();
    } else if (activeTab === 'instructors') {
      fetchInstructorRevenue();
    } else if (activeTab === 'detailed') {
      fetchDetailedReport();
    }
  }, [activeTab, adminDateRange, instructorDateRange, detailedDateRange, itemType]);

  const fetchAdminRevenue = async () => {
    setLoading(true);
    try {
      const data = await getAdminTotalRevenue({
        from: adminDateRange.from,
        to: adminDateRange.to,
      });
      setAdminRevenue(data);
    } catch (error: any) {
      console.error('Error fetching admin revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInstructorRevenue = async () => {
    setLoading(true);
    try {
      const data = await getInstructorRevenue({
        from: instructorDateRange.from,
        to: instructorDateRange.to,
        instructor_id: isInstructor ? user?.id : undefined, // If instructor, only show their data
      });
      setInstructorRevenue(data.instructors || []);
    } catch (error: any) {
      console.error('Error fetching instructor revenue:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDetailedReport = async () => {
    setLoading(true);
    try {
      const data = await getRevenueReport({
        from: detailedDateRange.from,
        to: detailedDateRange.to,
        item_type: itemType,
      });
      setDetailedReport(data);
    } catch (error: any) {
      console.error('Error fetching detailed report:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Báo cáo & Thống kê</h1>
          <p className="mt-2 text-sm text-gray-700">Xem báo cáo doanh thu và thống kê chi tiết</p>
        </div>
        </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {!isInstructor && (
          <button
              onClick={() => setActiveTab('admin')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'admin'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <CurrencyDollarIcon className="h-5 w-5 mr-2" />
                Doanh thu Admin
              </div>
          </button>
          )}
          <button
            onClick={() => setActiveTab('instructors')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'instructors'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <div className="flex items-center">
              <UserGroupIcon className="h-5 w-5 mr-2" />
              {isInstructor ? 'Doanh thu của tôi' : 'Doanh thu Giảng viên'}
            </div>
          </button>
          {!isInstructor && (
            <button
              onClick={() => setActiveTab('detailed')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'detailed'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center">
                <ChartBarIcon className="h-5 w-5 mr-2" />
                Báo cáo Chi tiết
        </div>
            </button>
          )}
        </nav>
      </div>

      {/* Content */}
      <div className="mt-6">
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Đang tải dữ liệu...</p>
          </div>
        )}

        {/* Admin Total Revenue Tab */}
        {!loading && activeTab === 'admin' && (
          <div className="space-y-6">
            {/* Date Range Filter */}
            <div className="bg-white shadow rounded-lg p-4">
          <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
            <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
                  <input
                    type="date"
                    value={adminDateRange.from}
                    onChange={(e) => setAdminDateRange({ ...adminDateRange, from: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
          </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Đến ngày:</label>
                  <input
                    type="date"
                    value={adminDateRange.to}
                    onChange={(e) => setAdminDateRange({ ...adminDateRange, to: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
          </div>
        </div>
      </div>

            {adminRevenue && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tổng doanh thu Admin</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {formatCurrency(adminRevenue.total_revenue)}
                        </p>
                      </div>
                      <CurrencyDollarIcon className="h-12 w-12 text-blue-500" />
              </div>
            </div>

                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Doanh thu từ Admin</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {formatCurrency(adminRevenue.admin_items_revenue)}
                        </p>
            </div>
                      <AcademicCapIcon className="h-12 w-12 text-green-500" />
          </div>
        </div>

                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Chiết khấu từ GV</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {formatCurrency(adminRevenue.commission_from_instructors)}
                        </p>
              </div>
                      <UserGroupIcon className="h-12 w-12 text-purple-500" />
          </div>
        </div>

                  <div className="bg-white rounded-lg shadow p-6 border-l-4 border-yellow-500">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Tỷ lệ chiết khấu</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">30%</p>
              </div>
                      <ChartBarIcon className="h-12 w-12 text-yellow-500" />
            </div>
          </div>
        </div>

                {/* Breakdown Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Phân tích theo loại</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Khóa học', value: adminRevenue.breakdown.courses },
                          { name: 'Sách điện tử', value: adminRevenue.breakdown.books },
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[adminRevenue.breakdown.courses, adminRevenue.breakdown.books].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
              </div>
              </>
            )}
            </div>
        )}

        {/* Instructor Revenue Tab */}
        {!loading && activeTab === 'instructors' && (
          <div className="space-y-6">
            {/* Date Range Filter */}
            <div className="bg-white shadow rounded-lg p-4">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
                  <input
                    type="date"
                    value={instructorDateRange.from}
                    onChange={(e) => setInstructorDateRange({ ...instructorDateRange, from: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
            </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Đến ngày:</label>
                  <input
                    type="date"
                    value={instructorDateRange.to}
                    onChange={(e) => setInstructorDateRange({ ...instructorDateRange, to: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
          </div>
        </div>
      </div>

            {instructorRevenue.length > 0 ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-600">Tổng giảng viên</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{instructorRevenue.length}</p>
            </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-600">Tổng doanh thu</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(instructorRevenue.reduce((sum, inst) => sum + inst.gross_revenue, 0))}
                    </p>
                      </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-600">Tổng thu nhập GV</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {formatCurrency(instructorRevenue.reduce((sum, inst) => sum + inst.instructor_earning, 0))}
                    </p>
          </div>
        </div>

                {/* Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giảng viên
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Doanh thu gộp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Chiết khấu
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thu nhập GV
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Số đơn hàng
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {instructorRevenue.map((inst) => (
                          <tr key={inst.instructor_id} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
        <div>
                                <div className="text-sm font-medium text-gray-900">{inst.instructor_name}</div>
                                <div className="text-sm text-gray-500">{inst.instructor_email}</div>
            </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(inst.gross_revenue)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              {formatCurrency(inst.total_commission)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatCurrency(inst.instructor_earning)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {inst.total_orders}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
        </div>
      </div>

                {/* Chart */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top 10 Giảng viên</h3>
                  <ResponsiveContainer width="100%" height={400}>
                    <BarChart data={instructorRevenue.slice(0, 10).sort((a, b) => b.gross_revenue - a.gross_revenue)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="instructor_name"
                        angle={-45}
                        textAnchor="end"
                        height={100}
                        interval={0}
                      />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} />
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="gross_revenue" fill="#3b82f6" name="Doanh thu gộp" />
                      <Bar dataKey="instructor_earning" fill="#10b981" name="Thu nhập GV" />
                    </BarChart>
                  </ResponsiveContainer>
              </div>
              </>
            ) : (
              <div className="bg-white shadow rounded-lg p-12 text-center">
                <p className="text-gray-500">Chưa có dữ liệu doanh thu giảng viên</p>
            </div>
            )}
          </div>
        )}

        {/* Detailed Report Tab */}
        {!loading && activeTab === 'detailed' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white shadow rounded-lg p-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="flex items-center space-x-2">
                  <CalendarIcon className="h-5 w-5 text-gray-400" />
                  <label className="text-sm font-medium text-gray-700">Từ ngày:</label>
                  <input
                    type="date"
                    value={detailedDateRange.from}
                    onChange={(e) => setDetailedDateRange({ ...detailedDateRange, from: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                    </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Đến ngày:</label>
                  <input
                    type="date"
                    value={detailedDateRange.to}
                    onChange={(e) => setDetailedDateRange({ ...detailedDateRange, to: e.target.value })}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  />
                  </div>
                <div className="flex items-center space-x-2">
                  <label className="text-sm font-medium text-gray-700">Loại:</label>
                <select
                    value={itemType || ''}
                    onChange={(e) => setItemType(e.target.value ? Number(e.target.value) as 1 | 2 : undefined)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                  >
                    <option value="">Tất cả</option>
                    <option value="1">Khóa học</option>
                    <option value="2">Sách điện tử</option>
                </select>
              </div>
            </div>
          </div>

            {detailedReport && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-600">Tổng doanh thu gộp</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(detailedReport.totals.gross)}
                    </p>
                    </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-600">Tổng doanh thu ròng</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(detailedReport.totals.net)}
                    </p>
                  </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-600">Phí nền tảng</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(detailedReport.totals.platform_fee)}
                    </p>
                      </div>
                  <div className="bg-white rounded-lg shadow p-6">
                    <p className="text-sm font-medium text-gray-600">Thu nhập giảng viên</p>
                    <p className="text-2xl font-bold text-gray-900 mt-2">
                      {formatCurrency(detailedReport.totals.instructor_earning)}
                    </p>
        </div>
      </div>

                {/* Table */}
                <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Chi tiết theo giảng viên (Tỷ lệ chiết khấu: {detailedReport.commission_percentage}%)
                    </h3>
        </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Giảng viên
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Doanh thu gộp
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Doanh thu ròng
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phí nền tảng
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Thu nhập GV
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {detailedReport.per_instructor.map((inst, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {inst.name || 'Admin (Khóa học/Sách của hệ thống)'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(inst.gross)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatCurrency(inst.net)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600">
                              {formatCurrency(inst.platform_fee)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-green-600">
                              {formatCurrency(inst.instructor_earning)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
          </div>
        </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
