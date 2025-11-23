'use client';

import { useEffect, useState } from 'react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import InstructorSidebar from '@/components/dashboard/InstructorSidebar';
import { SidebarProvider } from '@/contexts/SidebarContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const userStr = typeof window !== 'undefined' ? localStorage.getItem('user') : null;
      if (userStr) {
        setUser(JSON.parse(userStr));
      }
    } catch (error) {
      console.error('Error getting user:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Disable body scroll when in dashboard
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    
    return () => {
      // Re-enable scroll when leaving dashboard
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const isInstructor = user?.role === 'instructor';
  const SidebarComponent = isInstructor ? InstructorSidebar : DashboardSidebar;

  return (
    <SidebarProvider>
      <div className="h-screen bg-gray-50 overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="flex-shrink-0">
            <SidebarComponent />
          </div>
          
          {/* Main content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            <main className="flex-1 overflow-y-auto p-4">
              {children}
            </main>
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
}
