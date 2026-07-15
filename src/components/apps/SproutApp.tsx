import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Square, 
  FileCode, 
  Save, 
  Upload, 
  RefreshCw, 
  HelpCircle, 
  FileText, 
  ChevronRight, 
  ChevronDown,
  Check, 
  Trash2, 
  Download, 
  Terminal, 
  BookOpen, 
  AlertCircle,
  Plus,
  ArrowRight,
  Info,
  X,
  Files,
  Search,
  Settings,
  Folder
} from 'lucide-react';
import { SproutInterpreter } from './SproutInterpreter';
import { VirtualFile } from '../../types';

interface SproutAppProps {
  initialFileContent?: string;
  initialFileName?: string;
  onFileSaved?: () => void;
}

// Default Sprout main.sp file template (clean state as requested)
const DEFAULT_MAIN_CODE = `# main.sp

make int a : 10
make int b : 20
make int sum : a + b

display("Sum of a and b is: ", sum)
`;

const DEFAULT_REFERENCE_CODE = `=========================================
      Sprout Language Specifications & Reference
=========================================

Sproutは、Python風のブロック構文と簡潔なキーワード、
強力なデータ構造を備えた軽量スクリプト言語です。

1. 変数宣言 (Variable Declarations)
-----------------------------------------
変数宣言には "make" キーワードとコロン ":"、またはピリオド "." を使用します。
基本型には int, string, bool, flort があります。

・値の初期化を伴う宣言:
    make int a : 10
    make string text : "こんにちは"
    make bool flag : true
    make flort pi : 3.14

・初期値なしの宣言 (ピリオドで終わる):
    make int x.       # デフォルト値は 0
    make string s.    # デフォルト値は ""
    make bool b.      # デフォルト値は false
    make flort f.     # デフォルト値は 0.0

2. 配列・リスト (Lists)
-----------------------------------------
リストの宣言は、角括弧を用いた初期化、または初期値なしで行えます。

・初期化リスト:
    make list food [ "リンゴ", "みかん", "バナナ" ].

・空のリスト:
    make list items.

・要素の追加 (add):
    food add "ブドウ"

・インデックスによる要素アクセス:
    # Sproutのインデックスは「1」から始まります。
    # 「:」または「.[ ]」の記法でアクセス可能です。
    display(food : 1)       # -> リンゴ
    display(food.[2])       # -> みかん

・インデックス代入:
    food : 1 = "イチゴ"
    food.[2] = "桃"

・要素数・サイズクエリ:
    # 変数名に "?" または "scale?" を付与してサイズや型情報を取得できます。
    make int size : food scale?
    display("要素数: ", size)

3. 制御構文 (Control Flow)
-----------------------------------------
SproutはPythonに似たインデントブロックを採用しています。
ブロックの始まりには、条件式の末尾にコロン ":" をつけます。
ループは "break." で途中で終了できます。

・If条件分岐:
    make int num : 15
    if num > 10 :
      display("10より大きいです。")
    else if num = 10 :
      display("10です。")
    else:
      display("10未満です。")

・Forループ:
    # 範囲の反復。 step [増分] および of [ループ変数名] を指定します。
    for 1 to 5 step 1 of i :
      display("ループ回数: ", i)

・Whileループ:
    make int count : 1
    while count <= 3 :
      display("カウント: ", count)
      count : count + 1

4. 関数 (Functions)
-----------------------------------------
関数は "function" キーワードで定義します。
戻り値の有無を関数の定義部分のカンマに続けて "true" または "false" で指定します。
関数の定義ブロックは最後は "."（ピリオド）や "return" で閉じます。

・引数と戻り値を持つ関数 (hasReturn: true):
    function add(x, y), true:
      return x + y.

・呼び出し:
    make int sum : add(10, 20)
    display("合計: ", sum)

5. モジュールインポート (Module Imports)
-----------------------------------------
組み込みのモジュールを読み込み、拡張機能を利用できます。

・モジュールの読み込み:
    import module list default.
    import module list Zero.

・モジュール定義・作成例:
    import module list default.
    import make module.

    function sum(numbers, v), true:
      # リスト numbers の全要素に v を加算するなどの処理
      ...
      return result.

    output : sum(list, send).

・モジュール使用・関数検証例:
    import module use math.sp
    make list my_list [ 1, 2, 3 ].
    make int val : 10

    # 正しい呼び出し（期待される引数の数 2 に対し、2つ渡す）
    make int result : module.use.math(my_list, val)
    display("結果: ", result)

    # 誤った呼び出し（引数を1つしか渡さないとバリデーションエラーが発生）
    # make int err : module.use.math(my_list)

6. その他 (Others)
-----------------------------------------
・エラー発生:
    error_messag("予期しないエラーです。")

・コメント:
    # 記号の後はコメントとなり実行時には無視されます。
`;

const DEFAULT_SCALE_MODULE_CODE = `import make module

function add(value1, value2), true:
  return value1 + value2.

add(send)
`;

const DEFAULT_MATH_MODULE_CODE = `# ① モジュール定義ブロック
import module list default.
import make module.

# ② 関数ブロック
function Alladd(numbers, v), true:
  make int num_sise : numbers scale?
  make int result.
  for 1 to num_sise step 1 of i :
    if numbers : i = v :
      result : result + numbers : i
    else:
      error_messag(型名が違います。)
      break.
  return result.

# ③ 呼び出し・出力ブロック
output : Alladd list (send).
`;

