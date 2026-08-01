'use client';

import { memo, type ReactNode } from 'react';

export const AuditPageContainer = memo(function AuditPageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      <div className="absolute inset-0 h-full w-full theme-grid-overlay"></div>
      <div className="absolute inset-0 h-full w-full theme-grid-fade"></div>
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
});
