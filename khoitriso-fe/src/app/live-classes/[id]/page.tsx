'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeftIcon,
  VideoCameraIcon,
  CalendarDaysIcon,
  ClockIcon,
  UsersIcon,
  LinkIcon,
  PlayIcon,
  CheckCircleIcon,
  XCircleIcon,
  AcademicCapIcon
} from '@heroicons/react/24/outline';
import { getLiveClass, joinLiveClass } from '@/services/liveclasses';
import { useToast } from '@/components/ToastProvider';

interface LiveClass {
  id: number;
  title: string;
  description: string;
  course?: { id: number; title: string };
  courseId?: number;
  scheduledAt: string;
  durationMinutes: number;
  maxParticipants: number;
  currentParticipants?: number;
  meetingUrl: string;
  meetingId: string;
  meetingPassword?: string;
  status: number; // 1=scheduled, 2=live, 3=ended, 4=cancelled
  recordingUrl?: string;
  chatEnabled: boolean;
  recordingEnabled: boolean;
  createdAt: string;
}

const getStatusLabel = (status: number) => {
  switch (status) {
    case 1: return 'Đã lên lịch';
    case 2: return 'Đang diễn ra';
    case 3: return 'Đã kết thúc';
    case 4: return 'Đã hủy';
    default: return 'Không xác định';
  }
};

