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
    <div className="hidden lg:flex items-center gap-2 bg-zinc-900/80 border border-zinc-800 rounded-2xl p-2">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition ${
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
