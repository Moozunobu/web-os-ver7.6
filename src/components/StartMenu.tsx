import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Power, Settings, User, LogOut, RefreshCw, HelpCircle, RotateCw } from 'lucide-react';
import { AppIcon } from './AppIcon';
import { AppID } from '../types';

interface StartMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isDarkTheme: boolean;
  onLaunchApp: (id: AppID) => void;
  onResetSystem: () => void;
  onRestartSystem?: () => void;
  onShutdownSystem?: () => void;
}

export const StartMenu: React.FC<StartMenuProps> = ({
  isOpen,
  onClose,
  isDarkTheme,
  onLaunchApp,
  onResetSystem,
  onRestartSystem,
  onShutdownSystem,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const appsList: Array<{ id: AppID; title: string; icon: string; desc: string }> = [
    { id: 'noobstore', title: 'Noob Store', icon: 'noobstore', desc: 'Download and install custom web HTML apps' },
    { id: 'files', title: 'File Explorer', icon: 'files', desc: 'Virtual directory folders' },
    { id: 'browser', title: 'Firefox Browser', icon: 'browser', desc: 'Browse simulated internet pages' },
    { id: 'notepad', title: 'Notepad', icon: 'notepad', desc: 'Create and open plain text memos' },
    { id: 'calculator', title: 'Calculator', icon: 'calculator', desc: 'Grid-based calculation' },
    { id: 'paint', title: 'Paint Tool', icon: 'paint', desc: 'Draw and export HTML5 drawings' },
    { id: 'terminal', title: 'Command Prompt', icon: 'terminal', desc: 'Text-based command console' },
    { id: 'excel', title: 'Excel Sheets', icon: 'excel', desc: '6x12 cell formula sheet' },
    { id: 'word', title: 'Word Editor', icon: 'word', desc: 'Microsoft Word style rich document editor' },
    { id: 'powerpoint', title: 'PowerPoint', icon: 'powerpoint', desc: 'Microsoft PowerPoint style presentation creator' },
    { id: 'minecraft', title: 'nooncraft 3D', icon: 'minecraft', desc: 'A highly optimized, lightweight 3D Minecraft clone' },
    { id: 'videoeditor', title: 'nooncut Video', icon: 'videoeditor', desc: 'Premium multi-track video editing canvas suite' },
    { id: 'dotsandboxes', title: 'Dots & Boxes', icon: 'dotsandboxes', desc: 'Classic strategic wire-grid point capture' },
    { id: 'blokus', title: 'Blokus', icon: 'blokus', desc: 'A strategic territory capture tile connection game' },
    { id: 'settings', title: 'Settings', icon: 'settings', desc: 'Manage wallpaper and theme configs' },
    { id: 'recycle', title: 'Recycle Bin', icon: 'recycle', desc: 'Recycle deleted drafts or files' },
    { id: 'wetalks', title: 'We talks Chat', icon: 'wetalks', desc: 'Secure, beautiful LINE-style group/room messenger' },
    { id: 'tetris', title: 'Neo Tetris', icon: 'tetris', desc: 'Classical block connection game with single player, AI battles, and online PvP matchmodes' },
    { id: 'sprout', title: 'Sprout Studio', icon: 'sprout', desc: 'IDE for Sprout language (.sp): autocomplete, save/load, run CUI code' },
  ];

  const filteredApps = appsList.filter((app) =>
    app.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAppClick = (appId: AppID) => {
    onLaunchApp(appId);
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop overlay to close when clicking outside */}
          <div
            onClick={onClose}
            className="fixed inset-0 z-[9998]"
            id="start-menu-backdrop"
          />

          {/* Start Menu Main Card Container */}
          <motion.div
            initial={{ opacity: 0, y: 150, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 150, scale: 0.95 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className={`fixed bottom-14 left-1/2 -translate-x-1/2 w-[520px] max-w-[95vw] h-[580px] z-[9999] rounded-2xl shadow-2xl overflow-hidden flex flex-col border transition-colors duration-200 select-none ${
              isDarkTheme
                ? 'acrylic-card-dark text-[#f3f4f6]'
                : 'acrylic-card text-gray-800'
            }`}
            id="start-menu-panel"
          >
            {/* Search Input bar */}
            <div className="p-6 pb-4">
              <div
                className={`flex items-center rounded-full px-4.5 py-2.5 border transition-all ${
                  isDarkTheme
                    ? 'bg-black/30 border-white/10 focus-within:bg-black/55 focus-within:ring-2 focus-within:ring-blue-500/80 focus-within:border-blue-500'
                    : 'bg-white border-gray-200/80 hover:shadow-sm focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500'
                }`}
              >
                <Search className="w-4 h-4 text-gray-400 mr-2.5 shrink-0" />
                <input
                  type="text"
                  placeholder="Type to search apps, files, or settings..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-transparent border-none outline-none text-xs font-sans text-inherit"
                  id="start-menu-search"
                />
              </div>
            </div>

            {/* Apps Pinned Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold tracking-wider uppercase opacity-85">
                  {searchQuery ? 'Search Results' : 'Pinned Applications'}
                </span>
                {!searchQuery && (
                  <span className="text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200 px-2.5 py-0.5 rounded-full font-bold">
                    All Apps
                  </span>
                )}
              </div>

              {filteredApps.length === 0 ? (
                <div className="text-center py-24 text-gray-400 text-xs">
                  <HelpCircle className="w-10 h-10 stroke-[1.25] mx-auto mb-2 opacity-50" />
                  No virtual applications found for "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-y-6 gap-x-2">
                  {filteredApps.map((app) => (
                    <div
                      key={app.id}
                      onClick={() => handleAppClick(app.id)}
                      className={`flex flex-col items-center text-center p-3.5 rounded-xl cursor-pointer transition-all duration-150 border border-transparent ${
                        isDarkTheme
                          ? 'hover:bg-white/5 hover:border-white/5 active:scale-95'
                          : 'hover:bg-gray-100/80 hover:border-gray-200/50 active:scale-95 shadow-2xs hover:shadow-sm'
                      }`}
                      id={`start-app-shortcut-${app.id}`}
                    >
                      <AppIcon id={app.icon} size={40} className="mb-2" />
                      <span className="text-xs font-semibold leading-tight truncate w-full px-1">
                        {app.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Start Menu Bottom Footer Bar */}
            <div
              className={`p-5 px-6 border-t flex items-center justify-between text-xs select-none ${
                isDarkTheme ? 'bg-black/40 border-white/5' : 'bg-gray-50/50 border-gray-200/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-bold text-sm shadow-inner shadow-black/10">
                  <User className="w-4.5 h-4.5 text-white/90" />
                </div>
                <div className="text-left leading-tight">
                  <p className="font-bold">noob os User</p>
                  <p className="text-[10px] text-gray-400">Offline Profile</p>
                </div>
              </div>

              {/* Power Controls */}
              <div className="flex items-center gap-1.5">
                {/* Format Storage & Restart */}
                <button
                  onClick={() => {
                    if (confirm('Format WebOS localstorage values and restart the platform?')) {
                      onClose();
                      onResetSystem();
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors relative group ${
                    isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                  }`}
                  title="Format System"
                  id="start-power-reset"
                >
                  <RefreshCw className="w-4 h-4 text-red-500 animate-pulse" />
                  <span className="absolute bottom-8 right-0 hidden group-hover:block bg-black text-white text-[9px] py-1 px-1.5 rounded truncate w-24 text-center z-50">
                    Format Storage
                  </span>
                </button>

                {/* Soft Restart (Play boot animation) */}
                <button
                  onClick={() => {
                    onClose();
                    if (onRestartSystem) {
                      onRestartSystem();
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors relative group ${
                    isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                  }`}
                  title="再起動 (Restart)"
                  id="start-power-restart"
                >
                  <RotateCw className="w-4 h-4 text-emerald-500 hover:rotate-180 transition-transform duration-300" />
                  <span className="absolute bottom-8 right-0 hidden group-hover:block bg-black text-white text-[9px] py-1 px-1.5 rounded truncate w-24 text-center z-50 font-sans">
                    再起動 (Restart)
                  </span>
                </button>

                {/* Shutdown / Power Off */}
                <button
                  onClick={() => {
                    onClose();
                    if (onShutdownSystem) {
                      onShutdownSystem();
                    } else {
                      alert('Goodbye! (Simulated logout. Double click desktop icons to restore apps)');
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors relative group ${
                    isDarkTheme ? 'hover:bg-white/10' : 'hover:bg-gray-200'
                  }`}
                  title="シャットダウン (Shutdown)"
                  id="start-power-lock"
                >
                  <Power className="w-4 h-4 text-blue-500" />
                  <span className="absolute bottom-8 right-0 hidden group-hover:block bg-black text-white text-[9px] py-1 px-1.5 rounded truncate w-28 text-center z-50 font-sans">
                    シャットダウン
                  </span>
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
