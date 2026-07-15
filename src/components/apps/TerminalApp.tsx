import React, { useState, useEffect, useRef } from 'react';
import { VirtualFile } from '../../types';

export const TerminalApp: React.FC = () => {
  const [history, setHistory] = useState<string[]>([
    'noob os [Version 1.0.0]',
    '(c) noob Corporation. All rights reserved.',
    '',
    'Type "help" to see available commands.',
    ''
  ]);
  const [inputValue, setInputValue] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyPointer, setHistoryPointer] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Administrator Mode States
  const [adminState, setAdminState] = useState<'none' | 'password_prompt' | 'authorized'>('none');
  const [adminTitle, setAdminTitle] = useState('緊急メンテナンスのお知らせ');
  const [adminSender, setAdminSender] = useState('システム管理者');
  const [adminBody, setAdminBody] = useState(
    `<h1 style="color: #185abd; font-family: sans-serif; border-bottom: 2px solid #185abd; padding-bottom: 8px;">管理者からの重要指示書</h1>
<p style="font-family: sans-serif; font-size: 14px; color: #333333; margin-top: 15px; line-height: 1.6;">
  本状はシステム管理者によってすべての一般端末へ向けて配信された公式文書です。
</p>
<p style="font-family: sans-serif; font-size: 14px; color: #333333; line-height: 1.6; background-color: #f3f6fc; padding: 12px; border-left: 4px solid #185abd; margin: 15px 0;">
  <strong>【連絡内容】</strong><br />
  基幹データベースサーバーの移行作業のため、本日18:00より全システムへのアクセスが一時的に制限されます。<br />
  作成中のファイルがある場合は、必ず速やかにローカルまたはクラウドへ保存を完了させてください。
</p>
<p style="font-family: sans-serif; font-size: 14px; color: #333333; line-height: 1.6;">
  ご不便をおかけいたしますが、システムの安定稼働のためご協力をお願い申し上げます。
</p>
<p style="font-family: sans-serif; font-size: 12px; color: #666666; margin-top: 30px; text-align: right; border-top: 1px dashed #dddddd; padding-top: 10px;">
  配信日時: ${new Date().toLocaleString()}<br />
  署名: セキュリティ統括本部 システム運用管理部門
</p>`
  );
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Auto-scroll to bottom of terminal output
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [history]);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  const handleCommand = (cmdStr: string) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) {
      setHistory(prev => [...prev, 'C:\\Users\\WebOS>']);
      return;
    }

    // Add to command history
    const newCmdHistory = [...commandHistory, trimmed];
    setCommandHistory(newCmdHistory);
    setHistoryPointer(newCmdHistory.length);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');

    const newOutput = [`C:\\Users\\WebOS>${trimmed}`];

    // Check for administrator commands
    if (command === 'sudo' || command === 'admin' || command === 'runas' || command === 'su' || command === 'administrator') {
      if (args === 'mozunbu1203') {
        setAdminState('authorized');
        setHistory(prev => [
          ...prev, 
          `C:\\Users\\WebOS>${trimmed}`, 
          'Authenticating administrative session...',
          'Status: Privilege Level 0 granted.',
          'Initializing Admin Broadcast Console...',
          ''
        ]);
        setInputValue('');
        return;
      } else if (args) {
        newOutput.push('Access Denied: Incorrect administrator password.');
      } else {
        setHistory(prev => [...prev, `C:\\Users\\WebOS>${trimmed}`, 'Enter Administrator Password:']);
        setAdminState('password_prompt');
        setInputValue('');
        return;
      }
    } else {
      switch (command) {
        case 'help':
          newOutput.push(
            'Supported CLI Commands:',
            '  help             - Show this help sheet',
            '  ls               - List files in virtual C:\\ drive',
            '  cat [filename]   - View text file contents',
            '  clear            - Clear terminal screen',
            '  date             - Display current system date',
            '  echo [text]      - Print text onto terminal stdout',
            '  sudo             - Access administrator mode (broadcast console)'
          );
          break;

        case 'ls':
          try {
            const stored = localStorage.getItem('webos_files');
            const files: VirtualFile[] = stored ? JSON.parse(stored) : [];
            if (files.length === 0) {
              newOutput.push('Directory of C:\\drive is empty.');
            } else {
              newOutput.push('Directory of C:\\');
              files.forEach((f) => {
                newOutput.push(
                  `  ${f.path.padEnd(12)}  ${f.name.padEnd(20)}  (${f.type.toUpperCase()})  - ${f.content.length} characters`
                );
              });
            }
          } catch {
            newOutput.push('Error loading filesystem.');
          }
          break;

        case 'cat':
          if (!args) {
            newOutput.push('Usage: cat [filename.txt]');
          } else {
            try {
              const stored = localStorage.getItem('webos_files');
              const files: VirtualFile[] = stored ? JSON.parse(stored) : [];
              const targetFile = files.find(
                (f) => f.name.toLowerCase() === args.toLowerCase()
              );

              if (!targetFile) {
                newOutput.push(`File not found: "${args}"`);
              } else if (targetFile.type !== 'txt') {
                newOutput.push(`Error: "${args}" is of type ${targetFile.type.toUpperCase()} and cannot be parsed as plain text.`);
              } else {
                newOutput.push(...targetFile.content.split('\n'));
              }
            } catch {
              newOutput.push('Error reading file.');
            }
          }
          break;

        case 'clear':
          setHistory([]);
          setInputValue('');
          return;

        case 'date':
          newOutput.push(new Date().toString());
          break;

        case 'echo':
          newOutput.push(args || '');
          break;

        default:
          newOutput.push(`'${command}' is not recognized as an internal or external command,`, 'operable program or batch file.');
      }
    }

    newOutput.push(''); // Add trailing line break
    setHistory(prev => [...prev, ...newOutput]);
    setInputValue('');
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (adminState === 'password_prompt') {
      const passwordInput = inputValue.trim().replace(/\s+/g, ' ');
      if (passwordInput === 'mozunbu1203' || passwordInput === 'sudo mozunbu1203') {
        setAdminState('authorized');
        setHistory(prev => [
          ...prev,
          '******',
          'Authenticating administrative session...',
          'Status: Privilege Level 0 granted.',
          'Initializing Admin Broadcast Console...',
          ''
        ]);
      } else {
        setAdminState('none');
        setHistory(prev => [
          ...prev,
          '******',
          'Access Denied: Incorrect administrator password.',
          ''
        ]);
      }
      setInputValue('');
      return;
    }
    handleCommand(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyPointer > 0) {
        const nextPointer = historyPointer - 1;
        setHistoryPointer(nextPointer);
        setInputValue(commandHistory[nextPointer]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyPointer < commandHistory.length - 1) {
        const nextPointer = historyPointer + 1;
        setHistoryPointer(nextPointer);
        setInputValue(commandHistory[nextPointer]);
      } else {
        setHistoryPointer(commandHistory.length);
        setInputValue('');
      }
    }
  };

  // Render Admin Broadcast Panel when authorized
  if (adminState === 'authorized') {
    return (
      <div 
        className="flex flex-col h-full bg-[#070b12] text-zinc-200 font-sans p-4 sm:p-6 overflow-y-auto select-none" 
        id="admin-broadcast-panel"
      >
        {/* Panel Header */}
        <div className="border-b border-zinc-800 pb-4 mb-4 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight text-white uppercase font-mono">
                WebOS Admin Broadcast Console
              </h2>
              <p className="text-[10px] text-zinc-400 font-mono">
                Domain Admin Session (Privilege Level: 0)
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setAdminState('none');
              setHistory(prev => [...prev, 'Returned to standard shell session.', '']);
            }}
            className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 text-[11px] text-zinc-300 rounded font-mono transition-colors border border-zinc-700"
          >
            EXIT ADMIN MODE
          </button>
        </div>

        {/* Status Indicators */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80 font-mono text-[10px]">
            <span className="text-zinc-500 block">SYSTEM STATUS:</span>
            <span className="text-emerald-400 font-bold">🟢 ACTIVE & LISTENING</span>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80 font-mono text-[10px]">
            <span className="text-zinc-500 block">DELIVERY FORMAT:</span>
            <span className="text-blue-400 font-bold">Microsoft Word (.docx)</span>
          </div>
          <div className="bg-zinc-950/60 p-3 rounded-lg border border-zinc-800/80 font-mono text-[10px]">
            <span className="text-zinc-500 block">TARGET WORKSTATIONS:</span>
            <span className="text-amber-500 font-bold">All Non-Privileged Workstations</span>
          </div>
        </div>

        {/* Broadcast Form */}
        <div className="bg-zinc-950/40 border border-zinc-800 p-4 rounded-xl flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold font-mono">
                Document Title (docx title)
              </label>
              <input
                type="text"
                value={adminTitle}
                onChange={(e) => setAdminTitle(e.target.value)}
                placeholder="e.g. 重要指示事項"
                className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold font-mono">
                Sender Signature (差出人)
              </label>
              <input
                type="text"
                value={adminSender}
                onChange={(e) => setAdminSender(e.target.value)}
                placeholder="e.g. システム管理者"
                className="bg-zinc-900 border border-zinc-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase tracking-wider text-zinc-400 font-bold font-mono flex items-center justify-between">
              <span>Message Body (HTML format for Microsoft Word Editor)</span>
              <span className="text-[9px] lowercase font-normal opacity-40">renders inside WordApp view</span>
            </label>
            <textarea
              value={adminBody}
              onChange={(e) => setAdminBody(e.target.value)}
              rows={9}
              className="bg-zinc-900 border border-zinc-800 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono resize-none leading-relaxed"
            />
          </div>

          {broadcastSuccess && (
            <div className="bg-emerald-950/40 border border-emerald-800/80 text-emerald-400 px-4 py-2.5 rounded text-xs flex items-center gap-2 animate-fade-in">
              <span>🟢</span>
              <span>
                <strong>ブロードキャスト成功!</strong> 管理者権限を持たない一般端末にWordメッセージ通知を送信しました。
              </span>
            </div>
          )}

          <button
            onClick={async () => {
              try {
                const res = await fetch('/api/admin/broadcasts', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({
                    sender: adminSender,
                    title: adminTitle + '.docx',
                    text: adminBody,
                  }),
                });
                if (res.ok) {
                  const data = await res.json();
                  if (data.success && data.broadcast) {
                    // Mark as seen on the sender terminal so we don't trigger a popup for ourselves
                    try {
                      const seenRaw = localStorage.getItem('webos_seen_broadcasts');
                      const seen = seenRaw ? JSON.parse(seenRaw) : [];
                      if (!seen.includes(data.broadcast.id)) {
                        seen.push(data.broadcast.id);
                        localStorage.setItem('webos_seen_broadcasts', JSON.stringify(seen));
                      }
                    } catch (e) {
                      console.error(e);
                    }
                  }
                  setBroadcastSuccess(true);
                  setTimeout(() => {
                    setBroadcastSuccess(false);
                  }, 4000);
                } else {
                  console.error('Failed to broadcast message');
                }
              } catch (e) {
                console.error('Error broadcasting message:', e);
              }
            }}
            className="w-full bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-mono text-xs font-bold py-2.5 px-4 rounded transition-all duration-150 uppercase tracking-wider mt-1 shadow-md hover:shadow-emerald-950/20 active:scale-[0.99]"
          >
            Broadcast Message (Deliver as Word docx)
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={focusInput}
      className="flex flex-col h-full bg-[#0c0c0c] text-[#cccccc] font-mono text-xs sm:text-sm p-4 overflow-hidden select-all"
      id="terminal-app"
    >
      {/* Output Console area */}
      <div
        ref={containerRef}
        className="flex-1 overflow-y-auto space-y-1 pr-1"
        style={{ scrollbarWidth: 'thin' }}
      >
        {history.map((line, i) => (
          <div key={i} className="whitespace-pre-wrap leading-relaxed min-h-[1.25rem]">
            {line.startsWith('C:\\Users\\WebOS>') ? (
              <span>
                <span className="text-[#00ffff]">C:\Users\WebOS&gt;</span>
                {line.replace('C:\\Users\\WebOS>', '')}
              </span>
            ) : line.includes('Error:') || line.includes('Access Denied:') ? (
              <span className="text-red-400">{line}</span>
            ) : line.includes('Supported CLI Commands:') ? (
              <span className="text-yellow-400">{line}</span>
            ) : line.includes('successful.') || line.includes('granted.') ? (
              <span className="text-emerald-400">{line}</span>
            ) : (
              line
            )}
          </div>
        ))}

        {/* Typing Line */}
        <div className="flex items-center min-h-[1.25rem]">
          <span className="text-[#00ffff] mr-1 shrink-0">
            {adminState === 'password_prompt' ? 'Enter Password: ' : 'C:\\Users\\WebOS>'}
          </span>
          <form onSubmit={handleSubmit} className="flex-1 flex items-center">
            <input
              ref={inputRef}
              type={adminState === 'password_prompt' ? 'password' : 'text'}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-[#cccccc] p-0 font-mono text-xs sm:text-sm select-all"
              autoFocus
              autoComplete="off"
              spellCheck={false}
              id="terminal-cli-input"
            />
            <button
              type="submit"
              className="ml-2 px-2.5 py-0.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-900 text-[10px] text-cyan-400 font-sans font-semibold rounded border border-zinc-700 transition cursor-pointer shrink-0"
              title="送信"
            >
              送信
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
