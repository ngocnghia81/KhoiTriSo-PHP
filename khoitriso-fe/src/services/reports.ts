/**
 * Reports Service
 * Handles all report and analytics API calls
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface AdminTotalRevenue {
  total_revenue: number;
  admin_items_revenue: number;
  commission_from_instructors: number;
  breakdown: {
    courses: number;
    books: number;
  };
}

export interface InstructorRevenue {
  instructor_id: number;
  instructor_name: string;
  instructor_email: string;
  gross_revenue: number;
  total_commission: number;
  instructor_earning: number;
  total_orders: number;
}

export interface RevenueReport {
  commission_percentage: number;
  totals: {
    gross: number;
    net: number;
    platform_fee: number;
    instructor_earning: number;
  };
  per_instructor: Array<{
    id: number | null;
    name: string;
    gross: number;
    net: number;
    platform_fee: number;
    instructor_earning: number;
  }>;
}

/**
 * Get admin total revenue (admin items + commission from instructors)
 */
export async function getAdminTotalRevenue(params?: {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}): Promise<AdminTotalRevenue> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/reports/total-revenue${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as AdminTotalRevenue;
}

/**
 * Get instructor revenue report
 */
export async function getInstructorRevenue(params?: {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  instructor_id?: number;
  isInstructor?: boolean; // If true, use instructor API
}): Promise<{ instructors: InstructorRevenue[] }> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.instructor_id) query.set('instructor_id', String(params.instructor_id));
  
  const qs = query.toString();
  
  // If instructor, use instructor API endpoint
  const endpoint = params?.isInstructor 
    ? `instructor/reports/revenue${qs ? `?${qs}` : ''}`
    : `admin/reports/instructor-revenue${qs ? `?${qs}` : ''}`;
  
  console.log('getInstructorRevenue - isInstructor:', params?.isInstructor, 'endpoint:', endpoint);
  
  const response = await httpClient.get(endpoint);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as { instructors: InstructorRevenue[] };
}

/**
 * Get detailed revenue report by instructor/author
 */
export async function getRevenueReport(params?: {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  item_type?: 1 | 2; // 1=course, 2=book
}): Promise<RevenueReport> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.item_type) query.set('item_type', String(params.item_type));
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/reports/revenue${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as RevenueReport;
}

export interface CommissionStats {
  total_pending: number;
  total_paid: number;
  total_instructors: number;
  avg_commission_rate: number;
  this_month_pending: number;
  next_payout_date: string;
}

export interface PendingPayout {
  id: number;
  instructor: {
    name: string;
    email: string;
    avatar: string | null;
  };
  total_earnings: number;
  commission_rate: number;
  courses_revenue: number;
  books_revenue: number;
  transaction_count: number;
  pending_since: string;
  bank_info: {
    bank_name: string | null;
    account_number: string | null;
    account_name: string | null;
  };
}

export interface TopInstructor {
  name: string;
  total_earnings: number;
  courses_count: number;
  books_count: number;
  students_count: number;
  commission_rate: number;
  avatar: string | null;
}

export interface CommissionTransaction {
  id: number;
  instructor: string;
  type: 'course_enrollment' | 'book_purchase';
  original_amount: number;
  commission_rate: number;
  commission_amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  paid_at: string | null;
  reference: string;
}

/**
 * Get commission statistics
 */
export async function getCommissionStats(params?: {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}): Promise<CommissionStats> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/commissions/stats${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as CommissionStats;
}

/**
 * Get pending payouts
 */
export async function getPendingPayouts(params?: {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}): Promise<{ payouts: PendingPayout[] }> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/commissions/pending-payouts${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as { payouts: PendingPayout[] };
}

/**
 * Get top instructors by revenue
 */
export async function getTopInstructors(params?: {
  limit?: number;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}): Promise<{ instructors: TopInstructor[] }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/commissions/top-instructors${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as { instructors: TopInstructor[] };
}

/**
 * Get recent commission transactions
 */
export async function getRecentTransactions(params?: {
  limit?: number;
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
}): Promise<{ transactions: CommissionTransaction[] }> {
  const query = new URLSearchParams();
  if (params?.limit) query.set('limit', String(params.limit));
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/commissions/recent-transactions${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as { transactions: CommissionTransaction[] };
}

export interface PayoutHistoryItem {
  id: number;
  instructor: {
    name: string;
    email: string;
    avatar: string | null;
  };
  amount: number;
  commission_rate: number;
  payment_method: string;
  transaction_id: string | null;
  status: 'completed' | 'pending' | 'failed';
  paid_at: string;
  notes: string | null;
}

/**
 * Get payout history
 */
export async function getPayoutHistory(params?: {
  from?: string; // YYYY-MM-DD
  to?: string; // YYYY-MM-DD
  status?: string; // completed, pending, failed
}): Promise<{ history: PayoutHistoryItem[] }> {
  const query = new URLSearchParams();
  if (params?.from) query.set('from', params.from);
  if (params?.to) query.set('to', params.to);
  if (params?.status) query.set('status', params.status);
  
  const qs = query.toString();
  const response = await httpClient.get(`admin/commissions/payout-history${qs ? `?${qs}` : ''}`);
  
  if (!isSuccess(response)) {
    throw new Error(handleApiError(response));
  }
  
  return extractData(response) as { history: PayoutHistoryItem[] };
}

