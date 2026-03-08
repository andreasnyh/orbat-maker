# ORBAT Maker

A drag-and-drop Order of Battle builder for milsim units. Create reusable organizational templates, maintain a personnel roster, and assign people to roles — all from your browser.

Data is stored locally in your browser with full offline support via PWA.

## Features

- **People roster** — manage personnel with names and ranks; search and filter
- **Template editor** — build reusable ORBAT structures with groups and role slots; ships with default milsim templates (Infantry Section, Weapons Team, Vehicle Crew)
- **Drag-and-drop builder** — assign people to slots by dragging from the roster; swap and reassign with ease
- **Export/import** — save and load people, templates, and ORBATs as JSON for backup and sharing
- **Clipboard export** — copy formatted ORBATs as plain text for Discord or TeamSpeak
- **PWA** — installable on desktop and mobile, works offline, auto-updates

## Getting started

```bash
npm install
npm run dev
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Lint with Biome |
| `npm run format` | Format with Biome |

## Tech stack

- React 19 + TypeScript
- Vite
- Tailwind CSS 4
- dnd-kit (drag-and-drop)
- Lucide React (icons)
- vite-plugin-pwa (service worker + install prompt)
- Biome (lint + format)

## Project structure

```
src/
├── components/
│   ├── about/        About page
│   ├── common/       Button, Modal, TextInput, etc.
│   ├── export/       Export menu and import dialog
│   ├── layout/       App shell, navbar, mobile nav
│   ├── orbat/        ORBAT list, builder, roster sidebar
│   ├── people/       People roster, person cards and forms
│   └── templates/    Template list and editor
├── context/          Global app state (React context + localStorage)
├── hooks/            usePeople, useTemplates, useOrbats, useLocalStorage
├── lib/              Clipboard formatting, export/import, ID generation
├── types/            TypeScript interfaces
└── data/             Default milsim templates
```
