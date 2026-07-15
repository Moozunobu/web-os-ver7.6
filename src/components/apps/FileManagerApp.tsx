import React, { useState, useEffect } from 'react';
import { AppIcon } from '../AppIcon';
import { ArrowLeft, HardDrive, Folder, ChevronRight, FileText, Image, RefreshCw, Trash2, Eye } from 'lucide-react';
import { VirtualFile } from '../../types';

interface FileManagerAppProps {
  onOpenFileInNotepad?: (name: string, content: string) => void;
}

export const FileManagerApp: React.FC<FileManagerAppProps> = ({ onOpenFileInNotepad }) => {
  const [currentFolder, setCurrentFolder] = useState<'Root' | 'Desktop' | 'Documents' | 'Pictures'>('Root');
  const [files, setFiles] = useState<VirtualFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(null);
  const [viewingImage, setViewingImage] = useState<string | null>(null);

  const fetchFiles = () => {
    try {
      const stored = localStorage.getItem('webos_files');
      if (stored) {
        setFiles(JSON.parse(stored));
      } else {
        // Seed default files if none exist
        const defaultFiles: VirtualFile[] = [
          {
            name: 'welcome.txt',
            path: 'Desktop',
            content: 'Welcome to noob os! Double click on Notepad, Paint, or any desktop icons to get started.\n\nAll your work is automatically saved to LocalStorage so you can close this browser tab and return anytime.',
            type: 'txt',
            createdAt: new Date().toISOString(),
          },
          {
            name: 'features.txt',
            path: 'Documents',
            content: 'Implemented Applications:\n- Firefox Browser mockup\n- Notepad with file system\n- Custom grid Excel sheet\n- Paint with save feature\n- Command terminal with CLI\n- Interactive settings',
            type: 'txt',
            createdAt: new Date().toISOString(),
          }
        ];
        localStorage.setItem('webos_files', JSON.stringify(defaultFiles));
        setFiles(defaultFiles);
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchFiles();

    const handleFsUpdate = () => {
      fetchFiles();
    };
    window.addEventListener('webos_fs_updated', handleFsUpdate);
    return () => {
      window.removeEventListener('webos_fs_updated', handleFsUpdate);
    };
  }, []);

  const getFolderContents = () => {
    if (currentFolder === 'Root') {
      return [
        { name: 'Desktop', type: 'folder', count: files.filter(f => f.path === 'Desktop').length },
        { name: 'Documents', type: 'folder', count: files.filter(f => f.path === 'Documents').length },
        { name: 'Pictures', type: 'folder', count: files.filter(f => f.path === 'Pictures').length }
      ];
    }
    return files.filter(f => f.path === currentFolder);
  };

  const handleDoubleClickItem = (item: any) => {
    if (item.type === 'folder') {
      setCurrentFolder(item.name);
      setSelectedFile(null);
    } else {
      // It is a file
      handleOpenFile(item);
    }
  };

  const handleOpenFile = (file: VirtualFile) => {
    if (file.type === 'txt') {
      if (onOpenFileInNotepad) {
        onOpenFileInNotepad(file.name, file.content);
      } else {
        alert('Could not launch Notepad directly. Please open Notepad and select the file from its Drawer.');
      }
    } else if (file.type === 'image') {
      setViewingImage(file.content);
    }
  };

  const handleDeleteFile = (file: VirtualFile, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm(`Are you sure you want to delete "${file.name}"?`)) {
      try {
        const updated = files.filter(f => !(f.name.toLowerCase() === file.name.toLowerCase() && f.path === file.path));
        localStorage.setItem('webos_files', JSON.stringify(updated));
        setFiles(updated);
        setSelectedFile(null);
        window.dispatchEvent(new Event('webos_fs_updated'));
      } catch (err) {
        console.error(err);
      }
    }
  };

  const formatBytes = (txt: string) => {
    if (!txt) return '0 B';
    const bytes = txt.length;
    if (bytes < 1024) return bytes + ' B';
    return (bytes / 1024).toFixed(1) + ' KB';
  };

  return (
    <div className="flex h-full bg-white text-gray-800 font-sans select-none" id="file-manager-app">
      {/* Sidebar Navigation */}
      <div className="w-48 bg-[#f3f4f6] border-r border-gray-200 p-2 flex flex-col justify-between shrink-0 hidden sm:flex">
        <div className="space-y-1">
          <p className="px-3 py-1.5 text-[10px] font-bold text-gray-400 tracking-wider">THIS PC</p>
          <button
            onClick={() => setCurrentFolder('Root')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded text-xs font-semibold text-left transition-colors ${
              currentFolder === 'Root' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-200 text-gray-700'
            }`}
          >
            <HardDrive className="w-4 h-4 text-gray-500" />
            <span>Virtual Storage (C:)</span>
          </button>
          <div className="pl-4 space-y-0.5 border-l border-gray-300 ml-5 mt-1.5">
            {['Desktop', 'Documents', 'Pictures'].map((f) => (
              <button
                key={f}
                onClick={() => {
                  setCurrentFolder(f as any);
                  setSelectedFile(null);
                }}
                className={`w-full flex items-center gap-2 px-3 py-1.5 rounded text-xs font-medium text-left transition-colors ${
                  currentFolder === f ? 'bg-blue-50 text-blue-700 font-semibold' : 'hover:bg-gray-200 text-gray-600'
                }`}
              >
                <Folder className="w-3.5 h-3.5 text-yellow-500" />
                <span>{f}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-3 bg-white border border-gray-200 rounded-lg text-[10px] text-gray-500 space-y-1">
          <p className="font-bold text-gray-700">Storage Usage</p>
          <div className="w-full bg-gray-200 h-1.5 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full"
              style={{ width: `${Math.min(100, (files.reduce((acc, f) => acc + f.content.length, 0) / 10000) * 100)}%` }}
            />
          </div>
          <p className="text-[9px]">
            {formatBytes(files.reduce((acc, f) => acc + f.content, ''))} of 10 KB virtual capacity
          </p>
        </div>
      </div>

      {/* Main File View Pane */}
      <div className="flex-1 flex flex-col">
        {/* Navigation Breadcrumbs & Toolbar */}
        <div className="flex items-center gap-2 p-2 border-b border-gray-200 bg-gray-50 select-none text-xs">
          <button
            onClick={() => {
              if (currentFolder !== 'Root') {
                setCurrentFolder('Root');
                setSelectedFile(null);
              }
            }}
            disabled={currentFolder === 'Root'}
            className="p-1.5 rounded hover:bg-gray-200 disabled:opacity-30 disabled:hover:bg-transparent"
            id="file-btn-up"
          >
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>

          {/* Breadcrumbs */}
          <div className="flex items-center gap-1 text-gray-500 flex-1 truncate font-medium">
            <span className="cursor-pointer hover:text-blue-600" onClick={() => setCurrentFolder('Root')}>This PC</span>
            {currentFolder !== 'Root' && (
              <>
                <ChevronRight className="w-3 h-3 text-gray-400 shrink-0" />
                <span className="font-semibold text-gray-800">{currentFolder}</span>
              </>
            )}
          </div>

          <button onClick={fetchFiles} className="p-1.5 rounded hover:bg-gray-200" title="Refresh files list" id="file-btn-refresh">
            <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
          </button>
        </div>

        {/* Directory/File Grid */}
        <div className="flex-1 overflow-auto p-4 bg-white" id="file-grid-container">
          {getFolderContents().length === 0 ? (
            <div className="text-center py-16 text-gray-400 select-none">
              <Folder className="w-12 h-12 stroke-[1] text-gray-300 mx-auto mb-2.5" />
              <p className="text-sm font-medium">This folder is empty.</p>
              <p className="text-xs mt-1">Files you create and save inside Notepad or Paint will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {getFolderContents().map((item: any, i) => {
                const isSelected = selectedFile?.name === item.name && selectedFile?.path === item.path;
                return (
                  <div
                    key={i}
                    onClick={() => {
                      if (item.type !== 'folder') {
                        setSelectedFile(item);
                      }
                    }}
                    onDoubleClick={() => handleDoubleClickItem(item)}
                    className={`flex flex-col items-center text-center p-3 rounded-lg border cursor-pointer select-none group transition-all ${
                      isSelected
                        ? 'bg-blue-50 border-blue-300 ring-1 ring-blue-300'
                        : 'border-transparent hover:bg-gray-100 hover:border-gray-200'
                    }`}
                  >
                    {/* Item Icon */}
                    {item.type === 'folder' ? (
                      <AppIcon id="folder" size={44} className="mb-2" />
                    ) : item.type === 'txt' ? (
                      <AppIcon id="doc-txt" size={44} className="mb-2" />
                    ) : (
                      <div className="w-11 h-11 mb-2 bg-gray-50 border border-gray-200 rounded overflow-hidden flex items-center justify-center p-0.5 group-hover:scale-105 transition-transform">
                        <img src={item.content} alt={item.name} className="w-full h-full object-cover rounded-sm" referrerPolicy="no-referrer" />
                      </div>
                    )}

                    {/* Item Title */}
                    <span className="text-xs font-semibold truncate w-full text-gray-700 px-1">
                      {item.name}
                    </span>

                    {/* Meta info if folder */}
                    {item.type === 'folder' && (
                      <span className="text-[9px] text-gray-400 mt-0.5">
                        {item.count} items
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected File Details Status Bar */}
        <div className="bg-[#f3f4f6] border-t border-gray-200 p-2.5 px-4 text-xs text-gray-500 flex flex-wrap justify-between items-center gap-2 select-none">
          {selectedFile ? (
            <>
              <div className="flex items-center gap-2 truncate">
                {selectedFile.type === 'txt' ? (
                  <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                ) : (
                  <Image className="w-4 h-4 text-purple-500 shrink-0" />
                )}
                <span className="font-semibold text-gray-700 truncate">{selectedFile.name}</span>
                <span className="text-[10px] text-gray-400">({formatBytes(selectedFile.content)})</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono">
                  Created: {new Date(selectedFile.createdAt).toLocaleDateString()}
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => handleOpenFile(selectedFile)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded"
                    title="Open / Preview File"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => handleDeleteFile(selectedFile, e)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Delete File"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <span className="text-gray-400 font-medium">Select a virtual file to inspect its specs.</span>
          )}
        </div>
      </div>

      {/* Image Previewer Modal Overlay */}
      {viewingImage && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4" onClick={() => setViewingImage(null)}>
          <div className="bg-white rounded-lg overflow-hidden shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="p-3 border-b border-gray-200 flex items-center justify-between select-none">
              <span className="font-semibold text-xs text-gray-700">Image Viewer Preview</span>
              <button
                onClick={() => setViewingImage(null)}
                className="text-gray-400 hover:text-gray-600 text-xs font-bold"
              >
                ✕
              </button>
            </div>
            <div className="p-4 bg-gray-50 flex items-center justify-center max-h-[350px]">
              <img src={viewingImage} alt="Preview Drawing" className="max-w-full max-h-[300px] object-contain rounded border shadow-sm" referrerPolicy="no-referrer" />
            </div>
            <div className="p-3 bg-gray-100 text-right">
              <button
                onClick={() => setViewingImage(null)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-semibold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
