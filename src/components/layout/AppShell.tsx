import type { ReactNode } from 'react';
import type { Page } from '../../types';
import { MobileNav } from './MobileNav';
import { Navbar } from './Navbar';

interface AppShellProps {
  currentPage: Page;
  onNavigate: (page: Page, id?: string) => void;
  children: ReactNode;
}

export function AppShell({ currentPage, onNavigate, children }: AppShellProps) {
  return (
    <div className="min-h-screen bg-[#0f0f23] bg-topo text-gray-200">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:top-2 focus:left-2 focus:px-4 focus:py-2 focus:bg-green-600 focus:text-white focus:rounded-md"
      >
        Skip to content
      </a>

      {/* Desktop top navigation — hidden on mobile, fixed */}
      <div className="hidden md:block fixed top-0 left-0 right-0 z-40">
        <Navbar currentPage={currentPage} onNavigate={onNavigate} />
      </div>

      {/* Main content — adds bottom padding on mobile to clear the fixed MobileNav, top padding on desktop for fixed Navbar */}
      <main
        id="main"
        className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6 md:pt-20"
      >
        {children}
      </main>

      {/* Mobile bottom navigation — hidden on desktop */}
      <MobileNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  );
}
