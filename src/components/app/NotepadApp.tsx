import React, { useState, useEffect } from 'react';
import { Save, FilePlus, FolderOpen, Trash2 } from 'lucide-react';
import { VirtualFile } from '../../types';

interface NotepadAppProps {
  initialFileContent?: string;
  initialFileName?: string;
  onFileSaved?: () => void;
}

export const NotepadApp: React.FC<NotepadAppProps> = ({
  initialFileContent = '',
  initialFileName = '',
  onFileSaved,
}) => {
  const [content, setContent] = useState(initialFileContent);
  const [fileName, setFileName] = useState(initialFileName || 'untitled.txt');
  const [savedFiles, setSavedFiles] = useState<VirtualFile[]>([]);
  const [isOpeningFile, setIsOpeningFile] = useState(false);

  // Sync with initial file content changes (when double clicking files from file manager)
  useEffect(() => {
    if (initialFileContent !== undefined) {
      setContent(initialFileContent);
    }
    if (initialFileName) {
      setFileName(initialFileName);
    }
  }, [initialFileContent, initialFileName]);

  const fetchSavedFiles = () => {
    try {
      const stored = localStorage.getItem('webos_files');
      if (stored) {
        const files: VirtualFile[] = JSON.parse(stored);
        setSavedFiles(files.filter(f => f.type === 'txt'));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchSavedFiles();
    
    // Listen to filesystem updates
    const handleFsUpdate = () => {
      fetchSavedFiles();
    };
    window.addEventListener('webos_fs_updated', handleFsUpdate);
    return () => {
      window.removeEventListener('webos_fs_updated', handleFsUpdate);
    };
  }, []);

  const handleSave = () => {
    if (!fileName.trim()) {
      alert('Please enter a valid file name.');
      return;
    }

    let sanitizedName = fileName.trim();
    if (!sanitizedName.endsWith('.txt')) {
      sanitizedName += '.txt';
    }

    try {
      const stored = localStorage.getItem('webos_files');
      let files: VirtualFile[] = stored ? JSON.parse(stored) : [];

      // Check if file already exists
      const existingIndex = files.findIndex(
        f => f.name.toLowerCase() === sanitizedName.toLowerCase() && f.path === 'Documents'
      );

      const newFile: VirtualFile = {
        name: sanitizedName,
        path: 'Documents',
        content: content,
        type: 'txt',
        createdAt: new Date().toISOString(),
      };

      if (existingIndex > -1) {
        files[existingIndex] = newFile;
      } else {
        files.push(newFile);
      }

      localStorage.setItem('webos_files', JSON.stringify(files));
      setFileName(sanitizedName);
      
      // Notify other apps (like File Manager, Terminal)
      window.dispatchEvent(new Event('webos_fs_updated'));
      
      if (onFileSaved) onFileSaved();
      
      alert(`File "${sanitizedName}" saved successfully in Documents folder!`);
    } catch (e) {
      console.error(e);
      alert('Failed to save file.');
    }
  };

  const handleNew = () => {
    setContent('');
    setFileName('untitled.txt');
  };

  const handleOpenFile = (file: VirtualFile) => {
    setContent(file.content);
    setFileName(file.name);
    setIsOpeningFile(false);
  };

  const handleDeleteFile = (file: VirtualFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        const stored = localStorage.getItem('webos_files');
        if (stored) {
          const files: VirtualFile[] = JSON.parse(stored);
          const filtered = files.filter(
            f => !(f.name.toLowerCase() === file.name.toLowerCase() && f.path === 'Documents')
          );
          localStorage.setItem('webos_files', JSON.stringify(filtered));
          window.dispatchEvent(new Event('webos_fs_updated'));
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 font-sans" id="notepad-app">
      {/* Menu / Controls Bar */}
      <div className="flex flex-wrap items-center justify-between border-b border-gray-200 bg-gray-50 px-3 py-2 text-xs select-none">
        <div className="flex items-center gap-2">
          {/* File Name input */}
          <span className="text-gray-500 font-medium">Filename:</span>
          <input
            type="text"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            className="border border-gray-300 rounded px-2 py-1 text-xs w-44 font-sans bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            id="notepad-filename-input"
          />
        </div>

        <div className="flex items-center gap-1 mt-1 sm:mt-0">
          <button
            onClick={handleNew}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Create new empty file"
            id="notepad-btn-new"
          >
            <FilePlus className="w-3.5 h-3.5" />
            <span>New</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1.5 px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium transition-colors"
            title="Save file"
            id="notepad-btn-save"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={() => {
              fetchSavedFiles();
              setIsOpeningFile(!isOpeningFile);
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 hover:bg-gray-200 rounded text-gray-700 transition-colors"
            title="Open an existing file"
            id="notepad-btn-open-toggle"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>Open Virtual Files ({savedFiles.length})</span>
          </button>
        </div>
      </div>

      {/* Main workspace */}
      <div className="flex-1 relative flex overflow-hidden">
        {/* Editor Area */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start typing your notes here..."
          className="flex-1 p-4 resize-none outline-none font-mono text-sm leading-relaxed border-none h-full bg-white text-gray-800"
          id="notepad-textarea"
        />

        {/* File Drawer Overlay */}
        {isOpeningFile && (
          <div className="absolute top-0 right-0 w-64 h-full bg-gray-50 border-l border-gray-200 shadow-lg flex flex-col z-10 animate-fade-in">
            <div className="p-3 border-b border-gray-200 flex items-center justify-between select-none">
              <span className="font-semibold text-xs text-gray-700">Open Virtual File</span>
              <button
                onClick={() => setIsOpeningFile(false)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-auto p-2 space-y-1">
              {savedFiles.length === 0 ? (
                <div className="text-center py-12 text-xs text-gray-400 select-none">
                  No saved txt files. Create some and hit Save!
                </div>
              ) : (
                savedFiles.map((file, i) => (
                  <div
                    key={i}
                    onClick={() => handleOpenFile(file)}
                    className="flex items-center justify-between p-2 rounded hover:bg-blue-50 hover:text-blue-700 cursor-pointer text-xs transition-colors group"
                  >
                    <div className="truncate flex-1 pr-2">
                      <p className="font-medium truncate">{file.name}</p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteFile(file, e)}
                      className="p-1 text-gray-400 hover:text-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Delete virtual file"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="bg-[#f3f3f3] border-t border-gray-200 px-3 py-1 text-[10px] text-gray-500 flex justify-between select-none font-mono">
        <span>Encoding: UTF-8</span>
        <span>
          Chars: {content.length} | Lines: {content.split('\n').length}
        </span>
      </div>
    </div>
  );
};