export const SproutApp: React.FC<SproutAppProps> = ({
  initialFileContent,
  initialFileName,
  onFileSaved,
}) => {
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [activeFileName, setActiveFileName] = useState<string>('main.sp');
  const [code, setCode] = useState<string>('');
  
  // Console state
  const [consoleLogs, setConsoleLogs] = useState<Array<{ type: 'info' | 'output' | 'error'; text: string }>>([]);
  const [isRunning, setIsRunning] = useState<boolean>(false);
  
  // Interactive CUI input state
  const [showInputPrompt, setShowInputPrompt] = useState<boolean>(false);
  const [inputPromptText, setInputPromptText] = useState<string>('');
  const [inputValue, setInputValue] = useState<string>('');
  const inputResolveRef = useRef<((value: string) => void) | null>(null);
  
  // Search query
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Line / cursor indicators
  const [cursorPosition, setCursorPosition] = useState({ line: 1, ch: 1 });
  
  // Autocomplete suggestions
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [suggestionIndex, setSuggestionIndex] = useState<number>(0);
  const [suggestionLine, setSuggestionLine] = useState<number>(0);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  
  // Custom non-blocking dialog states
  const [showNewFileDialog, setShowNewFileDialog] = useState<boolean>(false);
  const [newFileNameInput, setNewFileNameInput] = useState<string>('untitled.sp');
  const [newFileDialogError, setNewFileDialogError] = useState<string>('');
  const [showAlertDialog, setShowAlertDialog] = useState<boolean>(false);
  const [alertMessage, setAlertMessage] = useState<string>('');

  const showCustomAlert = (message: string) => {
    setAlertMessage(message);
    setShowAlertDialog(true);
  };
  
  // UI ref
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  const inputFieldRef = useRef<HTMLInputElement>(null);
  const interpreterRef = useRef<SproutInterpreter | null>(null);

  // Load files from system localstorage on mount
  useEffect(() => {
    loadFilesFromStorage();
  }, []);

  // Update active file when initial file payloads are injected from explorer double click
  useEffect(() => {
    if (initialFileName && initialFileContent !== undefined) {
      setActiveFileName(initialFileName);
      setCode(initialFileContent);
      
      // Merge into files list if not already present
      setFiles(prev => {
        if (!prev.some(f => f.name === initialFileName)) {
          const newFile: VirtualFile = {
            name: initialFileName,
            path: 'Documents',
            content: initialFileContent,
            type: 'txt',
            createdAt: new Date().toLocaleDateString()
          };
          const next = [...prev, newFile];
          localStorage.setItem('webos_files', JSON.stringify(next));
          return next;
        }
        return prev;
      });
    } else {
      // Load current active file
      let savedFiles = getStoredFiles();
      const initialized = localStorage.getItem('sprout_initialized');
      
      if (!initialized) {
        // Pre-populate with main.sp and reference.txt on first run
        const prepopulated: VirtualFile[] = [
          {
            name: 'main.sp',
            path: 'Documents',
            content: DEFAULT_MAIN_CODE,
            type: 'txt',
            createdAt: new Date().toLocaleDateString()
          },
          {
            name: 'reference.txt',
            path: 'Documents',
            content: DEFAULT_REFERENCE_CODE,
            type: 'txt',
            createdAt: new Date().toLocaleDateString()
          }
        ];
        localStorage.setItem('webos_files', JSON.stringify(prepopulated));
        localStorage.setItem('sprout_initialized', 'true');
        setFiles(prepopulated);
        setActiveFileName('main.sp');
        setCode(DEFAULT_MAIN_CODE);
      } else {
        // Automatically inject reference.txt if missing on upgrade
        if (!savedFiles.some(f => f.name === 'reference.txt')) {
          savedFiles.push({
            name: 'reference.txt',
            path: 'Documents',
            content: DEFAULT_REFERENCE_CODE,
            type: 'txt',
            createdAt: new Date().toLocaleDateString()
          });
          localStorage.setItem('webos_files', JSON.stringify(savedFiles));
        }
        setFiles(savedFiles);
        const current = savedFiles.find(f => f.name === activeFileName);
        if (current) {
          setCode(current.content);
        } else if (savedFiles.length > 0) {
          const firstSp = savedFiles.find(f => f.name.endsWith('.sp') || f.name.endsWith('.txt'));
          if (firstSp) {
            setActiveFileName(firstSp.name);
            setCode(firstSp.content);
          } else {
            setActiveFileName(savedFiles[0].name);
            setCode(savedFiles[0].content);
          }
        } else {
          setActiveFileName('');
          setCode('');
        }
      }
    }
  }, [initialFileName, initialFileContent]);

  // Sync scroll between transparent textarea, highlight background pre/code, and line numbers
  const handleScroll = () => {
    if (textareaRef.current) {
      const { scrollTop, scrollLeft } = textareaRef.current;
      
      if (highlightRef.current) {
        highlightRef.current.scrollTop = scrollTop;
        highlightRef.current.scrollLeft = scrollLeft;
      }
      if (lineNumbersRef.current) {
        lineNumbersRef.current.scrollTop = scrollTop;
      }
    }
  };

  const getStoredFiles = (): VirtualFile[] => {
    try {
      const stored = localStorage.getItem('webos_files');
      if (stored) {
        return JSON.parse(stored) as VirtualFile[];
      }
    } catch (e) {
      console.error(e);
    }
    return [];
  };

  const loadFilesFromStorage = () => {
    const stored = getStoredFiles();
    const initialized = localStorage.getItem('sprout_initialized');
    
    if (!initialized && stored.length === 0) {
      const mainFile: VirtualFile = {
        name: 'main.sp',
        path: 'Documents',
        content: DEFAULT_MAIN_CODE,
        type: 'txt',
        createdAt: new Date().toLocaleDateString()
      };
      const refFile: VirtualFile = {
        name: 'reference.txt',
        path: 'Documents',
        content: DEFAULT_REFERENCE_CODE,
        type: 'txt',
        createdAt: new Date().toLocaleDateString()
      };
      const prepopulated = [mainFile, refFile];
      localStorage.setItem('webos_files', JSON.stringify(prepopulated));
      localStorage.setItem('sprout_initialized', 'true');
      setFiles(prepopulated);
      setActiveFileName('main.sp');
      setCode(DEFAULT_MAIN_CODE);
    } else {
      let saved = [...stored];
      // Inject reference.txt if missing
      if (!saved.some(f => f.name === 'reference.txt')) {
        saved.push({
          name: 'reference.txt',
          path: 'Documents',
          content: DEFAULT_REFERENCE_CODE,
          type: 'txt',
          createdAt: new Date().toLocaleDateString()
        });
        localStorage.setItem('webos_files', JSON.stringify(saved));
      }
      setFiles(saved);
      if (activeFileName) {
        const current = saved.find(f => f.name === activeFileName);
        if (current) {
          setCode(current.content);
        }
      } else if (saved.length > 0) {
        const firstSp = saved.find(f => f.name.endsWith('.sp') || f.name.endsWith('.txt'));
        if (firstSp) {
          setActiveFileName(firstSp.name);
          setCode(firstSp.content);
        } else {
          setActiveFileName(saved[0].name);
          setCode(saved[0].content);
        }
      } else {
        setActiveFileName('');
        setCode('');
      }
    }
  };

  // Switch active editor file
  const handleSelectFile = (fileName: string) => {
    // Save current file first
    if (activeFileName) {
      saveFile(activeFileName, code);
    }

    const stored = getStoredFiles();
    const found = stored.find(f => f.name === fileName);
    if (found) {
      setActiveFileName(fileName);
      setCode(found.content);
      setConsoleLogs([]);
    }
  };

  // Save current code to virtual system
  const saveFile = (fileName: string, contentToSave: string) => {
    if (!fileName) return;
    const stored = getStoredFiles();
    const fileIndex = stored.findIndex(f => f.name === fileName);
    
    if (fileIndex !== -1) {
      stored[fileIndex].content = contentToSave;
    } else {
      stored.push({
        name: fileName,
        path: 'Documents',
        content: contentToSave,
        type: 'txt',
        createdAt: new Date().toLocaleDateString()
      });
    }
    localStorage.setItem('webos_files', JSON.stringify(stored));
    setFiles(stored);
    if (onFileSaved) onFileSaved();
  };

  // Save active file explicitly
  const handleSaveActiveFile = () => {
    saveFile(activeFileName, code);
    addConsoleLog('info', `ファイル "${activeFileName}" を保存しました。`);
  };

  // Trigger opening the dialog to create a new file
  const handleCreateNewFile = () => {
    setNewFileNameInput('untitled.sp');
    setNewFileDialogError('');
    setShowNewFileDialog(true);
  };

  // Perform actual creation when dialog is submitted
  const confirmCreateNewFile = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let finalName = newFileNameInput.trim();
    if (!finalName) {
      setNewFileDialogError('ファイル名を入力してください。');
      return;
    }
    if (!finalName.endsWith('.sp') && !finalName.endsWith('.txt')) {
      finalName += '.sp';
    }

    const stored = getStoredFiles();
    if (stored.some(f => f.name === finalName)) {
      setNewFileDialogError('同名のファイルが既に存在します。');
      return;
    }

    const newFile: VirtualFile = {
      name: finalName,
      path: 'Documents',
      content: `# ${finalName}\n\n`,
      type: 'txt',
      createdAt: new Date().toLocaleDateString()
    };

    const nextFiles = [...stored, newFile];
    localStorage.setItem('webos_files', JSON.stringify(nextFiles));
    setFiles(nextFiles);
    setActiveFileName(finalName);
    setCode(newFile.content);
    setConsoleLogs([]);
    setShowNewFileDialog(false);
    addConsoleLog('info', `新規ファイル "${finalName}" を作成しました。`);
  };

  // Delete a virtual Sprout file
  const handleDeleteFile = (fileName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const stored = getStoredFiles();
    const filtered = stored.filter(f => f.name !== fileName);
    localStorage.setItem('webos_files', JSON.stringify(filtered));
    setFiles(filtered);

    // If active file was deleted, switch to another
    if (activeFileName === fileName) {
      const remainingSp = filtered.filter(f => f.name.endsWith('.sp') || f.name.endsWith('.txt'));
      if (remainingSp.length > 0) {
        setActiveFileName(remainingSp[0].name);
        setCode(remainingSp[0].content);
      } else if (filtered.length > 0) {
        setActiveFileName(filtered[0].name);
        setCode(filtered[0].content);
      } else {
        setActiveFileName('');
        setCode('');
      }
    }
    addConsoleLog('info', `ファイル "${fileName}" を削除しました。`);
  };

  // File Download / Export helper
  const handleExportFile = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addConsoleLog('info', `ファイル "${activeFileName}" をエクスポートしました。`);
  };

  // File Upload / Import helper
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const fileName = file.name;
      
      const stored = getStoredFiles();
      const updated = stored.filter(f => f.name !== fileName);
      updated.push({
        name: fileName,
        path: 'Documents',
        content,
        type: 'txt',
        createdAt: new Date().toLocaleDateString()
      });

      localStorage.setItem('webos_files', JSON.stringify(updated));
      setFiles(updated);
      setActiveFileName(fileName);
      setCode(content);
      setConsoleLogs([]);
      addConsoleLog('info', `ファイル "${fileName}" をインポートしました。`);
    };
    reader.readAsText(file);
  };

  // Run Sprout interpreter code
  const handleRunCode = async () => {
    if (isRunning) return;

    setIsRunning(true);
    setConsoleLogs([]);
    addConsoleLog('info', `--- ${activeFileName} の実行を開始します ---`);

    // Auto-save active file
    saveFile(activeFileName, code);

    // Initialize interpreter
    const interpreter = new SproutInterpreter({
      onOutput: (text) => {
        addConsoleLog('output', text);
      },
      onInputPrompt: (promptText) => {
        return new Promise<string>((resolve) => {
          setInputPromptText(promptText);
          setShowInputPrompt(true);
          setInputValue('');
          inputResolveRef.current = resolve;
          
          // Focus input field dynamically
          setTimeout(() => {
            if (inputFieldRef.current) {
              inputFieldRef.current.focus();
            }
          }, 50);
        });
      },
      onComplete: () => {
        addConsoleLog('info', '--- 実行が正常に完了しました ---');
        setIsRunning(false);
      },
      onError: (err, lineNum) => {
        addConsoleLog('error', `エラー (行 ${lineNum}): ${err}`);
        setIsRunning(false);
      },
      onReadFile: (filename) => {
        const stored = getStoredFiles();
        let target = filename.trim();
        if (!target.toLowerCase().endsWith('.sp')) {
          target = target + '.sp';
        }
        const file = stored.find(f => 
          f.name.toLowerCase() === filename.trim().toLowerCase() ||
          f.name.toLowerCase() === target.toLowerCase()
        );
        return file ? file.content : undefined;
      }
    });

    interpreterRef.current = interpreter;
    await interpreter.execute(code);
  };

  // Stop running execution
  const handleStopExecution = () => {
    if (interpreterRef.current) {
      interpreterRef.current.stop();
    }
    setIsRunning(false);
    setShowInputPrompt(false);
    addConsoleLog('error', '--- ユーザーにより実行が強制停止されました ---');
  };

  // Handle console input submit
  const handleInputSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputResolveRef.current) {
      const value = inputValue;
      setShowInputPrompt(false);
      addConsoleLog('output', `> ${value}`);
      inputResolveRef.current(value);
      inputResolveRef.current = null;
    }
  };

  // Append a message to console logs
  const addConsoleLog = (type: 'info' | 'output' | 'error', text: string) => {
    setConsoleLogs(prev => [...prev, { type, text }]);
    // Scroll console to bottom
    setTimeout(() => {
      if (consoleEndRef.current) {
        consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
      }
    }, 30);
  };

  // Format Sprout Code (Standardize spaces and double-indent after colons)
  const handleFormatCode = () => {
    const lines = code.split('\n');
    let formattedLines: string[] = [];
    let currentIndent = 0;

    lines.forEach(line => {
      let trimmed = line.trim();
      if (!trimmed) {
        formattedLines.push('');
        return;
      }

      // Decrement indentation for closing / relative block keywords
      if (trimmed.startsWith('else if ') || trimmed === 'else:' || trimmed === 'else :') {
        currentIndent = Math.max(0, currentIndent - 2);
      }

      // Add indentation spaces
      const space = ' '.repeat(currentIndent);
      formattedLines.push(space + trimmed);

      // Increment indentation if ends with block header colon
      if (trimmed.endsWith(':')) {
        currentIndent += 2;
      }

      // If it has a return or break, sometimes reset or handle block end
      // However, Pythonic indent is usually closed explicitly by next indent change.
    });

    setCode(formattedLines.join('\n'));
    addConsoleLog('info', 'コードのインデントをフォーマットしました。');
  };

  // Cursor position changed
  const handleCursorChange = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    const valueBefore = el.value.substring(0, el.selectionStart);
    const lines = valueBefore.split('\n');
    const lineNum = lines.length;
    const chNum = lines[lines.length - 1].length + 1;
    setCursorPosition({ line: lineNum, ch: chNum });

    // Handle suggestions lookup
    handleSuggestionsLookup(el.value, el.selectionStart, lineNum);
  };

  // Auto-complete Intellisense handler
  const handleSuggestionsLookup = (text: string, cursorOffset: number, lineNum: number) => {
    const lastWordRegex = /([a-zA-Z_][a-zA-Z0-9_\s]*)$/;
    const lineContent = text.substring(0, cursorOffset).split('\n')[lineNum - 1] || '';
    const match = lineContent.match(lastWordRegex);

    if (match) {
      const currentWord = match[1].toLowerCase().trim();
      if (currentWord.length >= 1) {
        // Core keywords and language components
        const keywords = [
          'make', 'make int', 'make string', 'make bool', 'make flort', 'make list',
          'function', 'return', 'if', 'else if', 'else :', 'for', 'to', 'step', 'of',
          'while', 'break.', 'add', 'display', 'input', 
          'import module list Zero', 'import module list default', 
          'import module use', 'import make module',
          'module.use.',
          'error_messag', 'true', 'false', 'None'
        ];

        // Dynamic code scope variable and function scanner
        const dynamicVars: string[] = [];
        const dynamicFuncs: string[] = [];
        try {
          const lines = text.split('\n');
          lines.forEach(l => {
            const trimmed = l.trim();
            if (!trimmed || trimmed.startsWith('#')) return;

            // 1. make type name
            const makeMatch = trimmed.match(/^make\s+(int|string|bool|flort|list)\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
            if (makeMatch) {
              dynamicVars.push(makeMatch[2]);
            }

            // 2. function name(...)
            const funcMatch = trimmed.match(/^function\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(([^)]*)\)/i);
            if (funcMatch) {
              dynamicFuncs.push(funcMatch[1]);
              const argsStr = funcMatch[2];
              if (argsStr) {
                argsStr.split(',').forEach(arg => {
                  const cleanArg = arg.trim();
                  if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(cleanArg)) {
                    dynamicVars.push(cleanArg);
                  }
                });
              }
            }

            // 3. for ... of loopVar
            const forMatch = trimmed.match(/for\s+.*\s+of\s+([a-zA-Z_][a-zA-Z0-9_]*)/i);
            if (forMatch) {
              dynamicVars.push(forMatch[1]);
            }

            // 4. input : ..., varName
            const inputMatch = trimmed.match(/^input\s*:\s*([^,]+)\s*,\s*([a-zA-Z_][a-zA-Z0-9_]*)/i);
            if (inputMatch) {
              dynamicVars.push(inputMatch[2]);
            }

            // 5. Explicit assignment: varName : value
            const assignMatch = trimmed.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*:/);
            if (assignMatch) {
              const name = assignMatch[1].trim();
              const lowerName = name.toLowerCase();
              const keywordsSet = new Set(['if', 'for', 'while', 'else', 'function', 'return', 'make', 'input', 'display', 'output', 'import']);
              if (!keywordsSet.has(lowerName)) {
                dynamicVars.push(name);
              }
            }
          });
        } catch (e) {
          console.error('Error scanning dynamic symbols:', e);
        }

        const uniqueVars = Array.from(new Set(dynamicVars));
        const uniqueFuncs = Array.from(new Set(dynamicFuncs));

        const allCandidates = Array.from(new Set([
          ...keywords,
          ...uniqueVars,
          ...uniqueFuncs
        ]));

        const filtered = allCandidates.filter(kw => 
          kw.toLowerCase().startsWith(currentWord) && 
          kw !== match[1]
        );

        if (filtered.length > 0) {
          // Only update suggestions and reset index if the suggestion list is different or hidden
          const isSame = suggestions.length === filtered.length && suggestions.every((val, i) => val === filtered[i]);
          if (!isSame || !showSuggestions) {
            setSuggestions(filtered);
            setSuggestionLine(lineNum);
            setSuggestionIndex(0);
            setShowSuggestions(true);
          }
          return;
        }
      }
    }
    setShowSuggestions(false);
  };

  // Insert selected autocomplete item
  const applySuggestion = (selectedSuggestion: string) => {
    if (!textareaRef.current) return;
    const el = textareaRef.current;
    const text = code;
    const cursorOffset = el.selectionStart;
    
    // Find length of word being replaced
    const lineContent = text.substring(0, cursorOffset).split('\n')[cursorPosition.line - 1] || '';
    const lastWordRegex = /([a-zA-Z_][a-zA-Z0-9_\s]*)$/;
    const match = lineContent.match(lastWordRegex);
    
    if (match) {
      const currentWordLength = match[1].length;
      const beforeWord = text.substring(0, cursorOffset - currentWordLength);
      const afterWord = text.substring(cursorOffset);
      
      const newCode = beforeWord + selectedSuggestion + afterWord;
      setCode(newCode);
      setShowSuggestions(false);

      // Re-focus and set selection
      setTimeout(() => {
        el.focus();
        const newCursorPos = cursorOffset - currentWordLength + selectedSuggestion.length;
        el.setSelectionRange(newCursorPos, newCursorPos);
      }, 50);
    }
  };

  const handleEditorKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Autocomplete navigation
    if (showSuggestions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev + 1) % suggestions.length);
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applySuggestion(suggestions[suggestionIndex]);
        return;
      }
      if (e.key === 'Escape') {
        setShowSuggestions(false);
        return;
      }
    }

    // Tab key spacing indentation
    if (e.key === 'Tab') {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const spaces = '  '; // 2 spaces for tab
      const nextCode = code.substring(0, start) + spaces + code.substring(end);
      setCode(nextCode);
      
      setTimeout(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      }, 0);
    }
  };

  // Regex syntax highlighter rendering
  const renderHighlightedCode = () => {
    const lines = code.split('\n');
    
    const highlightLine = (lineText: string) => {
      // Find comment index (first '#' that is not inside quotes)
      let commentIdx = -1;
      let inQuotes = false;
      let quoteChar = '';
      for (let i = 0; i < lineText.length; i++) {
        const char = lineText[i];
        if (inQuotes) {
          if (char === quoteChar) inQuotes = false;
        } else if (char === '"' || char === "'") {
          inQuotes = true;
          quoteChar = char;
        } else if (char === '#') {
          commentIdx = i;
          break;
        }
      }

      if (commentIdx !== -1) {
        const codePart = lineText.substring(0, commentIdx);
        const commentPart = lineText.substring(commentIdx);

        // Escape HTML for both
        const escapeHtml = (str: string) => str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');

        const escapedComment = `<span class="text-zinc-500/80 italic font-medium">${escapeHtml(commentPart)}</span>`;

        if (!codePart.trim()) {
          // Entire line is a comment! (Only whitespace before '#')
          return `<span class="text-zinc-500/80 italic font-medium">${escapeHtml(lineText)}</span>`;
        } else {
          // Highlight codePart normally, append escapedComment
          let escapedCode = escapeHtml(codePart);
          escapedCode = applyCodeHighlighting(escapedCode);
          return escapedCode + escapedComment;
        }
      } else {
        const escapeHtml = (str: string) => str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;');
        return applyCodeHighlighting(escapeHtml(lineText));
      }
    };

    const applyCodeHighlighting = (escaped: string) => {
      // Highlight Sprout keywords
      const keywords = [
        '\\bmake\\b', '\\bfunction\\b', '\\breturn\\b', '\\bif\\b', '\\belse if\\b', '\\belse\\b',
        '\\bfor\\b', '\\bto\\b', '\\bstep\\b', '\\bof\\b', '\\bwhile\\b', '\\bbreak\\b', '\\bbreak\\.\\b',
        '\\badd\\b', '\\bimport\\b', '\\bmodule\\b', '\\blist\\b', '\\bZero\\b', '\\bdefault\\b',
        '\\buse\\b', '\\boutput\\b', '\\bsend\\b'
      ];
      keywords.forEach(kw => {
        const regex = new RegExp(`(${kw})`, 'g');
        escaped = escaped.replace(regex, '<span class="text-indigo-400">$1</span>');
      });

      // Highlight primitive types
      const types = ['\\bint\\b', '\\bstring\\b', '\\bbool\\b', '\\bflort\\b'];
      types.forEach(t => {
        const regex = new RegExp(`(${t})`, 'g');
        escaped = escaped.replace(regex, '<span class="text-emerald-400">$1</span>');
      });

      // Highlight core input/output helpers
      const builtins = ['\\bdisplay\\b', '\\binput\\b', '\\berror_messag\\b'];
      builtins.forEach(b => {
        const regex = new RegExp(`(${b})`, 'g');
        escaped = escaped.replace(regex, '<span class="text-cyan-400">$1</span>');
      });

      // Scale / Type Queries
      escaped = escaped.replace(/(\w+)\s*scale\?/g, '<span class="text-sky-300">$1 scale?</span>');
      escaped = escaped.replace(/(\w+)\s*\?/g, '<span class="text-sky-300">$1?</span>');

      // Numbers (safe from matching inside existing tags like text-indigo-400)
      escaped = escaped.replace(/(<[^>]+>)|(\b\d+(\.\d+)?)\b/g, (m, tag, num) => {
        return tag ? tag : `<span class="text-amber-400">${num}</span>`;
      });

      // Booleans / None (safe from matching inside existing tags)
      escaped = escaped.replace(/(<[^>]+>)|(\b(true|false|None)\b)/g, (m, tag, word) => {
        return tag ? tag : `<span class="text-orange-400">${word}</span>`;
      });

      return escaped;
    };

    let escapedResult = lines.map(highlightLine).join('\n');
    if (code.endsWith('\n')) {
      escapedResult += ' ';
    }

    return { __html: escapedResult };
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1e1e1e] text-[#cccccc] font-sans overflow-hidden border border-zinc-800 rounded-lg shadow-2xl" id="sprout-studio-ide">
      
      {/* VS Code Main Layout splits into: Side Area and Main Area */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* 1. Activity Bar (Far Left) */}
        <div className="w-12 bg-[#181818] border-r border-[#2d2d2d] flex flex-col justify-between items-center py-3 select-none shrink-0 z-30" id="ide-activity-bar">
          <div className="flex flex-col items-center space-y-4">
            {/* Active Explorer Button */}
            <button className="p-2 text-white border-l-2 border-[#007acc] focus:outline-none transition" title="エクスプローラー">
              <Files className="w-5 h-5 text-[#007acc]" />
            </button>
            {/* Disabled Search icon */}
            <button className="p-2 text-zinc-500 hover:text-zinc-300 focus:outline-none transition" title="検索" onClick={() => showCustomAlert('検索機能は開発中です。')}>
              <Search className="w-5 h-5" />
            </button>
          </div>
          <div className="flex flex-col items-center">
            {/* Help / Docs Button */}
            <button 
              onClick={() => showCustomAlert('Sprout Studio IDE (VS Code Edition)\n- 左側のエクスプローラーでファイルを管理・新規作成、いつでもゴミ箱ボタンから削除できます。\n- 右上の実行ボタン(Play)からコードを即時実行し、下部の出力ペインで結果を確認できます。')} 
              className="p-2 text-zinc-500 hover:text-zinc-300 focus:outline-none transition" 
              title="ヘルプ"
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            {/* Settings Button */}
            <button className="p-2 text-zinc-500 hover:text-zinc-300 focus:outline-none transition" title="設定" onClick={() => showCustomAlert('設定は現在デフォルト(VS Code Dark Pro)に固定されています。')}>
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 2. Primary Sidebar (Explorer Drawer) */}
        <div className="w-56 bg-[#252526] border-r border-[#2d2d2d] flex flex-col overflow-hidden shrink-0" id="ide-sidebar">
          
          {/* Header */}
          <div className="h-9 px-3 flex items-center justify-between text-[11px] font-bold text-zinc-400 uppercase tracking-wider select-none border-b border-[#2d2d2d]">
            <span>エクスプローラー</span>
            <button 
              onClick={handleCreateNewFile} 
              className="p-1 hover:bg-[#333337] rounded text-zinc-400 hover:text-white transition" 
              title="新規ファイル作成"
              id="btn-new-file"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden">
            {/* collapsible folder */}
            <div className="px-1 py-1.5 flex items-center justify-between text-[11px] font-bold text-zinc-400 select-none cursor-pointer hover:bg-[#2a2a2b]">
              <div className="flex items-center space-x-1">
                <ChevronDown className="w-3 h-3 text-zinc-500" />
                <Folder className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span className="uppercase tracking-wide">Sprout Workspace</span>
              </div>
            </div>

            {/* File search */}
            <div className="px-2 pb-2">
              <input 
                type="text" 
                placeholder="ファイル名でフィルター..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#3c3c3c] border border-[#3c3c3c] focus:border-[#007acc] rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none font-sans placeholder-zinc-500"
                id="search-files"
              />
            </div>

            {/* File List Stream */}
            <div className="flex-1 overflow-y-auto px-1 space-y-0.5" id="sidebar-files-list">
              {files.filter(f => (f.name.endsWith('.sp') || f.name.endsWith('.txt')) && f.name.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 ? (
                <div className="px-4 py-2 text-[11px] text-zinc-500 italic">
                  ファイルがありません
                </div>
              ) : (
                files
                  .filter(f => (f.name.endsWith('.sp') || f.name.endsWith('.txt')) && f.name.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map(file => (
                    <div 
                      key={file.name}
                      onClick={() => handleSelectFile(file.name)}
                      className={`group flex items-center justify-between px-2 py-1 rounded cursor-pointer transition select-none ${
                        activeFileName === file.name 
                          ? 'bg-[#37373d] text-white' 
                          : 'text-zinc-400 hover:bg-[#2a2a2b] hover:text-zinc-200'
                      }`}
                      id={`file-item-${file.name}`}
                    >
                      <div className="flex items-center space-x-1.5 truncate">
                        <FileText className={`w-3.5 h-3.5 shrink-0 ${activeFileName === file.name ? 'text-emerald-400' : 'text-zinc-500'}`} />
                        <span className="text-[12px] truncate font-sans">{file.name}</span>
                      </div>
                      <button 
                        onClick={(e) => handleDeleteFile(file.name, e)}
                        className="opacity-60 group-hover:opacity-100 p-0.5 hover:bg-[#4d4d54] rounded text-zinc-400 hover:text-rose-400 transition shrink-0"
                        title="ファイルを削除"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* 3. Editor, Console, Status Bar Area (Right) */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#1e1e1e]" id="ide-main-workspace">
          
          {/* Tabs header bar */}
          <div className="h-9 bg-[#252526] flex items-center overflow-x-auto no-scrollbar border-b border-[#2d2d2d] select-none shrink-0">
            {files.map(file => (
              <div
                key={file.name}
                onClick={() => handleSelectFile(file.name)}
                className={`h-full px-3.5 flex items-center space-x-2 border-r border-[#2d2d2d] cursor-pointer transition shrink-0 text-xs ${
                  activeFileName === file.name
                    ? 'bg-[#1e1e1e] text-white border-t-2 border-t-[#007acc]'
                    : 'bg-[#2d2d2d] text-zinc-500 hover:bg-[#2b2b2b] hover:text-zinc-300'
                }`}
              >
                <FileText className={`w-3.5 h-3.5 shrink-0 ${activeFileName === file.name ? 'text-emerald-400' : 'text-zinc-500'}`} />
                <span>{file.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFile(file.name, e);
                  }}
                  className="p-0.5 hover:bg-[#333337] rounded text-zinc-500 hover:text-rose-400 transition shrink-0"
                  title="ファイルを削除"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
            
            {/* Play controls at top right */}
            <div className="ml-auto flex items-center pr-3 space-x-1">
              {activeFileName && (
                <>
                  {isRunning ? (
                    <button 
                      onClick={handleStopExecution} 
                      className="p-1.5 hover:bg-[#333337] text-rose-500 hover:text-rose-400 rounded transition"
                      title="停止"
                      id="btn-stop-code"
                    >
                      <Square className="w-4 h-4 fill-current" />
                    </button>
                  ) : (
                    <button 
                      onClick={handleRunCode} 
                      className="p-1.5 hover:bg-[#333337] text-emerald-500 hover:text-emerald-400 rounded transition"
                      title="実行"
                      id="btn-run-code"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                  )}
                  <div className="h-4 w-px bg-zinc-700/50 mx-1" />
                  <button 
                    onClick={handleSaveActiveFile} 
                    className="p-1.5 hover:bg-[#333337] text-zinc-400 hover:text-white rounded transition"
                    title="保存"
                    id="btn-save-file"
                  >
                    <Save className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleFormatCode} 
                    className="p-1.5 hover:bg-[#333337] text-zinc-400 hover:text-white rounded transition"
                    title="自動インデント整形"
                    id="btn-format-code"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleExportFile} 
                    className="p-1.5 hover:bg-[#333337] text-zinc-400 hover:text-white rounded transition"
                    title="エクスポート"
                    id="btn-export-file"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                  <label className="p-1.5 hover:bg-[#333337] text-zinc-400 hover:text-white rounded transition cursor-pointer">
                    <Upload className="w-4 h-4" />
                    <input 
                      type="file" 
                      accept=".sp" 
                      onChange={handleImportFile} 
                      className="hidden" 
                      id="btn-import-file"
                    />
                  </label>
                </>
              )}
            </div>
          </div>

          {/* Editor Area (Dynamic Workspace / Welcome panel) */}
          <div className="flex-1 relative overflow-hidden" id="ide-editor-container">
            {activeFileName ? (
              <div className="absolute inset-0 flex">
                
                {/* Line Numbers Bar */}
                <div 
                  ref={lineNumbersRef}
                  style={{
                    fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                    fontSize: '16px',
                    lineHeight: '26px',
                    paddingTop: '16px',
                    paddingBottom: '16px',
                  }}
                  className="w-12 select-none bg-[#1e1e1e] border-r border-[#2d2d2d] text-zinc-600 text-right pr-2 space-y-0 overflow-hidden no-scrollbar" 
                  id="ide-line-numbers"
                >
                  {code.split('\n').map((_, i) => (
                    <div key={i}>{i + 1}</div>
                  ))}
                </div>

                {/* Textarea Editor and HTML Highlight Block Overlaid */}
                <div className="flex-1 relative overflow-hidden h-full">
                  
                  {/* Highlighting Code Container */}
                  <pre 
                    ref={highlightRef}
                    style={{
                      fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '16px',
                      lineHeight: '26px',
                      padding: '16px',
                      margin: 0,
                      border: 'none',
                    }}
                    className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden whitespace-pre text-zinc-300 bg-transparent z-10 no-scrollbar box-border"
                    id="editor-highlighter"
                    dangerouslySetInnerHTML={renderHighlightedCode()}
                  />

                  {/* Edit Textarea Overlay (Transparent) */}
                  <textarea
                    ref={textareaRef}
                    value={code}
                    onChange={(e) => {
                      const val = e.target.value;
                      setCode(val);
                      saveFile(activeFileName, val);
                      
                      const el = e.currentTarget;
                      const valueBefore = val.substring(0, el.selectionStart);
                      const lines = valueBefore.split('\n');
                      const lineNum = lines.length;
                      const chNum = lines[lines.length - 1].length + 1;
                      setCursorPosition({ line: lineNum, ch: chNum });
                      handleSuggestionsLookup(val, el.selectionStart, lineNum);
                    }}
                    onScroll={handleScroll}
                    onKeyDown={handleEditorKeyDown}
                    onKeyUp={handleCursorChange}
                    onClick={handleCursorChange}
                    style={{
                      fontFamily: '"JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
                      fontSize: '16px',
                      lineHeight: '26px',
                      padding: '16px',
                      margin: 0,
                      border: 'none',
                      outline: 'none',
                      boxShadow: 'none',
                    }}
                    className="absolute inset-0 w-full h-full bg-transparent text-transparent caret-emerald-400 resize-none overflow-auto whitespace-pre z-20 focus:ring-0 focus:outline-none no-scrollbar box-border"
                    spellCheck="false"
                    id="editor-textarea"
                  />

                  {/* Floating Autocomplete Suggestions Panel */}
                  {showSuggestions && (
                    <div 
                      className="absolute bg-[#18181c] border border-zinc-700/80 rounded-lg shadow-2xl z-40 w-64 max-h-48 overflow-y-auto p-1 font-mono text-xs text-zinc-300"
                      style={{ 
                        top: `${Math.min(suggestionLine * 26 + 20 - (textareaRef.current?.scrollTop || 0), (textareaRef.current?.clientHeight || 300) - 200)}px`,
                        left: `${Math.min(16 + (cursorPosition.ch - 1) * 9.6 - (textareaRef.current?.scrollLeft || 0), (textareaRef.current?.clientWidth || 400) - 270)}px`
                      }}
                      id="autocomplete-panel"
                    >
                      <div className="px-2 py-1 text-[10px] text-zinc-500 uppercase tracking-wider border-b border-zinc-850">
                        Sprout 補完候補
                      </div>
                      {suggestions.map((sug, idx) => (
                        <div 
                          key={sug}
                          onClick={() => applySuggestion(sug)}
                          className={`px-2.5 py-1.5 rounded flex items-center justify-between cursor-pointer transition ${
                            idx === suggestionIndex 
                              ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/20' 
                              : 'hover:bg-zinc-800 text-zinc-400'
                          }`}
                          id={`autocomplete-item-${idx}`}
                        >
                          <span className="truncate font-mono font-medium">{sug}</span>
                          {idx === suggestionIndex && <ArrowRight className="w-3.5 h-3.5" />}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* VS Code Welcome screen if no file is selected/open */
              <div className="flex-1 bg-[#1e1e1e] flex flex-col items-center justify-center p-6 text-center select-none h-full">
                <div className="max-w-md space-y-6">
                  <div className="w-16 h-16 mx-auto rounded-2xl bg-emerald-600/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
                    <svg viewBox="0 0 100 100" className="w-10 h-10 fill-none stroke-current stroke-[6]" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M 50 80 Q 50 45, 65 25" />
                      <path d="M 50 55 Q 32 45, 36 30 Q 50 40, 50 55 Z" fill="#4ade80" fillOpacity="0.4" />
                      <path d="M 54 42 Q 72 35, 70 20 Q 54 28, 54 42 Z" fill="#4ade80" fillOpacity="0.4" />
                    </svg>
                  </div>
                  <div className="space-y-2">
                    <h2 className="text-xl font-bold text-white tracking-tight">Sprout Studio</h2>
                    <p className="text-xs text-zinc-500">
                      スプラウト言語のための軽量・高速なビジュアル統合開発環境
                    </p>
                  </div>
                  
                  <div className="bg-[#252526] border border-[#2d2d2d] rounded-lg p-4 text-left space-y-3 font-mono text-xs text-zinc-400">
                    <div className="flex justify-between items-center">
                      <span>新規ファイルの作成</span>
                      <span className="bg-[#3c3c3c] px-1.5 py-0.5 rounded text-[10px] text-zinc-300">エクスプローラーの +</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>モジュールの作成・インポート</span>
                      <span className="bg-[#3c3c3c] px-1.5 py-0.5 rounded text-[10px] text-zinc-300">import module use [名前]</span>
                    </div>
                  </div>

                  <div className="flex justify-center space-x-3">
                    <button
                      onClick={handleCreateNewFile}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold shadow transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新規ファイル作成</span>
                    </button>
                    
                    <button
                      onClick={() => {
                        // Create Scale.sp for quick sample start
                        const newFile: VirtualFile = {
                          name: 'Scale.sp',
                          path: 'Documents',
                          content: DEFAULT_SCALE_MODULE_CODE,
                          type: 'txt',
                          createdAt: new Date().toLocaleDateString()
                        };
                        const nextFiles = [...files, newFile];
                        localStorage.setItem('webos_files', JSON.stringify(nextFiles));
                        setFiles(nextFiles);
                        setActiveFileName('Scale.sp');
                        setCode(DEFAULT_SCALE_MODULE_CODE);
                      }}
                      className="px-4 py-2 bg-[#2d2d2d] hover:bg-[#333337] border border-[#3c3c3c] text-zinc-300 hover:text-white rounded text-xs font-semibold transition cursor-pointer flex items-center space-x-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
                      <span>Scale.sp サンプルを復元</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Console/Terminal */}
          <div className="h-44 bg-[#1e1e1e] border-t border-[#2d2d2d] flex flex-col overflow-hidden" id="ide-console">
            <div className="h-9 bg-[#1e1e1e] border-b border-[#2d2d2d] flex items-center justify-between px-4 select-none shrink-0">
              <div className="flex items-center space-x-4">
                <span className="text-[11px] font-bold tracking-wider text-white border-b-2 border-[#007acc] h-9 flex items-center uppercase font-sans">出力 (Output)</span>
                <span className="text-[11px] font-bold tracking-wider text-zinc-500 hover:text-zinc-300 cursor-pointer h-9 flex items-center uppercase font-sans" onClick={() => showCustomAlert('問題は現在ありません。')}>問題</span>
                <span className="text-[11px] font-bold tracking-wider text-zinc-500 hover:text-zinc-300 cursor-pointer h-9 flex items-center uppercase font-sans" onClick={() => showCustomAlert('CUI出力は「出力」タブをご覧ください。')}>ターミナル</span>
                <span className="text-[11px] font-bold tracking-wider text-zinc-500 hover:text-zinc-300 cursor-pointer h-9 flex items-center uppercase font-sans" onClick={() => showCustomAlert('デバッグログは「出力」タブにリアルタイムで出力されます。')}>デバッグ コンソール</span>
              </div>
              <button 
                onClick={() => setConsoleLogs([])}
                className="text-xs hover:text-white text-zinc-500 transition px-2 py-0.5 rounded hover:bg-[#2d2d2d] flex items-center space-x-1 font-sans"
                id="btn-clear-console"
                title="出力をクリア"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>クリア</span>
              </button>
            </div>

            {/* Logs Stream */}
            <div className="flex-1 overflow-y-auto p-4 font-mono text-xs space-y-1 select-text bg-[#1e1e1e] text-zinc-300">
              {consoleLogs.length === 0 && !showInputPrompt && (
                <div className="text-zinc-500 italic font-sans">
                  コード上の「実行」ボタンを押してプログラムを開始します。
                </div>
              )}
              {consoleLogs.map((log, idx) => {
                let colorClass = 'text-zinc-300';
                if (log.type === 'info') colorClass = 'text-zinc-500 italic';
                if (log.type === 'error') colorClass = 'text-rose-400 font-bold';
                return (
                  <div key={idx} className={`${colorClass} whitespace-pre-wrap break-all leading-relaxed`}>
                    {log.text}
                  </div>
                );
              })}

              {/* Dynamic Interactive CUI Input Overlay inside log stream */}
              {showInputPrompt && (
                <form onSubmit={handleInputSubmit} className="mt-2 p-2 bg-emerald-950/15 border border-emerald-900/30 rounded flex flex-col md:flex-row items-stretch md:items-center space-y-2 md:space-y-0 md:space-x-3 font-sans">
                  <div className="flex items-center text-emerald-400 font-semibold text-xs">
                    <Info className="w-4 h-4 mr-1.5 shrink-0" />
                    <span>{inputPromptText || 'キーボード入力を待機中:'}</span>
                  </div>
                  <div className="flex-1 flex items-center">
                    <input
                      ref={inputFieldRef}
                      type="text"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      placeholder="ここに入力してEnterキーを押す..."
                      className="w-full bg-black/40 border border-emerald-700/50 rounded px-2.5 py-1 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                      id="cui-interactive-input"
                    />
                    <button 
                      type="submit" 
                      className="ml-2 px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-bold shrink-0 transition"
                      id="btn-submit-cui"
                    >
                      送信
                    </button>
                  </div>
                </form>
              )}

              <div ref={consoleEndRef} />
            </div>
          </div>

          {/* VS Code Status Bar */}
          <div className="h-[22px] bg-[#007acc] text-white flex items-center justify-between px-3 text-[11px] font-sans select-none shrink-0 z-30">
            <div className="flex items-center space-x-3">
              <span className="flex items-center font-semibold bg-[#0062a3] px-1.5 h-[22px] cursor-pointer">
                <Terminal className="w-3 h-3 mr-1" />
                Ready
              </span>
              <span>Sprout v1.0.0</span>
            </div>
            <div className="flex items-center space-x-4">
              {activeFileName && (
                <>
                  <span>行 {cursorPosition.line}, 列 {cursorPosition.ch}</span>
                  <span>スペース: 2</span>
                  <span>UTF-8</span>
                  <span className="bg-[#0062a3] px-2 h-[22px] flex items-center font-medium">Sprout</span>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* New File Creation Custom Dialog */}
      {showNewFileDialog && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181c] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-fade-in">
            <div className="px-4 py-3 bg-[#131316] border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-white uppercase tracking-wider font-mono flex items-center">
                <FileCode className="w-4 h-4 mr-2 text-emerald-400" />
                新規ファイル作成
              </span>
              <button 
                onClick={() => setShowNewFileDialog(false)}
                className="text-zinc-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={confirmCreateNewFile} className="p-4 space-y-4">
              <div>
                <label className="block text-[11px] text-zinc-400 font-mono mb-1.5">
                  ファイル名を入力してください (.spで終わる必要があります)
                </label>
                <input 
                  type="text"
                  value={newFileNameInput}
                  onChange={(e) => {
                    setNewFileNameInput(e.target.value);
                    setNewFileDialogError('');
                  }}
                  placeholder="untitled.sp"
                  className="w-full bg-[#111114] border border-zinc-850 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-emerald-600 focus:ring-1 focus:ring-emerald-600/30"
                  autoFocus
                />
                {newFileDialogError && (
                  <p className="text-[11px] text-rose-400 mt-1.5 flex items-center">
                    <AlertCircle className="w-3.5 h-3.5 mr-1" />
                    {newFileDialogError}
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-2 border-t border-zinc-850">
                <button
                  type="button"
                  onClick={() => setShowNewFileDialog(false)}
                  className="px-3.5 py-1.5 rounded-lg text-xs font-medium text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-850 border border-zinc-800 transition"
                >
                  キャンセル
                </button>
                <button
                  type="submit"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md transition"
                >
                  作成
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Alert Modal Overlay */}
      {showAlertDialog && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#18181c] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col animate-fade-in">
            <div className="px-4 py-3 bg-[#131316] border-b border-zinc-800 flex items-center justify-between">
              <span className="text-xs font-bold text-rose-400 uppercase tracking-wider font-mono flex items-center">
                <AlertCircle className="w-4 h-4 mr-2" />
                お知らせ
              </span>
              <button 
                onClick={() => setShowAlertDialog(false)}
                className="text-zinc-500 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <p className="text-xs text-zinc-300 leading-relaxed font-sans">{alertMessage}</p>
              <div className="flex justify-end pt-2 border-t border-zinc-850">
                <button
                  onClick={() => setShowAlertDialog(false)}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold text-white bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 transition"
                >
                  閉じる
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
