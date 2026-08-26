import React from 'react';
import { Card } from '@/components/ui/card';

const AlumniCardSkeleton = () => {
  return (
    <Card className="border border-border/80 bg-card shadow-2xs rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      {/* Left: Avatar + Details */}
      <div className="flex items-start gap-4 min-w-0 flex-1">
        <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-full bg-muted animate-pulse shrink-0 border border-border" />
        <div className="flex-1 space-y-2 min-w-0">
          <div className="flex items-center gap-2">
            <div className="h-4 w-36 bg-muted animate-pulse rounded" />
            <div className="h-4 w-14 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-3 w-48 bg-muted animate-pulse rounded" />
          <div className="h-3.5 w-40 bg-muted animate-pulse rounded" />
          <div className="h-3 w-28 bg-muted animate-pulse rounded" />
        </div>
      </div>

      {/* Right: Buttons */}
      <div className="flex items-center gap-2.5 w-full sm:w-auto shrink-0 pt-2 sm:pt-0">
        <div className="h-9 w-28 bg-muted animate-pulse rounded-md flex-1 sm:flex-initial" />
        <div className="h-9 w-28 bg-muted animate-pulse rounded-md flex-1 sm:flex-initial" />
      </div>
    </Card>
  );
};

export default AlumniCardSkeleton;


