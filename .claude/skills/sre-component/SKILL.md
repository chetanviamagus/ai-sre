---
name: sre-component
description: Scaffold a new React component for the AI SRE Dashboard, following the project's established design patterns, Tailwind conventions, Zustand store usage, and Lucide icon style.
argument-hint: [ComponentName] [description]
allowed-tools: Read, Glob, Grep, Write, Edit
---

# SRE Component Scaffolder

When invoked with `/sre-component $ARGUMENTS`, create a new React component for the AI SRE Dashboard.

Parse `$ARGUMENTS` as: first word = ComponentName (PascalCase), remaining = description of what it does.

## Step 1 — Understand Context

Before generating, read these files to understand current patterns:
- `src/components/ActionCard.jsx` — card UI pattern, severity colors, button styles
- `src/components/FilterBar.jsx` — filter group pattern, Lucide icon usage
- `src/store/useDashboardStore.js` — available store state and actions
- `src/App.jsx` — layout structure and how components are composed

## Step 2 — Generate the Component

Create `src/components/<ComponentName>.jsx` following these **strict conventions**:

### Design System
- **Colors**: `slate-*` for neutrals, `indigo-*` for primary/brand, `emerald-*` for healthy/success, `yellow-*` for warning, `red-*` for critical/P0, `orange-*` for P1, `blue-*` for P2
- **Cards**: `bg-white rounded-2xl border border-slate-200 shadow-sm p-6`
- **Section headers**: `text-xs font-black uppercase tracking-widest text-slate-400`
- **Primary headings**: `font-black text-slate-800`
- **Body text**: `text-sm font-medium text-slate-600` or `text-[11px] font-medium text-slate-500`
- **Tiny labels**: `text-[10px] font-bold text-slate-400 uppercase tracking-widest`
- **Buttons (primary)**: `py-2 text-[11px] font-bold bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition-colors`
- **Buttons (secondary)**: `py-2 text-[11px] font-bold border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors`
- **Hover transitions**: always include `transition-colors` or `transition-all`
- **Icons**: always from `lucide-react`, sized with `size={14}` (inline) or `size={20}` (standalone), paired with `className="text-slate-400"` for muted or brand color for emphasis

### Store Usage
Import from `'../store/useDashboardStore'` and destructure only what is needed:
```js
const { getFilteredData, currentRole } = useDashboardStore();
const { incidents, nodes, isExecutive, isManagement } = getFilteredData();
```

### Role Gating
- Executive-only sections: wrap with `{isExecutive && (...)}`
- Management+ sections: wrap with `{isManagement && (...)}`

### Component Structure
```jsx
import React from 'react';
import { /* relevant icons */ } from 'lucide-react';
import { useDashboardStore } from '../store/useDashboardStore';

const ComponentName = () => {
  const { getFilteredData } = useDashboardStore();
  const { /* destructure needed */ } = getFilteredData();

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
      <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">
        SECTION TITLE
      </h2>
      {/* content */}
    </div>
  );
};

export default ComponentName;
```

## Step 3 — Suggest Integration

After writing the file, show the user a concise code snippet to add the component to `src/App.jsx` in the appropriate place (inside `<main>`, in the left service-map section, in the right buckets section, or as a new row).

## Step 4 — Severity / Priority Color Helper

If the component renders incidents or nodes, include this local map:
```js
const priorityColors = {
  P0: 'border-red-600 bg-red-50/30',
  P1: 'border-orange-500 bg-orange-50/30',
  P2: 'border-blue-500 bg-blue-50/30',
};
const statusColors = {
  healthy: 'text-emerald-500',
  warning: 'text-yellow-500',
  critical: 'text-red-500',
};
```

## Notes
- Do NOT use inline styles — always use Tailwind utility classes.
- Do NOT install new dependencies. Use only: `react`, `lucide-react`, `framer-motion`, `reactflow`, `zustand`.
- Keep components focused and single-purpose. Do not bundle unrelated functionality.
- If `$ARGUMENTS` is empty, ask the user for a component name and brief description before proceeding.
