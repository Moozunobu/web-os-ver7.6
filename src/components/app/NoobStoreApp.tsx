import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Download, 
  Trash2, 
  Globe, 
  Sparkles, 
  Check, 
  Play, 
  AppWindow, 
  RefreshCw, 
  AlertTriangle, 
  ChevronRight, 
  Info,
  HelpCircle,
  ExternalLink
} from 'lucide-react';

interface InstalledApp {
  id: string;
  title: string;
  url: string;
  iconChar: string;
  installedAt: string;
}

const CURATED_APPS = [
  {
    id: 'curated-tetris',
    title: 'Tetris Web Classic',
    url: 'https://raw.githack.com/jakesgordon/javascript-tetris/master/index.html',
    desc: 'Pure HTML5/JS classic Tetris puzzle block game.',
    iconChar: '🎮',
    category: 'Game',
    developer: 'Jake Gordon'
  },
  {
    id: 'curated-pixel',
    title: 'Pixel Art Paint',
    url: 'https://raw.githack.com/mitchgavan/react-pixel-art/master/index.html',
    desc: 'Fun retro 8-bit style canvas drawing paint app.',
    iconChar: '🎨',
    category: 'Creative',
    developer: 'Mitch Gavan'
  },
  {
    id: 'curated-flappy',
    title: 'Floppy Bird',
    url: 'https://raw.githack.com/nebez/floppybird/master/index.html',
    desc: 'The addictive flapping bird challenge with audio and physics.',
    iconChar: '🐦',
    category: 'Game',
    developer: 'Nebez Briefkani'
  },
  {
    id: 'curated-calc',
    title: 'Interactive Calculator',
    url: 'https://raw.githack.com/hepting/calculator/master/index.html',
    desc: 'Sleek, responsive dark-mode pocket calculator.',
    iconChar: '📊',
    category: 'Utilities',
    developer: 'Hepting'
  },
  {
    id: 'curated-flexbox',
    title: 'Flexbox Froggy',
    url: 'https://flexboxfroggy.com/',
    desc: 'Learn CSS layout alignments by coding for cute frogs.',
    iconChar: '🐸',
    category: 'Education',
    developer: 'Codepip'
  },
  {
    id: 'curated-emoji',
    title: 'Emoji Finder Studio',
    url: 'https://emojifinder.com/',
    desc: 'Search, copy, and explore the entire Unicode emoji catalog.',
    iconChar: '🔍',
    category: 'Utilities',
    developer: 'EmojiFinder'
  }
];

const EMOJI_POOL = ['🌐', '🎮', '🎨', '📊', '🛠️', '📝', '📂', '💬', '🔔', '🎵', '🎥', '💡', '🔋', '🏆', '🍕', '🚀', '🔮', '🍀'];

