import React, { useState, useEffect } from 'react';
import { AppIcon } from './AppIcon';
import { AppID, WindowInstance } from '../types';
import { Wifi, Volume2, Search, Battery, Command } from 'lucide-react';

interface TaskbarProps {
  openWindows: WindowInstance[];
  activeWindowId: AppID | null;
  onStartClick: () => void;
  isStartOpen: boolean;
  onTaskbarIconClick: (id: AppID) => void;
  isDarkTheme: boolean;
  pinnedAppIds: AppID[];
  onTogglePin: (id: AppID) => void;
  isTaskbarHidden?: boolean;
  isActionCenterOpen?: boolean;
  onToggleActionCenter?: () => void;
  notificationCount?: number;
}

export const Taskbar: React.FC<TaskbarProps> = ({
  openWindows,
  activeWindowId,
  onStartClick,
  isStartOpen,
  onTaskbarIconClick,
  isDarkTheme,
  pinnedAppIds,
  onTogglePin,
  isTaskbarHidden = false,
  isActionCenterOpen = false,
  onToggleActionCenter,
  notificationCount = 0,
}) => {
  const [time, setTime] = useState<Date>(new Date());
  const [contextMenu, setContextMenu] = useState<{ appId: AppID; x: number; y: number } | null>(null);
  const touchTimerRef = React.useRef<NodeJS.Timeout | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const activeUnpinnedApps = openWindows.filter(
    (w) => w.isOpen && !pinnedAppIds.includes(w.id)
  );

  const taskbarAppIds = [...pinnedAppIds, ...activeUnpinnedApps.map((w) => w.id)];

  // Manage rendering state for unpinned apps to allow unmounting animations
  const [renderedApps, setRenderedApps] = useState<Array<{ id: AppID; isExiting: boolean }>>([]);
  const [mountedAppIds, setMountedAppIds] = useState<AppID[]>([]);

  useEffect(() => {
    setRenderedApps((prev) => {
      const next = [...prev];
      
      // Add pinned apps if not already present
      pinnedAppIds.forEach((id) => {
        if (!next.some((item) => item.id === id)) {
          next.push({ id, isExiting: false });
        }
      });

      // Add unpinned apps
      taskbarAppIds.forEach((id) => {
        const found = next.find((item) => item.id === id);
        if (!found) {
          next.push({ id, isExiting: false });
        } else if (found.isExiting) {
          found.isExiting = false;
        }
      });

      // Mark unpinned apps that were closed/removed as exiting
      next.forEach((item) => {
        if (!taskbarAppIds.includes(item.id) && !item.isExiting) {
          item.isExiting = true;
          setTimeout(() => {
            setRenderedApps((current) => current.filter((x) => x.id !== item.id));
          }, 300);
        }
      });

      return next;
    });
  }, [JSON.stringify(taskbarAppIds)]);

  useEffect(() => {
    const nonPinnedIds = renderedApps
      .filter((x) => !pinnedAppIds.includes(x.id) && !x.isExiting)
      .map((x) => x.id);
    const timer = setTimeout(() => {
      setMountedAppIds(nonPinnedIds);
    }, 30);
    return () => clearTimeout(timer);
  }, [renderedApps]);

  useEffect(() => {
    const closeMenu = () => setContextMenu(null);
    if (contextMenu) {
      window.addEventListener('click', closeMenu);
    }
    return () => window.removeEventListener('click', closeMenu);
  }, [contextMenu]);

  const handleIconContextMenu = (e: React.MouseEvent, appId: AppID) => {
    e.preventDefault();
    setContextMenu({ appId, x: e.clientX, y: e.clientY - 45 });
  };

  const handlePointerDown = (e: React.PointerEvent, appId: AppID) => {
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      touchTimerRef.current = setTimeout(() => {
        setContextMenu({ appId, x: e.clientX, y: e.clientY - 45 });
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 600);
    }
  };

  const handlePointerUpOrLeave = () => {
    if (touchTimerRef.current) {
      clearTimeout(touchTimerRef.current);
      touchTimerRef.current = null;
    }
  };

  const appMeta: Record<AppID, { icon: string; name: string }> = {
    browser: { icon: 'browser', name: 'Firefox' },
    notepad: { icon: 'notepad', name: 'Notepad' },
    calculator: { icon: 'calculator', name: 'Calculator' },
    paint: { icon: 'paint', name: 'Paint' },
    files: { icon: 'files', name: 'Files' },
    terminal: { icon: 'terminal', name: 'Terminal' },
    excel: { icon: 'excel', name: 'Excel' },
    word: { icon: 'word', name: 'Word' },
    powerpoint: { icon: 'powerpoint', name: 'PowerPoint' },
    settings: { icon: 'settings', name: 'Settings' },
    minecraft: { icon: 'minecraft', name: 'nooncraft 3D' },
    videoeditor: { icon: 'videoeditor', name: 'nooncut Video' },
    dotsandboxes: { icon: 'dotsandboxes', name: 'Dots & Boxes' },
    blokus: { icon: 'blokus', name: 'Blokus' },
    wetalks: { icon: 'wetalks', name: 'We talks Chat' },
    recycle: { icon: 'recycle', name: 'Recycle Bin' },
    nmap: { icon: 'nmap', name: 'Nmap Practice' },
    flightsim: { icon: 'flightsim', name: '3D Flight Simulator' },
    chameleon: { icon: 'chameleon', name: 'Chameleon Game' },
  };

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 h-12 flex items-center justify-between px-3 select-none z-50 border-t transition-all duration-300 ease-in-out ${
        isDarkTheme
          ? 'glass-dark border-white/5 text-gray-200'
          : 'glass border-gray-200/50 text-gray-800'
      }`}
      style={{
        transform: isTaskbarHidden ? 'translateY(100%)' : 'translateY(0)',
      }}
      id="desktop-taskbar"
    >
      {/* Taskbar Left: Mock Search pill */}
      <div className="flex items-center gap-1 min-w-[120px] sm:min-w-[150px]">
        <div
          onClick={onStartClick}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer border transition-colors ${
            isDarkTheme
              ? 'bg-white/5 border-white/5 hover:bg-white/10'
              : 'bg-black/5 border-black/5 hover:bg-black/10'
          }`}
          id="taskbar-btn-search-pill"
        >
          <Search className="w-3.5 h-3.5 text-blue-500" />
          <span className="hidden md:inline font-sans text-gray-400">Search...</span>
        </div>
      </div>

      {/* Taskbar Center: App Launchers & Start Button */}
      <div className="flex items-center gap-1.5 justify-center flex-1">
        {/* noob os Start Button */}
        <div
          onClick={onStartClick}
          className={`p-2 rounded-lg cursor-pointer transition-all duration-150 active:scale-95 ${
            isStartOpen
              ? isDarkTheme ? 'bg-white/10 ring-1 ring-white/5' : 'bg-black/10'
              : isDarkTheme ? 'hover:bg-white/5' : 'hover:bg-black/5'
          }`}
          id="taskbar-btn-start"
        >
          <AppIcon id="start" size={22} />
        </div>

        {/* Separator */}
        <div className={`h-6 w-[1px] mx-1 shrink-0 ${isDarkTheme ? 'bg-white/10' : 'bg-black/10'}`} />

        {/* App Icons List */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[calc(100vw-300px)]">
          {renderedApps.map((item) => {
            const appId = item.id;
            const isExiting = item.isExiting;
            const isPinned = pinnedAppIds.includes(appId);
            const isFullyMounted = isPinned || mountedAppIds.includes(appId);

            const meta = appMeta[appId] || { icon: appId, name: appId };
            const win = openWindows.find((w) => w.id === appId);
            const isOpen = win?.isOpen;
            const isActive = activeWindowId === appId && !win?.isMinimized;

            return (
              <div
                key={appId}
                onClick={() => !isExiting && onTaskbarIconClick(appId)}
                onContextMenu={(e) => !isExiting && handleIconContextMenu(e, appId)}
                onPointerDown={(e) => !isExiting && handlePointerDown(e, appId)}
                onPointerUp={handlePointerUpOrLeave}
                onPointerLeave={handlePointerUpOrLeave}
                className={`transition-all duration-300 ease-out flex items-center justify-center overflow-hidden ${
                  !isPinned
                    ? (!isExiting && isFullyMounted)
                      ? 'max-w-[44px] opacity-100 scale-100'
                      : 'max-w-0 opacity-0 scale-50 pointer-events-none'
                    : 'max-w-[44px] opacity-100 scale-100'
                }`}
              >
                <div
                  className={`relative flex flex-col items-center justify-center p-2 rounded-lg cursor-pointer transition-all duration-150 active:scale-95 group ${
                    isActive
                      ? isDarkTheme ? 'bg-white/10' : 'bg-black/10'
                      : isDarkTheme ? 'hover:bg-white/5' : 'hover:bg-black/5'
                  }`}
                  title={meta.name}
                  id={`taskbar-icon-${appId}`}
                >
                  <AppIcon id={meta.icon} size={24} />

                  {/* Running Indicators (noob os line bar underneath) */}
                  {isOpen && (
                    <span
                      className={`absolute bottom-0.5 h-1 rounded-full transition-all duration-200 ${
                        isActive
                          ? 'w-4 bg-blue-500' // Brighter, wider bar for current active window
                          : 'w-1.5 bg-gray-400 group-hover:w-3.5' // Small bar for inactive background windows
                      }`}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Taskbar Right: System Tray (Wifi, Volume, Clock) */}
      <div className="flex items-center gap-2 min-w-[150px] justify-end">
        {/* Wifi, Sound & battery indicators */}
        <div className="flex items-center gap-2 hover:bg-white/5 p-1 px-2 rounded-md cursor-pointer text-xs select-none">
          <Wifi className="w-3.5 h-3.5 opacity-80" />
          <Volume2 className="w-3.5 h-3.5 opacity-80" />
          <Battery className="w-3.5 h-3.5 opacity-80" />
        </div>

        {/* Real-time System Clock */}
        <div
          onClick={onToggleActionCenter}
          className={`flex flex-col text-right hover:bg-white/5 p-1 px-2 rounded-md cursor-pointer font-sans leading-tight text-[11px] select-none ${
            isActionCenterOpen ? (isDarkTheme ? 'bg-white/10' : 'bg-black/10') : ''
          }`}
          title={time.toLocaleDateString() + ' - クリックで通知とカレンダーを表示'}
          id="taskbar-system-clock"
        >
          <span className="font-semibold tracking-wide">
            {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="text-[9px] text-gray-400">
            {time.toLocaleDateString([], { month: '2-digit', day: '2-digit', year: 'numeric' })}
          </span>
        </div>

        {/* Windows 10 Action Center Button */}
        <button
          onClick={onToggleActionCenter}
          className={`p-1.5 rounded-md hover:bg-white/5 transition-colors cursor-pointer text-inherit flex items-center justify-center relative ${
            isActionCenterOpen ? (isDarkTheme ? 'bg-white/10' : 'bg-black/10') : ''
          }`}
          title={`アクション センター (通知とカレンダー)${notificationCount > 0 ? ` - ${notificationCount}件の通知` : ''}`}
          id="taskbar-btn-action-center"
        >
          <svg
            viewBox="0 0 24 24"
            width="15"
            height="15"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-80 hover:opacity-100"
          >
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
          </svg>
          {notificationCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 bg-red-600 text-white text-[8px] font-bold h-3.5 min-w-[14px] px-0.5 rounded-full flex items-center justify-center border border-white dark:border-zinc-950 shadow-md">
              {notificationCount}
            </span>
          )}
        </button>
      </div>

      {/* Taskbar Floating Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 99999,
          }}
          className="bg-white text-gray-800 rounded-lg shadow-xl border border-gray-200/50 py-1.5 min-w-[140px] text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              const appId = contextMenu.appId;
              setContextMenu(null);
              onTogglePin(appId);
            }}
            className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition-colors text-gray-700"
          >
            <span className="text-gray-400">{pinnedAppIds.includes(contextMenu.appId) ? '❌' : '📌'}</span>
            <span>{pinnedAppIds.includes(contextMenu.appId) ? 'ピン留めを外す' : 'タスクバーにピン留めする'}</span>
          </button>
        </div>
      )}
    </div>
  );
};
