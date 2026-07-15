/**
 * BrowserAppStyles.ts
 * Scoped styling for a highly polished Web OS Acrylic / Glass Fluent-style browser.
 */

export const scopedCss = `
#browser.browser-app-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  width: 100%;
  position: relative;
  overflow: hidden;
  font-family: var(--font-sans), system-ui, -apple-system, sans-serif;
  
  /* Modern Web OS Glass (Dark Theme Default) */
  --shell-bg:      rgba(24, 24, 30, 0.9);        /* Less transparent to guarantee maximum readability */
  --tabbar-bg:     rgba(18, 18, 22, 0.75);
  --tab-idle:      transparent;
  --tab-hover:     rgba(255, 255, 255, 0.08);
  --tab-active:    rgba(255, 255, 255, 0.12);    /* Active Tab */
  --toolbar-bg:    rgba(32, 32, 42, 0.94);       /* Solid glass main toolbar */
  --border:        rgba(255, 255, 255, 0.1);
  --text-main:     #f3f4f6;
  --text-muted:    #e5e7eb;
  --text-dim:      #9ca3af;
  --accent:        #3b82f6;                      /* Premium Blue Accent */
  --accent-light:  rgba(59, 130, 246, 0.25);
  --urlbar-bg:     rgba(10, 10, 12, 0.6);
  --ntpage-bg:     rgba(20, 20, 26, 0.93);       /* Dark Acrylic cover for New Tab */
  --shortcut-bg:   rgba(255, 255, 255, 0.05);
  --search-bg:     rgba(10, 10, 12, 0.7);
  --console-bg:    rgba(15, 15, 20, 0.92);
  --font-size-main: 13px;
  --font-size-small: 12px;
  
  background: var(--shell-bg);
  backdrop-filter: blur(25px);
  -webkit-backdrop-filter: blur(25px);
  color: var(--text-main);
  font-size: var(--font-size-main);
  transition: background-color 0.3s, color 0.3s;
}

#browser.browser-app-container.theme-light {
  /* Modern Web OS Glass (Light Theme) */
  --shell-bg:      rgba(245, 246, 250, 0.94);    /* Solid elegant off-white to block background noise */
  --tabbar-bg:     rgba(232, 234, 242, 0.8);
  --tab-idle:      transparent;
  --tab-hover:     rgba(0, 0, 0, 0.06);
  --tab-active:    rgba(255, 255, 255, 0.85);
  --toolbar-bg:    rgba(255, 255, 255, 0.94);
  --border:        rgba(0, 0, 0, 0.12);          /* Higher contrast border */
  --text-main:     #111827;                      /* Pure contrast text */
  --text-muted:    #374151;
  --text-dim:      #4b5563;                      /* Darker grey for light theme */
  --accent:        #1d4ed8;                      /* Vibrant high-contrast blue */
  --accent-light:  rgba(29, 78, 216, 0.15);
  --urlbar-bg:     rgba(255, 255, 255, 0.85);
  --ntpage-bg:     rgba(245, 246, 252, 0.95);    /* Crisp off-white-blueish acrylic for New Tab */
  --shortcut-bg:   rgba(0, 0, 0, 0.04);
  --search-bg:     rgba(255, 255, 255, 0.9);
  --console-bg:    rgba(255, 255, 255, 0.95);
}

#browser.browser-app-container[data-font-size="small"] { --font-size-main: 12px; --font-size-small: 11px; }
#browser.browser-app-container[data-font-size="large"] { --font-size-main: 14px; --font-size-small: 13px; }

#browser.browser-app-container #main-panel {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  position: relative;
}

#browser.browser-app-container #tab-bar {
  display: flex;
  align-items: center;
  background: var(--tabbar-bg);
  padding: 8px 12px 0;
  gap: 6px;
  min-height: 46px;
  overflow-x: auto;
  overflow-y: hidden;
  scrollbar-width: none;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}
#browser.browser-app-container #tab-bar::-webkit-scrollbar { display: none; }

#browser.browser-app-container .tab {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  min-width: 130px;
  max-width: 200px;
  height: 32px;
  background: var(--tab-idle);
  border-radius: 8px 8px 0 0;
  cursor: pointer;
  font-size: var(--font-size-small);
  color: var(--text-dim);
  user-select: none;
  position: relative;
  flex-shrink: 0;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  border: 1px solid transparent;
  border-bottom: none;
  margin-bottom: 0;
}
#browser.browser-app-container .tab:hover { 
  background: var(--tab-hover); 
  color: var(--text-main); 
}
#browser.browser-app-container .tab.active { 
  background: var(--tab-active); 
  color: var(--text-main); 
  z-index: 2; 
  border-color: var(--border);
  box-shadow: 0 -2px 10px rgba(0,0,0,0.05);
  font-weight: 500;
}
#browser.browser-app-container .tab-favicon { 
  font-size: 13px; 
  flex-shrink: 0; 
  display: flex; 
  align-items: center; 
  justify-content: center; 
}
#browser.browser-app-container .tab-title { 
  flex: 1; 
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap; 
}

#browser.browser-app-container.layout-vertical { flex-direction: row; }
#browser.browser-app-container.layout-vertical #tab-bar {
  flex-direction: column; 
  width: 210px; 
  height: 100%;
  align-items: stretch; 
  padding: 12px; 
  border-right: 1px solid var(--border); 
  border-bottom: none;
  gap: 6px;
}
#browser.browser-app-container.layout-vertical .tab {
  max-width: none; 
  min-width: 0; 
  border-radius: 8px; 
  margin-bottom: 0; 
  height: 36px;
  border: 1px solid transparent;
}
#browser.browser-app-container.layout-vertical .tab.active {
  border-color: var(--border);
  background: var(--tab-active);
}

#browser.browser-app-container .tab-close {
  width: 16px; 
  height: 16px; 
  border-radius: 4px; 
  display: flex; 
  align-items: center;
  justify-content: center; 
  font-size: 10px; 
  color: var(--text-dim); 
  cursor: pointer;
  flex-shrink: 0; 
  transition: all 0.15s; 
  line-height: 1; 
  margin-left: auto;
}
#browser.browser-app-container .tab-close:hover { 
  background: rgba(255,38,38,0.18); 
  color: #ff4d4d; 
}

#browser.browser-app-container #new-tab-btn {
  width: 26px; 
  height: 26px; 
  background: transparent; 
  border: none; 
  border-radius: 6px;
  color: var(--text-main); 
  font-size: 16px; 
  cursor: pointer; 
  display: flex; 
  align-items: center;
  justify-content: center; 
  flex-shrink: 0; 
  transition: all 0.2s;
  align-self: center; 
  margin-bottom: 0; 
  line-height: 1;
}
#browser.browser-app-container #new-tab-btn:hover { 
  background: var(--tab-hover); 
  transform: scale(1.05);
}
#browser.browser-app-container.layout-vertical #new-tab-btn { 
  width: 100%; 
  height: 36px; 
  margin-top: 4px; 
  margin-bottom: 0; 
}

/* ─── ツールバー ─── */
#browser.browser-app-container #toolbar {
  background: var(--toolbar-bg); 
  padding: 8px 12px; 
  display: flex;
  align-items: center; 
  gap: 8px; 
  border-bottom: 1px solid var(--border); 
  flex-shrink: 0;
}
#browser.browser-app-container .nav-btn {
  width: 32px; 
  height: 32px; 
  background: transparent; 
  border: none; 
  border-radius: 50%;
  color: var(--text-main); 
  font-size: 13px; 
  cursor: pointer; 
  display: flex;
  align-items: center; 
  justify-content: center; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  flex-shrink: 0;
}
#browser.browser-app-container .nav-btn:hover:not(:disabled) { 
  background: var(--tab-hover); 
  transform: scale(1.05);
}
#browser.browser-app-container .nav-btn:disabled { 
  color: var(--text-dim); 
  cursor: default; 
  opacity: 0.35; 
  transform: none;
}

#browser.browser-app-container #url-bar-wrap { 
  flex: 1; 
  position: relative; 
  display: flex; 
  align-items: center; 
}
#browser.browser-app-container #url-bar {
  width: 100%; 
  height: 32px; 
  background: var(--urlbar-bg);
  border: 1px solid var(--border); 
  border-radius: 99px; 
  padding: 0 36px;
  color: var(--text-main); 
  font-size: var(--font-size-main); 
  font-family: inherit;
  outline: none; 
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: inset 0 1px 2px rgba(0,0,0,0.05);
}
#browser.browser-app-container #url-bar:hover { 
  background-color: rgba(255, 255, 255, 0.05); 
  border-color: rgba(255, 255, 255, 0.15);
}
#browser.browser-app-container.theme-light #url-bar:hover { 
  background-color: rgba(255, 255, 255, 0.95); 
  border-color: rgba(0, 0, 0, 0.15);
}
#browser.browser-app-container #url-bar:focus { 
  border-color: var(--accent); 
  background: var(--urlbar-bg); 
  box-shadow: 0 0 0 3px var(--accent-light); 
}
#browser.browser-app-container #url-bar-lock { 
  position: absolute; 
  left: 12px; 
  top: 50%; 
  transform: translateY(-50%); 
  font-size: 13px; 
  color: var(--text-dim); 
  pointer-events: none; 
  display: flex; 
  align-items: center; 
}
#browser.browser-app-container #url-bar-go {
  position: absolute; 
  right: 12px; 
  background: none; 
  border: none; 
  color: var(--text-dim);
  cursor: pointer; 
  font-size: 14px; 
  padding: 0; 
  transition: color 0.15s;
}
#browser.browser-app-container #url-bar-go:hover { 
  color: var(--accent); 
}

/* ─── 検索補助ツールバー ─── */
#browser.browser-app-container #search-tools {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-left: 4px;
  margin-right: 4px;
  flex-shrink: 0;
}
#browser.browser-app-container .search-tool-btn {
  border: 1px solid var(--border);
  padding: 0 12px;
  height: 28px;
  font-size: var(--font-size-small);
  font-weight: 500;
  cursor: pointer;
  border-radius: 99px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.05);
  color: var(--text-main);
}
#browser.browser-app-container .search-tool-btn:hover {
  background: rgba(255, 255, 255, 0.12);
  transform: translateY(-1px);
}
#browser.browser-app-container #btn-search-all, 
#browser.browser-app-container #btn-search-images, 
#browser.browser-app-container #btn-search-videos {
  background: rgba(255, 255, 255, 0.06);
}
#browser.browser-app-container #btn-search-focus {
  background: rgba(0, 0, 0, 0.2);
}
#browser.browser-app-container .search-tool-btn.active {
  background: var(--accent) !important;
  color: #ffffff !important;
  border-color: var(--accent);
  box-shadow: 0 2px 6px rgba(59, 130, 246, 0.3);
}

#browser.browser-app-container.theme-light .search-tool-btn {
  background: rgba(0, 0, 0, 0.04);
  color: var(--text-main);
  border-color: rgba(0, 0, 0, 0.06);
}
#browser.browser-app-container.theme-light .search-tool-btn:hover {
  background: rgba(0, 0, 0, 0.08);
}
#browser.browser-app-container.theme-light #btn-search-focus {
  background: rgba(255, 255, 255, 0.8) !important;
}
#browser.browser-app-container.theme-light .search-tool-btn.active {
  background: var(--accent) !important;
  color: #ffffff !important;
}

/* ─── 右上お天気ウィジェット ─── */
#browser.browser-app-container #weather-widget {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
  font-weight: 500;
  color: var(--text-muted);
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid var(--border);
  padding: 0 10px;
  border-radius: 99px;
  height: 28px;
  white-space: nowrap;
  user-select: none;
  box-shadow: 0 1px 2px rgba(0,0,0,0.05);
  transition: all 0.2s;
}
#browser.browser-app-container #weather-widget:hover {
  background: rgba(255, 255, 255, 0.09);
  border-color: rgba(255, 255, 255, 0.15);
}
#browser.browser-app-container.theme-light #weather-widget {
  background: rgba(255, 255, 255, 0.75);
  color: var(--text-muted);
  border-color: rgba(0,0,0,0.05);
}
#browser.browser-app-container.theme-light #weather-widget:hover {
  background: #ffffff;
  border-color: rgba(0,0,0,0.1);
}

/* ─── コアコンテンツ領域 (左右分割対応型) ─── */
#browser.browser-app-container #content-area {
  flex: 1; 
  display: flex; 
  flex-direction: row; 
  min-height: 0;
  position: relative; 
  overflow: hidden; 
  background: var(--shell-bg);
}
#browser.browser-app-container #left-pane {
  flex: 1; 
  height: 100%; 
  position: relative; 
  min-width: 0;
  border-radius: 0 0 0 8px;
}
#browser.browser-app-container #right-pane {
  width: 50%;
  border-left: 1px solid var(--border); 
  display: none;
  height: 100%; 
  background: var(--shell-bg); 
  position: relative;
  border-radius: 0 0 8px 0;
}

#browser.browser-app-container.split-active #left-pane {
  width: 50%; 
  flex: none;
}
#browser.browser-app-container.split-active #right-pane {
  display: flex;
}

#browser.browser-app-container .page-frame {
  position: absolute; 
  inset: 0; 
  width: 100%; 
  height: 100%; 
  border: none; 
  display: none;
  background: #ffffff;
}
#browser.browser-app-container .page-frame.active {
  display: block;
}

/* ─── 新規タブページ (Acrylic OS Dashboard style) ─── */
#browser.browser-app-container .nt-page {
  position: absolute; 
  inset: 0; 
  width: 100%; 
  height: 100%; 
  background: var(--ntpage-bg); 
  display: none;
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  gap: 28px;
  overflow-y: auto; 
  padding: 30px 20px; 
  box-sizing: border-box;
  backdrop-filter: blur(30px);
  -webkit-backdrop-filter: blur(30px);
}
#browser.browser-app-container .nt-page.active { 
  display: flex; 
}

/* 検索カテゴリボタン */
#browser.browser-app-container .nt-categories {
  display: flex; 
  gap: 8px; 
  justify-content: center; 
  margin-bottom: -6px;
}
#browser.browser-app-container .nt-cat-btn {
  background: rgba(255, 255, 255, 0.05); 
  color: var(--text-muted); 
  border: 1px solid var(--border);
  padding: 6px 18px; 
  font-size: var(--font-size-small); 
  font-weight: 500; 
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); 
  border-radius: 99px;
}
#browser.browser-app-container .nt-cat-btn:hover { 
  background: rgba(255, 255, 255, 0.1); 
  transform: translateY(-1px);
}
#browser.browser-app-container .nt-cat-btn.active { 
  background: var(--accent) !important; 
  color: #ffffff !important;
  border-color: var(--accent);
  box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
}

#browser.browser-app-container.theme-light .nt-cat-btn { 
  background: rgba(255, 255, 255, 0.6); 
  color: var(--text-muted); 
  border-color: rgba(0,0,0,0.06);
}
#browser.browser-app-container.theme-light .nt-cat-btn:hover { 
  background: #ffffff; 
}

/* 検索窓 */
#browser.browser-app-container .nt-search-wrap {
  position: relative;
  width: 100%;
  max-width: 520px;
  flex-shrink: 0;
}
#browser.browser-app-container .nt-search-icon {
  position: absolute; 
  left: 18px; 
  top: 50%; 
  transform: translateY(-50%);
  font-size: 16px; 
  color: var(--text-dim); 
  pointer-events: none;
}
#browser.browser-app-container .nt-search {
  width: 100%; 
  height: 44px; 
  background: var(--search-bg); 
  border: 1px solid var(--border);
  border-radius: 99px; 
  padding: 0 20px 0 46px; 
  color: var(--text-main);
  font-size: 14px; 
  font-family: inherit; 
  outline: none; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}
#browser.browser-app-container.theme-light .nt-search { 
  box-shadow: 0 4px 15px rgba(0,0,0,0.04); 
}
#browser.browser-app-container .nt-search:focus { 
  border-color: var(--accent); 
  box-shadow: 0 0 0 4px var(--accent-light), 0 4px 20px rgba(0,0,0,0.2); 
  background: var(--search-bg);
}

#browser.browser-app-container .shortcuts {
  display: grid; 
  grid-template-columns: repeat(4, 1fr);
  gap: 16px; 
  width: 520px; 
  max-width: 100%; 
  justify-content: center;
}
#browser.browser-app-container .shortcut { 
  display: flex; 
  flex-direction: column; 
  align-items: center; 
  gap: 10px; 
  cursor: pointer; 
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1); 
  width: 100%; 
  position: relative; 
}
#browser.browser-app-container .shortcut:hover {
  transform: translateY(-2px);
}
#browser.browser-app-container .shortcut-icon {
  width: 56px; 
  height: 56px; 
  background: var(--shortcut-bg); 
  border-radius: 14px;
  display: flex; 
  align-items: center; 
  justify-content: center; 
  font-size: 24px;
  border: 1px solid var(--border); 
  box-shadow: 0 4px 10px rgba(0,0,0,0.08); 
  transition: all 0.25s;
}
#browser.browser-app-container .shortcut:hover .shortcut-icon { 
  background: var(--tab-hover); 
  border-color: rgba(255, 255, 255, 0.15);
  box-shadow: 0 8px 16px rgba(0,0,0,0.18); 
}
#browser.browser-app-container.theme-light .shortcut-icon {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0,0,0,0.12); /* Higher contrast border */
}
#browser.browser-app-container.theme-light .shortcut:hover .shortcut-icon {
  background: #ffffff;
  border-color: var(--accent);
  box-shadow: 0 6px 14px rgba(0,0,0,0.1);
}
#browser.browser-app-container .shortcut-label {
  font-size: 11px; 
  font-weight: 600; /* Made bolder for peak readability */
  color: var(--text-main); /* Changed to var(--text-main) for strongest contrast */
  text-align: center; 
  width: 100%;
  overflow: hidden; 
  text-overflow: ellipsis; 
  white-space: nowrap;
}

/* お気に入り削除ボタン */
#browser.browser-app-container .shortcut-delete-btn {
  position: absolute;
  top: -4px; 
  right: 12px;
  width: 16px; 
  height: 16px;
  background: rgba(239, 68, 68, 0.9); 
  color: white; 
  border: none;
  border-radius: 50%; 
  display: flex; 
  align-items: center; 
  justify-content: center;
  font-size: 11px; 
  font-weight: bold; 
  cursor: pointer; 
  line-height: 1; 
  z-index: 10;
  transition: all 0.15s;
  box-shadow: 0 2px 5px rgba(0,0,0,0.2);
}
#browser.browser-app-container .shortcut-delete-btn:hover {
  transform: scale(1.15); 
  background: rgb(220, 38, 38);
}
@media (hover: hover) {
  #browser.browser-app-container .shortcut-delete-btn { opacity: 0; transform: scale(0.8); }
  #browser.browser-app-container .shortcut:hover .shortcut-delete-btn { opacity: 1; transform: scale(1); }
}

/* ─── 設定パネル ─── */
#browser.browser-app-container #settings-panel {
  position: absolute; 
  top: 0; 
  right: 0; 
  width: 300px; 
  height: 100%;
  background: var(--toolbar-bg); 
  backdrop-filter: blur(35px);
  -webkit-backdrop-filter: blur(35px);
  border-left: 1px solid var(--border);
  z-index: 300; 
  display: flex; 
  flex-direction: column;
  transform: translateX(100%); 
  transition: transform 0.25s cubic-bezier(0.16, 1, 0.3, 1);
  box-shadow: -4px 0 24px rgba(0,0,0,0.15);
}
#browser.browser-app-container #settings-panel.active { 
  transform: translateX(0); 
}
#browser.browser-app-container .settings-header {
  padding: 16px; 
  border-bottom: 1px solid var(--border);
  display: flex; 
  justify-content: space-between; 
  align-items: center;
  flex-shrink: 0;
}
#browser.browser-app-container .settings-title { 
  font-weight: 600; 
  font-size: 13px; 
  letter-spacing: -0.01em;
}
#browser.browser-app-container .settings-close { 
  font-size: 20px; 
  cursor: pointer; 
  color: var(--text-dim); 
  line-height: 1;
  transition: color 0.15s;
}
#browser.browser-app-container .settings-close:hover { 
  color: var(--text-main); 
}
#browser.browser-app-container .settings-body { 
  flex: 1; 
  overflow-y: auto; 
  padding: 16px; 
}
#browser.browser-app-container .setting-group { 
  margin-bottom: 20px; 
}
#browser.browser-app-container .setting-group-title { 
  font-weight: 600; 
  font-size: 11px; 
  color: var(--text-dim); 
  margin-bottom: 10px; 
  text-transform: uppercase; 
  letter-spacing: 0.05em; 
}
#browser.browser-app-container .setting-option { 
  display: flex; 
  flex-direction: column; 
  gap: 8px; 
}
#browser.browser-app-container .setting-option label { 
  display: flex; 
  align-items: center; 
  gap: 8px; 
  font-size: var(--font-size-main); 
  cursor: pointer; 
  user-select: none; 
}

#browser.browser-app-container .setting-option input[type="radio"] {
  appearance: none; 
  background-color: transparent; 
  margin: 0; 
  font: inherit;
  color: var(--accent); 
  width: 15px; 
  height: 15px; 
  border: 1.5px solid var(--text-dim);
  border-radius: 50%; 
  display: grid; 
  place-content: center; 
  cursor: pointer;
  transition: all 0.15s;
}
#browser.browser-app-container .setting-option input[type="radio"]::before {
  content: ""; 
  width: 7px; 
  height: 7px; 
  border-radius: 50%;
  transform: scale(0); 
  transition: 120ms transform ease-in-out; 
  background-color: var(--accent);
}
#browser.browser-app-container .setting-option input[type="radio"]:checked { 
  border-color: var(--accent); 
}
#browser.browser-app-container .setting-option input[type="radio"]:checked::before { 
  transform: scale(1); 
}

#browser.browser-app-container .setting-option select {
  width: 100%; 
  padding: 6px 10px; 
  border-radius: 6px; 
  border: 1px solid var(--border);
  background: var(--urlbar-bg); 
  color: var(--text-main); 
  font-family: inherit; 
  outline: none;
  transition: all 0.15s;
}
#browser.browser-app-container .setting-option select:focus { 
  border-color: var(--accent); 
  box-shadow: 0 0 0 2px var(--accent-light);
}

/* ─── 開発コンソール ─── */
#browser.browser-app-container #console-panel {
  position: absolute; 
  bottom: 0; 
  left: 0; 
  right: 0; 
  height: 220px; 
  background: var(--console-bg);
  backdrop-filter: blur(35px);
  -webkit-backdrop-filter: blur(35px);
  border-top: 1px solid var(--border); 
  display: none; 
  flex-direction: column;
  font-family: var(--font-mono), monospace; 
  color: var(--text-main); 
  flex-shrink: 0; 
  z-index: 200;
  box-shadow: 0 -4px 20px rgba(0,0,0,0.12);
}
#browser.browser-app-container #console-panel.active { 
  display: flex; 
}
#browser.browser-app-container #console-header { 
  background: rgba(0,0,0,0.15); 
  padding: 8px 12px; 
  font-size: 11px; 
  color: var(--text-muted); 
  display: flex; 
  justify-content: space-between; 
  align-items: center; 
  border-bottom: 1px solid var(--border); 
}
#browser.browser-app-container #console-title { 
  font-weight: 600; 
}
#browser.browser-app-container #console-close { 
  cursor: pointer; 
  font-size: 16px; 
  color: var(--text-dim); 
}
#browser.browser-app-container #console-close:hover { 
  color: var(--text-main); 
}
#browser.browser-app-container #console-body { 
  flex: 1; 
  padding: 10px 12px; 
  overflow-y: auto; 
  font-size: 11px; 
  line-height: 1.6; 
  white-space: pre-wrap; 
}

.browser-app-console-line { 
  margin-bottom: 4px; 
}
.browser-app-console-line.error { color: #f87171; }
.browser-app-console-line.success { color: #34d399; }
.browser-app-console-line.info { color: #60a5fa; }
.browser-app-console-line.prompt { color: #3b82f6; }

#browser.browser-app-container #console-footer { 
  display: flex; 
  border-top: 1px solid var(--border); 
  background: rgba(0,0,0,0.1); 
  align-items: center; 
}
#browser.browser-app-container #console-prompt { 
  padding-left: 12px; 
  color: var(--accent); 
  font-size: 12px; 
  font-weight: bold; 
  user-select: none; 
}
#browser.browser-app-container #console-input { 
  flex: 1; 
  background: transparent; 
  border: none; 
  color: var(--text-main); 
  padding: 8px 6px; 
  font-family: inherit; 
  font-size: 12px; 
  outline: 0; 
}
#browser.browser-app-container #console-run-btn { 
  background: var(--accent); 
  border: none; 
  color: #fff; 
  padding: 0 16px; 
  height: 32px; 
  cursor: pointer; 
  font-family: inherit; 
  font-size: 11px; 
  transition: background-color .15s; 
}
#browser.browser-app-container #console-run-btn:hover { 
  background: #2563eb; 
}

/* ─── エラーページ ─── */
#browser.browser-app-container .error-page {
  width: 100%; 
  height: 100%; 
  flex: 1; 
  background: var(--shell-bg); 
  display: none;
  flex-direction: column; 
  align-items: center; 
  justify-content: center; 
  gap: 16px;
  color: var(--text-main); 
  text-align: center; 
  padding: 30px; 
  box-sizing: border-box;
}
#browser.browser-app-container .error-page.active { 
  display: flex; 
}
#browser.browser-app-container .error-page .err-icon {
  font-size: 36px; 
  background: rgba(239, 68, 68, 0.1); 
  border-radius: 50%;
  width: 64px; 
  height: 64px; 
  display: flex; 
  align-items: center; 
  justify-content: center;
}
#browser.browser-app-container .error-page .err-title { 
  font-size: 18px; 
  font-weight: 600; 
  color: var(--text-main); 
}
#browser.browser-app-container .error-page .err-desc { 
  font-size: var(--font-size-small); 
  line-height: 1.5; 
  max-width: 400px; 
  color: var(--text-dim); 
}
#browser.browser-app-container .error-page .err-retry {
  margin-top: 8px; 
  padding: 6px 20px; 
  background: var(--accent); 
  border: none;
  border-radius: 99px; 
  color: #fff; 
  font-size: var(--font-size-small); 
  font-weight: 500; 
  cursor: pointer;
  transition: background-color 0.15s; 
  font-family: inherit;
}
#browser.browser-app-container .error-page .err-retry:hover { 
  background: #2563eb; 
}

/* ─── ローディングバー ─── */
#browser.browser-app-container #loading-bar {
  position: absolute; 
  top: 0; 
  left: 0; 
  height: 2px; 
  background: var(--accent);
  width: 0%; 
  z-index: 100; 
  pointer-events: none;
  transition: width 0.2s ease;
}
`;
