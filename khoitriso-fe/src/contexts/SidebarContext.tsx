'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

interface SidebarContextType {
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  sidebarWidth: number;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarWidth: (width: number) => void;
  toggleSidebar: () => void;
  toggleCollapse: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (context === undefined) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

interface SidebarProviderProps {
  children: ReactNode;
}

export const SidebarProvider: React.FC<SidebarProviderProps> = ({ children }) => {
  // Load initial state from localStorage
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarCollapsed');
      return saved === 'true';
    }
    return false;
  });
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('sidebarWidth');
      return saved ? parseInt(saved, 10) : 256;
    }
    return 256;
  });

  // Save to localStorage when collapsed state changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
    }
  }, [sidebarCollapsed]);

  // Save to localStorage when width changes
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('sidebarWidth', String(sidebarWidth));
    }
  }, [sidebarWidth]);

  const toggleSidebar = useCallback(() => {
    setSidebarOpen(prev => !prev);
  }, []);

  const toggleCollapse = useCallback(() => {
    setSidebarCollapsed(prev => {
      const newCollapsed = !prev;
      // Auto adjust width when collapsing
      if (newCollapsed) {
        setSidebarWidth(80); // Collapsed width
      } else {
        setSidebarWidth(256); // Expanded width
      }
      return newCollapsed;
    });
  }, []);

  const value = {
    sidebarOpen,
    sidebarCollapsed,
    sidebarWidth,
    setSidebarOpen,
    setSidebarCollapsed,
    setSidebarWidth,
    toggleSidebar,
    toggleCollapse,
  };

  return (
    <SidebarContext.Provider value={value}>
      {children}
    </SidebarContext.Provider>
  );
};