export const NoobStoreApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'browse' | 'myapps'>('browse');
  const [urlInput, setUrlInput] = useState('');
  const [searchedUrl, setSearchedUrl] = useState<string | null>(null);
  const [appTitle, setAppTitle] = useState('');
  const [appIconChar, setAppIconChar] = useState('🌐');
  const [installedApps, setInstalledApps] = useState<InstalledApp[]>([]);
  const [showGithubHelp, setShowGithubHelp] = useState(false);

  // Load installed apps from localStorage
  useEffect(() => {
    const loadApps = () => {
      try {
        const stored = localStorage.getItem('noobstore_installed_apps');
        if (stored) {
          setInstalledApps(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Error loading installed apps:', e);
      }
    };
    loadApps();
    window.addEventListener('webos_desktop_items_changed', loadApps);
    return () => window.removeEventListener('webos_desktop_items_changed', loadApps);
  }, []);

  // Normalise URL input
  const handleSearch = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let trimmed = urlInput.trim();
    if (!trimmed) return;

    // Check for raw GitHub file and offer to convert to raw.githack
    if (trimmed.includes('github.com/') && trimmed.includes('/blob/')) {
      setShowGithubHelp(true);
      // Automatically construct the raw.githack.com version
      // e.g. https://github.com/user/repo/blob/main/index.html -> https://raw.githack.com/user/repo/main/index.html
      const parsedGithack = trimmed
        .replace('github.com', 'raw.githack.com')
        .replace('/blob/', '/');
      
      // Auto-suggest title based on repo or filename
      const urlParts = trimmed.split('/');
      const repoName = urlParts[4] || '';
      const fileName = urlParts[urlParts.length - 1] || 'Web App';
      const cleanTitle = repoName 
        ? repoName.charAt(0).toUpperCase() + repoName.slice(1) 
        : fileName.replace('.html', '');

      setSearchedUrl(parsedGithack);
      setAppTitle(cleanTitle);
      return;
    } else {
      setShowGithubHelp(false);
    }

    if (!/^https?:\/\//i.test(trimmed)) {
      trimmed = 'https://' + trimmed;
    }

    // Attempt to deduce a clean title from the domain/URL path
    try {
      const urlObj = new URL(trimmed);
      let deducedTitle = urlObj.hostname.replace('www.', '').split('.')[0];
      deducedTitle = deducedTitle.charAt(0).toUpperCase() + deducedTitle.slice(1);
      
      // If github pages, get the repo name instead
      if (urlObj.hostname.includes('github.io')) {
        const pathParts = urlObj.pathname.split('/').filter(Boolean);
        if (pathParts.length > 0) {
          deducedTitle = pathParts[0].charAt(0).toUpperCase() + pathParts[0].slice(1);
        }
      }
      setAppTitle(deducedTitle);
    } catch (_) {
      setAppTitle('Web App');
    }

    setSearchedUrl(trimmed);
  };

  const convertGithubUrl = () => {
    if (!urlInput) return;
    const parsedGithack = urlInput
      .trim()
      .replace('github.com', 'raw.githack.com')
      .replace('/blob/', '/');
    setUrlInput(parsedGithack);
    setSearchedUrl(parsedGithack);
    setShowGithubHelp(false);
  };

  const handleInstall = (title: string, url: string, iconChar: string) => {
    if (!title || !url) return;

    // 1. Load latest apps list
    let latestInstalled: InstalledApp[] = [];
    try {
      const stored = localStorage.getItem('noobstore_installed_apps');
      if (stored) latestInstalled = JSON.parse(stored);
    } catch (e) {}

    // Check if URL is already installed
    if (latestInstalled.some(a => a.url === url)) {
      alert('このアプリのURLは既にインストールされています。');
      return;
    }

    const newId = 'custom-app-' + Date.now();
    const newApp: InstalledApp = {
      id: newId,
      title: title.trim(),
      url: url.trim(),
      iconChar: iconChar,
      installedAt: new Date().toISOString()
    };

    latestInstalled.push(newApp);
    localStorage.setItem('noobstore_installed_apps', JSON.stringify(latestInstalled));
    setInstalledApps(latestInstalled);

    // 2. Load and update desktop items
    let desktopItems: any[] = [];
    try {
      const stored = localStorage.getItem('webos_desktop_items_v2');
      if (stored) desktopItems = JSON.parse(stored);
    } catch (e) {}

    // Find non-overlapping position
    const colWidth = 110;
    const rowHeight = 100;
    const startX = 244;
    const startY = 24;
    
    let nextX = startX;
    let nextY = startY;
    
    const isOccupied = (x: number, y: number) => {
      return desktopItems.some((item: any) => !item.isDeleted && Math.abs(item.x - x) < 50 && Math.abs(item.y - y) < 50);
    };

    let foundSlot = false;
    for (let col = 2; col < 10; col++) {
      for (let row = 0; row < 6; row++) {
        const x = 24 + col * colWidth;
        const y = 24 + row * rowHeight;
        if (!isOccupied(x, y)) {
          nextX = x;
          nextY = y;
          foundSlot = true;
          break;
        }
      }
      if (foundSlot) break;
    }

    const newDesktopItem = {
      id: newId,
      appId: newId,
      title: title.trim(),
      icon: 'custom-app-' + iconChar,
      type: 'app',
      x: nextX,
      y: nextY
    };

    desktopItems.push(newDesktopItem);
    localStorage.setItem('webos_desktop_items_v2', JSON.stringify(desktopItems));

    // Notify OS Desktop layer to load new items
    window.dispatchEvent(new Event('webos_desktop_items_changed'));

    // Trigger WeTalks chime sound + system-wide fluent notification!
    try {
      window.postMessage({
        type: 'WETALKS_NEW_MESSAGE',
        payload: {
          sender: 'Noob Store',
          text: `「${title}」がインストールされました！デスクトップから起動できます。`
        }
      }, '*');
    } catch (e) {}

    // Reset search state
    setSearchedUrl(null);
    setUrlInput('');
    setActiveTab('myapps');
  };

  const handleUninstall = (appId: string) => {
    if (!confirm('このアプリをアンインストールしますか？')) return;

    // 1. Remove from registry
    const updatedApps = installedApps.filter(a => a.id !== appId);
    localStorage.setItem('noobstore_installed_apps', JSON.stringify(updatedApps));
    setInstalledApps(updatedApps);

    // 2. Remove from desktop items
    let desktopItems: any[] = [];
    try {
      const stored = localStorage.getItem('webos_desktop_items_v2');
      if (stored) desktopItems = JSON.parse(stored);
    } catch (e) {}

    const updatedDesktop = desktopItems.filter((item: any) => item.id !== appId);
    localStorage.setItem('webos_desktop_items_v2', JSON.stringify(updatedDesktop));

    // Notify Desktop update
    window.dispatchEvent(new Event('webos_desktop_items_changed'));
  };

  const handleLaunchAppFromStore = (appId: string) => {
    // We can simulate a double click on the desktop icon by triggering an event or standard message!
    // Simply dispatch a custom event that App.tsx can intercept, or let App.tsx know
    const customEvent = new CustomEvent('webos_launch_custom_app', { detail: { appId } });
    window.dispatchEvent(customEvent);
  };

  const handleCuratedClick = (app: typeof CURATED_APPS[0]) => {
    setUrlInput(app.url);
    setSearchedUrl(app.url);
    setAppTitle(app.title);
    setAppIconChar(app.iconChar);
  };

  return (
    <div className="w-full h-full flex flex-col bg-zinc-950 text-zinc-100 select-none overflow-hidden" id="noob-store-wrapper">
      {/* Fluent Sub-Header Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-3.5 bg-zinc-900/60 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 flex items-center justify-center shadow-md">
            <span className="text-lg font-bold text-white">N</span>
          </div>
          <div>
            <h1 className="text-sm font-bold tracking-tight">Noob Store</h1>
            <p className="text-[10px] text-zinc-400">Expand your WebOS Workspace</p>
          </div>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 bg-zinc-950/60 p-1 rounded-lg border border-zinc-800/50">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === 'browse'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
            }`}
            id="store-tab-browse"
          >
            <Sparkles className="w-3.5 h-3.5" />
            ストア (ブラウズ)
          </button>
          <button
            onClick={() => setActiveTab('myapps')}
            className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all duration-150 flex items-center gap-1.5 ${
              activeTab === 'myapps'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/30'
            }`}
            id="store-tab-myapps"
          >
            <AppWindow className="w-3.5 h-3.5" />
            インストール済み
            {installedApps.length > 0 && (
              <span className="ml-1 px-1.5 py-0.5 bg-zinc-700 text-zinc-300 text-[9px] rounded-full font-bold">
                {installedApps.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Main Body Layout */}
      <div className="flex-1 flex overflow-hidden">
        {activeTab === 'browse' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Search result view WITH PREVIEW ON THE LEFT */}
            {searchedUrl ? (
              <div className="flex-1 flex overflow-hidden bg-zinc-900/10">
                {/* LEFT SIDE: PREVIEW CONTAINER */}
                <div className="w-3/5 border-r border-zinc-800/80 flex flex-col h-full bg-zinc-950">
                  <div className="px-4 py-2 border-b border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 animate-pulse" />
                      <span className="text-[10px] font-bold text-zinc-400 tracking-wider uppercase">Live Preview Screen</span>
                    </div>
                    <div className="text-[10px] text-zinc-500 truncate max-w-xs font-mono">{searchedUrl}</div>
                  </div>
                  
                  {/* Iframe View */}
                  <div className="flex-1 bg-white relative">
                    <iframe
                      src={searchedUrl}
                      title="Store Preview Frame"
                      className="w-full h-full border-none"
                      referrerPolicy="no-referrer"
                      sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
                    />
                  </div>
                </div>

                {/* RIGHT SIDE: INSTALLATION CONTROLS */}
                <div className="w-2/5 p-6 flex flex-col justify-between overflow-y-auto h-full bg-zinc-900/30">
                  <div className="flex flex-col gap-5">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-400">App Setup & Metadata</h2>
                      <button 
                        onClick={() => setSearchedUrl(null)}
                        className="text-xs text-zinc-400 hover:text-white hover:underline flex items-center gap-1"
                      >
                        検索をキャンセル &times;
                      </button>
                    </div>

                    {/* App details card */}
                    <div className="bg-zinc-900/70 border border-zinc-800/80 rounded-xl p-4 flex flex-col gap-4">
                      {/* Name input */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">App Name (名前)</label>
                        <input
                          type="text"
                          value={appTitle}
                          onChange={(e) => setAppTitle(e.target.value)}
                          placeholder="App Title..."
                          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 outline-none focus:border-amber-500 transition-colors"
                        />
                      </div>

                      {/* Icon selector */}
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[10px] font-bold uppercase tracking-wider text-zinc-400">Desktop Icon (アイコン選択)</label>
                        <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 bg-zinc-950 rounded-lg border border-zinc-800/80">
                          {EMOJI_POOL.map((emoji) => (
                            <button
                              key={emoji}
                              onClick={() => setAppIconChar(emoji)}
                              className={`w-8 h-8 rounded-md flex items-center justify-center text-sm transition-all duration-150 ${
                                appIconChar === emoji
                                  ? 'bg-amber-500 text-white scale-110 shadow-lg shadow-amber-500/20'
                                  : 'hover:bg-zinc-800 text-zinc-300'
                              }`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Info / Safety warning */}
                      <div className="flex gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-[10px] leading-relaxed">
                        <Info className="w-4 h-4 shrink-0 stroke-[1.5]" />
                        <div>
                          <p className="font-bold">Iframe Safety Compatibility</p>
                          <p className="opacity-80 mt-0.5">
                            GitHub HTML pages render beautifully! Some pages with strict security headers (X-Frame-Options) might block framing.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Big Install Button at the bottom */}
                  <div className="mt-6 flex flex-col gap-3">
                    <div className="flex items-center gap-3 bg-zinc-900/50 p-3 rounded-xl border border-zinc-800/80">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-amber-500 to-indigo-600 flex items-center justify-center text-2xl shadow-inner shadow-black/10">
                        {appIconChar}
                      </div>
                      <div className="flex-1 leading-tight overflow-hidden">
                        <p className="text-xs font-bold text-white truncate">{appTitle || 'Unnamed App'}</p>
                        <p className="text-[9px] text-zinc-500 truncate font-mono mt-0.5">{searchedUrl}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => handleInstall(appTitle, searchedUrl, appIconChar)}
                      disabled={!appTitle.trim()}
                      className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 disabled:opacity-50 text-white py-3 px-4 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-emerald-900/20"
                    >
                      <Download className="w-4 h-4" />
                      noob os にインストール
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Browse Home Hub with Search Box and Curated Grid */
              <div className="flex-1 flex flex-col overflow-y-auto px-10 py-8 max-w-4xl mx-auto w-full">
                {/* Search Bar Block */}
                <div className="text-center mb-8">
                  <h2 className="text-lg font-bold text-white">Import Custom HTML Web App</h2>
                  <p className="text-xs text-zinc-400 mt-1 max-w-md mx-auto">
                    Type or paste any web URL (such as GitHub Pages, direct index.html raw servers) to search, preview, and install it on your local Desktop.
                  </p>

                  <form onSubmit={handleSearch} className="mt-5 max-w-lg mx-auto flex items-center gap-2">
                    <div className="flex-1 flex items-center rounded-xl bg-zinc-900 border border-zinc-800 focus-within:border-amber-500 focus-within:ring-1 focus-within:ring-amber-500 px-3.5 py-2.5 transition-all">
                      <Globe className="w-4 h-4 text-zinc-500 mr-2 shrink-0" />
                      <input
                        type="text"
                        placeholder="https://user.github.io/my-page/ or index.html URL..."
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="w-full bg-transparent border-none outline-none text-xs text-zinc-100 placeholder-zinc-500"
                        id="store-url-search-input"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={!urlInput.trim()}
                      className="bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-black font-bold px-5 py-2.5 rounded-xl text-xs transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Search className="w-3.5 h-3.5" />
                      調べる
                    </button>
                  </form>

                  {/* GitHub Raw File Tip Alert */}
                  {showGithubHelp && (
                    <div className="mt-4 max-w-lg mx-auto p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] text-left flex items-start gap-2.5">
                      <AlertTriangle className="w-4.5 h-4.5 text-indigo-400 shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-bold">Raw GitHub Files Detected</p>
                        <p className="opacity-85 mt-0.5 leading-relaxed">
                          Standard GitHub code links cannot load in iframes. Convert it to a live runnable sandbox link using <strong>raw.githack.com</strong>?
                        </p>
                        <button
                          onClick={convertGithubUrl}
                          className="mt-2 px-3 py-1 bg-indigo-500 hover:bg-indigo-600 text-black font-bold rounded-md text-[9px] transition-colors"
                        >
                          変換してプレビューする
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Featured/Curated Catalog Section */}
                <div className="mt-2 border-t border-zinc-800/80 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400">Curated Web Apps (一クリック インストール)</h3>
                    <span className="text-[10px] text-zinc-500 font-medium">Ready-made GitHub web projects</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {CURATED_APPS.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => handleCuratedClick(app)}
                        className="bg-zinc-900/40 border border-zinc-800/60 hover:bg-zinc-900/90 hover:border-zinc-700/80 rounded-xl p-4 cursor-pointer transition-all duration-200 flex items-start gap-3.5 group"
                      >
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-2xl group-hover:scale-105 transition-transform shrink-0 shadow-md">
                          {app.iconChar}
                        </div>
                        <div className="flex-1 leading-tight min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded-full text-zinc-400 font-bold uppercase tracking-wide">
                              {app.category}
                            </span>
                            <span className="text-[8px] text-zinc-500 font-mono">by {app.developer}</span>
                          </div>
                          <h4 className="text-xs font-bold text-white mt-1.5 group-hover:text-amber-400 transition-colors truncate">
                            {app.title}
                          </h4>
                          <p className="text-[10px] text-zinc-400 opacity-80 mt-1 line-clamp-2 leading-relaxed">
                            {app.desc}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footnote */}
                <div className="mt-12 text-center text-[10px] text-zinc-600 flex items-center justify-center gap-1.5">
                  <Info className="w-3.5 h-3.5" />
                  <span>Installed webapps are completely persistent inside your WebOS desktop workspace.</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* My Apps Tab */
          <div className="flex-1 flex flex-col overflow-y-auto px-8 py-6 w-full max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-sm font-bold text-white">Your Installed Web Applications</h2>
                <p className="text-[10px] text-zinc-400 mt-0.5">Apps you have added to your noob os desktop</p>
              </div>
              <span className="text-xs text-zinc-500 font-bold bg-zinc-900 px-3 py-1 rounded-lg border border-zinc-800">
                合計: {installedApps.length} 個
              </span>
            </div>

            {installedApps.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center py-20 text-center text-zinc-500">
                <HelpCircle className="w-12 h-12 stroke-[1.25] text-zinc-600 mb-3" />
                <p className="text-xs font-bold">まだ何もインストールされていません。</p>
                <p className="text-[10px] text-zinc-500 mt-1 max-w-xs leading-relaxed">
                  「ストア」タブを開いて、GitHubのURLを入力するか、プリセットアプリを一クリックでインストールしてみましょう！
                </p>
                <button
                  onClick={() => setActiveTab('browse')}
                  className="mt-4 px-4 py-1.5 bg-amber-500 hover:bg-amber-600 text-black font-bold text-xs rounded-lg transition-colors cursor-pointer"
                >
                  ストアに移動する
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {installedApps.map((app) => (
                  <div
                    key={app.id}
                    className="bg-zinc-900/30 border border-zinc-800/80 rounded-xl p-4 flex items-center justify-between gap-4 hover:bg-zinc-900/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 min-w-0">
                      {/* App Icon visual */}
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-zinc-800 to-zinc-900 border border-zinc-700/50 flex items-center justify-center text-2xl shrink-0 shadow-md">
                        {app.iconChar}
                      </div>
                      
                      <div className="leading-tight min-w-0">
                        <h3 className="text-xs font-bold text-white truncate">{app.title}</h3>
                        <p className="text-[9px] text-zinc-500 font-mono mt-1 truncate hover:text-zinc-400 select-all max-w-sm flex items-center gap-1.5">
                          <Globe className="w-3 h-3 text-zinc-600" />
                          {app.url}
                        </p>
                        <p className="text-[9px] text-zinc-500 mt-0.5">
                          インストール日時: {new Date(app.installedAt).toLocaleString('ja-JP')}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleLaunchAppFromStore(app.id)}
                        className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs transition-colors flex items-center gap-1 cursor-pointer"
                        title="Open App Window"
                      >
                        <Play className="w-3.5 h-3.5 fill-white text-white" />
                        起動
                      </button>
                      <button
                        onClick={() => handleUninstall(app.id)}
                        className="p-1.5 bg-zinc-900 hover:bg-red-500/20 hover:text-red-400 border border-zinc-800 text-zinc-400 rounded-lg transition-all cursor-pointer"
                        title="Uninstall App"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
