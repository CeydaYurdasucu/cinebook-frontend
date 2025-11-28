import type { ReactNode } from "react";

interface Tab {
  id: string;
  label: string;
  count?: number;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

export function Tabs({ tabs, activeTab, onTabChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`px-6 py-4 transition-all whitespace-nowrap ${
            activeTab === tab.id
              ? "text-[#3DD9B4] border-b-2 border-[#3DD9B4]"
              : "text-gray-400 hover:text-white"
          }`}
        >
          {tab.label}
          {tab.count !== undefined && (
            <span className="text-gray-600"> ({tab.count})</span>
          )}
        </button>
      ))}
    </div>
  );
}

interface TabContentProps {
  children: ReactNode;
}

export function TabContent({ children }: TabContentProps) {
  return <div className="py-6">{children}</div>;
}
