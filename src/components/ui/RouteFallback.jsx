import React from 'react';
import { Loader2 } from 'lucide-react';

export default function RouteFallback() {
  return (
    <div className="min-h-[50vh] flex items-center justify-center bg-white">
      <Loader2 className="h-8 w-8 animate-spin text-neutral-400" aria-label="Loading page" />
    </div>
  );
}
