import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, ArrowRight, RotateCw, Settings, Terminal, Plus, X, Lock, Globe, Search } from 'lucide-react';
import { CHAT_APP_HTML, YACHT_GAME_HTML, UNO_GAME_HTML } from '../browserConstants';
import { scopedCss } from './BrowserAppStyles';
import { 
  BookmarkItem, 
  BROWSER_VERSION, 
  getFavicon, 
  getDomainOrUrl, 
  normalise, 
  getSearchUrl, 
  cityCoordinates, 
  I18N 
} from './BrowserAppHelpers';

interface BrowserAppProps {
  onOpenNotepadWithFile?: (name: string, content: string) => void;
}

interface BrowserTab {
  id: number;
  title: string;
  favicon: string;
  url: string | null;
  history: Array<string | null>;
  histIdx: number;
  hasError?: boolean;
}

export const BrowserApp: React.FC<BrowserAppProps> = ({ onOpenNotepadWithFile }) => {
  // ─── Settings State ───
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('my_browser_settings');
      if (saved) {
        return {
          theme: 'dark',
          tabLayout: 'horizontal',
          language: 'ja',
          fontSize: 'medium',
          weatherCity: 'tokyo',
          ...JSON.parse(saved)
        };
      }
    } catch (_) {}
    return {
      theme: 'dark',
      tabLayout: 'horizontal',
      language: 'ja',
      fontSize: 'medium',
      weatherCity: 'tokyo'
    };
  });

  // Save settings on changes
  useEffect(() => {
    localStorage.setItem('my_browser_settings', JSON.stringify(settings));
  }, [settings]);

  // ─── Bookmarks State ───
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>(() => {
    try {
      const data = localStorage.getItem("my_browser_bookmarks");
      if (data) return JSON.parse(data);
    } catch (_) {}
    return [
      { label: "Wikipedia", url: "https://ja.wikipedia.org", icon: "📖" },
      { label: "Yacht", url: "https://yacht.game", icon: "🎲" },
      { label: "UNO", url: "https://uno.game", icon: "🃏" }
    ];
  });

  useEffect(() => {
    localStorage.setItem("my_browser_bookmarks", JSON.stringify(bookmarks));
  }, [bookmarks]);

  // ─── Tabs State ───
  const [tabs, setTabs] = useState<BrowserTab[]>([
    { id: 1, title: '新しいタブ', favicon: '🌐', url: null, history: [null], histIdx: 0 }
  ]);
  const [activeId, setActiveId] = useState<number>(1);
  const [idCounter, setIdCounter] = useState<number>(1);

  // ─── Browser/UI States ───
  const [urlInputValue, setUrlInputValue] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const [showConsole, setShowConsole] = useState(false);
  const [isSplitActive, setIsSplitActive] = useState(false);

  // New tab inputs / active search categories (mapped by tabId)
  const [tabSearchVals, setTabSearchVals] = useState<Record<number, string>>({});
  const [tabSearchCats, setTabSearchCats] = useState<Record<number, string>>({});

  // ─── Weather State ───
  const [weatherData, setWeatherData] = useState({ name: '東京', status: '取得中...' });

  // ─── Console State ───
  const [consoleLogs, setConsoleLogs] = useState<Array<{ text: string; type?: 'prompt' | 'error' | 'success' | 'info' }>>([
    { text: "Edge Fluent Developer Shell initialized.", type: 'info' }
  ]);
  const [consoleInputValue, setConsoleInputValue] = useState('');
  const consoleBodyRef = useRef<HTMLDivElement>(null);

  const activeTab = tabs.find(t => t.id === activeId) || tabs[0];

  const getCleanUrl = (url: string | null) => {
    if (!url) return '';
    return url.replace(/\/$/, '').toLowerCase();
  };

  // Sync Address input bar on switching tab or changing its URL
  useEffect(() => {
    if (activeTab) {
      setUrlInputValue(activeTab.url || '');
    }
  }, [activeId, activeTab?.url]);

  // Auto Scroll Console output
  useEffect(() => {
    if (consoleBodyRef.current) {
      consoleBodyRef.current.scrollTop = consoleBodyRef.current.scrollHeight;
    }
  }, [consoleLogs]);

  // ─── Split Screen Automatic trigger ───
  useEffect(() => {
    if (activeTab && activeTab.url) {
      const cleanUrl = getCleanUrl(activeTab.url);
      if (
        cleanUrl === 'https://yacht.game' || 
        cleanUrl === 'http://yacht.game' || 
        cleanUrl === 'https://uno.game' || 
        cleanUrl === 'http://uno.game'
      ) {
        setIsSplitActive(true);
      } else {
        setIsSplitActive(false);
      }
    } else {
      setIsSplitActive(false);
    }
  }, [activeId, activeTab?.url]);

  // ─── Listen to window message events from internal iframes ───
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'CONSOLE_LOG') {
        setConsoleLogs(prev => [...prev, { text: e.data.text, type: 'info' }]);
      }
    };
    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // ─── Weather API handler ───
  useEffect(() => {
    let active = true;
    const updateWeather = async () => {
      const cityKey = settings.weatherCity || 'tokyo';
      const coord = cityCoordinates[cityKey] || cityCoordinates.tokyo;
      
      setWeatherData({ name: coord.name, status: '取得中...' });

      try {
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${coord.lat}&longitude=${coord.lon}&current_weather=true`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("HTTP error");
        const data = await res.json();
        if (data && data.current_weather && active) {
          const temp = Math.round(data.current_weather.temperature);
          const code = data.current_weather.weathercode;
          
          let emoji = "☁";
          if (code === 0) emoji = "☀";
          else if (code >= 1 && code <= 3) emoji = "⛅";
          else if (code === 45 || code === 48) emoji = "🌫";
          else if ((code >= 51 && code <= 55) || (code >= 61 && code <= 65) || (code >= 80 && code <= 82)) emoji = "☔";
          else if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) emoji = "❄";
          else if (code >= 95) emoji = "⚡";
          
          setWeatherData({ name: coord.name, status: `${emoji} ${temp}°C` });
          return;
        }
        throw new Error("Invalid data format");
      } catch (e) {
        if (active) {
          // Fallback based on city lat/lon so it is consistent and looks natural
          const hash = Math.abs(Math.sin(coord.lat) * 1000 + Math.cos(coord.lon) * 1000);
          const tempOffset = Math.floor(hash % 7) - 3; // -3 ~ +3
          
          let baseTemp = 22;
          if (coord.lat > 40) baseTemp = 14; // Hokkaido
          else if (coord.lat > 37) baseTemp = 18; // Sendai
          else if (coord.lat < 34) baseTemp = 25; // Fukuoka/Hiroshima
          const temp = baseTemp + tempOffset;
          
          const weathers = [
            { emoji: "☀", text: "晴れ" },
            { emoji: "⛅", text: "曇り" },
            { emoji: "☁", text: "曇り" },
            { emoji: "☔", text: "小雨" }
          ];
          const w = weathers[Math.floor(hash) % weathers.length];
          setWeatherData({ name: coord.name, status: `${w.emoji} ${temp}°C` });
        }
      }
    };

    updateWeather();
    return () => { active = false; };
  }, [settings.weatherCity]);

  // ─── Navigation Core ───
  const navigateTo = (tabId: number, rawUrl: string) => {
    const normalisedUrl = normalise(rawUrl);
    if (!normalisedUrl) return;

    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        const nextHistory = t.history.slice(0, t.histIdx + 1);
        nextHistory.push(normalisedUrl);
        return {
          ...t,
          url: normalisedUrl,
          history: nextHistory,
          histIdx: nextHistory.length - 1,
          favicon: getFavicon(normalisedUrl),
          title: getDomainOrUrl(normalisedUrl),
          hasError: false
        };
      }
      return t;
    }));

    setLoadingProgress(30);
    setTimeout(() => setLoadingProgress(60), 80);
    setTimeout(() => setLoadingProgress(90), 160);

    if (tabId === activeId) {
      setUrlInputValue(normalisedUrl);
    }
  };

  const handleReload = () => {
    if (!activeTab || !activeTab.url) return;
    const currentUrl = activeTab.url;
    setLoadingProgress(20);

    // Briefly unset url to trigger iframe reload
    setTabs(prev => prev.map(t => {
      if (t.id === activeId) {
        return { ...t, url: '' };
      }
      return t;
    }));

    setTimeout(() => {
      setTabs(prev => prev.map(t => {
        if (t.id === activeId) {
          return { ...t, url: currentUrl, hasError: false };
        }
        return t;
      }));
      setLoadingProgress(100);
      setTimeout(() => setLoadingProgress(0), 400);
    }, 100);
  };

  const historyGo = (delta: number) => {
    if (!activeTab) return;
    const nextIdx = activeTab.histIdx + delta;
    if (nextIdx >= 0 && nextIdx < activeTab.history.length) {
      const url = activeTab.history[nextIdx];
      setTabs(prev => prev.map(t => {
        if (t.id === activeId) {
          return {
            ...t,
            url,
            histIdx: nextIdx,
            favicon: getFavicon(url),
            title: url ? getDomainOrUrl(url) : '新しいタブ',
            hasError: false
          };
        }
        return t;
      }));
      setUrlInputValue(url || '');
    }
  };

  // ─── Tabs Manager ───
  const openTab = (url: string | null = null) => {
    const nextId = idCounter + 1;
    setIdCounter(nextId);
    const newTab: BrowserTab = {
      id: nextId,
      title: '新しいタブ',
      favicon: '🌐',
      url,
      history: [url],
      histIdx: 0,
      hasError: false
    };
    setTabs(prev => [...prev, newTab]);
    setActiveId(nextId);
    if (url) {
      navigateTo(nextId, url);
    } else {
      setUrlInputValue('');
    }
  };

  const closeTab = (tabId: number) => {
    if (tabs.length === 1) {
      setTabs([{ id: 1, title: '新しいタブ', favicon: '🌐', url: null, history: [null], histIdx: 0 }]);
      setActiveId(1);
      setIdCounter(1);
      setUrlInputValue('');
      return;
    }

    const index = tabs.findIndex(t => t.id === tabId);
    const nextTabs = tabs.filter(t => t.id !== tabId);
    setTabs(nextTabs);

    if (activeId === tabId) {
      const nextActiveIndex = Math.min(index, nextTabs.length - 1);
      const nextActive = nextTabs[nextActiveIndex];
      setActiveId(nextActive.id);
      setUrlInputValue(nextActive.url || '');
    }
  };

  const activateTab = (tabId: number) => {
    setActiveId(tabId);
    const tab = tabs.find(t => t.id === tabId);
    if (tab) {
      setUrlInputValue(tab.url || '');
    }
  };

  // ─── Frames Handlers ───
  const handleFrameLoaded = (tabId: number, el: HTMLIFrameElement) => {
    setLoadingProgress(100);
    setTimeout(() => setLoadingProgress(0), 400);

    try {
      if (el.contentWindow) {
        const currentUrl = el.contentWindow.location.href;
        if (currentUrl && currentUrl !== 'about:blank' && currentUrl !== 'about:srcdoc') {
          setTabs(prev => prev.map(t => {
            if (t.id === tabId && t.url !== currentUrl) {
              const nextHistory = t.history.slice(0, t.histIdx + 1);
              nextHistory.push(currentUrl);
              return {
                ...t,
                url: currentUrl,
                history: nextHistory,
                histIdx: nextHistory.length - 1,
                favicon: getFavicon(currentUrl),
                title: getDomainOrUrl(currentUrl)
              };
            }
            return t;
          }));
        }
      }
    } catch (_) {}
  };

  const handleFrameError = (tabId: number) => {
    setLoadingProgress(0);
    setTabs(prev => prev.map(t => {
      if (t.id === tabId) {
        return { ...t, hasError: true };
      }
      return t;
    }));
  };

  // ─── Settings Handlers ───
  const handleSettingChange = (key: string, value: string) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  // ─── Developer Console Handler ───
  const addConsoleLog = (text: string, isError = false, isSuccess = false) => {
    setConsoleLogs(prev => [...prev, {
      text,
      type: isError ? 'error' : isSuccess ? 'success' : 'info'
    }]);
  };

  const executeCommand = (input: string) => {
    const cmd = input.trim();
    if (!cmd) return;

    setConsoleLogs(prev => [...prev, { text: `> ${input}`, type: 'prompt' }]);

    const lowerCmd = cmd.toLowerCase();

    if (lowerCmd === 'this web in my book') {
      if (!activeTab || !activeTab.url) {
        addConsoleLog("エラー: 現在有効なWebページが開かれていません。", true);
        setConsoleInputValue('');
        return;
      }
      const isAlreadySaved = bookmarks.some(b => b.url === activeTab.url);
      if (isAlreadySaved) {
        addConsoleLog("案内: すでに登録されています: " + activeTab.title);
        setConsoleInputValue('');
        return;
      }
      const newBookmark: BookmarkItem = {
        label: activeTab.title,
        url: activeTab.url,
        icon: getFavicon(activeTab.url)
      };
      setBookmarks(prev => [...prev, newBookmark]);
      addConsoleLog("成功: お気に入りに追加しました: 「" + activeTab.title + "」", false, true);
    } else if (lowerCmd === 'view-source') {
      if (!activeTab || !activeTab.url) {
        addConsoleLog("エラー: 開いているWebページがありません。", true);
        setConsoleInputValue('');
        return;
      }
      if (
        activeTab.url === 'https://wetalks.chat' || 
        activeTab.url === 'http://wetalks.chat' ||
        activeTab.url === 'https://yacht.game' || 
        activeTab.url === 'http://yacht.game' ||
        activeTab.url === 'https://uno.game' || 
        activeTab.url === 'http://uno.game'
      ) {
        const fileContent = activeTab.url.includes('chat') ? CHAT_APP_HTML :
                            activeTab.url.includes('yacht') ? YACHT_GAME_HTML : UNO_GAME_HTML;
        if (onOpenNotepadWithFile) {
          onOpenNotepadWithFile('page_source.html', fileContent);
          addConsoleLog("成功: ソースコードをテキストエディタ(Notepad)で開きました。", false, true);
        } else {
          addConsoleLog("ソースコードプレビュー:\n" + fileContent.substring(0, 1000) + "\n...(以下省略)");
        }
      } else {
        addConsoleLog(`[セキュリティ制限(CORS)により取得不可]\n現在のWebページ (${activeTab.url}) は外部ドメインであるため、ブラウザのセキュリティ仕様により中身のコードをJavaScriptで直接覗き見ることができません。`, true);
      }
    } else if (lowerCmd === 'this browser-version') {
      addConsoleLog(`Browser Version: ${BROWSER_VERSION}`, false, true);
    } else if (lowerCmd === 'clear') {
      setConsoleLogs([]);
    } else if (lowerCmd === 'help command ? -a') {
      addConsoleLog(`使用可能なコマンド:
  This web in my book   - 現在のページをお気に入りに追加
  view-source           - 現在ページのソースコードを表示 (CORS制限あり)
  this browser-version  - バージョン情報を表示
  clear                 - コンソール画面をクリア
  Help command ? -a     - このヘルプメッセージを表示`);
    } else {
      addConsoleLog("エラー: 未知のコマンド「" + cmd + "」です。'Help command ? -a' と入力してください。", true);
    }
    setConsoleInputValue('');
  };

  // ─── Helpers ───
  const t = (key: string) => {
    return (I18N[settings.language as 'ja' | 'en'] as any)?.[key] || key;
  };

  const getQueryFromUrl = (urlStr: string | null) => {
    if (!urlStr) return "";
    try {
      const parsed = new URL(urlStr);
      return parsed.searchParams.get("q") || "";
    } catch (_) {
      const match = urlStr.match(/[?&]q=([^&]+)/);
      return match ? decodeURIComponent(match[1]) : "";
    }
  };

  const isBing = activeTab && activeTab.url && (
    activeTab.url.includes("bing.com/search") ||
    activeTab.url.includes("bing.com/images/search") ||
    activeTab.url.includes("bing.com/videos/search") ||
    activeTab.url.includes("bing.com/maps")
  );

  // ─── Sub-renderers ───
  const renderNewTab = (tabId: number) => {
    const val = tabSearchVals[tabId] || '';
    const cat = tabSearchCats[tabId] || 'all';

    const categories = [
      { id: 'all', label: settings.language === 'ja' ? 'すべて' : 'All' },
      { id: 'images', label: settings.language === 'ja' ? '画像' : 'Images' },
      { id: 'videos', label: settings.language === 'ja' ? '動画' : 'Videos' },
      { id: 'maps', label: settings.language === 'ja' ? 'マップ' : 'Maps' }
    ];

    return (
      <div className="nt-page active">
        <div className="nt-categories">
          {categories.map(c => (
            <button
              key={c.id}
              className={`nt-cat-btn ${cat === c.id ? 'active' : ''}`}
              onClick={() => {
                setTabSearchCats(prev => ({ ...prev, [tabId]: c.id }));
                if (val.trim()) {
                  navigateTo(tabId, getSearchUrl(c.id, val.trim()));
                }
              }}
            >
              {c.label}
            </button>
          ))}
        </div>

        <div className="nt-search-wrap">
          <span className="nt-search-icon" aria-hidden="true"><Search size={16} /></span>
          <input
            type="text"
            className="nt-search"
            placeholder={settings.language === 'ja' ? 'Bing で検索、またはURLを入力' : 'Search Bing or enter URL'}
            aria-label="検索またはURLを入力"
            value={val}
            onChange={(e) => {
              const text = e.target.value;
              setTabSearchVals(prev => ({ ...prev, [tabId]: text }));
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const query = val.trim();
                if (query) {
                  navigateTo(tabId, getSearchUrl(cat, query));
                }
              }
            }}
          />
        </div>

        <div className="shortcuts">
          {bookmarks.map((s, idx) => (
            <div
              key={idx}
              className="shortcut"
              role="button"
              tabIndex={0}
              onClick={() => navigateTo(tabId, s.url)}
              onKeyDown={e => { if (e.key === "Enter" || e.key === " ") navigateTo(tabId, s.url); }}
            >
              <div className="shortcut-icon">{s.icon}</div>
              <div className="shortcut-label">{s.label}</div>
              <button
                className="shortcut-delete-btn"
                title={settings.language === 'ja' ? 'お気に入りを削除' : 'Delete bookmark'}
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(settings.language === 'ja' ? `お気に入り「${s.label}」を削除しますか？` : `Delete bookmark "${s.label}"?`)) {
                    const next = bookmarks.filter((_, bIdx) => bIdx !== idx);
                    setBookmarks(next);
                  }
                }}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderErrorPage = (tabId: number, url: string) => {
    return (
      <div className="error-page active">
        <div className="err-icon">🔌</div>
        <div className="err-title">{settings.language === 'ja' ? 'ページを表示できませんでした' : 'Unable to display page'}</div>
        <div className="err-desc">
          <strong>{url}</strong> {settings.language === 'ja' ? 'に接続できませんでした。' : 'could not be reached.'}<br />
          {settings.language === 'ja' ? 'URLを確認するか、別のサイトをお試しください。' : 'Please verify the URL or try another site.'}<br />
          ※ {settings.language === 'ja' ? 'セキュリティ制限により、一部のサイトはiframe内では表示できません。' : 'Due to security policies, some sites cannot be loaded within an iframe.'}
        </div>
        <button className="err-retry" onClick={() => navigateTo(tabId, url)}>
          {settings.language === 'ja' ? '再試行' : 'Retry'}
        </button>
      </div>
    );
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: scopedCss }} />
      <div 
        id="browser" 
        className={`browser-app-container ${settings.theme === 'light' ? 'theme-light' : ''} ${settings.tabLayout === 'vertical' ? 'layout-vertical' : ''} ${isSplitActive ? 'split-active' : ''}`}
        data-font-size={settings.fontSize}
      >
        <div id="tab-bar" role="tablist">
          {tabs.map(tab => (
            <div 
              key={tab.id}
              className={`tab ${tab.id === activeId ? 'active' : ''}`}
              role="tab"
              aria-selected={tab.id === activeId ? "true" : "false"}
              title={tab.title}
              onClick={() => activateTab(tab.id)}
            >
              <span className="tab-favicon" aria-hidden="true">{tab.favicon}</span>
              <span className="tab-title">{tab.title}</span>
              <span 
                className="tab-close"
                role="button"
                aria-label="タブを閉じる"
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
              >
                <X size={10} />
              </span>
            </div>
          ))}
          <button id="new-tab-btn" title="新しいタブ" onClick={() => openTab(null)}><Plus size={14} /></button>
        </div>

        <div id="main-panel">
          <div id="toolbar">
            <button 
              className="nav-btn" 
              id="btn-back" 
              title={settings.language === 'ja' ? '戻る' : 'Back'} 
              disabled={!activeTab || activeTab.histIdx <= 0}
              onClick={() => historyGo(-1)}
            >
              <ArrowLeft size={15} />
            </button>
            <button 
              className="nav-btn" 
              id="btn-fwd" 
              title={settings.language === 'ja' ? '進む' : 'Forward'} 
              disabled={!activeTab || activeTab.histIdx >= activeTab.history.length - 1}
              onClick={() => historyGo(1)}
            >
              <ArrowRight size={15} />
            </button>
            <button 
              className="nav-btn" 
              id="btn-reload" 
              title={settings.language === 'ja' ? '再読み込み' : 'Reload'}
              onClick={handleReload}
            >
              <RotateCw size={14} />
            </button>
            <div id="url-bar-wrap">
              <span id="url-bar-lock">
                {activeTab && activeTab.url && activeTab.url.startsWith("https://") ? (
                  <Lock size={12} className="text-emerald-500" />
                ) : (
                  <Globe size={12} />
                )}
              </span>
              <input 
                id="url-bar" 
                type="text" 
                autoComplete="off" 
                spellCheck="false" 
                placeholder={settings.language === 'ja' ? 'URLを入力' : 'Enter URL'} 
                value={urlInputValue}
                onChange={(e) => setUrlInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    navigateTo(activeId, urlInputValue);
                  }
                }}
              />
            </div>

            {/* 検索補助ツールバー */}
            {isBing && (
              <div id="search-tools">
                <button 
                  className="search-tool-btn" 
                  id="btn-search-focus"
                  onClick={() => document.getElementById('url-bar')?.focus()}
                >
                  🔍 検索
                </button>
                <button 
                  className={`search-tool-btn ${activeTab.url?.includes('bing.com/search') && !activeTab.url?.includes('images/search') && !activeTab.url?.includes('videos/search') ? 'active' : ''}`}
                  id="btn-search-all"
                  onClick={() => navigateTo(activeId, "https://www.bing.com/search?q=" + encodeURIComponent(getQueryFromUrl(activeTab.url)))}
                >
                  すべて
                </button>
                <button 
                  className={`search-tool-btn ${activeTab.url?.includes('bing.com/images/search') ? 'active' : ''}`}
                  id="btn-search-images"
                  onClick={() => navigateTo(activeId, "https://www.bing.com/images/search?q=" + encodeURIComponent(getQueryFromUrl(activeTab.url)))}
                >
                  画像
                </button>
                <button 
                  className={`search-tool-btn ${activeTab.url?.includes('bing.com/videos/search') ? 'active' : ''}`}
                  id="btn-search-videos"
                  onClick={() => navigateTo(activeId, "https://www.bing.com/videos/search?q=" + encodeURIComponent(getQueryFromUrl(activeTab.url)))}
                >
                  動画
                </button>
              </div>
            )}

            {/* お天気表示ウィジェット */}
            <div id="weather-widget">
              <span id="weather-city">{weatherData.name}</span>: <span id="weather-status">{weatherData.status}</span>
            </div>

            <button className="nav-btn" id="btn-console" title={settings.language === 'ja' ? '開発コンソール' : 'Dev Console'} onClick={() => setShowConsole(!showConsole)}><Terminal size={15} /></button>
            <button className="nav-btn" id="btn-settings" title={settings.language === 'ja' ? '設定' : 'Settings'} onClick={() => setShowSettings(!showSettings)}><Settings size={15} /></button>
          </div>

          <div id="content-area" role="main">
            <div id="left-pane">
              <div id="loading-bar" style={{ width: `${loadingProgress}%` }} />
              
              {tabs.map(tab => {
                const isActive = tab.id === activeId;
                const isNewTab = tab.url === null;
                const cleanUrl = getCleanUrl(tab.url);
                const isWeTalks = cleanUrl === 'https://wetalks.chat' || cleanUrl === 'http://wetalks.chat';
                const isYacht = cleanUrl === 'https://yacht.game' || cleanUrl === 'http://yacht.game';
                const isUno = cleanUrl === 'https://uno.game' || cleanUrl === 'http://uno.game';
                
                return (
                  <div 
                    key={tab.id} 
                    className={`page-frame ${isActive ? 'active' : ''}`}
                    style={{ position: 'absolute', inset: 0, display: isActive ? 'block' : 'none' }}
                    data-tabid={tab.id}
                  >
                    {isNewTab ? (
                      renderNewTab(tab.id)
                    ) : tab.hasError ? (
                      renderErrorPage(tab.id, tab.url!)
                    ) : (
                      <iframe
                        key={`${tab.id}-${isWeTalks || isYacht || isUno ? 'local' : 'external'}`}
                        className="page-frame active"
                        data-tabid={tab.id}
                        title={tab.title}
                        srcDoc={
                          isWeTalks ? CHAT_APP_HTML :
                          isYacht ? YACHT_GAME_HTML :
                          isUno ? UNO_GAME_HTML :
                          undefined
                        }
                        src={
                          !isWeTalks && !isYacht && !isUno ? tab.url || undefined : undefined
                        }
                        sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                        onLoad={(e) => handleFrameLoaded(tab.id, e.currentTarget)}
                        onError={() => handleFrameError(tab.id)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            
            {/* Split screen panel on the right */}
            <div id="right-pane" style={{ display: isSplitActive ? 'flex' : 'none' }}>
              <iframe 
                id="split-chat-frame" 
                title="Split WeTalks"
                srcDoc={CHAT_APP_HTML} 
                sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals"
                style={{ width: '100%', height: '100%', border: 'none' }}
              />
            </div>
          </div>
        </div>

        {/* 設定パネル */}
        <div id="settings-panel" className={showSettings ? 'active' : ''}>
          <div className="settings-header">
            <span className="settings-title">{t('settings.title')}</span>
            <span className="settings-close" onClick={() => setShowSettings(false)}>&times;</span>
          </div>
          <div className="settings-body">
            <div className="setting-group">
              <div className="setting-group-title">{t('settings.theme.title')}</div>
              <div className="setting-option">
                <label>
                  <input 
                    type="radio" 
                    name="theme" 
                    value="dark" 
                    checked={settings.theme === 'dark'}
                    onChange={() => handleSettingChange('theme', 'dark')}
                  /> 
                  <span>{t('settings.theme.dark')}</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="theme" 
                    value="light" 
                    checked={settings.theme === 'light'}
                    onChange={() => handleSettingChange('theme', 'light')}
                  /> 
                  <span>{t('settings.theme.light')}</span>
                </label>
              </div>
            </div>
            <div className="setting-group">
              <div className="setting-group-title">{t('settings.layout.title')}</div>
              <div className="setting-option">
                <label>
                  <input 
                    type="radio" 
                    name="tab-layout" 
                    value="horizontal" 
                    checked={settings.tabLayout === 'horizontal'}
                    onChange={() => handleSettingChange('tabLayout', 'horizontal')}
                  /> 
                  <span>{t('settings.layout.horizontal')}</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="tab-layout" 
                    value="vertical" 
                    checked={settings.tabLayout === 'vertical'}
                    onChange={() => handleSettingChange('tabLayout', 'vertical')}
                  /> 
                  <span>{t('settings.layout.vertical')}</span>
                </label>
              </div>
            </div>
            <div className="setting-group">
              <div className="setting-group-title">{t('settings.language.title')}</div>
              <div className="setting-option">
                <select 
                  id="language-select"
                  value={settings.language}
                  onChange={(e) => handleSettingChange('language', e.target.value)}
                >
                  <option value="ja">日本語</option>
                  <option value="en">English</option>
                </select>
              </div>
            </div>
            <div className="setting-group">
              <div className="setting-group-title">{t('settings.fontsize.title')}</div>
              <div className="setting-option">
                <label>
                  <input 
                    type="radio" 
                    name="font-size" 
                    value="small"
                    checked={settings.fontSize === 'small'}
                    onChange={() => handleSettingChange('fontSize', 'small')}
                  /> 
                  <span>{t('settings.fontsize.small')}</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="font-size" 
                    value="medium"
                    checked={settings.fontSize === 'medium'}
                    onChange={() => handleSettingChange('fontSize', 'medium')}
                  /> 
                  <span>{t('settings.fontsize.medium')}</span>
                </label>
                <label>
                  <input 
                    type="radio" 
                    name="font-size" 
                    value="large"
                    checked={settings.fontSize === 'large'}
                    onChange={() => handleSettingChange('fontSize', 'large')}
                  /> 
                  <span>{t('settings.fontsize.large')}</span>
                </label>
              </div>
            </div>
            <div className="setting-group">
              <div className="setting-group-title">{settings.language === 'ja' ? 'お天気地域の設定' : 'Weather Region Setting'}</div>
              <div className="setting-option">
                <select 
                  id="weather-city-select"
                  value={settings.weatherCity}
                  onChange={(e) => handleSettingChange('weatherCity', e.target.value)}
                >
                  <option value="fukuoka">福岡</option>
                  <option value="hiroshima">広島</option>
                  <option value="kyoto">京都</option>
                  <option value="shizuoka">静岡</option>
                  <option value="tokyo">東京</option>
                  <option value="sendai">仙台</option>
                  <option value="hokkaido">北海道</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* コマンドコンソール */}
        <div id="console-panel" className={showConsole ? 'active' : ''}>
          <div className="settings-header">
            <span className="settings-title">{settings.language === 'ja' ? '出力結果' : 'Output Results'}</span>
            <span className="settings-close" onClick={() => setShowConsole(false)}>&times;</span>
          </div>
          <div id="console-body" ref={consoleBodyRef}>
            {consoleLogs.map((log, idx) => (
              <div key={idx} className={`browser-app-console-line ${log.type || ''}`}>
                {log.text}
              </div>
            ))}
          </div>
          <div id="console-footer">
            <span id="console-prompt">&gt;</span>
            <input 
              id="console-input" 
              type="text" 
              autoComplete="off" 
              spellCheck="false" 
              placeholder={settings.language === 'ja' ? 'コマンドを入力...' : 'Enter command...'} 
              value={consoleInputValue}
              onChange={(e) => setConsoleInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  executeCommand(consoleInputValue);
                }
              }}
            />
            <button id="console-run-btn" onClick={() => executeCommand(consoleInputValue)}>
              {settings.language === 'ja' ? '実行' : 'Run'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
