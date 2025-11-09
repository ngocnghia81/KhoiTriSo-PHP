import { redirect } from 'next/navigation';

// Redirect /dashboard/revenue -> /dashboard/reports
export default function Page() {
  redirect('/dashboard/reports');
}
