'use client';

/**
 * Header với Language Switcher
 * Wrapper around existing Header component
 */

import React from 'react';
import Header from './Header';
import { CompactLanguageSwitcher } from './LanguageSwitcher';

export default function HeaderWithLanguage() {
  return (
    <div className="relative">
      <Header />
      {/* Language Switcher - Fixed position top right */}
      <div className="fixed top-4 right-4 z-[60]">
        <CompactLanguageSwitcher />
      </div>
    </div>
  );
}

