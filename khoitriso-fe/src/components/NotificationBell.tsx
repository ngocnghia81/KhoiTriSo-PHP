'use client';

import { useState, useEffect, useRef } from 'react';
import { BellIcon } from '@heroicons/react/24/outline';
import { httpClient } from '@/lib/http-client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: number; // 1 = general, 2 = course, 3 = live class scheduled, 4 = live class starting, 5 = admin reply
  action_url: string | null;
  is_read: boolean;
  priority: number;
  created_at: string;
}

interface NotificationResponse {
  notifications: Notification[];
  unreadCount: number;
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      return;
    }

    fetchNotifications();
    
    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      setLoading(true);
      const response = await httpClient.get('notifications?pageSize=10');
      
      if (response.ok && response.data) {
        // Handle both response formats
        let data: NotificationResponse;
        if (response.data.data) {
          // Nested data format
          data = response.data.data as NotificationResponse;
        } else if (response.data.notifications !== undefined) {
          // Direct format
          data = response.data as NotificationResponse;
        } else {
          // Fallback: try to extract from response
          data = {
            notifications: Array.isArray(response.data) ? response.data : [],
            unreadCount: 0
          };
        }
        
        const newUnreadCount = data.unreadCount || 0;
        
        // Trigger animation if unread count increased
        if (newUnreadCount > prevUnreadCount && prevUnreadCount >= 0) {
          setIsAnimating(true);
          setTimeout(() => setIsAnimating(false), 600);
        }
        
        setPrevUnreadCount(newUnreadCount);
        setNotifications(data.notifications || []);
        setUnreadCount(newUnreadCount);
      } else {
        // Handle error response
        console.warn('Failed to fetch notifications:', response.error || response.status);
        // Don't show error to user, just silently fail
      }
    } catch (error) {
      // Network error or other exception
      console.error('Error fetching notifications:', error);
      // Silently fail - don't show error to user for notifications
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const response = await httpClient.put(`notifications/${notificationId}/mark-read`);
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const response = await httpClient.put('notifications/mark-all-read');
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
    
    setIsOpen(false);
    
    if (notification.action_url) {
      router.push(notification.action_url);
    }
  };

  const getNotificationIcon = (type: number) => {
    switch (type) {
      case 3: // Live class scheduled
      case 4: // Live class starting
        return '🔴';
      case 5: // Admin reply
        return '💬';
      case 2: // Course
        return '📚';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: number, priority: number) => {
    if (priority === 1) return 'bg-red-50 border-red-200';
    if (type === 3 || type === 4) return 'bg-blue-50 border-blue-200';
    if (type === 5) return 'bg-green-50 border-green-200';
    return 'bg-white border-gray-200';
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Vừa xong';
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString('vi-VN');
  };

  // Check if user is logged in
  const token = localStorage.getItem('token');
  if (!token) {
    return null;
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 text-gray-600 hover:text-gray-900 transition-all duration-300 ${
          isAnimating ? 'scale-110' : ''
        }`}
        aria-label="Notifications"
      >
        <BellIcon className={`h-6 w-6 transition-all duration-300 ${
          isAnimating ? 'text-red-600 animate-pulse' : ''
        }`} />
        {unreadCount > 0 && (
          <span className={`absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white transition-all duration-300 ${
            isAnimating ? 'animate-pulse scale-125 bg-red-600' : ''
          }`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 md:w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50 max-h-96 overflow-hidden flex flex-col">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Thông báo</h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          {/* Notifications List */}
          <div className="overflow-y-auto flex-1">
            {loading ? (
              <div className="p-4 text-center text-gray-500">Đang tải...</div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <BellIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                <p>Không có thông báo nào</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <button
                    key={notification.id}
                    onClick={() => handleNotificationClick(notification)}
                    className={`w-full text-left p-4 hover:bg-gray-50 transition-colors ${
                      !notification.is_read ? 'bg-blue-50' : ''
                    } ${getNotificationColor(notification.type, notification.priority)}`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0 text-2xl">
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <p className={`text-sm font-medium ${
                            !notification.is_read ? 'text-gray-900 font-semibold' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </p>
                          {!notification.is_read && (
                            <div className="flex-shrink-0 ml-2">
                              <div className="h-2 w-2 bg-blue-600 rounded-full"></div>
                            </div>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="mt-1 text-xs text-gray-400">
                          {formatTime(notification.created_at)}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200">
              <Link
                href="/profile?tab=notifications"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium text-center block"
                onClick={() => setIsOpen(false)}
              >
                Xem tất cả thông báo
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

