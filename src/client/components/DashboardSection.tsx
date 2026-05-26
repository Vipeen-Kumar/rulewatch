import type { ReactNode } from 'react';

type DashboardSectionProps = {
  title: string;
  description?: string;
  children: ReactNode;
};

export const DashboardSection = ({ title, description, children }: DashboardSectionProps) => {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {description ? (
          <p className="text-sm text-zinc-400 mt-1">{description}</p>
        ) : null}
      </div>
      {children}
    </div>
  );
};
