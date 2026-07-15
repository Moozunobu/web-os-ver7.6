import React, { useState, useEffect } from 'react';
import { Trash2, RotateCcw, ShieldAlert, FolderOpen } from 'lucide-react';
import { DesktopItem } from '../../types';

export const RecycleBinApp: React.FC = () => {
  const [deletedItems, setDeletedItems] = useState<DesktopItem[]>([]);

  const loadDeletedItems = () => {
    try {
      const stored = localStorage.getItem('webos_desktop_items_v2');
      if (stored) {
        const items = JSON.parse(stored) as DesktopItem[];
        setDeletedItems(items.filter((item) => item.isDeleted === true));
      } else {
        setDeletedItems([]);
      }
    } catch (e) {
      console.error('Failed to load trash items', e);
    }
  };

  useEffect(() => {
    loadDeletedItems();

    const handleUpdate = () => {
      loadDeletedItems();
    };

    window.addEventListener('webos_desktop_items_changed', handleUpdate);
    return () => window.removeEventListener('webos_desktop_items_changed', handleUpdate);
  }, []);

  const handleRestore = (id: string) => {
    try {
      const stored = localStorage.getItem('webos_desktop_items_v2');
      if (stored) {
        const items = JSON.parse(stored) as DesktopItem[];
        const updated = items.map((item) => {
          if (item.id === id) {
            return { ...item, isDeleted: false };
          }
          return item;
        });
        localStorage.setItem('webos_desktop_items_v2', JSON.stringify(updated));
        window.dispatchEvent(new Event('webos_desktop_items_changed'));
        loadDeletedItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeletePermanently = (id: string) => {
    try {
      const stored = localStorage.getItem('webos_desktop_items_v2');
      if (stored) {
        const items = JSON.parse(stored) as DesktopItem[];
        const updated = items.filter((item) => item.id !== id);
        localStorage.setItem('webos_desktop_items_v2', JSON.stringify(updated));
        window.dispatchEvent(new Event('webos_desktop_items_changed'));
        loadDeletedItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleEmptyBin = () => {
    if (deletedItems.length === 0) return;
    const confirmEmpty = window.confirm('Are you sure you want to permanently delete all items in the Recycle Bin? This action cannot be undone.');
    if (!confirmEmpty) return;

    try {
      const stored = localStorage.getItem('webos_desktop_items_v2');
      if (stored) {
        const items = JSON.parse(stored) as DesktopItem[];
        const updated = items.filter((item) => !item.isDeleted);
        localStorage.setItem('webos_desktop_items_v2', JSON.stringify(updated));
        window.dispatchEvent(new Event('webos_desktop_items_changed'));
        loadDeletedItems();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f2f1] text-gray-800 font-sans select-none" id="recycle-app-container">
      {/* Top action toolbar ribbon */}
      <div className="bg-white border-b border-gray-200 p-2 flex items-center justify-between shrink-0 shadow-xs">
        <div className="flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-gray-500" />
          <span className="text-sm font-bold text-gray-700">Recycle Bin Tools</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleEmptyBin}
            disabled={deletedItems.length === 0}
            className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border transition-all ${
              deletedItems.length === 0
                ? 'bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed'
                : 'bg-red-50 hover:bg-red-100 text-red-600 border-red-200 shadow-sm'
            }`}
            id="recycle-btn-empty"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Empty Recycle Bin</span>
          </button>
        </div>
      </div>

      {/* Main Area showing the list of trashed items */}
      <div className="flex-1 overflow-y-auto p-4">
        {deletedItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3 border border-gray-200/50">
              <Trash2 className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-bold text-gray-700 mb-1">Recycle Bin is empty</h3>
            <p className="text-xs text-gray-400 max-w-xs">
              Deleted desktop icons or files will appear here until they are permanently deleted.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {deletedItems.map((item) => (
              <div
                key={item.id}
                className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-sm hover:border-gray-300 transition-all flex items-center justify-between"
              >
                <div className="flex items-center gap-3 truncate">
                  <div className="w-10 h-10 flex-shrink-0 bg-gray-50 rounded-lg flex items-center justify-center border border-gray-100">
                    {/* Simplified helper representation */}
                    <span className="text-xl">
                      {item.icon === 'files' && '📁'}
                      {item.icon === 'browser' && '🌐'}
                      {item.icon === 'notepad' && '📝'}
                      {item.icon === 'calculator' && '🧮'}
                      {item.icon === 'paint' && '🎨'}
                      {item.icon === 'excel' && '📊'}
                      {item.icon === 'terminal' && '⚙️'}
                      {item.icon === 'settings' && '⚙️'}
                      {item.icon === 'word' && '📘'}
                      {item.icon === 'powerpoint' && '🍊'}
                      {item.icon === 'doc-txt' && '📄'}
                    </span>
                  </div>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-gray-800 truncate" title={item.title}>
                      {item.title}
                    </h4>
                    <span className="text-[10px] text-gray-400 capitalize">
                      {item.type}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  <button
                    onClick={() => handleRestore(item.id)}
                    className="p-1.5 rounded-md hover:bg-green-50 text-green-600 transition-colors border border-transparent hover:border-green-100"
                    title="Restore item to desktop"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDeletePermanently(item.id)}
                    className="p-1.5 rounded-md hover:bg-red-50 text-red-600 transition-colors border border-transparent hover:border-red-100"
                    title="Delete permanently"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer bar */}
      <div className="bg-white border-t border-gray-200 px-4 py-2 flex items-center justify-between text-[11px] font-semibold text-gray-500 shrink-0 select-none">
        <div className="flex items-center gap-1">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-500" />
          <span>Items here can be recovered or permanently deleted</span>
        </div>
        <div>
          <span>Total Trashed: <strong>{deletedItems.length}</strong></span>
        </div>
      </div>
    </div>
  );
};
