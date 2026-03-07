import { ChevronsUp, Info, LayoutTemplate, Shield, Users } from 'lucide-react';
import type { Page } from '../../types';

interface MobileNavProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const navItems: {
  page: Page;
  label: string;
  icon: typeof Users;
  iconSize?: number;
}[] = [
  { page: 'orbats', label: 'ORBATs', icon: Shield },
  { page: 'people', label: 'People', icon: Users },
  { page: 'ranks', label: 'Ranks', icon: ChevronsUp, iconSize: 24 },
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
        {navItems.map(({ page, label, icon: Icon, iconSize }) => {
          const active = isActive(page);
          return (
            <button
              type="button"
              key={page}
              onClick={() => onNavigate(page)}
              className={`flex-1 flex flex-col items-center justify-center gap-1 min-h-11 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-green-400/60 focus-visible:text-green-400 ${
                active
                  ? 'text-green-400'
                  : 'text-gray-400 hover:text-gray-300 active:text-gray-200'
              }`}
            >
              <Icon size={iconSize ?? 20} aria-hidden="true" />
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
