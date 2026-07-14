/**
 * browserConstants.ts
 * Holds the rich HTML, CSS, and JS code for Virtual Browser v2 sub-apps.
 * These are loaded inside iframes using srcDoc.
 */

// We talks LINE風チャットのHTMLソース
export const CHAT_APP_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <style>
    :root {
      --line-green: #06C755;
      --chat-bg: #8cabd9;
      --text-color: #1e1e1e;
      --light-gray: #f4f4f4;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; margin: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Helvetica Neue", Arial, sans-serif;
      display: flex; flex-direction: column; background: #fff; color: var(--text-color); overflow: hidden;
    }
    .header {
      background: var(--line-green); color: white; padding: 12px 16px;
      display: flex; align-items: center; justify-content: space-between; font-weight: bold; flex-shrink: 0;
    }
    .header-btn {
      background: none; border: none; color: white; font-size: 16px; cursor: pointer; outline: none;
    }
    #view-lobby { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .lobby-title { padding: 12px 16px; font-size: 14px; color: #666; border-bottom: 1px solid #ddd; display: flex; justify-content: space-between; align-items: center; }
    #lobby-username-tag {
      font-size: 13px; color: var(--line-green); font-weight: bold; cursor: pointer;
      text-decoration: underline; text-decoration-style: dashed; transition: opacity 0.1s;
    }
    #lobby-username-tag:hover { opacity: 0.8; }
    .room-list { flex: 1; overflow-y: auto; list-style: none; }
    .room-item {
      display: flex; align-items: center; gap: 12px; padding: 14px 16px;
      border-bottom: 1px solid #eee; cursor: pointer; transition: background 0.1s;
    }
    .room-item:hover { background: #fafafa; }
    .room-avatar {
      width: 44px; height: 44px; background: #ddd; border-radius: 50%;
      display: flex; align-items: center; justify-content: center; font-size: 20px; color: white;
    }
    .room-info { flex: 1; display: flex; align-items: center; justify-content: space-between; width: 100%; }
    .room-name-wrapper { display: flex; flex-direction: column; gap: 4px; }
    .room-name { font-weight: bold; font-size: 15px; }
    .room-type { font-size: 11px; background: #eee; padding: 2px 6px; border-radius: 10px; color: #555; align-self: flex-start; }
    .room-unread-badge {
      background: #ff3b30; color: white; border-radius: 50%; padding: 2px 6px;
      font-size: 10px; font-weight: bold; min-width: 18px; height: 18px;
      display: flex; align-items: center; justify-content: center; margin-left: auto;
    }
    .btn-create {
      margin: 16px; padding: 12px; background: var(--line-green); color: white;
      border: none; border-radius: 4px; font-weight: bold; cursor: pointer; font-size: 14px; text-align: center;
    }
    #view-chat { display: none; flex-direction: column; flex: 1; overflow: hidden; background: var(--chat-bg); }
    .message-area { flex: 1; overflow-y: auto; padding: 16px; display: flex; flex-direction: column; gap: 12px; }
    .msg { display: flex; flex-direction: column; max-width: 80%; }
    .msg-sender { font-size: 11px; color: rgba(255,255,255,0.9); margin-bottom: 3px; font-weight: bold; }
    .msg-row { display: flex; align-items: flex-end; gap: 6px; }
    .msg-bubble { padding: 8px 12px; border-radius: 14px; font-size: 14px; line-height: 1.4; word-break: break-all; box-shadow: 0 1px 2px rgba(0,0,0,0.1); }
    .msg-meta { font-size: 9px; color: rgba(255,255,255,0.85); flex-shrink: 0; display: flex; flex-direction: column; gap: 1px; }
    .msg-read-status { color: #fdf156; font-weight: bold; text-align: right; }
    .msg.me { align-self: flex-start; align-items: flex-start; }
    .msg.me .msg-sender { align-self: flex-start; }
    .msg.me .msg-row { flex-direction: row; }
    .msg.me .msg-bubble { background: #95ec69; color: #191919; border-top-left-radius: 2px; }
    .msg.other { align-self: flex-end; align-items: flex-end; }
    .msg.other .msg-sender { align-self: flex-end; }
    .msg.other .msg-row { flex-direction: row-reverse; }
    .msg.other .msg-bubble { background: #ffffff; color: #191919; border-top-right-radius: 2px; }
    .input-form {
      display: flex; padding: 8px; background: white; border-top: 1px solid #ddd; gap: 8px; flex-shrink: 0;
    }
    .input-form input {
      flex: 1; border: 1px solid #ccc; border-radius: 20px; padding: 10px 16px; font-size: 14px; outline: none;
    }
    .input-form input:focus { border-color: var(--line-green); }
    .input-form button {
      background: var(--line-green); color: white; border: none; border-radius: 50%;
      width: 40px; height: 40px; font-weight: bold; cursor: pointer; display: flex; align-items: center; justify-content: center; font-size: 14px;
    }
    #view-settings { display: none; flex-direction: column; flex: 1; overflow-y: auto; padding: 16px; gap: 20px; }
    .setting-item { display: flex; flex-direction: column; gap: 6px; }
    .setting-item input, .setting-item textarea {
      padding: 10px; border: 1px solid #ccc; border-radius: 4px; font-size: 14px; outline: none; width: 100%;
    }
    .setting-item input:focus { border-color: var(--line-green); }
    .btn-save { padding: 12px; background: var(--line-green); color: white; border: none; border-radius: 4px; font-weight: bold; cursor: pointer; width: 100%; font-size: 14px; }
    .modal {
      display: none; position: fixed; inset: 0; background: rgba(0,0,0,0.5);
      align-items: center; justify-content: center; padding: 16px; z-index: 1000;
    }
    .modal.active { display: flex; }
    .modal-content { background: white; border-radius: 8px; width: 100%; max-width: 320px; padding: 20px; display: flex; flex-direction: column; gap: 14px; }
    .modal-title { font-weight: bold; font-size: 16px; }
    .modal-btns { display: flex; gap: 8px; justify-content: flex-end; }
    .modal-btn { padding: 8px 16px; border-radius: 4px; border: none; font-size: 13px; cursor: pointer; font-weight: bold; }
    .modal-btn.cancel { background: #eee; color: #333; }
    .modal-btn.confirm { background: var(--line-green); color: white; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <div class="header">
    <button class="header-btn" id="btn-back" style="visibility: hidden;">&#10094; 戻る</button>
    <span id="title-text">We talks</span>
    <button class="header-btn" id="btn-to-settings">&#9881;</button>
  </div>

  <div id="view-auth" style="display: none; flex-direction: column; flex: 1; overflow-y: auto; padding: 24px; justify-content: center; align-items: stretch; gap: 16px;">
    <div style="text-align: center; margin-bottom: 20px;">
      <div style="font-size: 48px; margin-bottom: 8px;">💬</div>
      <h2 style="font-size: 24px; font-weight: bold; color: var(--line-green);">We talks</h2>
      <p style="font-size: 13px; color: #666; margin-top: 4px;">ログインまたは新規登録してください</p>
    </div>

    <div style="display: flex; background: #eee; border-radius: 8px; padding: 4px; margin-bottom: 8px;">
      <button id="auth-tab-login" style="flex: 1; padding: 8px; border: none; background: white; font-weight: bold; border-radius: 6px; cursor: pointer; font-size: 13px;">ログイン</button>
      <button id="auth-tab-signup" style="flex: 1; padding: 8px; border: none; background: transparent; font-weight: bold; border-radius: 6px; cursor: pointer; color: #555; font-size: 13px;">新規登録</button>
    </div>

    <div class="setting-item">
      <label style="font-size: 12px; font-weight: bold; color: #555;">ユーザー名</label>
      <input type="text" id="auth-username" placeholder="ユーザー名を入力" autocomplete="off" />
    </div>

    <div class="setting-item">
      <label style="font-size: 12px; font-weight: bold; color: #555; margin-top: 8px;">パスワード (5〜10桁の数字のみ)</label>
      <input type="password" id="auth-password" placeholder="パスワードを入力" autocomplete="off" />
    </div>

    <div id="auth-error" style="color: #ff3b30; font-size: 12px; font-weight: bold; text-align: center; display: none; margin-top: 8px;"></div>

    <button class="btn-save" id="btn-auth-submit" style="margin-top: 16px;">ログイン</button>
  </div>

  <div id="view-lobby">
    <div class="lobby-title">
      <span id="lobby-online-count-tag">● オンライン: 取得中...</span>
      <span id="lobby-username-tag">取得中...</span>
    </div>
    <ul class="room-list" id="room-list-container"></ul>
    <button class="btn-create" id="btn-open-create-modal">＋ 新しいトークルームを作成</button>
  </div>

  <div id="view-chat">
    <div class="message-area" id="message-container"></div>
    <div class="input-form">
      <input type="text" id="msg-input" placeholder="メッセージを入力" autocomplete="off" />
      <button id="btn-send">&#10148;</button>
    </div>
  </div>

  <div id="view-settings">
    <div style="padding-top: 10px;">
      <h4 style="font-size:13px; color:#555; margin-bottom:10px;">Supabase 設定</h4>
      <p style="font-size:11px; color:#888; margin-bottom:10px;">リアルタイム接続を行うために、取得した「URL」と「anon key」を入力してください。</p>
      <div class="setting-item">
        <label>Supabase URL</label>
        <input type="text" id="input-supabase-url" placeholder="https://xxxxxxxxxxxxxx.supabase.co" />
      </div>
      <div class="setting-item" style="margin-top:10px;">
        <label>Supabase anon key</label>
        <textarea id="input-supabase-key" rows="4" placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."></textarea>
      </div>
    </div>
    
    <div style="border-top: 1px solid #ddd; padding-top: 15px; margin-top: 15px;">
      <h4 style="font-size:13px; color:#ff3b30; margin-bottom:10px;">トークルームの管理 (管理者用)</h4>
      <ul id="settings-room-list" style="list-style:none; padding:0; display:flex; flex-direction:column; gap:8px;"></ul>
    </div>
    
    <button class="btn-save" id="btn-save-settings" style="margin-top:20px;">保存して戻る</button>
  </div>

  <div class="modal" id="modal-create-room">
    <div class="modal-content">
      <div class="modal-title">新しいトーク</div>
      <div class="setting-item" id="container-room-name" style="display: none;">
        <label>トークルーム名</label>
        <input type="text" id="input-new-room-name" placeholder="例: 家族グループ" />
      </div>
      <div class="setting-item" id="container-direct-target">
        <label>話す相手を選択</label>
        <select id="select-direct-target" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;"></select>
      </div>
      <div class="setting-item">
        <label>タイプ</label>
        <select id="select-new-room-type" style="padding: 10px; border: 1px solid #ccc; border-radius: 4px;">
          <option value="direct">1対1</option>
          <option value="group">グループ</option>
        </select>
      </div>
      <div class="modal-btns">
        <button class="modal-btn cancel" id="btn-create-cancel">キャンセル</button>
        <button class="modal-btn confirm" id="btn-create-confirm">作成</button>
      </div>
    </div>
  </div>

  <div class="modal" id="modal-passcode">
    <div class="modal-content">
      <div class="modal-title">管理者認証</div>
      <div class="setting-item">
        <label>設定を開くにはパスキーを入力してください</label>
        <input type="password" id="input-passcode" placeholder="パスキーを入力" style="margin-top: 8px;" />
        <div id="passcode-error" style="color: #ff3333; font-size: 12px; margin-top: 6px; display: none; font-weight: bold;">パスキーが一致しません。</div>
      </div>
      <div class="modal-btns">
        <button class="modal-btn cancel" id="btn-passcode-cancel">キャンセル</button>
        <button class="modal-btn confirm" id="btn-passcode-confirm">確認</button>
      </div>
    </div>
  </div>

  <div class="modal" id="modal-change-username">
    <div class="modal-content">
      <div class="modal-title">プロフィールの編集</div>
      <div class="setting-item">
        <label>ユーザー名 (変更できません)</label>
        <input type="text" id="input-new-username" style="margin-top: 8px; background: #eee; cursor: not-allowed;" readonly autocomplete="off" />
      </div>
      <div class="setting-item" style="margin-top: 12px;">
        <label>プロフィール画像</label>
        <div style="display: flex; align-items: center; gap: 12px; margin-top: 6px;">
          <img id="profile-avatar-preview" style="width: 50px; height: 50px; border-radius: 50%; object-fit: cover; background: #ddd; border: 1px solid #ccc;" src="" />
          <input type="file" id="profile-avatar-file" accept="image/*" style="font-size: 11px;" />
        </div>
      </div>
      <div class="modal-btns" style="margin-top: 12px;">
        <button class="modal-btn cancel" id="btn-username-cancel">キャンセル</button>
        <button class="modal-btn confirm" id="btn-username-confirm">保存</button>
      </div>
      <div style="border-top: 1px solid #eee; margin-top: 14px; padding-top: 14px;">
        <button class="modal-btn" id="btn-logout" style="background: #ff3b30; color: white; width: 100%; padding: 10px; border-radius: 4px; border: none; font-weight: bold; cursor: pointer;">ログアウト</button>
      </div>
    </div>
  </div>

  <script>
    (function() {
      'use strict';

      let localStorage;
      try {
        window.localStorage.getItem('test');
        localStorage = window.localStorage;
      } catch (e) {
        localStorage = {
          _data: {},
          getItem: function(k) { return this._data[k] !== undefined ? this._data[k] : null; },
          setItem: function(k, v) { this._data[k] = String(v); },
          removeItem: function(k) { delete this._data[k]; },
          clear: function() { this._data = {}; }
        };
      }

      let sessionStorage;
      try {
        window.sessionStorage.getItem('test');
        sessionStorage = window.sessionStorage;
      } catch (e) {
        sessionStorage = {
          _data: {},
          getItem: function(k) { return this._data[k] !== undefined ? this._data[k] : null; },
          setItem: function(k, v) { this._data[k] = String(v); },
          removeItem: function(k) { delete this._data[k]; },
          clear: function() { this._data = {}; }
        };
      }

      const DB_KEY = 'wetalks_local_db_v3';
      function getLocalDB() {
        const raw = localStorage.getItem(DB_KEY);
        if (raw) return JSON.parse(raw);
        const defaultDB = { rooms: [], messages: {} };
        localStorage.setItem(DB_KEY, JSON.stringify(defaultDB));
        return defaultDB;
      }

      const seenMessageIds = new Set();
      try {
        const db = getLocalDB();
        if (db && db.messages) {
          Object.keys(db.messages).forEach(roomId => {
            db.messages[roomId].forEach(m => {
              if (m && m.id) seenMessageIds.add(m.id);
            });
          });
        }
      } catch (e) {}

      function checkAndNotifyNewMessage(msg) {
        if (!msg || !msg.id) return;
        if (seenMessageIds.has(msg.id)) return;
        seenMessageIds.add(msg.id);
        if (msg.sender !== getSessionUser()) {
          window.parent.postMessage({
            type: 'WETALKS_NEW_MESSAGE',
            payload: { sender: msg.sender, text: msg.text }
          }, '*');
        }
      }

      function saveLocalDB(db) {
        localStorage.setItem(DB_KEY, JSON.stringify(db));
      }

      const SESSION_USER_KEY = 'wetalks_session_user';
      let currentIp = "unknown_ip";
      let authMode = 'login'; // 'login' or 'signup'
      let selectedAvatarBase64 = null;
      let cachedUsers = [];
      let hasSupabaseUsersTableError = false;
      let hasSupabaseRoomsTableError = false;
      let hasSupabaseMessagesTableError = false;

      async function callServerAPI(endpoint, method = 'GET', body = null) {
        try {
          const options = {
            method: method,
            headers: {
              'Content-Type': 'application/json'
            }
          };
          if (body) {
            options.body = JSON.stringify(body);
          }
          
          let fetchUrl = endpoint;
          if (endpoint.startsWith('/')) {
            try {
              fetchUrl = window.parent.location.origin + endpoint;
            } catch (err) {
              fetchUrl = window.location.origin + endpoint;
            }
          }
          
          const res = await fetch(fetchUrl, options);
          if (!res.ok) {
            throw new Error('API error: ' + res.statusText);
          }
          return await res.json();
        } catch (e) {
          console.error('Error calling server API ' + endpoint + ':', e);
          return null;
        }
      }

      async function loadCachedUsers() {
        if (!supabaseClient || hasSupabaseUsersTableError) {
          const apiUsers = await callServerAPI('/api/wetalks/users');
          if (apiUsers) {
            cachedUsers = apiUsers.map(u => ({
              username: u.username,
              password: u.password_numeric,
              avatar: u.avatar_base64
            }));
          } else {
            cachedUsers = JSON.parse(localStorage.getItem('wetalks_registered_users') || localStorage.getItem('wetalks_accounts_db') || '[]');
          }
          return;
        }
        try {
          const { data, error } = await supabaseClient.from('wetalks_users').select('*');
          if (data && !error) {
            cachedUsers = data.map(u => ({
              username: u.username,
              password: u.password_numeric,
              avatar: u.avatar_base64
            }));
          } else {
            console.warn("Could not query wetalks_users, falling back to server API:", error);
            if (error && (error.message.includes("Could not find the table") || error.code === '42P01' || error.message.includes("schema cache"))) {
              hasSupabaseUsersTableError = true;
            }
            const apiUsers = await callServerAPI('/api/wetalks/users');
            if (apiUsers) {
              cachedUsers = apiUsers.map(u => ({
                username: u.username,
                password: u.password_numeric,
                avatar: u.avatar_base64
              }));
            } else {
              cachedUsers = JSON.parse(localStorage.getItem('wetalks_registered_users') || localStorage.getItem('wetalks_accounts_db') || '[]');
            }
          }
        } catch(e) {
          console.error("Error loading cached users:", e);
          const apiUsers = await callServerAPI('/api/wetalks/users');
          if (apiUsers) {
            cachedUsers = apiUsers.map(u => ({
              username: u.username,
              password: u.password_numeric,
              avatar: u.avatar_base64
            }));
          } else {
            cachedUsers = JSON.parse(localStorage.getItem('wetalks_registered_users') || localStorage.getItem('wetalks_accounts_db') || '[]');
          }
        }
      }

      async function fetchUserIpAndInitName() {
        try {
          const res = await fetch("https://api.ipify.org?format=json");
          const data = await res.json();
          if (data && data.ip) currentIp = data.ip;
        } catch (e) {
          console.warn("IP Address API Fetch error, using default device storage fallback.", e);
        }
        
        await loadCachedUsers();
        
        const loggedIn = localStorage.getItem('wetalks_logged_in_user');
        if (loggedIn) {
          const found = cachedUsers.find(u => u.username === loggedIn);
          if (found) {
            sessionStorage.setItem(SESSION_USER_KEY, found.username);
            switchView('lobby');
            return;
          }
        }
        switchView('auth');
      }

      function getSessionUser() {
        return sessionStorage.getItem(SESSION_USER_KEY) || "ゲスト";
      }

      function getUserAvatar(username) {
        try {
          const found = cachedUsers.find(u => u.username === username);
          if (found && found.avatar) return found.avatar;
        } catch(e) {}
        return '';
      }

      let currentView = 'lobby';
      let activeRoomId = null;
      let supabaseClient = null;
      let msgChannel = null;
      let presenceChannel = null;
      let roomPresenceMembers = [];

      const ACTIVE_USERS_KEY = 'wetalks_active_users_in_rooms_v1';
      const READ_MAP_KEY = 'wetalks_read_messages_map_v1';
      let localPresenceInterval = null;

      function markMessageAsReadLocal(msgId, count) {
        let map = {};
        try {
          const raw = localStorage.getItem(READ_MAP_KEY);
          if (raw) map = JSON.parse(raw);
        } catch(e) {}
        if (!map[msgId] || map[msgId] < count) {
          map[msgId] = count;
          localStorage.setItem(READ_MAP_KEY, JSON.stringify(map));
          return true;
        }
        return false;
      }

      function getMessageReadCountLocal(msgId) {
        let map = {};
        try {
          const raw = localStorage.getItem(READ_MAP_KEY);
          if (raw) map = JSON.parse(raw);
        } catch(e) {}
        return map[msgId] || 0;
      }

      function startLocalPresence() {
        if (localPresenceInterval) clearInterval(localPresenceInterval);
        localPresenceInterval = setInterval(() => {
          if (!activeRoomId) return;
          let data = {};
          try {
            const raw = localStorage.getItem(ACTIVE_USERS_KEY);
            if (raw) data = JSON.parse(raw);
          } catch(e) {}
          if (!data[activeRoomId]) data[activeRoomId] = {};
          data[activeRoomId][getSessionUser()] = Date.now();
          localStorage.setItem(ACTIVE_USERS_KEY, JSON.stringify(data));
          updateReadReceipts();
        }, 1000);
      }

      function stopLocalPresence() {
        if (localPresenceInterval) {
          clearInterval(localPresenceInterval);
          localPresenceInterval = null;
        }
        if (!activeRoomId) return;
        let data = {};
        try {
          const raw = localStorage.getItem(ACTIVE_USERS_KEY);
          if (raw) data = JSON.parse(raw);
        } catch(e) {}
        if (data[activeRoomId]) {
          delete data[activeRoomId][getSessionUser()];
          localStorage.setItem(ACTIVE_USERS_KEY, JSON.stringify(data));
        }
      }

      function updateReadReceipts() {
        const myName = getSessionUser();
        let otherActiveCount = 0;

        if (supabaseClient) {
          otherActiveCount = roomPresenceMembers.filter(member => member !== myName).length;
        } else {
          let data = {};
          try {
            const raw = localStorage.getItem(ACTIVE_USERS_KEY);
            if (raw) data = JSON.parse(raw);
          } catch(e) {}
          const membersInRoom = data[activeRoomId] || {};
          const now = Date.now();
          const activeMembers = Object.keys(membersInRoom).filter(user => {
            return user !== myName && (now - membersInRoom[user]) < 5000;
          });
          otherActiveCount = activeMembers.length;
        }

        if (otherActiveCount > 0) {
          const db = getLocalDB();
          const msgs = db.messages[activeRoomId] || [];
          let changed = false;
          msgs.forEach(m => {
            if (m.sender === getSessionUser()) {
              if (markMessageAsReadLocal(m.id, otherActiveCount)) {
                changed = true;
              }
            }
          });
          if (changed && !supabaseClient) {
            saveLocalDB(db);
          }
        }

        document.querySelectorAll('.msg.me').forEach(el => {
          const msgId = el.getAttribute('data-msgid');
          let count = getMessageReadCountLocal(msgId);
          count = Math.max(count, otherActiveCount);
          const readStatusEl = el.querySelector('.msg-read-status');
          if (readStatusEl) {
            readStatusEl.textContent = count > 0 ? (count > 1 ? "既読 " + count : "既読") : "";
          }
        });
      }

      let unreadCounts = {};

      const DOM = {
        viewAuth: document.getElementById('view-auth'),
        authTabLogin: document.getElementById('auth-tab-login'),
        authTabSignup: document.getElementById('auth-tab-signup'),
        authUsername: document.getElementById('auth-username'),
        authPassword: document.getElementById('auth-password'),
        authError: document.getElementById('auth-error'),
        btnAuthSubmit: document.getElementById('btn-auth-submit'),
        profileAvatarPreview: document.getElementById('profile-avatar-preview'),
        profileAvatarFile: document.getElementById('profile-avatar-file'),
        btnLogout: document.getElementById('btn-logout'),
        viewLobby: document.getElementById('view-lobby'),
        viewChat: document.getElementById('view-chat'),
        viewSettings: document.getElementById('view-settings'),
        btnBack: document.getElementById('btn-back'),
        btnToSettings: document.getElementById('btn-to-settings'),
        titleText: document.getElementById('title-text'),
        roomList: document.getElementById('room-list-container'),
        messageContainer: document.getElementById('message-container'),
        msgInput: document.getElementById('msg-input'),
        btnSend: document.getElementById('btn-send'),
        lobbyUsernameTag: document.getElementById('lobby-username-tag'),
        lobbyOnlineCountTag: document.getElementById('lobby-online-count-tag'),
        btnSaveSettings: document.getElementById('btn-save-settings'),
        inputSupabaseUrl: document.getElementById('input-supabase-url'),
        inputSupabaseKey: document.getElementById('input-supabase-key'),
        modalCreate: document.getElementById('modal-create-room'),
        btnOpenCreate: document.getElementById('btn-open-create-modal'),
        btnCreateCancel: document.getElementById('btn-create-cancel'),
        btnCreateConfirm: document.getElementById('btn-create-confirm'),
        inputNewRoomName: document.getElementById('input-new-room-name'),
        selectNewRoomType: document.getElementById('select-new-room-type'),
        containerRoomName: document.getElementById('container-room-name'),
        containerDirectTarget: document.getElementById('container-direct-target'),
        selectDirectTarget: document.getElementById('select-direct-target'),
        modalPasscode: document.getElementById('modal-passcode'),
        inputPasscode: document.getElementById('input-passcode'),
        btnPasscodeCancel: document.getElementById('btn-passcode-cancel'),
        btnPasscodeConfirm: document.getElementById('btn-passcode-confirm'),
        passcodeError: document.getElementById('passcode-error'),
        modalUsername: document.getElementById('modal-change-username'),
        inputNewUsername: document.getElementById('input-new-username'),
        btnUsernameCancel: document.getElementById('btn-username-cancel'),
        btnUsernameConfirm: document.getElementById('btn-username-confirm')
      };

      async function initSupabase() {
        let url = localStorage.getItem('wetalks_supabase_url');
        let key = localStorage.getItem('wetalks_supabase_key');
        if (!url || !key) {
          url = 'https://nsyvlftqcciyetsbhymg.supabase.co';
          key = 'sb_publishable_lkhrFuMlNyEmUX4RTFApKw_AhD1sAkV';
          localStorage.setItem('wetalks_supabase_url', url);
          localStorage.setItem('wetalks_supabase_key', key);
        }
        if (url && key) {
          try {
            if (typeof supabase !== 'undefined') {
              supabaseClient = supabase.createClient(url, key);
              initGlobalPresence();
              initGlobalMessageListener();
              await loadCachedUsers();
            } else {
              console.warn("Supabase SDK is not loaded. Running in local-only fallback mode.");
            }
          } catch(e) {
            console.error("Failed to initialize Supabase:", e);
          }
        }
      }

      function initGlobalPresence() {
        if (!supabaseClient) return;
        presenceChannel = supabaseClient.channel('global-online-presence');
        presenceChannel
          .on('presence', { event: 'sync' }, () => {
            const state = presenceChannel.presenceState();
            const count = Object.keys(state).length;
            DOM.lobbyOnlineCountTag.textContent = "● オンライン: " + count + "人";
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await presenceChannel.track({ user: getSessionUser(), onlineAt: new Date().toISOString() });
            }
          });
      }

      function initGlobalMessageListener() {
        if (!supabaseClient) return;
        supabaseClient
          .channel('global-messages-unread')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, payload => {
            const msg = payload.new;
            checkAndNotifyNewMessage(msg);
            if (msg.room_id !== activeRoomId && msg.sender !== getSessionUser()) {
              unreadCounts[msg.room_id] = (unreadCounts[msg.room_id] || 0) + 1;
              if (currentView === 'lobby') renderLobby();
            }
          })
          .subscribe();
      }

      function switchView(view) {
        currentView = view;
        DOM.viewAuth.style.display = (view === 'auth') ? 'flex' : 'none';
        DOM.viewLobby.style.display = (view === 'lobby') ? 'flex' : 'none';
        DOM.viewChat.style.display = (view === 'chat') ? 'flex' : 'none';
        DOM.viewSettings.style.display = (view === 'settings') ? 'flex' : 'none';

        if (view === 'auth') {
          stopLocalPresence();
          DOM.btnBack.style.visibility = 'hidden';
          DOM.btnToSettings.style.visibility = 'hidden';
          DOM.titleText.textContent = 'We talks';
        } else if (view === 'lobby') {
          stopLocalPresence();
          DOM.btnBack.style.visibility = 'hidden';
          DOM.btnToSettings.style.visibility = 'visible';
          DOM.titleText.textContent = 'We talks';
          activeRoomId = null;
          renderLobby();
        } else if (view === 'chat') {
          startLocalPresence();
          DOM.btnBack.style.visibility = 'visible';
          DOM.btnToSettings.style.visibility = 'hidden';
          unreadCounts[activeRoomId] = 0;
          loadRoomTitleAndRender();
        } else if (view === 'settings') {
          stopLocalPresence();
          DOM.btnBack.style.visibility = 'visible';
          DOM.btnToSettings.style.visibility = 'hidden';
          DOM.titleText.textContent = '接続キー設定';
          DOM.inputSupabaseUrl.value = localStorage.getItem('wetalks_supabase_url') || '';
          DOM.inputSupabaseKey.value = localStorage.getItem('wetalks_supabase_key') || '';
          renderSettingsRoomList();
        }
      }

      async function renderSettingsRoomList() {
        const container = document.getElementById('settings-room-list');
        if (!container) return;
        container.innerHTML = '';
        let rooms = [];
        if (supabaseClient && !hasSupabaseRoomsTableError) {
          const { data, error } = await supabaseClient.from('rooms').select('*');
          if (error) {
            if (error.message.includes("Could not find the table") || error.code === '42P01' || error.message.includes("schema cache")) {
              hasSupabaseRoomsTableError = true;
            }
            const apiRooms = await callServerAPI('/api/wetalks/rooms');
            rooms = apiRooms || getLocalDB().rooms;
          } else if (data) {
            rooms = data;
          }
        } else {
          const apiRooms = await callServerAPI('/api/wetalks/rooms');
          rooms = apiRooms || getLocalDB().rooms;
        }
        if (rooms.length === 0) {
          container.innerHTML = '<li style="font-size:11px; color:#888;">作成されたルームはありません。</li>';
          return;
        }
        rooms.forEach(room => {
          const li = document.createElement('li');
          li.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.03); padding:8px 12px; border-radius:4px;';
          const nameSpan = document.createElement('span');
          nameSpan.style.cssText = 'font-size:13px; font-weight:bold;';
          let displayName = room.name;
          if (room.type === 'direct') {
            const myName = getSessionUser();
            const parts = room.name.replace(/@/g, '').split(' & ');
            if (parts.length === 2) {
              displayName = parts[0] === myName ? parts[1] : parts[0];
              displayName = "1対1: " + displayName;
            }
          }
          nameSpan.textContent = displayName;
          const delBtn = document.createElement('button');
          delBtn.style.cssText = 'background:#ff3b30; color:white; border:none; padding:4px 10px; border-radius:4px; font-size:11px; cursor:pointer; font-weight:bold;';
          delBtn.textContent = '削除';
          delBtn.addEventListener('click', async () => {
            if (confirm("本当に「" + room.name + "」トークルームと、その中のチャット履歴をすべて削除しますか？")) {
              await deleteRoomAndMessages(room.id);
              renderSettingsRoomList();
              renderLobby();
            }
          });
          li.appendChild(nameSpan);
          li.appendChild(delBtn);
          container.appendChild(li);
        });
      }

      async function deleteRoomAndMessages(roomId) {
        if (supabaseClient && !hasSupabaseRoomsTableError && !hasSupabaseMessagesTableError) {
          try {
            await supabaseClient.from('messages').delete().eq('room_id', roomId);
            await supabaseClient.from('rooms').delete().eq('id', roomId);
            const ch = supabaseClient.channel('global-lobby');
            ch.subscribe((status) => {
              if (status === 'SUBSCRIBED') {
                ch.send({ type: 'broadcast', event: 'room_deleted', payload: { roomId } }).then(() => {
                  supabaseClient.removeChannel(ch);
                });
              }
            });
          } catch(e) {
            console.error(e);
          }
        }
        
        // Delete on shared server API too
        await callServerAPI('/api/wetalks/rooms/' + roomId, 'DELETE');
        
        // Always delete locally too for consistency and fallback
        const db = getLocalDB();
        db.rooms = db.rooms.filter(r => r.id !== roomId);
        if (db.messages[roomId]) delete db.messages[roomId];
        saveLocalDB(db);
      }

      async function loadRoomTitleAndRender() {
        let rawName = "トークルーム";
        let type = "group";
        if (supabaseClient && !hasSupabaseRoomsTableError) {
          const { data, error } = await supabaseClient.from('rooms').select('*').eq('id', activeRoomId).single();
          if (error) {
            if (error.message.includes("Could not find the table") || error.code === '42P01' || error.message.includes("schema cache")) {
              hasSupabaseRoomsTableError = true;
            }
            const apiRooms = await callServerAPI('/api/wetalks/rooms');
            const room = (apiRooms || getLocalDB().rooms).find(r => r.id === activeRoomId);
            if (room) {
              rawName = room.name;
              type = room.type;
            }
          } else if (data) {
            rawName = data.name;
            type = data.type;
          }
        } else {
          const apiRooms = await callServerAPI('/api/wetalks/rooms');
          const room = (apiRooms || getLocalDB().rooms).find(r => r.id === activeRoomId);
          if (room) {
            rawName = room.name;
            type = room.type;
          }
        }

        let displayName = rawName;
        if (type === 'direct' && rawName) {
          const myName = getSessionUser();
          const parts = rawName.replace(/@/g, '').split(' & ');
          if (parts.length === 2) {
            displayName = parts[0] === myName ? parts[1] : parts[0];
          }
        }
        DOM.titleText.textContent = displayName;
        renderMessages();
      }

      async function renderLobby() {
        DOM.lobbyUsernameTag.textContent = getSessionUser();
        let rooms = [];
        if (supabaseClient && !hasSupabaseRoomsTableError) {
          const { data, error } = await supabaseClient.from('rooms').select('*');
          if (error) {
            if (error.message.includes("Could not find the table") || error.code === '42P01' || error.message.includes("schema cache")) {
              hasSupabaseRoomsTableError = true;
            }
            const apiRooms = await callServerAPI('/api/wetalks/rooms');
            rooms = apiRooms || getLocalDB().rooms;
          } else if (data) {
            rooms = data;
          }
        } else {
          const apiRooms = await callServerAPI('/api/wetalks/rooms');
          rooms = apiRooms || getLocalDB().rooms;
        }

        DOM.roomList.innerHTML = '';
        rooms.forEach(room => appendRoomItem(room));
      }

      function appendRoomItem(room) {
        let displayName = room.name;
        if (room.type === 'direct') {
          const myName = getSessionUser();
          const parts = room.name.replace(/@/g, '').split(' & ');
          if (parts.length === 2) {
            if (parts[0] !== myName && parts[1] !== myName) {
              // Direct message is not with current user, so hide it!
              return;
            }
            displayName = parts[0] === myName ? parts[1] : parts[0];
          } else {
            // Fallback for legacy formats
            if (!room.name.includes(myName)) {
              return;
            }
          }
        }

        const li = document.createElement('li');
        li.className = 'room-item';
        li.addEventListener('click', () => {
          activeRoomId = room.id;
          switchView('chat');
        });
        const avatar = document.createElement('div');
        avatar.className = 'room-avatar';
        avatar.textContent = room.type === 'group' ? '👥' : '👤';
        if (room.type === 'group') avatar.style.background = '#4ec5f1';

        const info = document.createElement('div');
        info.className = 'room-info';
        const wrapper = document.createElement('div');
        wrapper.className = 'room-name-wrapper';
        const name = document.createElement('div');
        name.className = 'room-name';
        name.textContent = displayName;
        const type = document.createElement('span');
        type.className = 'room-type';
        type.textContent = room.type === 'group' ? 'グループトーク' : '1対1トーク';
        wrapper.appendChild(name);
        wrapper.appendChild(type);
        info.appendChild(wrapper);

        const unread = unreadCounts[room.id] || 0;
        if (unread > 0) {
          const badge = document.createElement('span');
          badge.className = 'room-unread-badge';
          badge.textContent = unread;
          info.appendChild(badge);
        }
        li.appendChild(avatar);
        li.appendChild(info);
        DOM.roomList.appendChild(li);
      }

      function formatTime(createdAt) {
        const date = createdAt ? new Date(createdAt) : new Date();
        const hrs = String(date.getHours()).padStart(2, '0');
        const mins = String(date.getMinutes()).padStart(2, '0');
        return hrs + ':' + mins;
      }

      async function renderMessages() {
        if (!activeRoomId) return;
        let msgs = [];
        let fromSupabase = false;
        if (supabaseClient && !hasSupabaseMessagesTableError) {
          const { data, error } = await supabaseClient.from('messages').select('*').eq('room_id', activeRoomId).order('id', { ascending: true });
          if (error) {
            if (error.message.includes("Could not find the table") || error.code === '42P01' || error.message.includes("schema cache")) {
              hasSupabaseMessagesTableError = true;
            }
            const apiMsgs = await callServerAPI('/api/wetalks/messages/' + activeRoomId);
            msgs = apiMsgs || getLocalDB().messages[activeRoomId] || [];
          } else if (data) {
            msgs = data;
            fromSupabase = true;
          }
          if (msgChannel && !hasSupabaseMessagesTableError) {
            supabaseClient.removeChannel(msgChannel);
            msgChannel = null;
          }
          if (!hasSupabaseMessagesTableError) {
            msgChannel = supabaseClient.channel('room-' + activeRoomId);
            msgChannel
              .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: 'room_id=eq.' + activeRoomId }, payload => {
                const msg = payload.new;
                checkAndNotifyNewMessage(msg);
                appendMessageBubble(msg);
                DOM.messageContainer.scrollTop = DOM.messageContainer.scrollHeight;
              })
              .on('presence', { event: 'sync' }, () => {
                const state = msgChannel.presenceState();
                roomPresenceMembers = Object.values(state).flatMap(presences => presences.map(p => p.user));
                updateReadReceipts();
              })
              .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') await msgChannel.track({ user: getSessionUser() });
              });
          }
        } else {
          const apiMsgs = await callServerAPI('/api/wetalks/messages/' + activeRoomId);
          msgs = apiMsgs || getLocalDB().messages[activeRoomId] || [];
        }

        DOM.messageContainer.innerHTML = '';
        msgs.forEach(msg => {
          if (fromSupabase) {
            if (msg && msg.id) seenMessageIds.add(msg.id);
            appendMessageBubble(msg);
          } else {
            checkAndNotifyNewMessage(msg);
            appendMessageBubble(msg);
          }
        });
        DOM.messageContainer.scrollTop = DOM.messageContainer.scrollHeight;
      }

      function appendMessageBubble(msg) {
        const isMe = msg.sender === getSessionUser();
        const msgDiv = document.createElement('div');
        msgDiv.className = 'msg ' + (isMe ? 'me' : 'other');
        msgDiv.setAttribute('data-msgid', msg.id);

        if (!isMe) {
          const senderName = document.createElement('div');
          senderName.className = 'msg-sender';
          senderName.textContent = msg.sender;
          msgDiv.appendChild(senderName);
        }

        const msgRow = document.createElement('div');
        msgRow.className = 'msg-row';

        // Prepend custom profile avatar next to message bubbles
        const avatarImg = document.createElement('img');
        avatarImg.style.cssText = 'width: 28px; height: 28px; border-radius: 50%; object-fit: cover; border: 1px solid rgba(255,255,255,0.25); flex-shrink: 0;';
        const av = getUserAvatar(msg.sender);
        if (av) {
          avatarImg.src = av;
        } else {
          avatarImg.src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 28 28"><circle cx="14" cy="14" r="14" fill="%23e2e8f0"/><text x="14" y="18" font-family="sans-serif" font-size="12" font-weight="bold" fill="%23475569" text-anchor="middle">' + encodeURIComponent(msg.sender.charAt(0).toUpperCase()) + '</text></svg>';
        }
        msgRow.appendChild(avatarImg);

        const bubble = document.createElement('div');
        bubble.className = 'msg-bubble';
        bubble.textContent = msg.text;

        const meta = document.createElement('div');
        meta.className = 'msg-meta';
        const readStatus = document.createElement('div');
        readStatus.className = 'msg-read-status';

        if (isMe) {
          let count = getMessageReadCountLocal(msg.id);
          if (supabaseClient) {
            count = Math.max(count, roomPresenceMembers.filter(member => member !== getSessionUser()).length);
          } else {
            let data = {};
            try {
              const raw = localStorage.getItem(ACTIVE_USERS_KEY);
              if (raw) data = JSON.parse(raw);
            } catch(e) {}
            const membersInRoom = data[activeRoomId] || {};
            const now = Date.now();
            const localCount = Object.keys(membersInRoom).filter(u => u !== getSessionUser() && (now - membersInRoom[u]) < 5000).length;
            count = Math.max(count, localCount);
          }
          if (count > 0) readStatus.textContent = count > 1 ? "既読 " + count : "既読";
        }

        const time = document.createElement('div');
        time.className = 'msg-time';
        time.textContent = formatTime(msg.created_at);
        meta.appendChild(readStatus);
        meta.appendChild(time);
        msgRow.appendChild(bubble);
        msgRow.appendChild(meta);
        msgDiv.appendChild(msgRow);
        DOM.messageContainer.appendChild(msgDiv);
      }

      async function sendMessage() {
        const text = DOM.msgInput.value.trim();
        if (!text) return;
        const msg = { room_id: activeRoomId, sender: getSessionUser(), text: text };
        if (supabaseClient && !hasSupabaseMessagesTableError) {
          const { error } = await supabaseClient.from('messages').insert([msg]);
          if (error) {
            console.warn("Supabase sendMessage failed, saving locally:", error);
            if (error.message.includes("Could not find the table") || error.code === '42P01' || error.message.includes("schema cache")) {
              hasSupabaseMessagesTableError = true;
            }
            
            // Try saving on shared server API
            const res = await callServerAPI('/api/wetalks/messages', 'POST', msg);
            if (!res) {
              const db = getLocalDB();
              if (!db.messages[activeRoomId]) db.messages[activeRoomId] = [];
              const localMsg = { id: 'm-' + Date.now(), sender: msg.sender, text: msg.text, created_at: new Date().toISOString() };
              db.messages[activeRoomId].push(localMsg);
              saveLocalDB(db);
            }
            renderMessages();
          } else {
            // Also write to server database to keep them in sync
            await callServerAPI('/api/wetalks/messages', 'POST', msg);
          }
        } else {
          const res = await callServerAPI('/api/wetalks/messages', 'POST', msg);
          if (!res) {
            const db = getLocalDB();
            if (!db.messages[activeRoomId]) db.messages[activeRoomId] = [];
            const localMsg = { id: 'm-' + Date.now(), sender: msg.sender, text: msg.text, created_at: new Date().toISOString() };
            db.messages[activeRoomId].push(localMsg);
            saveLocalDB(db);
          }
          renderMessages();
        }
        DOM.msgInput.value = '';
      }

      async function createRoom() {
        const type = DOM.selectNewRoomType.value;
        let roomName = "";
        
        if (type === 'direct') {
          const targetUser = DOM.selectDirectTarget.value;
          if (!targetUser) {
            alert("話す相手のユーザーを選択してください。");
            return;
          }
          const sorted = [getSessionUser(), targetUser].sort();
          roomName = "@" + sorted[0] + " & @" + sorted[1];
          
          // Check if direct room already exists
          let roomsList = [];
          if (supabaseClient && !hasSupabaseRoomsTableError) {
            const { data, error } = await supabaseClient.from('rooms').select('*');
            if (error) {
              if (error.message.includes("Could not find the table") || error.code === '42P01' || error.message.includes("schema cache")) {
                hasSupabaseRoomsTableError = true;
              }
              const apiRooms = await callServerAPI('/api/wetalks/rooms');
              roomsList = apiRooms || getLocalDB().rooms;
            } else if (data) {
              roomsList = data;
            }
          } else {
            const apiRooms = await callServerAPI('/api/wetalks/rooms');
            roomsList = apiRooms || getLocalDB().rooms;
          }
          const existing = roomsList.find(r => r.name === roomName && r.type === 'direct');
          if (existing) {
            DOM.modalCreate.classList.remove('active');
            activeRoomId = existing.id;
            switchView('chat');
            return;
          }
        } else {
          roomName = DOM.inputNewRoomName.value.trim();
          if (!roomName) {
            alert("トークルーム名を入力してください。");
            return;
          }
        }
        
        const roomId = 'room-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4);
  
         if (supabaseClient && !hasSupabaseRoomsTableError) {
          const { error } = await supabaseClient.from('rooms').insert([{ id: roomId, name: roomName, type }]);
          if (error) {
            console.warn("Supabase createRoom failed, saving locally:", error);
            if (error.message.includes("Could not find the table") || error.code === '42P01' || error.message.includes("schema cache")) {
              hasSupabaseRoomsTableError = true;
            }
            // Try saving on shared server API
            const res = await callServerAPI('/api/wetalks/rooms', 'POST', { id: roomId, name: roomName, type });
            if (!res) {
              const db = getLocalDB();
              db.rooms.push({ id: roomId, name: roomName, type });
              db.messages[roomId] = [];
              saveLocalDB(db);
            }
          } else {
            // Success in Supabase, also save to server database for fallback users
            await callServerAPI('/api/wetalks/rooms', 'POST', { id: roomId, name: roomName, type });
          }
        } else {
          const res = await callServerAPI('/api/wetalks/rooms', 'POST', { id: roomId, name: roomName, type });
          if (!res) {
            const db = getLocalDB();
            db.rooms.push({ id: roomId, name: roomName, type });
            db.messages[roomId] = [];
            saveLocalDB(db);
          }
        }
        DOM.inputNewRoomName.value = '';
        DOM.modalCreate.classList.remove('active');
        activeRoomId = roomId;
        switchView('chat');
      }

      DOM.btnBack.addEventListener('click', () => {
        if (currentView === 'chat' || currentView === 'settings') {
          if (msgChannel && supabaseClient) {
            supabaseClient.removeChannel(msgChannel);
            msgChannel = null;
          }
          switchView('lobby');
        }
      });

      DOM.btnToSettings.addEventListener('click', () => {
        DOM.inputPasscode.value = '';
        DOM.passcodeError.style.display = 'none';
        DOM.modalPasscode.classList.add('active');
        DOM.inputPasscode.focus();
      });

      DOM.btnPasscodeCancel.addEventListener('click', () => DOM.modalPasscode.classList.remove('active'));
      DOM.btnPasscodeConfirm.addEventListener('click', () => {
        if (DOM.inputPasscode.value === 'mozunbu_1203') {
          DOM.modalPasscode.classList.remove('active');
          switchView('settings');
        } else {
          DOM.passcodeError.style.display = 'block';
        }
      });

      // Auth screen tab switches
      DOM.authTabLogin.addEventListener('click', () => {
        authMode = 'login';
        DOM.authTabLogin.style.background = 'white';
        DOM.authTabLogin.style.color = 'black';
        DOM.authTabSignup.style.background = 'transparent';
        DOM.authTabSignup.style.color = '#555';
        DOM.btnAuthSubmit.textContent = 'ログイン';
        DOM.authError.style.display = 'none';
      });

      DOM.authTabSignup.addEventListener('click', () => {
        authMode = 'signup';
        DOM.authTabSignup.style.background = 'white';
        DOM.authTabSignup.style.color = 'black';
        DOM.authTabLogin.style.background = 'transparent';
        DOM.authTabLogin.style.color = '#555';
        DOM.btnAuthSubmit.textContent = '新規作成してログイン';
        DOM.authError.style.display = 'none';
      });

      // Auth form submission handler
      DOM.btnAuthSubmit.addEventListener('click', async () => {
        const username = DOM.authUsername.value.trim();
        const password = DOM.authPassword.value.trim();

        if (!username) {
          showAuthError("ユーザー名を入力してください。");
          return;
        }
        if (!password) {
          showAuthError("パスワードを入力してください。");
          return;
        }

        // Reload cached users in real-time
        await loadCachedUsers();

        if (authMode === 'signup') {
          // Rule 1: Unique username
          const userExists = cachedUsers.some(u => String(u.username).toLowerCase().trim() === username.toLowerCase());
          if (userExists) {
            showAuthError("このユーザー名は既に登録されています");
            return;
          }

          // Rule 2: Passcode 5 to 10 digits
          const trimmedPassword = password.trim();
          const isNumeric = /^[0-9]+$/.test(trimmedPassword);
          const isCorrectLength = trimmedPassword.length >= 5 && trimmedPassword.length <= 10;
          if (!isNumeric || !isCorrectLength) {
            showAuthError("パスワードは5〜10桁の数字で入力してください");
            return;
          }

          // Rule 3: Password uniqueness
          const passExists = cachedUsers.some(u => String(u.password).trim() === trimmedPassword);
          if (passExists) {
            showAuthError("このパスコードは既に登録されています");
            return;
          }

          // Successfully validated! Register user in Supabase
          let registeredSuccessfully = false;
          if (supabaseClient && !hasSupabaseUsersTableError) {
            try {
              const { error: insertErr } = await supabaseClient
                .from('wetalks_users')
                .insert([{
                  username: username,
                  password_numeric: trimmedPassword,
                  avatar_base64: ''
                }]);
              if (insertErr) {
                console.warn("Supabase registration failed, falling back to server API registration:", insertErr);
                hasSupabaseUsersTableError = true;
              } else {
                registeredSuccessfully = true;
                // Sync with server database too
                await callServerAPI('/api/wetalks/users', 'POST', {
                  username: username,
                  password_numeric: trimmedPassword,
                  avatar_base64: ''
                });
              }
            } catch (err) {
              console.warn("Supabase registration threw error, falling back:", err);
              hasSupabaseUsersTableError = true;
            }
          }

          if (!registeredSuccessfully || hasSupabaseUsersTableError) {
            // Save to shared server database via API
            const apiRes = await callServerAPI('/api/wetalks/users', 'POST', {
              username: username,
              password_numeric: trimmedPassword,
              avatar_base64: ''
            });
            
            if (apiRes && apiRes.success) {
              registeredSuccessfully = true;
            } else {
              // Local fallback if server API is completely down too
              const newUser = {
                username: username,
                password: trimmedPassword,
                avatar: ''
              };
              const users = JSON.parse(localStorage.getItem('wetalks_registered_users') || localStorage.getItem('wetalks_accounts_db') || '[]');
              // Double check uniqueness locally
              if (users.some(u => String(u.username).toLowerCase().trim() === username.toLowerCase())) {
                showAuthError("このユーザー名は既に登録されています");
                return;
              }
              users.push(newUser);
              localStorage.setItem('wetalks_registered_users', JSON.stringify(users));
              localStorage.setItem('wetalks_accounts_db', JSON.stringify(users));
              registeredSuccessfully = true;
            }
          }

          await loadCachedUsers();

          // Set session & logged in state
          localStorage.setItem('wetalks_logged_in_user', username);
          sessionStorage.setItem(SESSION_USER_KEY, username);

          // Clear forms and errors
          DOM.authUsername.value = '';
          DOM.authPassword.value = '';
          DOM.authError.style.display = 'none';

          // Enter Lobby
          switchView('lobby');

          if (presenceChannel) {
            try { presenceChannel.unsubscribe(); } catch(e){}
            initGlobalPresence();
          }
        } else {
          // Login Mode
          const found = cachedUsers.find(u => String(u.username).toLowerCase().trim() === username.toLowerCase() && String(u.password).trim() === password.trim());
          if (!found) {
            showAuthError("ユーザー名またはパスワードが正しくありません。");
            return;
          }

          localStorage.setItem('wetalks_logged_in_user', found.username);
          sessionStorage.setItem(SESSION_USER_KEY, found.username);

          DOM.authUsername.value = '';
          DOM.authPassword.value = '';
          DOM.authError.style.display = 'none';

          switchView('lobby');

          if (presenceChannel) {
            try { presenceChannel.unsubscribe(); } catch(e){}
            initGlobalPresence();
          }
        }
      });

      function showAuthError(msg) {
        DOM.authError.textContent = msg;
        DOM.authError.style.display = 'block';
      }

      // Profile avatar change handler
      DOM.profileAvatarFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          selectedAvatarBase64 = event.target.result;
          DOM.profileAvatarPreview.src = selectedAvatarBase64;
        };
        reader.readAsDataURL(file);
      });

      DOM.lobbyUsernameTag.addEventListener('click', () => {
        const username = getSessionUser();
        DOM.inputNewUsername.value = username;

        const currentAvatar = getUserAvatar(username);
        DOM.profileAvatarPreview.src = currentAvatar || 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="50" height="50" viewBox="0 0 50 50"><circle cx="25" cy="25" r="25" fill="%23ddd"/><text x="25" y="32" font-family="sans-serif" font-size="20" font-weight="bold" fill="%23555" text-anchor="middle">' + encodeURIComponent(username.charAt(0).toUpperCase()) + '</text></svg>';
        
        DOM.profileAvatarFile.value = '';
        selectedAvatarBase64 = null;
        DOM.modalUsername.classList.add('active');
      });

      DOM.btnUsernameCancel.addEventListener('click', () => {
        selectedAvatarBase64 = null;
        DOM.modalUsername.classList.remove('active');
      });

      DOM.btnUsernameConfirm.addEventListener('click', async () => {
        const username = getSessionUser();
        if (selectedAvatarBase64) {
          try {
            if (supabaseClient && !hasSupabaseUsersTableError) {
              const { error } = await supabaseClient
                .from('wetalks_users')
                .update({ avatar_base64: selectedAvatarBase64 })
                .eq('username', username);
              if (error) {
                console.error("Failed to update avatar in cloud, attempting server API:", error);
                await callServerAPI('/api/wetalks/users/avatar', 'POST', { username, avatar_base64: selectedAvatarBase64 });
              }
            } else {
              await callServerAPI('/api/wetalks/users/avatar', 'POST', { username, avatar_base64: selectedAvatarBase64 });
            }
            // Always update locally too for consistency and fallback
            const users = JSON.parse(localStorage.getItem('wetalks_registered_users') || localStorage.getItem('wetalks_accounts_db') || '[]');
            const idx = users.findIndex(u => u.username === username);
            if (idx !== -1) {
              users[idx].avatar = selectedAvatarBase64;
              localStorage.setItem('wetalks_registered_users', JSON.stringify(users));
              localStorage.setItem('wetalks_accounts_db', JSON.stringify(users));
            }
            await loadCachedUsers();
          } catch(e) {
            console.error(e);
          }
          selectedAvatarBase64 = null;
        }
        DOM.modalUsername.classList.remove('active');
        renderLobby();
      });

      // Logout handler
      DOM.btnLogout.addEventListener('click', () => {
        sessionStorage.removeItem(SESSION_USER_KEY);
        localStorage.removeItem('wetalks_logged_in_user');
        DOM.modalUsername.classList.remove('active');
        selectedAvatarBase64 = null;
        stopLocalPresence();
        switchView('auth');
      });

      DOM.btnSaveSettings.addEventListener('click', () => {
        const newUrl = DOM.inputSupabaseUrl.value.trim();
        const newKey = DOM.inputSupabaseKey.value.trim();
        if (newUrl && newKey) {
          localStorage.setItem('wetalks_supabase_url', newUrl);
          localStorage.setItem('wetalks_supabase_key', newKey);
        } else {
          localStorage.removeItem('wetalks_supabase_url');
          localStorage.removeItem('wetalks_supabase_key');
          supabaseClient = null;
        }
        initSupabase();
        switchView('lobby');
      });

      DOM.btnSend.addEventListener('click', sendMessage);
      DOM.msgInput.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
      function updateCreateRoomModalFields() {
        const type = DOM.selectNewRoomType.value;
        if (type === 'direct') {
          DOM.containerRoomName.style.display = 'none';
          DOM.containerDirectTarget.style.display = 'flex';
          
          DOM.selectDirectTarget.innerHTML = '';
          const myName = getSessionUser();
          const otherUsers = cachedUsers.filter(u => u.username !== myName);
          if (otherUsers.length === 0) {
            const opt = document.createElement('option');
            opt.value = '';
            opt.textContent = '他の登録ユーザーがいません';
            DOM.selectDirectTarget.appendChild(opt);
          } else {
            otherUsers.forEach(u => {
              const opt = document.createElement('option');
              opt.value = u.username;
              opt.textContent = u.username;
              DOM.selectDirectTarget.appendChild(opt);
            });
          }
        } else {
          DOM.containerRoomName.style.display = 'flex';
          DOM.containerDirectTarget.style.display = 'none';
        }
      }

      DOM.selectNewRoomType.addEventListener('change', updateCreateRoomModalFields);

      DOM.btnOpenCreate.addEventListener('click', async () => {
        await loadCachedUsers();
        DOM.modalCreate.classList.add('active');
        updateCreateRoomModalFields();
      });
      DOM.btnCreateCancel.addEventListener('click', () => DOM.modalCreate.classList.remove('active'));
      DOM.btnCreateConfirm.addEventListener('click', createRoom);

      window.addEventListener('storage', e => {
        if (e.key === DB_KEY) {
          try {
            const db = JSON.parse(e.newValue || localStorage.getItem(DB_KEY));
            if (db && db.messages) {
              Object.keys(db.messages).forEach(roomId => {
                db.messages[roomId].forEach(msg => {
                  checkAndNotifyNewMessage(msg);
                });
              });
            }
          } catch(err){}
          if (currentView === 'lobby') renderLobby();
          else if (currentView === 'chat') renderMessages();
        }
        if (e.key === ACTIVE_USERS_KEY) updateReadReceipts();
      });

      function initGlobalDeleteListener() {
        if (!supabaseClient) return;
        const lobbyChannel = supabaseClient.channel('global-lobby-sync');
        lobbyChannel
          .on('broadcast', { event: 'room_deleted' }, ({ payload }) => {
            const delId = payload.roomId;
            if (activeRoomId === delId) {
              alert("このトークルームは管理者に削除されました。");
              switchView('lobby');
            } else {
              renderLobby();
            }
          })
          .subscribe();
      }

      // Background polling sync for server-based messages and rooms
      setInterval(async () => {
        // If we are on chat view, poll messages
        if (currentView === 'chat' && activeRoomId) {
          if (!supabaseClient || hasSupabaseMessagesTableError) {
            const apiMsgs = await callServerAPI('/api/wetalks/messages/' + activeRoomId);
            if (apiMsgs) {
              let changed = false;
              if (DOM.messageContainer.children.length !== apiMsgs.length) {
                changed = true;
              } else {
                // simple comparison by text of the last bubble
                const lastLocal = DOM.messageContainer.lastElementChild?.querySelector('.msg-bubble')?.textContent;
                const lastRemote = apiMsgs[apiMsgs.length - 1]?.text;
                if (lastLocal !== lastRemote) changed = true;
              }
              if (changed) {
                renderMessages();
              }
            }
          }
        }
        // If we are on lobby view, poll rooms
        else if (currentView === 'lobby') {
          if (!supabaseClient || hasSupabaseRoomsTableError || hasSupabaseUsersTableError) {
            await loadCachedUsers(); // also sync user list
            renderLobby();
          }
        }
      }, 2000);

      initSupabase();
      initGlobalDeleteListener();
      fetchUserIpAndInitName();
    })();
  </script>
