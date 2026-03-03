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
    <div className="min-h-screen bg-[#0f0f23] bg-grid-pattern text-gray-200">
      {/* Desktop top navigation — hidden on mobile */}
      <div className="hidden md:block">
        <Navbar currentPage={currentPage} onNavigate={onNavigate} />
      </div>

      {/* Main content — adds bottom padding on mobile to clear the fixed MobileNav */}
      <main className="max-w-6xl mx-auto px-4 py-6 pb-24 md:pb-6">
        {children}
      </main>

      {/* Mobile bottom navigation — hidden on desktop */}
      <MobileNav currentPage={currentPage} onNavigate={onNavigate} />
    </div>
  );
}
