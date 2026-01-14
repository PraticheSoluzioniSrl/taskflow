'use client';

import { useTaskStore } from '@/lib/store';
import { useSession } from 'next-auth/react';
import {
  Menu,
  Search,
  LayoutList,
  Calendar,
  Kanban,
  Plus,
  Bell,
  User,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

interface HeaderProps {
  onAddTask: () => void;
}

export default function Header({ onAddTask }: HeaderProps) {
  const {
    viewMode,
    setViewMode,
    filters,
    setFilters,
    toggleSidebar,
    sidebarOpen,
  } = useTaskStore();
  const { data: session } = useSession();

  const [searchFocused, setSearchFocused] = useState(false);

  const viewOptions = [
    { id: 'list', icon: LayoutList, label: 'Lista' },
    { id: 'calendar', icon: Calendar, label: 'Calendario' },
    { id: 'kanban', icon: Kanban, label: 'Kanban' },
  ] as const;

  return (
    <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/50">
      <div className="flex items-center justify-between gap-4 px-4 py-3">
        {/* Left section */}
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="btn-icon lg:hidden"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Search */}
          <div
            className={cn(
              'relative flex items-center transition-all duration-200',
              searchFocused ? 'w-64 sm:w-80' : 'w-40 sm:w-64'
            )}
          >
            <Search className="absolute left-3 w-4 h-4 text-slate-500" />
            <input
              type="text"
              placeholder="Cerca task..."
              value={filters.searchQuery}
              onChange={(e) => setFilters({ searchQuery: e.target.value })}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="input-base pl-10 pr-10"
            />
            {filters.searchQuery && (
              <button
                onClick={() => setFilters({ searchQuery: '' })}
                className="absolute right-3 p-1 hover:bg-slate-700 rounded"
              >
                <X className="w-3 h-3 text-slate-400" />
              </button>
            )}
          </div>
        </div>

        {/* Center - View Toggle */}
        <div className="hidden md:flex items-center gap-1 p-1 bg-slate-900/60 rounded-lg border border-slate-800/50">
          {viewOptions.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => setViewMode(option.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md transition-all duration-200',
                  viewMode === option.id
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{option.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <button onClick={onAddTask} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Nuovo Task</span>
          </button>

          <button className="btn-icon relative">
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-blue-500 rounded-full" />
          </button>

          <button className="btn-icon">
            {session?.user?.image ? (
              <img
                src={session.user.image}
                alt={session.user.name || 'User'}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </button>
          {session?.user?.name && (
            <span className="hidden sm:inline text-sm text-slate-300">
              {session.user.name}
            </span>
          )}
        </div>
      </div>

      {/* Mobile View Toggle */}
      <div className="md:hidden flex items-center gap-1 px-4 pb-3">
        {viewOptions.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.id}
              onClick={() => setViewMode(option.id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
                viewMode === option.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-900/60 text-slate-400'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{option.label}</span>
            </button>
          );
        })}
      </div>
    </header>
  );
}
