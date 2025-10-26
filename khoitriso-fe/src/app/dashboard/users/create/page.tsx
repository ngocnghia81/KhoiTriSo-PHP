'use client'

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createInstructor } from '@/services/admin';

export default function CreateUserPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    role: 'Instructor',
    password: '123456'
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const onChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'Vui lòng nhập tên';
    if (!form.username.trim()) e.username = 'Vui lòng nhập username';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Email không hợp lệ';
    if (!form.password || form.password.length < 6) e.password = 'Mật khẩu tối thiểu 6 ký tự';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const res: any = await createInstructor({
        name: form.name,
        username: form.username,
        email: form.email,
        phone: form.phone || undefined,
        role: form.role,
        password: form.password,
      } as any);
      if (res?.ok) {
        alert('Tạo người dùng thành công');
        router.push('/dashboard/users');
      } else {
        alert('Tạo người dùng thất bại');
      }
    } catch (err) {
      alert('Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-900">Thêm người dùng</h1>
        <Link href="/dashboard/users" className="text-sm text-blue-600 hover:text-blue-700">Quay lại danh sách</Link>
      </div>

      <form onSubmit={onSubmit} className="bg-white shadow rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Họ tên</label>
            <input name="name" value={form.name} onChange={onChange} className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.name ? 'border-red-300' : 'border-gray-300'}`} placeholder="Nguyễn Văn A" />
            {errors.name && <p className="text-sm text-red-600 mt-1">{errors.name}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input name="username" value={form.username} onChange={onChange} className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.username ? 'border-red-300' : 'border-gray-300'}`} placeholder="nguyenvana" />
            {errors.username && <p className="text-sm text-red-600 mt-1">{errors.username}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email</label>
            <input name="email" type="email" value={form.email} onChange={onChange} className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.email ? 'border-red-300' : 'border-gray-300'}`} placeholder="user@example.com" />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input name="phone" value={form.phone} onChange={onChange} className="mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300" placeholder="090xxxxxxx" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Vai trò</label>
            <select name="role" value={form.role} onChange={onChange} className="mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 border-gray-300">
              <option value="Admin">Admin</option>
              <option value="Instructor">Instructor</option>
              <option value="Student">Student</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mật khẩu</label>
            <input name="password" type="password" value={form.password} onChange={onChange} className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 ${errors.password ? 'border-red-300' : 'border-gray-300'}`} />
            {errors.password && <p className="text-sm text-red-600 mt-1">{errors.password}</p>}
          </div>
        </div>

        <div className="flex items-center justify-end space-x-3">
          <Link href="/dashboard/users" className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 bg-white hover:bg-gray-50">Hủy</Link>
          <button type="submit" disabled={submitting} className="px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50">
            {submitting ? 'Đang lưu...' : 'Lưu'}
          </button>
        </div>
      </form>
    </div>
  );
}


