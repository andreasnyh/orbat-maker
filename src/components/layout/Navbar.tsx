import { ChevronsUp, Info, LayoutTemplate, Shield, Users } from 'lucide-react';
import type { Page } from '../../types';
import { ExportMenu } from '../export/ExportMenu';

interface NavbarProps {
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
  { page: 'people', label: 'Personnel', icon: Users },
  { page: 'ranks', label: 'Ranks', icon: ChevronsUp, iconSize: 22 },
  { page: 'templates', label: 'Templates', icon: LayoutTemplate },
];

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const activePage = (p: Page) =>
    p === currentPage ||
    (p === 'templates' && currentPage === 'template-editor') ||
    (p === 'orbats' && currentPage === 'orbat-builder');

  return (
    <nav className="bg-[#1a1a2e] border-b border-[#2a2a4a]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center h-14 gap-8">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="24 16 144 164"
            className="shrink-0"
            aria-label="Orbat Maker"
          >
            <path
              d="M32 40 L96 24 L160 40 L160 96 C160 138 96 172 96 172 C96 172 32 138 32 96 Z"
              fill="none"
              stroke="#4ade80"
              strokeWidth="8"
            />
            <text
              x="96"
              y="118"
              fontFamily="'Barlow Condensed',sans-serif"
              fontSize="60"
              fontWeight="700"
              fill="#4ade80"
              textAnchor="middle"
              letterSpacing="-2"
            >
              OM
            </text>
          </svg>
          <div className="flex gap-1">
            {navItems.map(({ page, label, icon: Icon, iconSize }) => (
              <div key={page} className="relative">
                <button
                  type="button"
                  onClick={() => onNavigate(page)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 focus-visible:text-green-400 ${
                    activePage(page)
                      ? 'text-green-400'
                      : 'text-gray-400 hover:text-green-400/70'
                  }`}
                >
                  <Icon size={iconSize ?? 18} aria-hidden="true" />
                  {label}
                </button>
                {activePage(page) && (
                  <div className="absolute bottom-0 left-2 right-2 h-0.5 bg-green-400 rounded-full" />
                )}
              </div>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-2">
            <ExportMenu />
            <button
              type="button"
              onClick={() => onNavigate('about')}
              className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 focus-visible:text-green-400 ${
                currentPage === 'about'
                  ? 'text-green-400'
                  : 'text-gray-400 hover:text-green-400/70'
              }`}
              aria-label="About"
              title="About"
            >
              <Info size={18} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}
