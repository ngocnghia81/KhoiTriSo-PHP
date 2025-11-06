"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { TOKEN_STORAGE_KEY } from '@/lib/config';

export function useAuthGuard(redirectTo: string = '/auth/login') {
  const router = useRouter();
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      router.replace(redirectTo);
    }
  }, [router, redirectTo]);
}



