import { ChevronDown, Download, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import {
  usePeopleState,
  useTemplatesState,
} from '../../context/AppStateContext';
import {
  createExportBundle,
  downloadJson,
  generateFilename,
} from '../../lib/exportImport';
import { ImportDialog } from './ImportDialog';

export function ExportMenu() {
  const { people } = usePeopleState();
  const { templates } = useTemplatesState();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!dropdownOpen) return;
    function handleOutsideClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [dropdownOpen]);

  function handleExport(type: 'people' | 'templates' | 'all') {
    setDropdownOpen(false);
    switch (type) {
      case 'people':
        downloadJson(
          createExportBundle({ people }),
          generateFilename('people'),
        );
        break;
      case 'templates':
        downloadJson(
          createExportBundle({ templates }),
          generateFilename('templates'),
        );
        break;
      case 'all':
        downloadJson(
          createExportBundle({ people, templates }),
          generateFilename('all'),
        );
        break;
    }
  }

  return (
    <>
      <div className="flex items-center gap-1" ref={containerRef}>
        {/* Export dropdown */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setDropdownOpen((prev) => !prev)}
            aria-expanded={dropdownOpen}
            aria-haspopup="menu"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 focus-visible:text-green-400"
          >
            <Download size={16} />
            Export
            <ChevronDown
              size={14}
              className={`transition-transform duration-150 ${dropdownOpen ? 'rotate-180' : ''}`}
            />
          </button>

          {dropdownOpen && (
            <div
              role="menu"
              className="absolute right-0 top-full mt-1 w-44 bg-[#1a1a2e] border border-[#2a2a4a] rounded-md shadow-xl z-50 py-1"
            >
              <DropdownItem
                label="Export People"
                onClick={() => handleExport('people')}
              />
              <DropdownItem
                label="Export Templates"
                onClick={() => handleExport('templates')}
              />
              <div className="border-t border-[#2a2a4a] my-1" />
              <DropdownItem
                label="Export All"
                onClick={() => handleExport('all')}
                bold
              />
            </div>
          )}
        </div>

        {/* Import button */}
        <button
          type="button"
          onClick={() => setImportOpen(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium text-gray-400 hover:text-gray-200 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-400/60 focus-visible:text-green-400"
        >
          <Upload size={16} />
          Import
        </button>
      </div>

      <ImportDialog open={importOpen} onClose={() => setImportOpen(false)} />
    </>
  );
}

interface DropdownItemProps {
  label: string;
  onClick: () => void;
  bold?: boolean;
}

function DropdownItem({ label, onClick, bold }: DropdownItemProps) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={`w-full text-left px-4 py-2 text-sm hover:bg-white/5 hover:text-green-400 transition-colors ${
        bold ? 'text-gray-200 font-medium' : 'text-gray-400'
      }`}
    >
      {label}
    </button>
  );
}
