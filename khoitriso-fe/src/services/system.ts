/**
 * System Service
 */

import { httpClient, extractData, isSuccess } from '@/lib/http-client';
import { handleApiError } from '@/lib/error-handler';

export interface SystemSetting {
  key: string;
  value: string;
  type: number;
  isPublic: boolean;
}

/**
 * Get system settings (public - no auth required)
 */
export async function getSystemSettings(): Promise<SystemSetting[]> {
  try {
    const response = await httpClient.get('system/settings/public');
    
    if (!isSuccess(response)) {
      // Fallback to default values if API fails
      return [
        { key: 'site_name', value: 'Khởi Trí Số', type: 1, isPublic: true },
      ];
    }
    
    const data = extractData(response) as any;
    // API returns { settings: [...] }
    if (data && 'settings' in data) {
      return data.settings;
    }
    // Fallback: if data is already an array
    return Array.isArray(data) ? data : [];
  } catch (error) {
    // Fallback to default values on error
    return [
      { key: 'site_name', value: 'Khởi Trí Số', type: 1, isPublic: true },
    ];
  }
}
