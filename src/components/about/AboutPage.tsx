export function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-gray-100 uppercase tracking-wide mb-2">
          About ORBAT Maker
        </h1>
        <p className="text-gray-400">
          A tool for building and managing Order of Battle charts. Create
          templates, manage personnel rosters, and assign people to roles with
          an intuitive drag-and-drop interface.
        </p>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg border border-[#2a2a4a] p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-gray-200 uppercase tracking-wide">
          Features
        </h2>
        <ul className="space-y-2 text-gray-400 text-sm">
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">&#x2022;</span>
            Create and manage reusable ORBAT templates
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">&#x2022;</span>
            Maintain a people roster with ranks
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">&#x2022;</span>
            Drag-and-drop assignment of personnel to slots
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">&#x2022;</span>
            Import and export data for backup and sharing
          </li>
          <li className="flex items-start gap-2">
            <span className="text-green-400 mt-0.5">&#x2022;</span>
            Works offline as a Progressive Web App
          </li>
        </ul>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg border border-[#2a2a4a] p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-gray-200 uppercase tracking-wide">
          Built by
        </h2>
        <p className="text-gray-400 text-sm">
          Created by Andréas Ny. Built with React, TypeScript, and Tailwind CSS.
        </p>
        <a
          href="https://github.com/andreasnyh"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-green-400 hover:text-green-300 transition-colors"
        >
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="currentColor"
            aria-hidden="true"
          >
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844a9.59 9.59 0 0 1 2.504.337c1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.02 10.02 0 0 0 22 12.017C22 6.484 17.522 2 12 2Z" />
          </svg>
          github.com/andreasnyh
        </a>
      </div>

      <div className="bg-[#1a1a2e] rounded-lg border border-[#2a2a4a] p-6 space-y-4">
        <h2 className="font-display text-lg font-semibold text-gray-200 uppercase tracking-wide">
          Privacy
        </h2>
        <p className="text-gray-400 text-sm">
          This site uses{' '}
          <a
            href="https://www.goatcounter.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-green-400 hover:text-green-300 transition-colors"
          >
            GoatCounter
          </a>{' '}
          for anonymous visit statistics. No cookies are used and no personal
          data is collected.
        </p>
      </div>

      <div className="border-t border-[#2a2a4a] pt-6">
        <p className="text-gray-400 text-xs text-center">
          &copy; {new Date().getFullYear()} Andr&eacute;as Ny. Released under
          the MIT License.
        </p>
      </div>
    </div>
  );
}
