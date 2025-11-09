'use client';

import { useEffect, useState } from 'react';
import {
  ClockIcon,
  CheckCircleIcon,
  EyeIcon,
  BanknotesIcon,
  UserIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { getPendingPayouts, type PendingPayout } from '@/services/reports';
import Link from 'next/link';

const formatCurrency = (amount: number) => {
  return `₫${amount.toLocaleString('vi-VN')}`;
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
};

export default function PendingPayoutsPage() {
  const [payouts, setPayouts] = useState<PendingPayout[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPayouts, setSelectedPayouts] = useState<number[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getPendingPayouts();
        setPayouts(data.payouts);
      } catch (err: any) {
        console.error('Error fetching pending payouts:', err);
        setError(err.message || 'Có lỗi xảy ra khi tải dữ liệu');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSelectAll = () => {
    if (selectedPayouts.length === payouts.length) {
      setSelectedPayouts([]);
    } else {
      setSelectedPayouts(payouts.map(p => p.id));
    }
  };

  const handleSelectPayout = (id: number) => {
    setSelectedPayouts(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleBulkPay = () => {
    if (selectedPayouts.length === 0) {
      alert('Vui lòng chọn ít nhất một thanh toán');
      return;
    }
    // TODO: Implement bulk payment
    alert(`Thanh toán cho ${selectedPayouts.length} giảng viên (Chức năng đang phát triển)`);
  };

  const handlePaySingle = (id: number) => {
    // TODO: Implement single payment
    alert(`Thanh toán cho giảng viên ID: ${id} (Chức năng đang phát triển)`);
  };

  const totalSelectedAmount = payouts
    .filter(p => selectedPayouts.includes(p.id))
    .reduce((sum, p) => sum + p.total_earnings, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Đang tải dữ liệu...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-800">{error}</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Page header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Thanh toán chờ</h1>
          <p className="mt-2 text-sm text-gray-700">
            Danh sách các khoản thanh toán đang chờ xử lý cho giảng viên
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none space-x-3">
          {selectedPayouts.length > 0 && (
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 border border-blue-200 rounded-lg">
              <span className="text-sm text-blue-800 mr-3">
                Đã chọn: <strong>{selectedPayouts.length}</strong> giảng viên
                {' - '}
                Tổng: <strong>{formatCurrency(totalSelectedAmount)}</strong>
              </span>
              <button
                type="button"
                onClick={handleBulkPay}
                className="inline-flex items-center justify-center rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-green-500 transition-all duration-200"
              >
                <BanknotesIcon className="-ml-0.5 mr-1.5 h-5 w-5" />
                Thanh toán hàng loạt
              </button>
            </div>
          )}
          <Link
            href="/dashboard/commissions"
            className="inline-flex items-center justify-center rounded-lg bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-200 transition-all duration-200"
          >
            Quay lại
          </Link>
        </div>
      </div>

      {/* Stats summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <ClockIcon className="h-5 w-5 text-blue-600 mr-2" />
            <span className="text-sm text-blue-800">
              <strong>Tổng số giảng viên chờ thanh toán:</strong> {payouts.length}
            </span>
          </div>
          <div className="text-sm text-blue-800">
            <strong>Tổng số tiền:</strong>{' '}
            {formatCurrency(payouts.reduce((sum, p) => sum + p.total_earnings, 0))}
          </div>
        </div>
      </div>

      {/* Payouts list */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                checked={selectedPayouts.length === payouts.length && payouts.length > 0}
                onChange={handleSelectAll}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="text-sm font-medium text-gray-700">
                Chọn tất cả ({payouts.length})
              </label>
            </div>
          </div>
        </div>
        <div className="divide-y divide-gray-200">
          {payouts.length === 0 ? (
            <div className="p-12 text-center">
              <ClockIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có thanh toán chờ</h3>
              <p className="mt-1 text-sm text-gray-500">
                Hiện tại không có khoản thanh toán nào đang chờ xử lý.
              </p>
            </div>
          ) : (
            payouts.map((payout) => (
              <div key={payout.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 pt-1">
                    <input
                      type="checkbox"
                      checked={selectedPayouts.includes(payout.id)}
                      onChange={() => handleSelectPayout(payout.id)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="flex-shrink-0">
                    {payout.instructor.avatar ? (
                      <img
                        src={payout.instructor.avatar}
                        alt={payout.instructor.name}
                        className="h-12 w-12 rounded-full"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-full bg-blue-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {payout.instructor.name.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-sm font-medium text-gray-900">
                          {payout.instructor.name}
                        </h4>
                        <p className="text-sm text-gray-500">{payout.instructor.email}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(payout.total_earnings)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {payout.commission_rate.toFixed(1)}% chiết khấu
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 mb-3">
                      <div>
                        <span className="font-medium">Khóa học:</span>{' '}
                        {formatCurrency(payout.courses_revenue)}
                      </div>
                      <div>
                        <span className="font-medium">Sách:</span>{' '}
                        {formatCurrency(payout.books_revenue)}
                      </div>
                      <div>
                        <span className="font-medium">Giao dịch:</span> {payout.transaction_count}
                      </div>
                      <div className="flex items-center">
                        <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                        <span className="font-medium">Chờ từ:</span>{' '}
                        {formatDate(payout.pending_since)}
                      </div>
                    </div>

                    {payout.bank_info.bank_name && (
                      <div className="bg-gray-50 p-3 rounded-lg mb-3">
                        <div className="text-xs text-gray-600">
                          <div>
                            <strong>Ngân hàng:</strong> {payout.bank_info.bank_name}
                          </div>
                          <div>
                            <strong>Số TK:</strong> {payout.bank_info.account_number}
                          </div>
                          <div>
                            <strong>Tên TK:</strong> {payout.bank_info.account_name}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex space-x-2">
                      <button
                        onClick={() => handlePaySingle(payout.id)}
                        className="flex-1 inline-flex items-center justify-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircleIcon className="h-4 w-4 mr-1" />
                        Thanh toán
                      </button>
                      <button className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                        <EyeIcon className="h-4 w-4 mr-1" />
                        Chi tiết
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

