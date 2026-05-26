import type { ReactNode } from 'react';

type CollapsibleSectionProps = {
  title: string;
  isOpen: boolean;
  onToggle: () => void;
  children?: ReactNode;
  renderContent?: () => ReactNode;
};

export const CollapsibleSection = ({
  title,
  isOpen,
  onToggle,
  children,
  renderContent,
}: CollapsibleSectionProps) => {
  const content = isOpen ? (renderContent ? renderContent() : children) : null;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl sm:rounded-2xl">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 text-left sm:px-5 sm:py-4"
        onClick={onToggle}
      >
        <span className="text-sm font-semibold sm:text-base">{title}</span>
        <span className="text-[10px] text-zinc-400 sm:text-xs">
          {isOpen ? 'Hide' : 'Show'}
        </span>
      </button>
      <div
        className={`transition-all duration-300 ${isOpen ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
      >
        {isOpen ? <div className="px-4 pb-4 sm:px-5 sm:pb-5">{content}</div> : null}
      </div>
    </div>
  );
};
