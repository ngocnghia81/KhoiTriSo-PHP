'use client';

/**
 * Language Context
 * Provides multi-language support for the app
 */

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Language, defaultLanguage, translations, getNestedValue } from '@/locales';

const LANGUAGE_STORAGE_KEY = 'kts_language';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  tError: (messageCode: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(defaultLanguage);
  const [mounted, setMounted] = useState(false);

  // Initialize language from localStorage on mount
  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language;
        if (stored && (stored === 'vi' || stored === 'en')) {
          setLanguageState(stored);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    }
  }, []);

  // Set language and persist to localStorage
  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
        // Dispatch event for other components
        window.dispatchEvent(new CustomEvent('kts-language-changed', { detail: lang }));
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  }, []);

  // Translation function with parameter replacement
  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const translation = getNestedValue(translations[language], key);
    
    if (!params) return translation;
    
    // Replace {param} with actual values
    return Object.entries(params).reduce((text, [paramKey, value]) => {
      return text.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value));
    }, translation);
  }, [language]);

  // Translation function specifically for error messageCode
  const tError = useCallback((messageCode: string): string => {
    const errorKey = `errors.${messageCode}`;
    const translation = getNestedValue(translations[language], errorKey);
    
    // If translation not found, return default error or messageCode
    if (translation === errorKey) {
      return getNestedValue(translations[language], 'errors.UNKNOWN_ERROR');
    }
    
    return translation;
  }, [language]);

  const value: LanguageContextType = {
    language,
    setLanguage,
    t,
    tError,
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) {
    return null;
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

// Hook to use language context
export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}

// Hook to get translation function only
export function useTranslation() {
  const { t, tError } = useLanguage();
  return { t, tError };
}

