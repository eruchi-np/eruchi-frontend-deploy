import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Search, ChevronDown, X } from 'lucide-react';

const SearchableSelect = ({ 
  options, 
  value, 
  onChange, 
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  label = "Select Occupation"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const inputRef = useRef(null);

  const filteredOptions = options.filter(option =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openModal = () => {
    document.body.style.overflow = 'hidden';
    setIsOpen(true);
  };

  const closeModal = () => {
    document.body.style.overflow = '';
    setIsOpen(false);
    setSearchTerm('');
  };

  // Always clean up on unmount — prevents overflow getting stuck
  useEffect(() => {
    return () => { document.body.style.overflow = ''; };
  }, []);

  // Focus without scrolling the background page
  useEffect(() => {
    if (isOpen && inputRef.current) {
      const t = setTimeout(() => {
        inputRef.current?.focus({ preventScroll: true });
      }, 150);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleSelect = (option) => {
    onChange(option.label);
    closeModal();
  };

  const clearSelection = () => {
    onChange('');
    setSearchTerm('');
  };

  const selectedOption = options.find(opt => opt.label === value);

  return (
    <div className="relative">
      {/* Trigger */}
      <div
        className="w-full px-3 py-2 border border-gray-300 rounded-md cursor-pointer flex items-center justify-between bg-white hover:border-gray-400 transition-colors"
        onClick={openModal}
      >
        <div className="flex-1 truncate">
          {selectedOption ? (
            <span className="font-medium text-gray-900">{selectedOption.label}</span>
          ) : (
            <span className="text-gray-500">{placeholder}</span>
          )}
        </div>
        <div className="flex items-center space-x-2 ml-2">
          {value && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); clearSelection(); }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {/* 2. Use createPortal to render the modal directly into document.body */}
      {isOpen && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50 p-6"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-xl w-full max-w-md flex flex-col"
            style={{ maxHeight: '70vh' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="px-5 pt-5 pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{label}</h3>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={searchPlaceholder}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-base"
                />
              </div>
            </div>

            {/* Options */}
            <div className="flex-1 overflow-y-auto">
              {filteredOptions.length === 0 ? (
                <div className="px-5 py-10 text-center text-gray-500">
                  <div className="text-base font-medium mb-1">No occupations found</div>
                  <div className="text-sm">Try different keywords</div>
                </div>
              ) : (
                <div className="p-2">
                  {filteredOptions.map((option) => (
                    <div
                      key={option.id}
                      className={`px-4 py-3 cursor-pointer rounded-xl transition-colors ${
                        value === option.label
                          ? 'bg-blue-50 text-blue-700'
                          : 'hover:bg-gray-50 text-gray-900'
                      }`}
                      onClick={() => handleSelect(option)}
                    >
                      <div className="font-medium">{option.label}</div>
                      {option.description && (
                        <div className="text-sm text-gray-500 mt-0.5">{option.description}</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 rounded-b-2xl">
              <p className="text-sm text-gray-400 text-center">
                {filteredOptions.length} occupation{filteredOptions.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>,
        document.body // Append directly to the body element
      )}
    </div>
  );
};

export default SearchableSelect;