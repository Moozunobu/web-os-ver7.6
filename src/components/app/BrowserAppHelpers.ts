/**
 * BrowserAppHelpers.ts
 * Utility constants and functions for BrowserApp.
 */

export interface BookmarkItem {
  label: string;
  url: string;
  icon: string;
}

export const BROWSER_VERSION = "v2";

export const FAVICON_MAP: Record<string, string> = {
  "wikipedia.org": "📖",
  "wetalks.chat": "💬",
  "yacht.game": "🎲",
  "uno.game": "🃏"
};

export function getFavicon(urlStr: string | null): string {
  if (!urlStr) return "🌐";
  try {
    const host = (new URL(urlStr)).hostname.replace(/^www\./, "");
    for (const [k, v] of Object.entries(FAVICON_MAP)) {
      if (host.includes(k)) return v;
    }
  } catch (_) {}
  return "🌐";
}

export function getDomainOrUrl(urlStr: string): string {
  try {
    return new URL(urlStr).hostname.replace(/^www\./, "") || urlStr;
  } catch (_) {
    return urlStr;
  }
}

export function normalise(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (/\s/.test(trimmed) || !/\./.test(trimmed)) {
    return "https://www.bing.com/search?q=" + encodeURIComponent(trimmed);
  }
  return "https://" + trimmed;
}

export function getSearchUrl(category: string, query: string): string {
  const encoded = encodeURIComponent(query);
  switch (category) {
    case 'images':
      return "https://www.bing.com/images/search?q=" + encoded;
    case 'videos':
      return "https://www.bing.com/videos/search?q=" + encoded;
    case 'maps':
      return "https://www.bing.com/maps/search?q=" + encoded;
    case 'all':
    default:
      return "https://www.bing.com/search?q=" + encoded;
  }
}

export const cityCoordinates: Record<string, { name: string; lat: number; lon: number }> = {
  fukuoka: { name: "福岡", lat: 33.5902, lon: 130.4017 },
  hiroshima: { name: "広島", lat: 34.3853, lon: 132.4553 },
  kyoto: { name: "京都", lat: 35.0116, lon: 135.7681 },
  shizuoka: { name: "静岡", lat: 34.9756, lon: 138.3828 },
  tokyo: { name: "東京", lat: 35.6895, lon: 139.6917 },
  sendai: { name: "仙台", lat: 38.2682, lon: 140.8694 },
  hokkaido: { name: "北海道", lat: 43.0621, lon: 141.3544 }
};

export const I18N = {
  ja: {
    'settings.title': '設定',
    'settings.theme.title': 'テーマ',
    'settings.theme.dark': 'ダーク',
    'settings.theme.light': 'ライト',
    'settings.layout.title': 'タブバーの配置',
    'settings.layout.horizontal': '水平 (上)',
    'settings.layout.vertical': '垂直 (左)',
    'settings.language.title': '言語',
    'settings.fontsize.title': '文字の大きさ',
    'settings.fontsize.small': '小',
    'settings.fontsize.medium': '中',
    'settings.fontsize.large': '大'
  },
  en: {
    'settings.title': 'Settings',
    'settings.theme.title': 'Theme',
    'settings.theme.dark': 'Dark',
    'settings.theme.light': 'Light',
    'settings.layout.title': 'Tab Bar Layout',
    'settings.layout.horizontal': 'Horizontal (Top)',
    'settings.layout.vertical': 'Vertical (Left)',
    'settings.language.title': 'Language',
    'settings.fontsize.title': 'Font Size',
    'settings.fontsize.small': 'Small',
    'settings.fontsize.medium': 'Medium',
    'settings.fontsize.large': 'Large'
  }
};
