import { ChevronsUp, Info, LayoutTemplate, Network, Users } from 'lucide-react';
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
  { page: 'orbats', label: 'ORBATs', icon: Network },
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
            viewBox="0 0 24 24"
            className="shrink-0"
            aria-label="Orbat Maker"
          >
            <path
              d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"
              fill="none"
              stroke="#4ade80"
              strokeWidth="1.5"
            />
            <text
              x="12"
              y="15"
              fontFamily="'Barlow Condensed',sans-serif"
              fontSize="8.5"
              fontWeight="700"
              fill="#4ade80"
              textAnchor="middle"
              letterSpacing="-0.3"
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
