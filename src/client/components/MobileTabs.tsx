type Tab = {
  id: string;
  label: string;
};

type MobileTabsProps = {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
};

export const MobileTabs = ({ tabs, activeTab, onChange }: MobileTabsProps) => {
  return (
    <div className="sticky top-3 z-20 flex items-center gap-2 overflow-x-auto bg-zinc-950/90 border border-zinc-800 rounded-xl p-2 backdrop-blur sm:static sm:bg-zinc-900/80 sm:rounded-2xl">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-semibold transition sm:px-4 sm:py-2 sm:text-sm sm:rounded-xl ${
              isActive
                ? 'bg-blue-500 text-white'
                : 'bg-transparent text-zinc-300 hover:text-white hover:bg-zinc-800'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
};
