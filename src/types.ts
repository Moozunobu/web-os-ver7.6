export type AppID =
  | 'browser'
  | 'notepad'
  | 'calculator'
  | 'paint'
  | 'files'
  | 'terminal'
  | 'excel'
  | 'settings'
  | 'word'
  | 'powerpoint'
  | 'recycle'
  | 'minecraft'
  | 'videoeditor'
  | 'dotsandboxes'
  | 'blokus'
  | 'wetalks'
  | 'nmap'
  | 'flightsim'
  | 'chameleon'
  | 'noobstore'
  | 'sprout'
  | string;

export interface WindowInstance {
  id: AppID;
  title: string;
  icon: string; // Icon name or SVG identifier
  isOpen: boolean;
  isMinimized: boolean;
  isMaximized: boolean;
  x: number;
  y: number;
  width: number;
  height: number;
  prevX: number;
  prevY: number;
  prevWidth: number;
  prevHeight: number;
  zIndex: number;
  minWidth?: number;
  minHeight?: number;
}

export interface VirtualFile {
  name: string;
  path: string; // e.g. "Desktop", "Documents", "Pictures"
  content: string;
  type: 'txt' | 'sheet' | 'image';
  createdAt: string;
}

export interface SettingsState {
  wallpaper: string;
  isDarkTheme: boolean; // Toggles light/dark taskbar & start menu
  isToggleTaskbarWithQ: boolean; // Toggle taskbar visibility with Q key
}

export interface DesktopIconDef {
  id: AppID;
  title: string;
  icon: string;
  type: 'app' | 'file';
  fileName?: string; // If this opens a specific file
}

export interface DesktopItem {
  id: string;
  appId?: AppID;
  title: string;
  icon: string;
  type: 'app' | 'file' | 'recycle';
  x: number;
  y: number;
  fileName?: string;
  isDeleted?: boolean;
}

export const WALLPAPERS = [
  {
    id: 'bloom',
    name: 'noob os Bloom (Default)',
    url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&q=80',
  },
  {
    id: 'dark-aura',
    name: 'Dark Aura',
    url: 'https://images.unsplash.com/photo-1604871000636-074fa5117945?w=1200&q=80',
  },
  {
    id: 'sunset-glow',
    name: 'Sunset Glow',
    url: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=1200&q=80',
  },
];
