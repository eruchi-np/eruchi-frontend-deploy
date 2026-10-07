import React, { useEffect, useRef, useState } from 'react';
import { Bold, Italic, Underline } from 'lucide-react';
import { plainSurveyText, sanitizeSurveyMarkup } from '../../utils/surveyMarkup';

const COMMANDS = {
  b: 'bold',
  i: 'italic',
  u: 'underline',
};

function commandState() {
  try {
    return {
      bold: document.queryCommandState('bold'),
      italic: document.queryCommandState('italic'),
      underline: document.queryCommandState('underline'),
    };
  } catch {
    return { bold: false, italic: false, underline: false };
  }
}

export function SurveyRichText({ text, className }) {
  const html = sanitizeSurveyMarkup(text || '');
  if (!/<\/?(?:b|i|u)>/.test(html)) {
    return <span className={className}>{html}</span>;
  }
  return <span className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function SurveyTextField({ value, onChange, placeholder = 'Enter question text...' }) {
  const ref = useRef(null);
  const [active, setActive] = useState({ bold: false, italic: false, underline: false });
  const count = plainSurveyText(value).length;
  const over = count > 200;
  const empty = count === 0;

  useEffect(() => {
    const el = ref.current;
    if (!el || document.activeElement === el) return;
    const next = sanitizeSurveyMarkup(value || '');
    if (el.innerHTML !== next) el.innerHTML = next;
  }, [value]);

  useEffect(() => {
    const sync = () => {
      if (!ref.current || document.activeElement !== ref.current) {
        setActive({ bold: false, italic: false, underline: false });
        return;
      }
      setActive(commandState());
    };
    document.addEventListener('selectionchange', sync);
    return () => document.removeEventListener('selectionchange', sync);
  }, []);

  const publish = () => {
    const el = ref.current;
    if (!el) return;
    let clean = sanitizeSurveyMarkup(el.innerHTML);
    if (!plainSurveyText(clean)) clean = '';
    onChange(clean);
  };

  const format = (command) => {
    const el = ref.current;
    if (!el) return;
    el.focus();
    document.execCommand(command, false, null);
    setActive(commandState());
    publish();
  };

  const onKeyDown = (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      return;
    }
    if (!(event.metaKey || event.ctrlKey) || event.altKey) return;
    const command = COMMANDS[event.key.toLowerCase()];
    if (!command) return;
    event.preventDefault();
    format(command);
  };

  const onPaste = (event) => {
    event.preventDefault();
    const text = (event.clipboardData?.getData('text/plain') || '').replace(/[\r\n]+/g, ' ');
    document.execCommand('insertText', false, text);
    publish();
  };

  const buttonClass = (pressed) =>
    `inline-flex h-8 w-8 items-center justify-center rounded-lg border text-sm transition-colors ${
      pressed
        ? 'border-green-400 bg-green-50 text-green-800'
        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
    }`;

  return (
    <div>
      <div className="mb-2 flex items-center gap-1">
        <button
          type="button"
          aria-label="Bold"
          aria-pressed={active.bold}
          title="Bold (Ctrl+B)"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => format('bold')}
          className={buttonClass(active.bold)}
        >
          <Bold className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Italic"
          aria-pressed={active.italic}
          title="Italic (Ctrl+I)"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => format('italic')}
          className={buttonClass(active.italic)}
        >
          <Italic className="h-4 w-4" />
        </button>
        <button
          type="button"
          aria-label="Underline"
          aria-pressed={active.underline}
          title="Underline (Ctrl+U)"
          onMouseDown={(event) => event.preventDefault()}
          onClick={() => format('underline')}
          className={buttonClass(active.underline)}
        >
          <Underline className="h-4 w-4" />
        </button>
      </div>
      <div className="relative">
        {empty && (
          <span className="pointer-events-none absolute left-4 top-3 text-gray-400">{placeholder}</span>
        )}
        <div
          ref={ref}
          role="textbox"
          aria-multiline="false"
          aria-label="Question text"
          contentEditable
          suppressContentEditableWarning
          onInput={publish}
          onBlur={publish}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
            over ? 'border-red-400' : 'border-gray-200'
          }`}
        />
      </div>
      <p className={`text-xs mt-1.5 ${over ? 'text-red-600' : 'text-gray-500'}`}>
        {count}/200
        <span className="text-gray-400"> · Ctrl or Cmd + B, I, U</span>
      </p>
    </div>
  );
}