</body>
</html>`;

// 3DヨットダイスのHTMLソース
export const YACHT_GAME_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>We talks Yacht Dice</title>
  <style>
    :root {
      --primary: #06C755;
      --bg: #1e293b;
      --panel: #334155;
      --text: #f8fafc;
      --text-dim: #94a3b8;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; margin: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg); color: var(--text); padding: 12px; display: flex; flex-direction: column; overflow: hidden;
    }
    .header { background: var(--primary); padding: 12px; font-weight: bold; border-radius: 8px; text-align: center; margin-bottom: 12px; flex-shrink: 0; font-size:16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .lobby-screen, .game-screen { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .btn { background: var(--primary); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: center; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background-color 0.15s; }
    .btn:hover { background: #05b042; }
    .btn.secondary { background: #64748b; }
    .btn.secondary:hover { background: #475569; }
    .btn:disabled { background: #475569; opacity: 0.5; cursor: default; }
    .game-board { display: flex; flex-direction: row; gap: 12px; flex: 1; overflow: hidden; }
    .board-left { flex: 1.2; display: flex; flex-direction: column; gap: 12px; }
    .board-right { flex: 0.8; background: var(--panel); border-radius: 8px; padding: 10px; overflow-y: auto; font-size: 12px; }
    .dice-container { display: flex; gap: 12px; justify-content: center; padding: 15px 0; flex-wrap: wrap; }
    .die-scene { width: 50px; height: 50px; perspective: 300px; cursor: pointer; }
    .die-cube { width: 100%; height: 100%; position: relative; transform-style: preserve-3d; transition: transform 0.8s cubic-bezier(0.2, 0.8, 0.3, 1); }
    .die-face {
      position: absolute; width: 50px; height: 50px; background: #ffffff; border: 2px solid #cbd5e1; border-radius: 10px;
      display: flex; align-items: center; justify-content: center; font-size: 26px; font-weight: bold; color: #1e293b;
      box-shadow: inset 0 0 6px rgba(0,0,0,0.15), 0 2px 4px rgba(0,0,0,0.1); backface-visibility: hidden;
    }
    .die-face.f1 { transform: rotateY(0deg) translateZ(25px); }
    .die-face.f6 { transform: rotateY(180deg) translateZ(25px); }
    .die-face.f3 { transform: rotateY(90deg) translateZ(25px); }
    .die-face.f4 { transform: rotateY(-90deg) translateZ(25px); }
    .die-face.f2 { transform: rotateX(90deg) translateZ(25px); }
    .die-face.f5 { transform: rotateX(-90deg) translateZ(25px); }
    .die-scene.kept .die-face { border: 3px solid #f97316; background: #fff7ed; box-shadow: inset 0 0 6px rgba(249, 115, 22, 0.2), 0 3px 6px rgba(249, 115, 22, 0.3); }
    .score-table { width: 100%; border-collapse: collapse; text-align: left; margin-top: 4px; }
    .score-table th, .score-table td { padding: 6px 8px; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .score-table th { background: rgba(0,0,0,0.2); color: var(--text-dim); font-size: 11px; }
    .score-row { cursor: pointer; transition: background-color 0.1s; }
    .score-row:hover:not(.scored) { background: rgba(255,255,255,0.05); }
    .score-row.scored { cursor: not-allowed; opacity: 0.6; }
    .score-val { text-align: right; font-weight: bold; color: var(--primary); }
    .score-val.potential { color: #f59e0b; opacity: 0.8; }
    .game-status-bar { padding: 8px; background: rgba(0,0,0,0.15); border-radius: 6px; font-size: 13px; text-align: center; font-weight: bold; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <div class="header" id="header-text">We talks Yacht Dice</div>

  <div class="lobby-screen" id="lobby-screen">
    <div style="font-size: 13px; color: var(--text-dim); margin-bottom: 12px; text-align: center;">部屋コードを指定してオンライン対戦相手と繋がります</div>
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <input type="text" id="input-room-code" placeholder="部屋コードを入力 (例: 777)" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #475569; background: var(--panel); color: white; outline: none; font-size: 14px;" />
      <button class="btn" id="btn-join-room">部屋に入る / 作成</button>
    </div>
    <button class="btn secondary" id="btn-solo-play" style="width: 100%;">練習用ソロプレイ (オフライン)</button>
  </div>

  <div class="game-screen" id="game-screen" style="display: none;">
    <div class="game-board">
      <div class="board-left">
        <div class="game-status-bar" id="status-bar">対戦相手を待っています...</div>
        <div class="dice-container" id="dice-container">
          <div class="die-scene" data-idx="0"><div class="die-cube"><div class="die-face f1">⚀</div><div class="die-face f2">⚁</div><div class="die-face f3">⚂</div><div class="die-face f4">⚃</div><div class="die-face f5">⚄</div><div class="die-face f6">⚅</div></div></div>
          <div class="die-scene" data-idx="1"><div class="die-cube"><div class="die-face f1">⚀</div><div class="die-face f2">⚁</div><div class="die-face f3">⚂</div><div class="die-face f4">⚃</div><div class="die-face f5">⚄</div><div class="die-face f6">⚅</div></div></div>
          <div class="die-scene" data-idx="2"><div class="die-cube"><div class="die-face f1">⚀</div><div class="die-face f2">⚁</div><div class="die-face f3">⚂</div><div class="die-face f4">⚃</div><div class="die-face f5">⚄</div><div class="die-face f6">⚅</div></div></div>
          <div class="die-scene" data-idx="3"><div class="die-cube"><div class="die-face f1">⚀</div><div class="die-face f2">⚁</div><div class="die-face f3">⚂</div><div class="die-face f4">⚃</div><div class="die-face f5">⚄</div><div class="die-face f6">⚅</div></div></div>
          <div class="die-scene" data-idx="4"><div class="die-cube"><div class="die-face f1">⚀</div><div class="die-face f2">⚁</div><div class="die-face f3">⚂</div><div class="die-face f4">⚃</div><div class="die-face f5">⚄</div><div class="die-face f6">⚅</div></div></div>
        </div>
        <div style="display: flex; gap: 8px; justify-content: center;">
          <button class="btn" id="btn-roll" style="flex: 1;">サイコロを振る (残り3回)</button>
          <button class="btn secondary" id="btn-leave-game" style="flex: 0.5;">退出</button>
        </div>
        <div style="font-size: 10px; color: var(--text-dim); text-align: center;">※キープしたいサイコロをタップして「サイコロを振る」を押してください。</div>
      </div>
      <div class="board-right">
        <h4 style="border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 4px; margin-bottom: 6px; font-size: 13px;">スコアシート</h4>
        <table class="score-table">
          <thead><tr><th>役名</th><th style="text-align: right;">あなた</th><th style="text-align: right;" id="col-opp">相手</th></tr></thead>
          <tbody id="score-rows-container"></tbody>
        </table>
      </div>
    </div>
  </div>

  <script>
    (function() {
      'use strict';

      let localStorage;
      try {
        window.localStorage.getItem('test');
        localStorage = window.localStorage;
      } catch (e) {
        localStorage = {
          _data: {},
          getItem: function(k) { return this._data[k] !== undefined ? this._data[k] : null; },
          setItem: function(k, v) { this._data[k] = String(v); },
          removeItem: function(k) { delete this._data[k]; },
          clear: function() { this._data = {}; }
        };
      }

      let sessionStorage;
      try {
        window.sessionStorage.getItem('test');
        sessionStorage = window.sessionStorage;
      } catch (e) {
        sessionStorage = {
          _data: {},
          getItem: function(k) { return this._data[k] !== undefined ? this._data[k] : null; },
          setItem: function(k, v) { this._data[k] = String(v); },
          removeItem: function(k) { delete this._data[k]; },
          clear: function() { this._data = {}; }
        };
      }

      let supabaseClient = null;
      let gameChannel = null;
      const url = localStorage.getItem('wetalks_supabase_url') || 'https://nsyvlftqcciyetsbhymg.supabase.co';
      const key = localStorage.getItem('wetalks_supabase_key') || 'sb_publishable_lkhrFuMlNyEmUX4RTFApKw_AhD1sAkV';
      try {
        if (typeof supabase !== 'undefined') {
          supabaseClient = supabase.createClient(url, key);
        } else {
          console.warn("Supabase SDK is not loaded.");
        }
      } catch(e) { console.error(e); }

      let isSolo = false;
      let myId = 'p-' + Math.floor(1000 + Math.random() * 9000);
      let myName = sessionStorage.getItem('wetalks_session_user') || 'ゲスト';
      let oppId = null;
      let oppName = "対戦相手";
      let diceValues = [1, 1, 1, 1, 1];
      let diceKept = [false, false, false, false, false];
      let rollCount = 0;
      let isMyTurn = false;
      let gameActive = false;
      let rollRotations = [{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0},{x:0,y:0}];

      const CATEGORIES = [
        { id: 'aces', name: '① エース', calc: d => sumOf(d, 1) },
        { id: 'deuces', name: '② デュース', calc: d => sumOf(d, 2) },
        { id: 'treys', name: '③ トレイ', calc: d => sumOf(d, 3) },
        { id: 'fours', name: '④ フォー', calc: d => sumOf(d, 4) },
        { id: 'fives', name: '⑤ ファイブ', calc: d => sumOf(d, 5) },
        { id: 'sixes', name: '⑥ シックス', calc: d => sumOf(d, 6) },
        { id: 'choice', name: '選択 (全合計)', calc: d => d.reduce((a, b) => a + b, 0) },
        { id: 'four_kind', name: 'フォー・カインド', calc: d => hasOfKind(d, 4) ? d.reduce((a, b) => a + b, 0) : 0 },
        { id: 'full_house', name: 'フルハウス', calc: d => isFullHouse(d) ? d.reduce((a, b) => a + b, 0) : 0 },
        { id: 's_straight', name: 'S.ストレート', calc: d => isSmallStraight(d) ? 15 : 0 },
        { id: 'l_straight', name: 'L.ストレート', calc: d => isLargeStraight(d) ? 30 : 0 },
        { id: 'yacht', name: 'ヨット', calc: d => hasOfKind(d, 5) ? 50 : 0 }
      ];

      let myScores = {};
      let oppScores = {};

      const DOM = {
        lobby: document.getElementById('lobby-screen'),
        game: document.getElementById('game-screen'),
        roomCode: document.getElementById('input-room-code'),
        btnJoin: document.getElementById('btn-join-room'),
        btnSolo: document.getElementById('btn-solo-play'),
        statusBar: document.getElementById('status-bar'),
        btnRoll: document.getElementById('btn-roll'),
        btnLeave: document.getElementById('btn-leave-game'),
        diceContainer: document.getElementById('dice-container'),
        colOpp: document.getElementById('col-opp'),
        scoreRows: document.getElementById('score-rows-container'),
        headerText: document.getElementById('header-text')
      };

      function sumOf(d, val) { return d.filter(x => x === val).length * val; }
      function hasOfKind(d, num) {
        const counts = d.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {});
        return Object.values(counts).some(c => c >= num);
      }
      function isFullHouse(d) {
        const counts = d.reduce((acc, val) => { acc[val] = (acc[val] || 0) + 1; return acc; }, {});
        const vals = Object.values(counts);
        return (vals.includes(3) && vals.includes(2)) || vals.includes(5);
      }
      function isSmallStraight(d) {
        const unique = Array.from(new Set(d)).sort().join("");
        return unique.includes("1234") || unique.includes("2345") || unique.includes("3456");
      }
      function isLargeStraight(d) {
        const unique = Array.from(new Set(d)).sort().join("");
        return unique === "12345" || unique === "23456";
      }

      function getCubeTransform(idx, value) {
        const rx = rollRotations[idx].x;
        const ry = rollRotations[idx].y;
        switch (value) {
          case 1: return 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
          case 6: return 'rotateX(' + rx + 'deg) rotateY(' + (ry + 180) + 'deg)';
          case 3: return 'rotateX(' + rx + 'deg) rotateY(' + (ry + 90) + 'deg)';
          case 4: return 'rotateX(' + rx + 'deg) rotateY(' + (ry - 90) + 'deg)';
          case 2: return 'rotateX(' + (rx - 90) + 'deg) rotateY(' + ry + 'deg)';
          case 5: return 'rotateX(' + (rx + 90) + 'deg) rotateY(' + ry + 'deg)';
          default: return 'rotateX(' + rx + 'deg) rotateY(' + ry + 'deg)';
        }
      }

      function updateDiceUI() {
        const scenes = DOM.diceContainer.querySelectorAll('.die-scene');
        scenes.forEach((scene, idx) => {
          scene.classList.toggle('kept', diceKept[idx]);
          const cube = scene.querySelector('.die-cube');
          if (cube) cube.style.transform = getCubeTransform(idx, diceValues[idx]);
        });
      }

      function toggleKeep(idx) {
        if (!gameActive || !isMyTurn || rollCount === 0) return;
        diceKept[idx] = !diceKept[idx];
        updateDiceUI();
        if (!isSolo) sendGameState(false);
      }

      function updateGameStatus() {
        if (!gameActive) {
          DOM.statusBar.textContent = "対戦相手を待っています...";
          return;
        }
        if (isMyTurn) {
          DOM.statusBar.textContent = "🟢 あなたの番です。ダイスを振るか、得点表の確定させたい役をクリックしてください。";
          DOM.btnRoll.disabled = rollCount >= 3;
        } else {
          DOM.statusBar.textContent = "🔴 " + oppName + " の手番です。相手のプレイを待っています...";
          DOM.btnRoll.disabled = true;
        }
      }

      function checkGameOver() {
        const myDone = CATEGORIES.every(cat => myScores[cat.id] !== undefined);
        const oppDone = isSolo || CATEGORIES.every(cat => oppScores[cat.id] !== undefined);
        if (myDone && oppDone) {
          gameActive = false;
          const myTotal = Object.values(myScores).reduce((a, b) => a + b, 0);
          const oppTotal = isSolo ? 0 : Object.values(oppScores).reduce((a, b) => a + b, 0);
          let resultMsg = "ゲーム終了！あなたの最終得点: " + myTotal + "点";
          if (!isSolo) {
            resultMsg += " 対 " + oppName + ": " + oppTotal + "点\\n";
            if (myTotal > oppTotal) resultMsg += "🏆 あなたの勝ちです！";
            else if (myTotal < oppTotal) resultMsg += "敗北しました...";
            else resultMsg += "引き分けです！";
          } else {
            resultMsg += " (ソロ練習終了)";
          }
          DOM.statusBar.textContent = resultMsg;
          alert(resultMsg);
        }
      }

      function updateScoreboard() {
        DOM.scoreRows.innerHTML = '';
        CATEGORIES.forEach(cat => {
          const tr = document.createElement('tr');
          tr.className = 'score-row';
          if (myScores[cat.id] !== undefined) tr.classList.add('scored');
          const tdName = document.createElement('td');
          tdName.textContent = cat.name;
          const tdMy = document.createElement('td');
          tdMy.className = 'score-val';
          if (myScores[cat.id] !== undefined) {
            tdMy.textContent = myScores[cat.id];
          } else if (rollCount > 0 && isMyTurn && gameActive) {
            tdMy.textContent = cat.calc(diceValues);
            tdMy.classList.add('potential');
            tr.addEventListener('click', () => selectCategory(cat.id));
          } else {
            tdMy.textContent = '-';
          }
          const tdOpp = document.createElement('td');
          tdOpp.className = 'score-val';
          tdOpp.textContent = oppScores[cat.id] !== undefined ? oppScores[cat.id] : '-';
          if (isSolo) tdOpp.style.display = 'none';
          tr.appendChild(tdName);
          tr.appendChild(tdMy);
          tr.appendChild(tdOpp);
          DOM.scoreRows.appendChild(tr);
        });

        const totalTr = document.createElement('tr');
        totalTr.style.background = 'rgba(255,255,255,0.05)';
        totalTr.style.fontWeight = 'bold';
        const tdTotalName = document.createElement('td');
        tdTotalName.textContent = '合計得点';
        const tdMyTotal = document.createElement('td');
        tdMyTotal.className = 'score-val';
        tdMyTotal.textContent = Object.values(myScores).reduce((a, b) => a + b, 0);
        const tdOppTotal = document.createElement('td');
        tdOppTotal.className = 'score-val';
        tdOppTotal.textContent = Object.values(oppScores).reduce((a, b) => a + b, 0);
        if (isSolo) tdOppTotal.style.display = 'none';
        totalTr.appendChild(tdTotalName);
        totalTr.appendChild(tdMyTotal);
        totalTr.appendChild(tdOppTotal);
        DOM.scoreRows.appendChild(totalTr);
      }

      function selectCategory(catId) {
        if (!isMyTurn || myScores[catId] !== undefined || rollCount === 0 || !gameActive) return;
        const score = CATEGORIES.find(c => c.id === catId).calc(diceValues);
        myScores[catId] = score;
        diceKept = [false, false, false, false, false];
        rollCount = 0;
        if (isSolo) {
          isMyTurn = true;
          checkGameOver();
        } else {
          isMyTurn = false;
          sendGameState(true);
          checkGameOver();
        }
        DOM.btnRoll.textContent = "サイコロを振る (残り3回)";
        updateScoreboard();
        updateDiceUI();
        updateGameStatus();
      }

      function rollDice() {
        if (!isMyTurn || rollCount >= 3 || !gameActive) return;
        for (let i = 0; i < 5; i++) {
          if (!diceKept[i]) {
            diceValues[i] = Math.floor(Math.random() * 6) + 1;
            rollRotations[i].x += 720 + Math.floor(Math.random() * 4) * 90;
            rollRotations[i].y += 720 + Math.floor(Math.random() * 4) * 90;
          }
        }
        rollCount++;
        DOM.btnRoll.textContent = "サイコロを振る (残り" + (3 - rollCount) + "回)";
        if (rollCount >= 3) DOM.btnRoll.disabled = true;
        updateDiceUI();
        updateScoreboard();
        updateGameStatus();
        if (!isSolo) sendGameState(false);
      }

      function joinRoom(roomCode) {
        if (!supabaseClient) return alert("Supabaseの設定が有効になっていないため対戦できません。");
        isSolo = false;
        DOM.colOpp.style.display = 'table-cell';
        DOM.headerText.textContent = "Yacht Room: " + roomCode;
        DOM.lobby.style.display = 'none';
        DOM.game.style.display = 'flex';
        myScores = {};
        oppScores = {};
        rollCount = 0;
        diceValues = [1, 1, 1, 1, 1];
        diceKept = [false, false, false, false, false];

        gameChannel = supabaseClient.channel('yacht-' + roomCode);
        gameChannel
          .on('broadcast', { event: 'join' }, ({ payload }) => {
            if (payload.id !== myId) {
              oppId = payload.id;
              oppName = payload.name;
              gameChannel.send({ type: 'broadcast', event: 'welcome', payload: { id: myId, name: myName, scores: myScores } });
              gameActive = true;
              isMyTurn = true;
              updateGameStatus();
              updateScoreboard();
              updateDiceUI();
            }
          })
          .on('broadcast', { event: 'welcome' }, ({ payload }) => {
            if (payload.id !== myId) {
              oppId = payload.id;
              oppName = payload.name;
              oppScores = payload.scores;
              gameActive = true;
              isMyTurn = false;
              updateGameStatus();
              updateScoreboard();
              updateDiceUI();
            }
          })
          .on('broadcast', { event: 'state' }, ({ payload }) => {
            if (payload.id !== myId) {
              diceValues = payload.diceValues;
              oppScores = payload.scores;
              if (payload.turnEnded) {
                isMyTurn = true;
                rollCount = 0;
                diceKept = [false, false, false, false, false];
                DOM.btnRoll.textContent = "サイコロを振る (残り3回)";
                DOM.btnRoll.disabled = false;
              }
              updateDiceUI();
              updateScoreboard();
              updateGameStatus();
              checkGameOver();
            }
          })
          .on('broadcast', { event: 'leave' }, () => {
            alert("対戦相手が退出しました。");
            leaveGame();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              gameChannel.send({ type: 'broadcast', event: 'join', payload: { id: myId, name: myName } });
            }
          });
      }

      function sendGameState(turnEnded = false) {
        if (!gameChannel) return;
        gameChannel.send({
          type: 'broadcast',
          event: 'state',
          payload: { id: myId, diceValues: diceValues, scores: myScores, turnEnded: turnEnded }
        });
      }

      function startSoloPlay() {
        isSolo = true;
        DOM.colOpp.style.display = 'none';
        DOM.headerText.textContent = "We talks Yacht (Solo)";
        DOM.lobby.style.display = 'none';
        DOM.game.style.display = 'flex';
        gameActive = true;
        isMyTurn = true;
        myScores = {};
        oppScores = {};
        rollCount = 0;
        diceValues = [1, 1, 1, 1, 1];
        diceKept = [false, false, false, false, false];
        updateDiceUI();
        updateScoreboard();
        updateGameStatus();
      }

      function leaveGame() {
        if (gameChannel) {
          gameChannel.send({ type: 'broadcast', event: 'leave', payload: { id: myId } });
          supabaseClient.removeChannel(gameChannel);
          gameChannel = null;
        }
        isSolo = false;
        gameActive = false;
        myScores = {};
        oppScores = {};
        DOM.lobby.style.display = 'flex';
        DOM.game.style.display = 'none';
        DOM.headerText.textContent = "We talks Yacht Dice";
      }

      DOM.btnJoin.addEventListener('click', () => {
        const code = DOM.roomCode.value.trim();
        if (code) joinRoom(code);
      });
      DOM.btnSolo.addEventListener('click', startSoloPlay);
      DOM.btnLeave.addEventListener('click', leaveGame);
      DOM.btnRoll.addEventListener('click', rollDice);

      DOM.diceContainer.querySelectorAll('.die-scene').forEach(scene => {
        scene.addEventListener('click', () => {
          const idx = parseInt(scene.getAttribute('data-idx'));
          toggleKeep(idx);
        });
      });
    })();
  </script>
</body>
</html>`;

