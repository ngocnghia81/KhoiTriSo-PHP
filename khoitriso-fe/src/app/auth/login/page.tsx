'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  LockClosedIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';
import { authService } from '@/services/authService';
import { loginWithGoogleIdToken } from '@/services/auth.new';

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'student' | 'staff'>('student');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    remember: false
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [apiError, setApiError] = useState('');
  const googleButtonRef = useRef<HTMLDivElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.email) {
      newErrors.email = 'Vui lòng nhập email';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setApiError('');
    setErrors({});

    try {
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
        remember: formData.remember
      });

      const { user } = response;
      switch (user.role) {
        case 'admin':
          router.push('/dashboard');
          break;
        case 'instructor':
          router.push('/instructor');
          break;
        default:
          router.push('/');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      
      if (error.validationErrors) {
        const newErrors: {[key: string]: string} = {};
        
        Object.entries(error.validationErrors).forEach(([field, messages]: [string, any]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            let message = messages[0];
            
            if (message.includes('is required')) {
              message = field === 'email' ? 'Email là bắt buộc' : 'Mật khẩu là bắt buộc';
            } else if (message.includes('must be a valid email')) {
              message = 'Email không hợp lệ';
            }
            
            newErrors[field] = message;
          }
        });
        
        setErrors(newErrors);
        setApiError(Object.values(newErrors)[0] || error.message);
      } else {
        const errorMessage = error.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.';
        setApiError(errorMessage);
        setErrors({ general: errorMessage });
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Load Google Sign-In script and initialize
  useEffect(() => {
    if (mode !== 'student' || !googleButtonRef.current) return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setApiError('Thiếu cấu hình GOOGLE CLIENT ID');
      return;
    }

    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        (window as any).google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            if (response && response.credential) {
              setIsLoading(true);
              setApiError('');
              try {
                const authRes = await loginWithGoogleIdToken(response.credential);
                router.push('/');
              } catch (error: any) {
                setApiError(error?.message || 'Đăng nhập Google thất bại');
              } finally {
                setIsLoading(false);
              }
            }
          },
        });

        if (googleButtonRef.current) {
          (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
            theme: 'outline',
            size: 'large',
            width: '100%',
            text: 'signin_with',
          });
        }
      };
      document.head.appendChild(script);
    } else if ((window as any).google && googleButtonRef.current) {
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: any) => {
          if (response && response.credential) {
            setIsLoading(true);
            setApiError('');
            try {
              const authRes = await loginWithGoogleIdToken(response.credential);
              router.push('/');
            } catch (error: any) {
              setApiError(error?.message || 'Đăng nhập Google thất bại');
            } finally {
              setIsLoading(false);
            }
          }
        },
      });
      (window as any).google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        width: '100%',
        text: 'signin_with',
      });
    }
  }, [mode, router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <AcademicCapIcon className="h-8 w-8 text-white" />
            </div>
          </div>
          <h2 className="text-3xl font-bold text-gray-900">Đăng nhập</h2>
          <p className="mt-2 text-sm text-gray-600">
            Chọn phương thức đăng nhập phù hợp với vai trò của bạn
          </p>
        </div>

        {/* Mode Switcher */}
        <div className="bg-white rounded-lg shadow-sm p-1 border border-gray-200">
          <div className="flex gap-1">
            <button
              type="button"
              onClick={() => setMode('student')}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                mode === 'student'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Học viên
            </button>
            <button
              type="button"
              onClick={() => setMode('staff')}
              className={`flex-1 rounded-md px-4 py-2.5 text-sm font-medium transition-all ${
                mode === 'staff'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
              }`}
            >
              Admin/Giảng viên
            </button>
          </div>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 space-y-6">
          {mode === 'student' ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-4 text-center">
                  Đăng nhập bằng tài khoản Google của bạn
                </p>
                {apiError && (
                  <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                    {apiError}
                  </div>
                )}
                {isLoading && (
                  <div className="mb-4 rounded-md bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800 text-center">
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin h-5 w-5 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Đang xác thực với Google...
                    </div>
                  </div>
                )}
                <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div ref={googleButtonRef} className="w-full [&>div]:w-full [&>div]:justify-center"></div>
                </div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                * Hệ thống không hỗ trợ tự đăng ký. Liên hệ quản trị viên để được cấp quyền.
              </p>
            </div>
          ) : (
            <form className="space-y-5" onSubmit={handleSubmit}>
              {(errors.general || apiError) && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3 text-sm text-red-800">
                  {errors.general || apiError}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.email ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="name@khoitriso.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-red-600">{errors.email}</p>
                )}
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                  Mật khẩu
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <LockClosedIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`block w-full pl-10 pr-10 py-2.5 border rounded-lg text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                      errors.password ? 'border-red-300 focus:ring-red-500' : 'border-gray-300'
                    }`}
                    placeholder="••••••••"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? (
                        <EyeSlashIcon className="h-5 w-5" />
                      ) : (
                        <EyeIcon className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-red-600">{errors.password}</p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    id="remember-me"
                    name="remember"
                    type="checkbox"
                    checked={formData.remember}
                    onChange={(e) => setFormData(prev => ({ ...prev, remember: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
                </label>
                <Link
                  href="/auth/forgot-password"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  Quên mật khẩu?
                </Link>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <>
                    <svg
                      className="animate-spin h-5 w-5 mr-2"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Đang xác thực...
                  </>
                ) : (
                  'Đăng nhập'
                )}
              </button>
            </form>
          )}

          {/* Demo Accounts Info */}
          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs font-medium text-gray-700 mb-2">Tài khoản demo:</p>
            <div className="space-y-1 text-xs text-gray-600 font-mono">
              <div className="flex justify-between">
                <span>Admin:</span>
                <span>admin@khoitriso.com / 123456</span>
              </div>
              <div className="flex justify-between">
                <span>Giảng viên:</span>
                <span>instructor@khoitriso.com / 123456</span>
              </div>
              <div className="flex justify-between">
                <span>Học viên:</span>
                <span>student@khoitriso.com / 123456</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500">
          Bằng việc đăng nhập, bạn đồng ý với{' '}
          <Link href="/terms" className="text-blue-600 hover:text-blue-700">
            Điều khoản sử dụng
          </Link>{' '}
          và{' '}
          <Link href="/privacy" className="text-blue-600 hover:text-blue-700">
            Chính sách bảo mật
          </Link>
        </p>
      </div>
    </div>
  );
}
