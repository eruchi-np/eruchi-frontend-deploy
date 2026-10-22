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
