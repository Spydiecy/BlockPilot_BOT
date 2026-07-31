'use client';

import { memo, type ReactNode } from 'react';

export const AuditPageContainer = memo(function AuditPageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen w-full bg-black text-white relative overflow-hidden">
      <div
        className="absolute inset-0 h-full w-full bg-black bg-[linear-gradient(to_right,#161616_1px,transparent_1px),linear-gradient(to_bottom,#161616_1px,transparent_1px)] bg-[size:4rem_4rem]"
      ></div>
      <div className="absolute inset-0 h-full w-full bg-black [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]"></div>
      <div className="relative z-10 p-4 sm:p-6 lg:p-8">
        {children}
      </div>
    </div>
  );
});
