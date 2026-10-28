import React from 'react';
import {
  Calendar,
  CalendarDays,
  CalendarCheck,
  History,
  MessageSquare,
  SlidersHorizontal,
  FileText,
  Bell,
  Settings,
  X,
} from 'lucide-react';
import { ScreenId } from '../../types/elvi';
import { useElvi } from '../../context/ElviContext';

interface SidebarGroup {
  groupLabel: 'OVERVIEW' | 'TRACKING' | 'CARE & INSIGHTS' | 'PREFERENCES';
  items: {
    id: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[];
}

export const SIDEBAR_NAVIGATION: SidebarGroup[] = [
  {
    groupLabel: 'OVERVIEW',
    items: [{ id: 'today', label: 'Today', icon: Calendar }],
  },
  {
    groupLabel: 'TRACKING',
    items: [
      { id: 'cycle-tracker', label: 'Cycle Tracker', icon: CalendarDays },
      { id: 'daily-check-in', label: 'Daily Check-in', icon: CalendarCheck },
      { id: 'health-timeline', label: 'Health Timeline', icon: History },
    ],
  },
  {
    groupLabel: 'CARE & INSIGHTS',
    items: [
      { id: 'ai-companion', label: 'AI Companion', icon: MessageSquare },
      { id: 'pcos-care', label: 'PCOS/PCOD Care', icon: SlidersHorizontal },
      { id: 'reports', label: 'Reports', icon: FileText },
    ],
  },
  {
    groupLabel: 'PREFERENCES',
    items: [
      { id: 'reminders', label: 'Reminders', icon: Bell },
      { id: 'settings', label: 'Settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, onCloseMobile }) => {
  const { activeScreen, navigateTo, userProfile, currentUser } = useElvi();

  const handleSelect = (id: ScreenId) => {
    navigateTo(id);
    onCloseMobile();
  };

  const sidebarContent = (
    <div className="flex flex-col h-full w-[248px] bg-[#F3F3E7] border-r border-[#D9A2B5]/45 text-[#30232A] select-none">
      {/* Master Brand Block */}
      <div className="px-6 pt-6 pb-5 border-b border-[#D9A2B5]/40 flex items-start justify-between">
        <button
          type="button"
          onClick={() => handleSelect('today')}
          className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#890149]/40 rounded"
        >
          <div className="font-serif-elvi text-[26px] leading-none text-[#890149] tracking-tight font-normal">
            ELVI
          </div>
          <div className="text-[12px] leading-[16px] text-[#30232A]/70 mt-1.5 font-normal">
            Health Companion
          </div>
        </button>

        {mobileOpen && (
          <button
            type="button"
            onClick={onCloseMobile}
            aria-label="Close navigation menu"
            className="lg:hidden p-1.5 rounded-md text-[#30232A]/75 hover:bg-[#EADCE0]/60 hover:text-[#30232A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#890149]"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation Groups */}
      <nav aria-label="Main Navigation" className="flex-1 overflow-y-auto px-3.5 py-5 space-y-6">
        {SIDEBAR_NAVIGATION.map((group) => (
          <div key={group.groupLabel}>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-[0.08em] text-[#890149]/85">
              {group.groupLabel}
            </div>
            <ul className="space-y-1">
              {group.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeScreen === item.id;
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => handleSelect(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[8px] text-[14px] leading-[18px] transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#890149]/50 ${
                        isActive
                          ? 'bg-[#EADCE0] text-[#890149] font-semibold'
                          : 'text-[#30232A]/85 hover:bg-[#EADCE0]/45 hover:text-[#30232A] font-normal'
                      }`}
                    >
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 ${
                          isActive ? 'text-[#890149] stroke-[2]' : 'text-[#30232A]/75 stroke-[1.75]'
                        }`}
                      />
                      <span className="truncate">{item.label}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Master Account Footer */}
      <div className="border-t border-[#D9A2B5]/40 px-5 py-4">
        <button
          type="button"
          onClick={() => handleSelect(currentUser ? 'settings' : 'auth')}
          className="w-full flex items-center gap-3 text-left rounded-[8px] py-1 px-1 hover:bg-[#EADCE0]/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#890149]/50"
        >
          <div className="w-9 h-9 rounded-full bg-[#890149] text-[#F3F3E7] flex items-center justify-center font-semibold text-[14px] shrink-0">
            {userProfile.initials}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[14px] font-semibold text-[#30232A] leading-tight truncate">
              {userProfile.name}
            </div>
            <div className="text-[11px] text-[#890149] font-medium leading-tight truncate mt-0.5">
              {currentUser ? 'Signed In' : 'Sign In / Register'}
            </div>
          </div>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:block lg:fixed lg:inset-y-0 lg:left-0 lg:w-[248px] lg:z-30">
        {sidebarContent}
      </aside>

      {/* Mobile Accessible Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex" role="dialog" aria-modal="true" aria-label="Navigation menu">
          <div
            className="fixed inset-0 bg-[#30232A]/40 transition-opacity"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <div className="relative z-10 flex-shrink-0">{sidebarContent}</div>
        </div>
      )}
    </>
  );
};
