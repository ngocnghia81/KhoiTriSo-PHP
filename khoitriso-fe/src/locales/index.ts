/**
 * Locales Index
 */

import { vi, TranslationKeys } from './vi';
import { en } from './en';

export type Language = 'vi' | 'en';

export const translations: Record<Language, TranslationKeys> = {
  vi,
  en,
};

export const languages: { code: Language; name: string; flag: string }[] = [
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
];

export const defaultLanguage: Language = 'vi';

// Get nested translation value
export function getNestedValue(obj: any, path: string): string {
  const keys = path.split('.');
  let current = obj;
  
  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = current[key];
    } else {
      return path; // Return path if not found
    }
  }
  
  return typeof current === 'string' ? current : path;
}

export { vi, en };
export type { TranslationKeys };

