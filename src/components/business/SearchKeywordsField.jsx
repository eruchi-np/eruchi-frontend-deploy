import { useState } from "react";
import { X } from "lucide-react";

const MAX_SEARCH_KEYWORDS = 15;
const MAX_KEYWORD_LENGTH = 40;

export default function SearchKeywordsField({ keywords = [], onChange, inputClassName }) {
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");

  const addWords = (raw) => {
    const parts = String(raw || "")
      .split(",")
      .map((part) => part.trim().replace(/\s+/g, " ").toLowerCase())
      .filter(Boolean);

    if (!parts.length) {
      setDraft("");
      return;
    }

    const next = [...keywords];
    const seen = new Set(next.map((word) => word.toLowerCase()));
    let message = "";

    for (const word of parts) {
      if (word.length > MAX_KEYWORD_LENGTH) {
        message = `Each keyword must be ${MAX_KEYWORD_LENGTH} characters or fewer`;
        continue;
      }
      if (seen.has(word)) continue;
      if (next.length >= MAX_SEARCH_KEYWORDS) {
        message = `A store can have at most ${MAX_SEARCH_KEYWORDS} keywords`;
        break;
      }
      seen.add(word);
      next.push(word);
    }

    onChange(next);
    setDraft("");
    setError(message);
  };

  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">
        Search keywords
      </label>
      <p className="text-xs text-gray-400 mb-2">
        Words customers can type in Rewards to find this store’s vouchers. A specific word is enough: momo still shows when someone searches food, and football still shows when someone searches sports.
      </p>
      <div className="flex gap-2">
        <input
          value={draft}
          onChange={(event) => {
            const value = event.target.value;
            if (value.includes(",")) {
              addWords(value);
              return;
            }
            setDraft(value);
          }}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addWords(draft);
            }
          }}
          placeholder="football"
          className={inputClassName}
        />
        <button
          type="button"
          onClick={() => addWords(draft)}
          className="shrink-0 px-4 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          Add
        </button>
      </div>
      {keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {keywords.map((word) => (
            <button
              key={word}
              type="button"
              onClick={() => onChange(keywords.filter((item) => item !== word))}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-gray-900 text-white"
            >
              {word}
              <X className="h-3 w-3" aria-hidden="true" />
              <span className="sr-only">Remove {word}</span>
            </button>
          ))}
        </div>
      )}
      {error ? <p className="text-xs text-red-500 mt-1">{error}</p> : null}
      <p className="text-[10px] text-gray-400 mt-1">
        {keywords.length}/{MAX_SEARCH_KEYWORDS}. Press Enter or comma to add.
      </p>
    </div>
  );
}
