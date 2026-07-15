import React, { useState, useEffect } from 'react';
import { WALLPAPERS, SettingsState } from '../../types';
import { Sun, Moon, RefreshCw, Trash2, ShieldAlert, RotateCw } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

interface SettingsAppProps {
  settings: SettingsState;
  onUpdateSettings: (s: SettingsState) => void;
  onResetSystem: () => void;
  onRestartSystem?: () => void;
}

export const SettingsApp: React.FC<SettingsAppProps> = ({
  settings,
  onUpdateSettings,
  onResetSystem,
  onRestartSystem,
}) => {
  const [passcode, setPasscode] = useState('');
  const [isAdminAuthorized, setIsAdminAuthorized] = useState(false);
  const [registeredUsers, setRegisteredUsers] = useState<any[]>([]);

  const loadRegisteredUsers = async () => {
    try {
      const url = localStorage.getItem('wetalks_supabase_url') || 'https://nsyvlftqcciyetsbhymg.supabase.co';
      const key = localStorage.getItem('wetalks_supabase_key') || 'sb_publishable_lkhrFuMlNyEmUX4RTFApKw_AhD1sAkV';
      const supabase = createClient(url, key);
      const { data, error } = await supabase.from('wetalks_users').select('*');
      if (data && !error) {
        setRegisteredUsers(data.map(u => ({
          username: u.username,
          password: u.password_numeric,
          avatar: u.avatar_base64
        })));
      } else {
        const usersRaw = localStorage.getItem('wetalks_registered_users') || localStorage.getItem('wetalks_accounts_db');
        if (usersRaw) {
          setRegisteredUsers(JSON.parse(usersRaw));
        } else {
          setRegisteredUsers([]);
        }
      }
    } catch (e) {
      console.error(e);
      const usersRaw = localStorage.getItem('wetalks_registered_users') || localStorage.getItem('wetalks_accounts_db');
      if (usersRaw) {
        setRegisteredUsers(JSON.parse(usersRaw));
      } else {
        setRegisteredUsers([]);
      }
    }
  };

  useEffect(() => {
    if (isAdminAuthorized) {
      loadRegisteredUsers();
    }
  }, [isAdminAuthorized]);

  const handleWallpaperChange = (url: string) => {
    onUpdateSettings({
      ...settings,
      wallpaper: url,
    });
  };

  const handleToggleTheme = () => {
    onUpdateSettings({
      ...settings,
      isDarkTheme: !settings.isDarkTheme,
    });
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f4f6] text-gray-800 font-sans p-4 overflow-auto select-none" id="settings-app">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Section 1: Themes & Styling */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
            <Sun className="w-4 h-4 text-blue-600" />
            <span>Theme Preferences</span>
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Configure the visual appearance of your noob os Taskbar, Start Menu, and popup drawers.
          </p>
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
            <div>
              <p className="text-xs font-bold text-gray-700">Dark Taskbar & Start Menu</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Toggle fluorescent panels styling preference.</p>
            </div>
            <button
              onClick={handleToggleTheme}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                settings.isDarkTheme
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
              id="settings-btn-theme-toggle"
            >
              {settings.isDarkTheme ? (
                <>
                  <Moon className="w-4 h-4" />
                  <span>Dark Theme</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4" />
                  <span>Light Theme</span>
                </>
              )}
            </button>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100 mt-3">
            <div>
              <p className="text-xs font-bold text-gray-700">Qキーでタスクバーを隠す/表示する (Toggle Taskbar with Q Key)</p>
              <p className="text-[10px] text-gray-400 mt-0.5">キーボードの「Q」キーを押して、タスクバーの表示/非表示を切り替えます（文字入力中を除く）。</p>
            </div>
            <button
              onClick={() => {
                onUpdateSettings({
                  ...settings,
                  isToggleTaskbarWithQ: !settings.isToggleTaskbarWithQ,
                });
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition-colors ${
                settings.isToggleTaskbarWithQ
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border border-gray-300 hover:bg-gray-100 text-gray-700'
              }`}
              id="settings-btn-q-toggle"
            >
              {settings.isToggleTaskbarWithQ ? '有効 (Enabled)' : '無効 (Disabled)'}
            </button>
          </div>
        </div>

        {/* Section 2: Desktop Background Wallpapers */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-orange-500" />
            <span>Desktop Background Wallpapers</span>
          </h3>
          <p className="text-xs text-gray-500 mb-4">
            Select an elegant backdrop image. Changes apply immediately to the main screen.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {WALLPAPERS.map((wp) => {
              const isSelected = settings.wallpaper === wp.url;
              return (
                <div
                  key={wp.id}
                  onClick={() => handleWallpaperChange(wp.url)}
                  className={`group cursor-pointer rounded-lg overflow-hidden border transition-all ${
                    isSelected ? 'ring-2 ring-blue-500 border-transparent shadow-sm' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <img src={wp.url} alt={wp.name} className="w-full h-24 object-cover group-hover:scale-105 transition-transform duration-300" referrerPolicy="no-referrer" />
                  <div className="p-2 bg-gray-50 text-[10px] text-center font-semibold truncate text-gray-700 border-t border-gray-100">
                    {wp.name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Reset / Storage Utilities */}
        <div className="bg-white border border-red-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-sm text-red-700 mb-2 flex items-center gap-2">
            <Trash2 className="w-4 h-4" />
            <span>Danger Zone / Reset OS</span>
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Clearing local storage will permanently wipe your virtual file system (saved Notepad documents and paint brush canvas works), and revert all styling options to defaults.
          </p>
          <div className="flex flex-col sm:flex-row flex-wrap gap-3">
            <button
              onClick={() => {
                if (onRestartSystem) {
                  onRestartSystem();
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold transition-all duration-150 shadow-sm active:scale-[0.98]"
              id="settings-btn-restart-system"
            >
              <RotateCw className="w-3.5 h-3.5" />
              <span>システム再起動 (Restart OS)</span>
            </button>

            <button
              onClick={() => {
                if (confirm('Warning! This will format your entire WebOS local drive, deleting all saved files, spreadsheets, drawings and custom wallpapers. Proceed?')) {
                  onResetSystem();
                }
              }}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-all duration-150 shadow-sm active:scale-[0.98]"
              id="settings-btn-reset-system"
            >
              <RefreshCw className="w-3.5 h-3.5 animate-spin-hover" />
              <span>Reset WebOS and Format Storage</span>
            </button>
          </div>
        </div>

        {/* Section 4: Admin Credentials Observer Panel */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
          <h3 className="font-bold text-sm text-gray-800 mb-3 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-500" />
            <span>Admin: User Credentials List (管理者用パスワード監視ビュー)</span>
          </h3>
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            Enter the administrative passcode to access the registered username database and view passwords or avatars.
          </p>

          {!isAdminAuthorized ? (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="password"
                placeholder="管理者パスコードを入力"
                value={passcode}
                onChange={(e) => {
                  setPasscode(e.target.value);
                  if (e.target.value === 'mozunbu_1203') {
                    setIsAdminAuthorized(true);
                  }
                }}
                className="flex-1 p-2 border border-gray-300 rounded text-xs outline-none focus:border-red-500"
              />
              <button
                onClick={() => {
                  if (passcode === 'mozunbu_1203') {
                    setIsAdminAuthorized(true);
                  } else {
                    alert('パスコードが正しくありません。');
                  }
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded text-xs font-semibold transition-colors shadow-xs"
              >
                認証
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-between items-center bg-green-50 border border-green-200 p-2 rounded text-xs text-green-800">
                <span>✓ 管理者認証に成功しました</span>
                <button
                  onClick={() => {
                    setIsAdminAuthorized(false);
                    setPasscode('');
                  }}
                  className="text-red-600 hover:underline font-bold text-[10px]"
                >
                  閉じる
                </button>
              </div>

              <div className="overflow-x-auto border border-gray-100 rounded-lg">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100">
                      <th className="p-3 font-semibold text-gray-600">アバター</th>
                      <th className="p-3 font-semibold text-gray-600">ユーザー名</th>
                      <th className="p-3 font-semibold text-gray-600">パスワード (数字)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {registeredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="p-4 text-center text-gray-400">
                          登録されたユーザーはありません
                        </td>
                      </tr>
                    ) : (
                      registeredUsers.map((u: any, idx: number) => (
                        <tr key={idx} className="border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                          <td className="p-3">
                            {u.avatar ? (
                              <img
                                src={u.avatar}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full object-cover border border-gray-200"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gray-200 border border-gray-300 flex items-center justify-center font-bold text-gray-500">
                                {u.username ? u.username.charAt(0).toUpperCase() : '?'}
                              </div>
                            )}
                          </td>
                          <td className="p-3 font-semibold text-gray-800">{u.username}</td>
                          <td className="p-3 font-mono font-bold text-red-600 bg-red-50/50 rounded">{u.password}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