const getStatusColor = (status: number) => {
  switch (status) {
    case 1: return 'bg-blue-100 text-blue-800';
    case 2: return 'bg-green-100 text-green-800';
    case 3: return 'bg-gray-100 text-gray-800';
    case 4: return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
};

export default function LiveClassDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { notify } = useToast();
  const liveClassId = params.id as string;
  
  const [liveClass, setLiveClass] = useState<LiveClass | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);

  useEffect(() => {
    if (liveClassId) {
      fetchLiveClass();
    }
  }, [liveClassId]);

  const fetchLiveClass = async () => {
    try {
      setLoading(true);
      const data = await getLiveClass(Number(liveClassId));
      if (data) {
        // Map API response (snake_case) to interface (camelCase)
        const mapped: LiveClass = {
          id: (data as any).id,
          title: (data as any).title,
          description: (data as any).description,
          course: (data as any).course,
          courseId: (data as any).course_id,
          scheduledAt: (data as any).scheduled_at,
          durationMinutes: (data as any).duration_minutes,
          maxParticipants: (data as any).max_participants,
          currentParticipants: (data as any).current_participants,
          meetingUrl: (data as any).meeting_url,
          meetingId: (data as any).meeting_id,
          meetingPassword: (data as any).meeting_password,
          status: (data as any).status,
          recordingUrl: (data as any).recording_url,
          chatEnabled: (data as any).chat_enabled,
          recordingEnabled: (data as any).recording_enabled,
          createdAt: (data as any).created_at,
        };
        setLiveClass(mapped);
      } else {
        notify('Không tìm thấy lớp học', 'error');
        router.push('/');
      }
    } catch (error: any) {
      console.error('Error fetching live class:', error);
      notify(error.message || 'Lỗi tải thông tin lớp học', 'error');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!liveClass) return;
    
    try {
      setJoining(true);
      await joinLiveClass(liveClass.id);
      
      // Open meeting URL in new tab
      if (liveClass.meetingUrl) {
        window.open(liveClass.meetingUrl, '_blank');
      }
      
      notify('Đã tham gia lớp học!', 'success');
    } catch (error: any) {
      console.error('Error joining live class:', error);
      notify(error.message || 'Lỗi tham gia lớp học', 'error');
    } finally {
      setJoining(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getTimeUntil = (dateString: string) => {
    const now = new Date();
    const scheduled = new Date(dateString);
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff < 0) return 'Đã qua';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days} ngày ${hours} giờ`;
    if (hours > 0) return `${hours} giờ ${minutes} phút`;
    return `${minutes} phút`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải thông tin lớp học...</p>
        </div>
      </div>
    );
  }

  if (!liveClass) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <XCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Không tìm thấy lớp học</h2>
          <Link
            href="/"
            className="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  const isUpcoming = liveClass.status === 1 && new Date(liveClass.scheduledAt) > new Date();
  const isLive = liveClass.status === 2;
  const isEnded = liveClass.status === 3;
  const isCancelled = liveClass.status === 4;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/"
                className="text-gray-600 hover:text-blue-600 transition-colors"
              >
                <ArrowLeftIcon className="h-6 w-6" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{liveClass.title}</h1>
                {liveClass.course && (
                  <p className="text-sm text-gray-600">Khóa học: {liveClass.course.title}</p>
                )}
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(liveClass.status)}`}>
              {getStatusLabel(liveClass.status)}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Mô tả</h2>
              <p className="text-gray-700 whitespace-pre-line">
                {liveClass.description || 'Không có mô tả.'}
              </p>
            </div>

            {/* Meeting Info */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <VideoCameraIcon className="h-5 w-5 mr-2 text-blue-600" />
                Thông tin phòng học
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Link phòng học</label>
                  <div className="mt-1 flex items-center space-x-2">
                    <input
                      type="text"
                      readOnly
                      value={liveClass.meetingUrl}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                    />
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(liveClass.meetingUrl);
                        notify('Đã sao chép link!', 'success');
                      }}
                      className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                      title="Sao chép link"
                    >
                      <LinkIcon className="h-5 w-5" />
                    </button>
                  </div>
                </div>
                
                {liveClass.meetingId && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Meeting ID</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={liveClass.meetingId}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(liveClass.meetingId);
                          notify('Đã sao chép Meeting ID!', 'success');
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Sao chép Meeting ID"
                      >
                        <LinkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
                
                {liveClass.meetingPassword && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Mật khẩu</label>
                    <div className="mt-1 flex items-center space-x-2">
                      <input
                        type="text"
                        readOnly
                        value={liveClass.meetingPassword}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm"
                      />
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(liveClass.meetingPassword || '');
                          notify('Đã sao chép mật khẩu!', 'success');
                        }}
                        className="p-2 text-gray-600 hover:text-blue-600 transition-colors"
                        title="Sao chép mật khẩu"
                      >
                        <LinkIcon className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Recording */}
            {liveClass.recordingUrl && (
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Bản ghi</h2>
                <a
                  href={liveClass.recordingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  Xem bản ghi lớp học
                  <ArrowLeftIcon className="h-4 w-4 ml-1 rotate-180" />
                </a>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Join Button */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              {isLive && (
                <button
                  onClick={handleJoin}
                  disabled={joining}
                  className="w-full flex items-center justify-center px-6 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {joining ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                      Đang tham gia...
                    </>
                  ) : (
                    <>
                      <PlayIcon className="h-5 w-5 mr-2" />
                      Tham gia ngay
                    </>
                  )}
                </button>
              )}
              
              {isUpcoming && (
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Lớp học sẽ bắt đầu sau:</p>
                  <p className="text-2xl font-bold text-blue-600 mb-4">
                    {getTimeUntil(liveClass.scheduledAt)}
                  </p>
                  <button
                    onClick={handleJoin}
                    disabled={joining || true}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gray-400 text-white font-semibold rounded-lg cursor-not-allowed"
                    title="Lớp học chưa bắt đầu"
                  >
                    <ClockIcon className="h-5 w-5 mr-2" />
                    Chưa đến giờ
                  </button>
                </div>
              )}
              
              {isEnded && (
                <div className="text-center">
                  <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Lớp học đã kết thúc</p>
                  {liveClass.recordingUrl && (
                    <a
                      href={liveClass.recordingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-block w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Xem bản ghi
                    </a>
                  )}
                </div>
              )}
              
              {isCancelled && (
                <div className="text-center">
                  <XCircleIcon className="h-12 w-12 text-red-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Lớp học đã bị hủy</p>
                </div>
              )}
            </div>

            {/* Info Card */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Thông tin lớp học</h3>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <CalendarDaysIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Thời gian</p>
                    <p className="text-sm text-gray-900">{formatDate(liveClass.scheduledAt)}</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <ClockIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Thời lượng</p>
                    <p className="text-sm text-gray-900">{liveClass.durationMinutes} phút</p>
                  </div>
                </div>
                
                <div className="flex items-start space-x-3">
                  <UsersIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-500">Số lượng tham gia</p>
                    <p className="text-sm text-gray-900">
                      {liveClass.currentParticipants || 0} / {liveClass.maxParticipants}
                    </p>
                  </div>
                </div>
                
                {liveClass.course && (
                  <div className="flex items-start space-x-3">
                    <AcademicCapIcon className="h-5 w-5 text-gray-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-500">Khóa học</p>
                      <Link
                        href={`/courses/${liveClass.course.id}`}
                        className="text-sm text-blue-600 hover:text-blue-700"
                      >
                        {liveClass.course.title}
                      </Link>
                    </div>
                  </div>
                )}
                
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Chat</span>
                    {liveClass.chatEnabled ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex items-center justify-between text-sm mt-2">
                    <span className="text-gray-500">Ghi hình</span>
                    {liveClass.recordingEnabled ? (
                      <CheckCircleIcon className="h-5 w-5 text-green-500" />
                    ) : (
                      <XCircleIcon className="h-5 w-5 text-gray-400" />
                    )}
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