// We talks: 2. UNO風ゲーム（UNO Card Game）のHTMLソース
export const UNO_GAME_HTML = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>We talks UNO</title>
  <style>
    :root {
      --primary: #06C755;
      --bg: #151515;
      --panel: #222222;
      --text: #f5f5f5;
      --text-dim: #999;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    html, body { height: 100%; margin: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: var(--bg); color: var(--text); padding: 12px; display: flex; flex-direction: column; overflow: hidden;
    }
    .header { background: var(--primary); padding: 12px; font-weight: bold; border-radius: 8px; text-align: center; margin-bottom: 12px; flex-shrink: 0; font-size:16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
    .lobby-screen, .game-screen { display: flex; flex-direction: column; flex: 1; overflow: hidden; }
    .btn { background: var(--primary); color: white; border: none; padding: 12px; border-radius: 8px; font-weight: bold; cursor: pointer; text-align: center; font-size: 14px; box-shadow: 0 2px 4px rgba(0,0,0,0.15); transition: background-color 0.15s; }
    .btn:hover { background: #05b042; }
    .btn.secondary { background: #444; }
    .btn.secondary:hover { background: #333; }
    .game-area { display: flex; flex-direction: column; flex: 1; justify-content: space-between; overflow: hidden; gap: 8px; }
    .opponent-hand-area { background: var(--panel); border-radius: 8px; padding: 10px; display: flex; flex-direction: column; align-items: center; gap: 6px; }
    .opponent-cards { display: flex; gap: -15px; }
    .card-back {
      width: 44px; height: 66px; background: radial-gradient(circle, #f43f5e 60%, #9f1239 100%);
      border: 2px solid white; border-radius: 6px; display: flex; align-items: center; justify-content: center;
      font-size: 10px; font-weight: bold; color: yellow; transform: scale(0.9); box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    .field-area { display: flex; flex: 1; align-items: center; justify-content: center; gap: 32px; background: rgba(255,255,255,0.02); border-radius: 8px; position: relative; }
    .pile-container { display: flex; flex-direction: column; align-items: center; gap: 4px; }
    .card {
      width: 54px; height: 80px; border-radius: 8px; border: 3px solid white;
      display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 20px;
      color: white; cursor: pointer; position: relative; box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      user-select: none; transition: transform 0.12s, margin-top 0.12s;
    }
    .card:hover { transform: translateY(-8px) scale(1.05); z-index: 10; }
    .card.red { background: linear-gradient(135deg, #ef4444, #b91c1c); }
    .card.yellow { background: linear-gradient(135deg, #eab308, #a16207); color: #000; border-color: #000; }
    .card.green { background: linear-gradient(135deg, #22c55e, #15803d); }
    .card.blue { background: linear-gradient(135deg, #3b82f6, #1d4ed8); }
    .card.wild { background: linear-gradient(135deg, #1e1e1e, #111111); }
    .player-hand-area { background: var(--panel); border-radius: 8px; padding: 12px; display: flex; flex-direction: column; align-items: center; gap: 8px; flex-shrink: 0; }
    .player-cards { display: flex; gap: 4px; overflow-x: auto; width: 100%; justify-content: center; padding: 6px 0; }
    .status-bar { padding: 8px; background: rgba(0,0,0,0.3); border-radius: 6px; font-size: 13px; text-align: center; font-weight: bold; width: 100%; }

    @keyframes slideInFromDeck {
      0% { transform: translateY(-200px) rotate(45deg); opacity: 0; }
      100% { transform: translateY(0) rotate(0deg); opacity: 1; }
    }
    .card.drawn-anim { animation: slideInFromDeck 0.4s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

    @keyframes slideToDiscard {
      0% { transform: translateY(120px) scale(1.1) rotate(-10deg); opacity: 0.5; }
      100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
    }
    .card.played-anim { animation: slideToDiscard 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }

    @keyframes slideToDiscardFromOpp {
      0% { transform: translateY(-120px) scale(1.1) rotate(10deg); opacity: 0.5; }
      100% { transform: translateY(0) scale(1) rotate(0deg); opacity: 1; }
    }
    .card.played-opp-anim { animation: slideToDiscardFromOpp 0.3s cubic-bezier(0.25, 1, 0.5, 1) forwards; }
  </style>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
</head>
<body>
  <div class="header" id="header-text">We talks UNO</div>

  <div class="lobby-screen" id="lobby-screen">
    <div style="font-size: 13px; color: var(--text-dim); margin-bottom: 12px; text-align: center;">部屋コードを指定してオンライン対戦相手と繋がります</div>
    <div style="display: flex; gap: 8px; margin-bottom: 12px;">
      <input type="text" id="input-room-code" placeholder="部屋コードを入力 (例: 888)" style="flex: 1; padding: 12px; border-radius: 8px; border: 1px solid #475569; background: var(--panel); color: white; outline: none; font-size: 14px;" />
      <button class="btn" id="btn-join-room">部屋に入る / 作成</button>
    </div>
    <button class="btn secondary" id="btn-ai-play" style="width: 100%;">練習用AI対戦プレイ (オフライン)</button>
  </div>

  <div class="game-screen" id="game-screen" style="display: none;">
    <div class="game-area">
      <div class="opponent-hand-area">
        <span id="opp-name-tag" style="font-size: 12px; font-weight: bold;">AI対戦相手 (手札: 7枚)</span>
        <div class="opponent-cards" id="opp-cards-container"></div>
      </div>
      <div class="field-area">
        <div class="pile-container">
          <div class="card-back" id="btn-draw" style="cursor: pointer; width: 56px; height: 82px; font-size: 11px;">山札<br>引く</div>
        </div>
        <div class="pile-container">
          <span style="font-size:11px; color: var(--text-dim);">場札</span>
          <div id="discard-card-container"></div>
        </div>
        <button class="btn" id="btn-end-turn" style="display: none; position: absolute; left: 12px; bottom: 12px; padding: 6px 12px; font-size:11px; background:#f59e0b;">ターン終了</button>
        <button class="btn secondary" id="btn-leave-game" style="position: absolute; right: 12px; bottom: 12px; padding: 6px 12px; font-size:11px;">退出</button>
      </div>
      <div class="player-hand-area">
        <div class="status-bar" id="status-bar">山札から引くか、出せるカードを出してください。</div>
        <div class="player-cards" id="player-cards-container"></div>
      </div>
    </div>
  </div>

  <script>
    (function() {
      'use strict';

      let localStorage;
      try {
        window.localStorage.getItem('test');
        localStorage = window.localStorage;
      } catch (e) {
        localStorage = {
          _data: {},
          getItem: function(k) { return this._data[k] !== undefined ? this._data[k] : null; },
          setItem: function(k, v) { this._data[k] = String(v); },
          removeItem: function(k) { delete this._data[k]; },
          clear: function() { this._data = {}; }
        };
      }

      let sessionStorage;
      try {
        window.sessionStorage.getItem('test');
        sessionStorage = window.sessionStorage;
      } catch (e) {
        sessionStorage = {
          _data: {},
          getItem: function(k) { return this._data[k] !== undefined ? this._data[k] : null; },
          setItem: function(k, v) { this._data[k] = String(v); },
          removeItem: function(k) { delete this._data[k]; },
          clear: function() { this._data = {}; }
        };
      }

      let supabaseClient = null;
      let gameChannel = null;
      const url = localStorage.getItem('wetalks_supabase_url') || 'https://nsyvlftqcciyetsbhymg.supabase.co';
      const key = localStorage.getItem('wetalks_supabase_key') || 'sb_publishable_lkhrFuMlNyEmUX4RTFApKw_AhD1sAkV';
      try {
        if (typeof supabase !== 'undefined') {
          supabaseClient = supabase.createClient(url, key);
        } else {
          console.warn("Supabase SDK is not loaded.");
        }
      } catch(e) {}

      let isSolo = false;
      let myId = 'p-' + Math.floor(1000 + Math.random() * 9000);
      let myName = sessionStorage.getItem('wetalks_session_user') || 'ゲスト';
      let oppId = null;
      let oppName = "対戦相手";
      let myHand = [];
      let oppHandCount = 0;
      let oppHand = [];
      let discardPile = [];
      let activeColor = '';
      let isMyTurn = false;
      let gameActive = false;
      let stackedValue = null; 
      let lastAction = null;

      const COLORS = ['red', 'yellow', 'green', 'blue'];
      const VALUES = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'Skip', 'Draw2'];

      const DOM = {
        lobby: document.getElementById('lobby-screen'),
        game: document.getElementById('game-screen'),
        roomCode: document.getElementById('input-room-code'),
        btnJoin: document.getElementById('btn-join-room'),
        btnAI: document.getElementById('btn-ai-play'),
        statusBar: document.getElementById('status-bar'),
        btnDraw: document.getElementById('btn-draw'),
        btnLeave: document.getElementById('btn-leave-game'),
        btnEndTurn: document.getElementById('btn-end-turn'),
        oppNameTag: document.getElementById('opp-name-tag'),
        oppCardsContainer: document.getElementById('opp-cards-container'),
        playerCardsContainer: document.getElementById('player-cards-container'),
        discardContainer: document.getElementById('discard-card-container'),
        headerText: document.getElementById('header-text')
      };

      function createRandomCard() {
        if (Math.random() < 0.1) return { color: 'wild', value: 'Wild' };
        const color = COLORS[Math.floor(Math.random() * COLORS.length)];
        const value = VALUES[Math.floor(Math.random() * VALUES.length)];
        return { color, value };
      }

      function buildCardDOM(card, isPlayable = false, clickHandler = null) {
        const div = document.createElement('div');
        div.className = 'card ' + card.color;
        let label = card.value;
        if (card.value === 'Draw2') label = '+2';
        if (card.value === 'Wild') label = 'W';
        div.textContent = label;
        if (isPlayable && clickHandler) div.addEventListener('click', clickHandler);
        return div;
      }

      function updateUI() {
        if (!gameActive) return;
        DOM.discardContainer.innerHTML = '';
        if (discardPile.length > 0) {
          const topCard = discardPile[discardPile.length - 1];
          const displayCard = { ...topCard };
          if (topCard.color === 'wild' && activeColor) displayCard.color = activeColor;
          const discardDOM = buildCardDOM(displayCard);
          if (lastAction === 'play_me') discardDOM.classList.add('played-anim');
          else if (lastAction === 'play_opp') discardDOM.classList.add('played-opp-anim');
          DOM.discardContainer.appendChild(discardDOM);
        }

        DOM.playerCardsContainer.innerHTML = '';
        myHand.forEach((card, idx) => {
          const playable = isMyTurn && canPlay(card);
          const dom = buildCardDOM(card, playable, () => playCard(idx));
          if (!playable) dom.style.opacity = '0.5';
          if (lastAction === 'draw' && idx === myHand.length - 1) dom.classList.add('drawn-anim');
          DOM.playerCardsContainer.appendChild(dom);
        });

        DOM.oppCardsContainer.innerHTML = '';
        const count = isSolo ? oppHand.length : oppHandCount;
        for (let i = 0; i < count; i++) {
          const cardBack = document.createElement('div');
          cardBack.className = 'card-back';
          cardBack.textContent = 'UNO';
          DOM.oppCardsContainer.appendChild(cardBack);
        }
        DOM.oppNameTag.textContent = oppName + " (手札: " + count + "枚)";

        if (isMyTurn) {
          if (stackedValue !== null) {
            DOM.statusBar.textContent = "🟢 同数字（" + stackedValue + "）の連続出しが可能です。出さない場合は「ターン終了」を押してください。";
            DOM.btnDraw.style.pointerEvents = 'none';
            DOM.btnDraw.style.opacity = '0.5';
          } else {
            DOM.statusBar.textContent = "🟢 あなたの手番です。場札に合うカードを出すか、山札から引いてください。";
            DOM.btnDraw.style.pointerEvents = 'auto';
            DOM.btnDraw.style.opacity = '1';
          }
        } else {
          DOM.statusBar.textContent = "🔴 " + oppName + " の手番です。相手の操作を待っています...";
          DOM.btnDraw.style.pointerEvents = 'none';
          DOM.btnDraw.style.opacity = '0.5';
        }
        lastAction = null;
        checkGameOver();
      }

      function canPlay(card) {
        if (stackedValue !== null) return card.value === stackedValue;
        if (discardPile.length === 0) return true;
        const top = discardPile[discardPile.length - 1];
        if (card.color === 'wild') return true;
        const topColor = top.color === 'wild' ? activeColor : top.color;
        if (card.color === topColor) return true;
        if (card.value === top.value) return true;
        return false;
      }

      function playCard(idx) {
        if (!isMyTurn) return;
        const card = myHand.splice(idx, 1)[0];
        discardPile.push(card);
        lastAction = 'play_me';
        if (card.color === 'wild') {
          activeColor = COLORS[Math.floor(Math.random() * COLORS.length)];
        } else {
          activeColor = card.color;
        }
        const hasMoreSameValue = myHand.some(c => c.value === card.value);
        if (hasMoreSameValue) {
          stackedValue = card.value;
          DOM.btnEndTurn.style.display = 'block';
          updateUI();
        } else {
          endMyTurn(card);
        }
      }

      function endMyTurn(card) {
        stackedValue = null;
        DOM.btnEndTurn.style.display = 'none';
        let turnSkip = false;
        let drawPenalty = 0;
        if (card.value === 'Skip') turnSkip = true;
        if (card.value === 'Draw2') drawPenalty = 2;
        isMyTurn = false;

        if (isSolo) {
          updateUI();
          if (drawPenalty > 0) {
            for (let i = 0; i < drawPenalty; i++) oppHand.push(createRandomCard());
          }
          if (turnSkip) {
            isMyTurn = true;
            setTimeout(updateUI, 1000);
          } else {
            setTimeout(aiTurn, 1500);
          }
        } else {
          sendGameState(turnSkip, drawPenalty);
          updateUI();
        }
      }

      function drawCard() {
        if (!isMyTurn || stackedValue !== null) return;
        myHand.push(createRandomCard());
        lastAction = 'draw';
        isMyTurn = false;
        if (isSolo) {
          updateUI();
          setTimeout(aiTurn, 1200);
        } else {
          sendGameState(false, 0);
          updateUI();
        }
      }

      function checkGameOver() {
        if (!gameActive) return;
        if (myHand.length === 0) {
          gameActive = false;
          isMyTurn = false;
          DOM.statusBar.textContent = "🏆 あなたの勝利！すべてのカードを出し切りました！";
          alert("おめでとうございます！あなたの勝利です！");
        } else if ((isSolo && oppHand.length === 0) || (!isSolo && oppHandCount === 0 && oppId)) {
          gameActive = false;
          isMyTurn = false;
          DOM.statusBar.textContent = "敗北... " + oppName + " が先にカードを出し切りました。";
          alert("残念... " + oppName + "の勝利です。");
        }
      }

      function aiTurn() {
        if (!gameActive) return;
        let playIdx = -1;
        for (let i = 0; i < oppHand.length; i++) {
          if (canPlay(oppHand[i])) {
            playIdx = i;
            break;
          }
        }
        if (playIdx !== -1) {
          const card = oppHand.splice(playIdx, 1)[0];
          discardPile.push(card);
          lastAction = 'play_opp';
          let turnSkip = false;
          let drawPenalty = 0;
          if (card.color === 'wild') {
            activeColor = COLORS[Math.floor(Math.random() * COLORS.length)];
          } else {
            activeColor = card.color;
          }
          if (card.value === 'Skip') turnSkip = true;
          if (card.value === 'Draw2') drawPenalty = 2;
          if (drawPenalty > 0) {
            for (let i = 0; i < drawPenalty; i++) myHand.push(createRandomCard());
          }
          if (turnSkip) setTimeout(aiTurn, 1500);
          else isMyTurn = true;
        } else {
          oppHand.push(createRandomCard());
          lastAction = 'draw_opp';
          isMyTurn = true;
        }
        updateUI();
      }

      function joinRoom(roomCode) {
        if (!supabaseClient) return alert("シミュレーターの設定でSupabaseが連携されていないため動作しません。");
        isSolo = false;
        DOM.headerText.textContent = "UNO Room: " + roomCode;
        DOM.lobby.style.display = 'none';
        DOM.game.style.display = 'flex';
        myHand = Array.from({ length: 7 }, createRandomCard);
        oppHandCount = 7;
        discardPile = [{ color: 'red', value: '5' }];
        activeColor = 'red';

        gameChannel = supabaseClient.channel('uno-' + roomCode);
        gameChannel
          .on('broadcast', { event: 'join' }, ({ payload }) => {
            if (payload.id !== myId) {
              oppId = payload.id;
              oppName = payload.name;
              gameChannel.send({ type: 'broadcast', event: 'welcome', payload: { id: myId, name: myName, handCount: myHand.length, discard: discardPile } });
              gameActive = true;
              isMyTurn = true;
              updateUI();
            }
          })
          .on('broadcast', { event: 'welcome' }, ({ payload }) => {
            if (payload.id !== myId) {
              oppId = payload.id;
              oppName = payload.name;
              oppHandCount = payload.handCount;
              discardPile = payload.discard;
              gameActive = true;
              isMyTurn = false;
              updateUI();
            }
          })
          .on('broadcast', { event: 'state' }, ({ payload }) => {
            if (payload.id !== myId) {
              if (payload.handCount < oppHandCount) lastAction = 'play_opp';
              else if (payload.handCount > oppHandCount) lastAction = 'draw_opp';
              oppHandCount = payload.handCount;
              discardPile = payload.discard;
              activeColor = payload.activeColor;
              if (payload.drawPenalty > 0) {
                for (let i = 0; i < payload.drawPenalty; i++) myHand.push(createRandomCard());
              }
              if (payload.turnSkip) {
                isMyTurn = false;
                gameChannel.send({
                  type: 'broadcast',
                  event: 'state',
                  payload: { id: myId, handCount: myHand.length, discard: discardPile, activeColor: activeColor, turnSkip: false, drawPenalty: 0, myTurnNext: true }
                });
              } else if (payload.myTurnNext || !payload.turnSkip) {
                isMyTurn = true;
              }
              updateUI();
            }
          })
          .on('broadcast', { event: 'leave' }, () => {
            alert("対戦相手が退出しました。");
            leaveGame();
          })
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') gameChannel.send({ type: 'broadcast', event: 'join', payload: { id: myId, name: myName } });
          });
      }

      function sendGameState(turnSkip = false, drawPenalty = 0) {
        if (!gameChannel) return;
        gameChannel.send({
          type: 'broadcast',
          event: 'state',
          payload: { id: myId, handCount: myHand.length, discard: discardPile, activeColor: activeColor, turnSkip: turnSkip, drawPenalty: drawPenalty, myTurnNext: false }
        });
      }

      function startAIGame() {
        isSolo = true;
        oppName = "AI対戦相手";
        DOM.headerText.textContent = "We talks UNO (vs AI)";
        DOM.lobby.style.display = 'none';
        DOM.game.style.display = 'flex';
        myHand = Array.from({ length: 7 }, createRandomCard);
        oppHand = Array.from({ length: 7 }, createRandomCard);
        discardPile = [{ color: 'blue', value: '7' }];
        activeColor = 'blue';
        gameActive = true;
        isMyTurn = true;
        updateUI();
      }

      function leaveGame() {
        if (gameChannel) {
          gameChannel.send({ type: 'broadcast', event: 'leave', payload: { id: myId } });
          supabaseClient.removeChannel(gameChannel);
          gameChannel = null;
        }
        isSolo = false;
        gameActive = false;
        DOM.lobby.style.display = 'flex';
        DOM.game.style.display = 'none';
        DOM.headerText.textContent = "We talks UNO";
      }

      DOM.btnJoin.addEventListener('click', () => {
        const code = DOM.roomCode.value.trim();
        if (code) joinRoom(code);
      });
      DOM.btnAI.addEventListener('click', startAIGame);
      DOM.btnLeave.addEventListener('click', leaveGame);
      DOM.btnDraw.addEventListener('click', drawCard);
      DOM.btnEndTurn.addEventListener('click', () => {
        if (stackedValue !== null) {
          const lastCard = discardPile[discardPile.length - 1];
          endMyTurn(lastCard);
        }
      });
    })();
  </script>
</body>
</html>`;
