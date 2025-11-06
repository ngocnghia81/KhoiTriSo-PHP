'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircleIcon,
  ArrowRightIcon,
  DocumentTextIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

function SuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState<string>('');

  useEffect(() => {
    const id = searchParams.get('orderId');
    if (!id) {
      // If no order ID, redirect to home
      router.push('/');
    } else {
      setOrderId(id);
    }
  }, [searchParams, router]);

  if (!orderId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Success Icon */}
        <div className="text-center mb-8">
          <div className="mx-auto flex items-center justify-center h-24 w-24 rounded-full bg-green-100 mb-6">
            <CheckCircleIcon className="h-16 w-16 text-green-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Thanh toán thành công!
          </h1>
          <p className="text-lg text-gray-600">
            Đơn hàng của bạn đã được xử lý thành công
          </p>
        </div>

        {/* Order Info Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <div className="border-b border-gray-200 pb-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Thông tin đơn hàng
            </h2>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Mã đơn hàng:</span>
              <span className="text-lg font-mono font-bold text-blue-600">
                #{orderId}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Thanh toán đã được xác nhận</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Chúng tôi đã nhận được thanh toán của bạn và đang xử lý đơn hàng.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <DocumentTextIcon className="h-6 w-6 text-blue-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Email xác nhận đã được gửi</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Kiểm tra hộp thư của bạn để xem chi tiết đơn hàng và hướng dẫn sử dụng.
                </p>
              </div>
            </div>

            <div className="flex items-start space-x-3">
              <AcademicCapIcon className="h-6 w-6 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-gray-900">Truy cập khóa học ngay</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Bạn có thể bắt đầu học ngay lập tức từ trang "Khóa học của tôi".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            href="/my-learning"
            className="inline-flex items-center justify-center px-6 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
          >
            Xem khóa học của tôi
            <ArrowRightIcon className="h-5 w-5 ml-2" />
          </Link>

          <Link
            href="/orders"
            className="inline-flex items-center justify-center px-6 py-4 bg-white text-gray-900 font-semibold rounded-xl hover:bg-gray-50 transition-colors shadow-lg hover:shadow-xl border-2 border-gray-200"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Chi tiết đơn hàng
          </Link>
        </div>

        {/* Back to Home */}
        <div className="text-center mt-8">
          <Link
            href="/"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Quay về trang chủ
          </Link>
        </div>

        {/* Additional Info */}
        <div className="mt-8 bg-blue-50 rounded-xl p-6 border border-blue-100">
          <h3 className="font-semibold text-gray-900 mb-2">
            Cần hỗ trợ?
          </h3>
          <p className="text-sm text-gray-600">
            Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi qua{' '}
            <Link href="/contact" className="text-blue-600 hover:underline font-medium">
              trang liên hệ
            </Link>{' '}
            hoặc email: support@khoitriso.com
          </p>
        </div>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SuccessContent />
    </Suspense>
  );
}
