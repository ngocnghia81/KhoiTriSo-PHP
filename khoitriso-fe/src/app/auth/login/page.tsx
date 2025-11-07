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
  SparklesIcon,
  ShieldCheckIcon,
  UsersIcon,
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
    // Clear error when user starts typing
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
    setErrors({}); // Clear all errors

    try {
      // Call authService to login
      const response = await authService.login({
        email: formData.email,
        password: formData.password,
        remember: formData.remember
      });

      // Redirect based on user role
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
      
      // Check if error has validation errors from backend
      if (error.validationErrors) {
        const newErrors: {[key: string]: string} = {};
        
        Object.entries(error.validationErrors).forEach(([field, messages]: [string, any]) => {
          if (Array.isArray(messages) && messages.length > 0) {
            let message = messages[0];
            
            // Translate common messages
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
        // General error message
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

    // Load Google script
    if (typeof window !== 'undefined' && !(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.defer = true;
      script.onload = () => {
        // Initialize Google Sign-In
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

        // Render button
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
      // Script already loaded, just render button
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
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-blue-500/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-24 h-[30rem] w-[30rem] rounded-full bg-purple-600/20 blur-3xl" />
      <div className="absolute top-1/2 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-3xl" />

      <div className="relative z-10 flex min-h-screen items-center px-6 py-12 sm:px-8 lg:px-20">
        <div className="grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr,0.95fr]">
          <div className="order-2 space-y-8 lg:order-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
              <SparklesIcon className="h-4 w-4 text-emerald-400" />
              Khởi Trí Số Academy
            </div>
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl">
              Nền tảng học tập số dành cho giảng viên và học viên hiện đại
            </h1>
            <p className="max-w-xl text-base text-white/70">
              Quản lý khóa học, giảng dạy trực tuyến và theo dõi tiến độ học tập trên một nền tảng duy nhất với trải nghiệm đăng nhập được tối ưu cho từng vai trò.
            </p>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-blue-500/10">
                <ShieldCheckIcon className="mb-4 h-8 w-8 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">Quyền truy cập bảo mật</h3>
                <p className="mt-2 text-sm text-white/60">
                  Admin và giảng viên đăng nhập bằng tài khoản nội bộ để quản trị và thiết kế khóa học.
                </p>
              </div>
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-purple-500/10">
                <UsersIcon className="mb-4 h-8 w-8 text-blue-400" />
                <h3 className="text-lg font-semibold text-white">Học viên - Google SSO</h3>
                <p className="mt-2 text-sm text-white/60">
                  Kết nối tức thì bằng tài khoản Google, đồng bộ tiến độ học tập và lịch học cá nhân.
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-[0.65rem] font-medium uppercase tracking-[0.4em] text-white/50">
              <span className="rounded-full border border-white/10 px-4 py-2">Cloud LMS</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Secure Access</span>
              <span className="rounded-full border border-white/10 px-4 py-2">Realtime Analytics</span>
              <span className="rounded-full border border-white/10 px-4 py-2">SSO Ready</span>
            </div>
          </div>

          <div className="order-1 lg:order-2">
            <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/60 shadow-[0_25px_80px_-20px_rgba(59,130,246,0.45)] backdrop-blur-xl">
              <div className="absolute inset-x-6 inset-y-0 bg-gradient-to-b from-blue-500/20 via-transparent to-purple-500/10 blur-3xl" />
              <div className="relative z-10 space-y-8 p-8 sm:p-10">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg shadow-indigo-500/30">
                    <AcademicCapIcon className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.4em] text-white/60">Access Portal</p>
                    <h2 className="text-2xl font-semibold text-white">Đăng nhập hệ thống</h2>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80">Chọn phương thức đăng nhập</p>
                  <div className="flex gap-1 rounded-full border border-white/10 bg-white/5 p-1 text-sm font-medium">
                    <button
                      type="button"
                      onClick={() => setMode('student')}
                      className={`flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                        mode === 'student'
                          ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg shadow-blue-500/40'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Học viên · Google
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('staff')}
                      className={`flex-1 rounded-full px-4 py-2 transition-all duration-200 ${
                        mode === 'staff'
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/40'
                          : 'text-white/60 hover:text-white'
                      }`}
                    >
                      Admin/Giảng viên · Email
                    </button>
                  </div>
                  <p className="text-xs text-white/50">
                    * Hệ thống không hỗ trợ tự đăng ký tài khoản. Liên hệ quản trị viên để được cấp quyền phù hợp.
                  </p>
                </div>

                {mode === 'student' ? (
                  <div className="space-y-5">
                    {apiError && (
                      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                        {apiError}
                      </div>
                    )}
                    {isLoading && (
                      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-center text-sm text-white/70">
                        <svg
                          className="mx-auto h-5 w-5 animate-spin text-blue-300"
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
                        <p className="mt-2 text-xs text-white/60">Đang xác thực với Google...</p>
                      </div>
                    )}
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                      <div ref={googleButtonRef} className="w-full [&>div]:w-full [&>div]:justify-center"></div>
                    </div>
                    <p className="text-xs text-white/60 text-center">
                      Là học viên? Đăng nhập bằng tài khoản Google được liên kết với trung tâm.
                    </p>
                  </div>
                ) : (
                  <form className="space-y-5" onSubmit={handleSubmit}>
                    {(errors.general || apiError) && (
                      <div className="rounded-2xl border border-rose-400/30 bg-rose-500/10 p-4 text-sm text-rose-100">
                        {errors.general || apiError}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="email" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                        Email nội bộ
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <EnvelopeIcon className="h-5 w-5 text-white/40" />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          className={`block w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white placeholder-white/40 shadow-inner shadow-black/5 focus:border-blue-400/60 focus:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${
                            errors.email ? 'border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/60' : ''
                          }`}
                          placeholder="name@khoitriso.com"
                        />
                      </div>
                      {errors.email && (
                        <p className="text-xs text-rose-200">{errors.email}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="password" className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                        Mật khẩu
                      </label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <LockClosedIcon className="h-5 w-5 text-white/40" />
                        </div>
                        <input
                          id="password"
                          name="password"
                          type={showPassword ? 'text' : 'password'}
                          autoComplete="current-password"
                          value={formData.password}
                          onChange={handleInputChange}
                          className={`block w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-11 text-sm text-white placeholder-white/40 shadow-inner shadow-black/5 focus:border-blue-400/60 focus:bg-slate-900/80 focus:outline-none focus:ring-2 focus:ring-blue-500/60 ${
                            errors.password ? 'border-rose-400/60 focus:border-rose-400 focus:ring-rose-400/60' : ''
                          }`}
                          placeholder="••••••••"
                        />
                        <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="rounded-full p-2 text-white/50 transition hover:text-white"
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
                        <p className="text-xs text-rose-200">{errors.password}</p>
                      )}
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <label className="inline-flex items-center gap-2 text-xs text-white/70">
                        <input
                          id="remember-me"
                          name="remember"
                          type="checkbox"
                          checked={formData.remember}
                          onChange={(e) => setFormData(prev => ({ ...prev, remember: e.target.checked }))}
                          className="h-4 w-4 rounded border-white/10 bg-white/10 text-blue-500 focus:ring-blue-400"
                        />
                        Ghi nhớ đăng nhập trên thiết bị này
                      </label>
                      <Link
                        href="/auth/forgot-password"
                        className="text-xs font-semibold text-blue-300 transition hover:text-blue-200"
                      >
                        Quên mật khẩu?
                      </Link>
                    </div>

                    <div className="pt-2">
                      <button
                        type="submit"
                        disabled={isLoading}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-blue-500/40 transition-all duration-300 hover:from-blue-400 hover:via-indigo-400 hover:to-purple-400 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {isLoading ? (
                          <>
                            <svg
                              className="h-5 w-5 animate-spin text-white"
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
                          'Đăng nhập tài khoản'
                        )}
                      </button>
                    </div>
                  </form>
                )}

                <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-xs text-white/60">
                  <h4 className="text-sm font-semibold text-white">Tài khoản demo kiểm thử</h4>
                  <div className="mt-3 space-y-2 font-mono text-[0.7rem] text-white/70">
                    <div className="flex items-center justify-between">
                      <span>Admin</span>
                      <span>admin@khoitriso.com · 123456</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Giảng viên</span>
                      <span>instructor@khoitriso.com · 123456</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Học viên</span>
                      <span>student@khoitriso.com · 123456</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}