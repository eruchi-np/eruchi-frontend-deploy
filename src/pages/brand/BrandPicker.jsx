import React, { useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

function useAnchoredMenu(open, anchorRef) {
  const [style, setStyle] = useState(null);
  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const node = anchorRef.current;
      if (!node) return;
      const rect = node.getBoundingClientRect();
      const roomBelow = window.innerHeight - rect.bottom - 12;
      const roomAbove = rect.top - 12;
      const upward = roomBelow < 240 && roomAbove > roomBelow;
      setStyle({
        position: 'fixed',
        left: rect.left,
        width: rect.width,
        zIndex: 80,
        maxHeight: Math.max(160, Math.min(520, upward ? roomAbove : roomBelow)),
        top: upward ? 'auto' : rect.bottom + 4,
        bottom: upward ? window.innerHeight - rect.top + 4 : 'auto',
      });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorRef]);
  return style;
}

function OptionMenu({ open, anchorRef, children }) {
  const style = useAnchoredMenu(open, anchorRef);
  if (!open || !style) return null;
  return createPortal(
    <ul data-option-menu className="overflow-auto rounded-xl border border-gray-100 bg-white py-1 shadow-lg" style={style}>
      {children}
    </ul>,
    document.body,
  );
}

export function CompareSearch({ peers, compares, onToggle }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const full = compares.length >= 5;
  const matches = peers
    .filter((name) => !compares.includes(name) && name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);
  return (
    <div className="shrink-0 text-xs text-gray-500">
      <p>Compare <span className="text-gray-400">{compares.length}/5</span></p>
      <input
        ref={anchorRef}
        className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900 disabled:bg-gray-50"
        value={query}
        placeholder={full ? '5 brands selected' : 'Search brands'}
        disabled={full}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      <OptionMenu open={open && !full} anchorRef={anchorRef}>
        {matches.length ? matches.map((name) => (
          <li key={name}>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-slate-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onToggle(name); setQuery(''); setOpen(false); }}
            >
              {name}
            </button>
          </li>
        )) : <li className="px-3 py-2 text-sm text-gray-400">No brand matches</li>}
      </OptionMenu>
    </div>
  );
}

export function BrandSearch({ brands, value, onChange }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const matches = (brands || [])
    .filter((name) => name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);
  return (
    <div className="text-xs text-gray-500">
      <p>Brand</p>
      <input
        ref={anchorRef}
        className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-lg font-bold text-gray-900"
        value={open ? query : value}
        placeholder="Search brands"
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => { setQuery(''); setOpen(true); }}
        onBlur={() => setOpen(false)}
      />
      <OptionMenu open={open} anchorRef={anchorRef}>
        {matches.length ? matches.map((name) => (
          <li key={name}>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm font-medium text-gray-800 hover:bg-slate-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onChange(name); setOpen(false); }}
            >
              {name}
            </button>
          </li>
        )) : <li className="px-3 py-2 text-sm text-gray-400">No brand matches</li>}
      </OptionMenu>
    </div>
  );
}

export function MultiBrandSearch({ brands, selected, onToggle, onFocus, focusBrand }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const anchorRef = useRef(null);
  const matches = (brands || [])
    .filter((name) => !selected.includes(name) && name.toLowerCase().includes(query.trim().toLowerCase()))
    .slice(0, 8);
  return (
    <div className="shrink-0 text-xs text-gray-500">
      <p>Add brands <span className="text-gray-400">{selected.length}/{brands?.length || 0}</span></p>
      <input
        ref={anchorRef}
        className="mt-1 block w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
        value={query}
        placeholder={selected.length ? 'Add another brand' : 'Search brands'}
        onChange={(event) => { setQuery(event.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
      />
      <OptionMenu open={open} anchorRef={anchorRef}>
        {matches.length ? matches.map((name) => (
          <li key={name}>
            <button
              type="button"
              className="block w-full px-3 py-2 text-left text-sm text-gray-800 hover:bg-slate-50"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => { onToggle(name); setQuery(''); setOpen(false); }}
            >
              {name}
            </button>
          </li>
        )) : <li className="px-3 py-2 text-sm text-gray-400">No brand matches</li>}
      </OptionMenu>
      {selected.length ? (
        <div className="mt-2 max-h-40 overflow-y-auto">
          <p className="mb-1 text-[11px] text-gray-400">Focus uses headlines. Remove with ×.</p>
          <div className="space-y-1">
            {selected.map((name, index) => (
              <div
                key={name}
                className={`flex items-center gap-2 rounded-xl border px-2 py-1.5 ${name === focusBrand ? 'border-blue-300 bg-blue-50' : 'border-gray-100 bg-white'}`}
              >
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: ['#2563eb', '#0f766e', '#7c3aed', '#0891b2', '#db2777', '#4f46e5', '#65a30d', '#be185d', '#64748b', '#9333ea'][index % 10] }} />
                <span className="min-w-0 flex-1 truncate text-sm text-gray-900">{name}</span>
                <button
                  type="button"
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium text-blue-700 hover:bg-blue-100"
                  onClick={() => onFocus?.(name)}
                >
                  Focus
                </button>
                <button
                  type="button"
                  className="rounded-full px-2 py-0.5 text-[11px] font-medium text-gray-500 hover:bg-gray-100"
                  onClick={() => onToggle(name)}
                  aria-label={`Remove ${name}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
