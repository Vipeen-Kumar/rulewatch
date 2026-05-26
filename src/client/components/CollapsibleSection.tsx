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
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
      <button
        type="button"
        className="w-full flex items-center justify-between px-5 py-4 text-left"
        onClick={onToggle}
      >
        <span className="text-base font-semibold">{title}</span>
        <span className="text-xs text-zinc-400">{isOpen ? 'Hide' : 'Show'}</span>
      </button>
      <div
        className={`transition-all duration-300 ${isOpen ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}
      >
        {isOpen ? <div className="px-5 pb-5">{content}</div> : null}
      </div>
    </div>
  );
};
