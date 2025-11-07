'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  UserPlusIcon,
  EnvelopeIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';
import { createInstructor, getUsers } from '@/services/admin';
import { useToast } from '@/components/ToastProvider';

export default function InstructorsPage() {
  const router = useRouter();
  const { notify } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [instructors, setInstructors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({
    email: '',
    fullName: '',
    phone: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchInstructors();
  }, []);

  const fetchInstructors = async () => {
    setLoading(true);
    try {
      const res = await getUsers({ role: 'instructor' });
      setInstructors(res.users);
    } catch (err) {
      console.error('Error fetching instructors:', err);
      notify('Lỗi tải danh sách giảng viên', 'error');
    } finally {
      setLoading(false);
    }
  };

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) {
      e.email = 'Email không hợp lệ';
    }
    if (!form.fullName.trim()) {
      e.fullName = 'Vui lòng nhập họ tên';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setSubmitting(true);
    try {
      const res: any = await createInstructor({
        email: form.email,
        fullName: form.fullName,
        phone: form.phone || undefined,
      });
      
      if (res) {
        notify('Tài khoản giảng viên đã được tạo và email đã được gửi!', 'success');
        setShowModal(false);
        setForm({ email: '', fullName: '', phone: '' });
        fetchInstructors();
      }
    } catch (err: any) {
      console.error('Error creating instructor:', err);
      notify(err?.message || 'Có lỗi xảy ra khi tạo tài khoản giảng viên', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="sm:flex sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Quản lý giảng viên</h1>
          <p className="mt-2 text-sm text-gray-700">
            Tạo và quản lý tài khoản giảng viên. Mật khẩu sẽ được gửi qua email tự động.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            <UserPlusIcon className="-ml-0.5 mr-2 h-5 w-5" />
            Tạo giảng viên mới
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <UserIcon className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Tổng giảng viên</dt>
                  <dd className="text-lg font-medium text-gray-900">{instructors.length}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-6 w-6 text-green-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Đang hoạt động</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {instructors.filter(i => i.isActive).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <XCircleIcon className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Không hoạt động</dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {instructors.filter(i => !i.isActive).length}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instructors List */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Danh sách giảng viên</h3>
          
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-sm text-gray-500">Đang tải...</p>
            </div>
          ) : instructors.length === 0 ? (
            <div className="text-center py-8">
              <UserIcon className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Chưa có giảng viên</h3>
              <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách tạo giảng viên mới.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tên
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trạng thái
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ngày tạo
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {instructors.map((instructor) => (
                    <tr key={instructor.id} className="hover:bg-gray-50 cursor-pointer">
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => router.push(`/dashboard/instructors/${instructor.id}`)}
                      >
                        <div className="text-sm font-medium text-gray-900">{instructor.name}</div>
                        {instructor.username && (
                          <div className="text-sm text-gray-500">@{instructor.username}</div>
                        )}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => router.push(`/dashboard/instructors/${instructor.id}`)}
                      >
                        <div className="text-sm text-gray-900">{instructor.email}</div>
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap"
                        onClick={() => router.push(`/dashboard/instructors/${instructor.id}`)}
                      >
                        {instructor.isActive ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Hoạt động
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            Không hoạt động
                          </span>
                        )}
                      </td>
                      <td 
                        className="px-6 py-4 whitespace-nowrap text-sm text-gray-500"
                        onClick={() => router.push(`/dashboard/instructors/${instructor.id}`)}
                      >
                        {instructor.createdAt ? new Date(instructor.createdAt).toLocaleDateString('vi-VN') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Instructor Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 py-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setShowModal(false)}></div>

            <div className="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
              <form onSubmit={onSubmit}>
                <div className="px-6 pt-6 pb-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Tạo tài khoản giảng viên mới
                  </h3>
                  <p className="text-sm text-gray-500 mb-6">
                    Nhập thông tin giảng viên. Mật khẩu sẽ được tạo tự động và gửi qua email.
                  </p>

                  <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              name="email"
                              type="email"
                              value={form.email}
                              onChange={onChange}
                              className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.email ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="example@email.com"
                            />
                          </div>
                          {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Họ và tên <span className="text-red-500">*</span>
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <UserIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              name="fullName"
                              type="text"
                              value={form.fullName}
                              onChange={onChange}
                              className={`block w-full pl-10 pr-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                errors.fullName ? 'border-red-300' : 'border-gray-300'
                              }`}
                              placeholder="Nguyễn Văn A"
                            />
                          </div>
                          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Số điện thoại (tùy chọn)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <PhoneIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                              name="phone"
                              type="tel"
                              value={form.phone}
                              onChange={onChange}
                              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                              placeholder="090xxxxxxx"
                            />
                          </div>
                        </div>
                  </div>
                </div>
                
                <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-6 py-2 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {submitting ? 'Đang tạo...' : 'Tạo tài khoản'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-6 py-2 bg-white text-gray-700 font-medium rounded-md border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

