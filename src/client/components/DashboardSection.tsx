import type { ReactNode } from 'react';

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export const DashboardSection = ({ title, description, children }: DashboardSectionProps) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 space-y-3 sm:space-y-4">
      <div>
        <h2 className="text-lg font-semibold sm:text-xl">{title}</h2>
        {description ? (
          <p className="text-xs text-zinc-400 mt-1 sm:text-sm">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
};
