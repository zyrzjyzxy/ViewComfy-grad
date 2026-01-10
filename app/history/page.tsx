'use client';

import { HistoryContent } from '@/components/pages/history/history-content';

export default function HistoryPage() {
  return (
    <div className="h-full overflow-auto bg-background">
      <HistoryContent />
    </div>
  );
}
