'use client';

import { usePathname } from 'next/navigation';

export default function ConditionalMain({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname && pathname.startsWith('/dashboard');
  
  if (isDashboard) {
    return <>{children}</>;
  }
  
  return (
    <main className="min-h-screen pt-[170px]">
      {children}
    </main>
  );
}

