import React, { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { ChevronDown, Check } from 'lucide-react';

/** Empty string / undefined = no choice. null can be a real option value (e.g. Other). */
const isUnset = (value) => value === '' || value === undefined;

const MENU_MAX = 240;
const MENU_GAP = 8;

const EnhancedSelect = ({
  options,
  value,
  onChange,
  placeholder = 'Select an option...',
  label = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);

  const placeMenu = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - MENU_GAP;
    const spaceAbove = rect.top - MENU_GAP;
    const openUp = spaceBelow < Math.min(MENU_MAX, 160) && spaceAbove > spaceBelow;
    const maxHeight = Math.max(120, Math.min(MENU_MAX, openUp ? spaceAbove : spaceBelow));
    setMenuStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 10000,
      maxHeight,
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + MENU_GAP }
        : { top: rect.bottom + MENU_GAP }),
    });
  }, []);

  useLayoutEffect(() => {
    if (!isOpen) {
      setMenuStyle(null);
      return undefined;
    }
    placeMenu();
    const onReposition = () => placeMenu();
    window.addEventListener('resize', onReposition);
    window.addEventListener('scroll', onReposition, true);
    return () => {
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
    };
  }, [isOpen, placeMenu]);

  useEffect(() => {
    if (!isOpen) return undefined;
    const handleClickOutside = (event) => {
      const inRoot = rootRef.current?.contains(event.target);
      const inMenu = menuRef.current?.contains(event.target);
      if (!inRoot && !inMenu) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSelect = (optionValue) => {
    onChange(optionValue);
    setIsOpen(false);
  };

  const selectedOption = isUnset(value)
    ? null
    : options.find((opt) =>
        typeof opt === 'object' ? opt.value === value : opt === value
      );

  const displayValue = selectedOption
    ? typeof selectedOption === 'object'
      ? selectedOption.label
      : selectedOption
    : '';

  const hasSelection = selectedOption != null;

  const menu = isOpen && menuStyle && typeof document !== 'undefined'
    ? createPortal(
        <div
          ref={menuRef}
          className="bg-white border-2 border-gray-200 rounded-xl shadow-lg shadow-gray-100 overflow-hidden"
          style={menuStyle}
        >
          <div className="py-2 overflow-auto" style={{ maxHeight: menuStyle.maxHeight }}>
            {options.map((option, index) => {
              const optionValue = typeof option === 'object' ? option.value : option;
              const optionLabel = typeof option === 'object' ? option.label : option;
              const isSelected = !isUnset(value) && value === optionValue;

              return (
                <div
                  key={optionValue ?? `opt-${index}`}
                  className={`px-4 py-3 cursor-pointer transition-all duration-150 flex items-center justify-between ${
                    isSelected
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-500'
                      : 'hover:bg-gray-50 text-gray-700 hover:text-gray-900'
                  } ${index !== options.length - 1 ? 'border-b border-gray-100' : ''}`}
                  onClick={() => handleSelect(optionValue)}
                >
                  <span className={`font-medium ${isSelected ? 'text-blue-700' : 'text-gray-700'}`}>
                    {optionLabel}
                  </span>
                  {isSelected && <Check className="h-4 w-4 text-blue-500 flex-shrink-0 ml-2" />}
                </div>
              );
            })}
          </div>
        </div>,
        document.body
      )
    : null;

  return (
    <div className="relative" ref={rootRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      )}

      <div
        ref={triggerRef}
        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer flex items-center justify-between bg-white transition-all duration-200 hover:border-gray-300 hover:shadow-sm"
        onClick={() => setIsOpen((open) => !open)}
      >
        <div className="flex-1">
          {hasSelection ? (
            <span className="font-medium text-gray-900">{displayValue}</span>
          ) : (
            <span className="text-gray-400">{placeholder}</span>
          )}
        </div>
        <ChevronDown
          className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-500' : ''
          }`}
        />
      </div>

      {menu}
    </div>
  );
};

export default EnhancedSelect;
