import { Info, LayoutTemplate, Shield, Users } from 'lucide-react';
import type { Page } from '../../types';

interface MobileNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: { page: Page; label: string; icon: typeof Users }[] = [
  { page: 'orbats', label: 'ORBATs', icon: Shield },
  { page: 'people', label: 'People', icon: Users },
  { page: 'templates', label: 'Templates', icon: LayoutTemplate },
  { page: 'about', label: 'About', icon: Info },
];

export function MobileNav({ currentPage, onNavigate }: MobileNavProps) {
  const isActive = (p: Page) =>
    p === currentPage ||
    (p === 'templates' && currentPage === 'template-editor') ||
    (p === 'orbats' && currentPage === 'orbat-builder');

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-[#1a1a2e] border-t border-[#2a2a4a] md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="flex items-stretch h-16">
        {navItems.map(({ page, label, icon: Icon }) => {
          const active = isActive(page);
          return (
            <button
              type="button"
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] transition-colors ${
                active
                  ? 'text-green-400'
                  : 'text-gray-500 hover:text-gray-300 active:text-gray-200'
              }`}
            >
              <Icon size={20} />
              <span className="font-display text-[10px] font-semibold tracking-wide uppercase">
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
