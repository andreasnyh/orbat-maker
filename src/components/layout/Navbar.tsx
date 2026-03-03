import { Users, LayoutTemplate, Shield } from 'lucide-react'
import type { Page } from '../../types'
import { ExportMenu } from '../export/ExportMenu'

interface NavbarProps {
  currentPage: Page
  onNavigate: (page: Page) => void
}

const navItems: { page: Page; label: string; icon: typeof Users }[] = [
  { page: 'orbats', label: 'ORBATs', icon: Shield },
  { page: 'people', label: 'People', icon: Users },
  { page: 'templates', label: 'Templates', icon: LayoutTemplate },
]

export function Navbar({ currentPage, onNavigate }: NavbarProps) {
  const activePage = (p: Page) =>
    p === currentPage ||
    (p === 'templates' && currentPage === 'template-editor') ||
    (p === 'orbats' && currentPage === 'orbat-builder')

  return (
    <nav className="bg-[#1a1a2e] border-b border-[#2a2a4a]">
      <div className="max-w-6xl mx-auto px-4">
        <div className="flex items-center h-14 gap-8">
          <span className="font-bold text-green-400 tracking-wide text-lg font-mono">ORBAT</span>
          <div className="flex gap-1">
            {navItems.map(({ page, label, icon: Icon }) => (
              <button
                key={page}
                onClick={() => onNavigate(page)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activePage(page)
                    ? 'bg-green-400/10 text-green-400'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                }`}
              >
                <Icon size={18} />
                {label}
              </button>
            ))}
          </div>
          <div className="ml-auto">
            <ExportMenu />
          </div>
        </div>
      </div>
    </nav>
  )
}
