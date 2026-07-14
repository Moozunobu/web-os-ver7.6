import React, { useState, useEffect, useRef } from 'react';
import { AppIcon } from './AppIcon';
import { Edit2, Trash2, RotateCcw } from 'lucide-react';

interface DesktopIconProps {
  id: string; // AppID or file name
  title: string;
  icon: string;
  type: 'app' | 'file' | 'recycle';
  x: number;
  y: number;
  onOpen: () => void;
  onDragStop?: (id: string, newX: number, newY: number) => void;
  onRename?: (id: string, newTitle: string) => void;
  onDelete?: (id: string) => void;
  isPinned?: boolean;
  onTogglePin?: (id: string) => void;
}

export const DesktopIcon: React.FC<DesktopIconProps> = ({
  id,
  title,
  icon,
  type,
  x,
  y,
  onOpen,
  onDragStop,
  onRename,
  onDelete,
  isPinned,
  onTogglePin,
}) => {
  const [clickCount, setClickCount] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [localPos, setLocalPos] = useState({ x, y });
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState(title);

  // Context Menu State
  const [showMenu, setShowMenu] = useState(false);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });

  const iconRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0, iconX: 0, iconY: 0 });
  const hasMovedRef = useRef(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Keep local position in sync with props when not dragging
  useEffect(() => {
    if (!isDragging) {
      setLocalPos({ x, y });
    }
  }, [x, y, isDragging]);

  // Sync rename title
  useEffect(() => {
    setEditTitle(title);
  }, [title]);

  // Handle double clicking / opening
  const handleOpenAction = () => {
    if (isEditing) return;
    onOpen();
  };

  // Pointer Down (Mouse & Touch)
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isEditing) return;
    // Close context menu if open
    setShowMenu(false);

    // Only allow left click (button 0) for dragging
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    // Set dragging context
    setIsDragging(true);
    hasMovedRef.current = false;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      iconX: localPos.x,
      iconY: localPos.y,
    };

    iconRef.current?.setPointerCapture(e.pointerId);

    // Set long press timer for touch devices
    if (e.pointerType === 'touch' || e.pointerType === 'pen') {
      longPressTimerRef.current = setTimeout(() => {
        // Trigger long press context menu
        setMenuPos({ x: e.clientX, y: e.clientY });
        setShowMenu(true);
        // Vibrate if supported
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }, 600);
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Check if pointer moved significantly
    if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
      hasMovedRef.current = true;
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    }

    // Update real-time position
    setLocalPos({
      x: dragStartRef.current.iconX + deltaX,
      y: dragStartRef.current.iconY + deltaY,
    });
  };

  // Pointer Up
  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    setIsDragging(false);
    iconRef.current?.releasePointerCapture(e.pointerId);

    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }

    // If it was just a quick tap/click without moving
    if (!hasMovedRef.current) {
      setClickCount((prev) => prev + 1);
      const timer = setTimeout(() => {
        setClickCount(0);
      }, 300);

      if (clickCount >= 1) {
        clearTimeout(timer);
        handleOpenAction();
      }
    } else {
      // Trigger update to parent state on drag end
      const finalX = Math.max(0, Math.min(window.innerWidth - 80, localPos.x));
      const finalY = Math.max(0, Math.min(window.innerHeight - 130, localPos.y));
      if (onDragStop) {
        onDragStop(id, finalX, finalY);
      }
    }
  };

  // Handle Right Click (Desktop Context Menu)
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isEditing) return;
    setMenuPos({ x: e.clientX, y: e.clientY });
    setShowMenu(true);
  };

  // Handle Rename Submit
  const handleRenameSubmit = () => {
    setIsEditing(false);
    if (editTitle.trim() && editTitle.trim() !== title && onRename) {
      onRename(id, editTitle.trim());
    } else {
      setEditTitle(title);
    }
  };

  // Close context menu on click outside
  useEffect(() => {
    const closeAll = () => {
      setShowMenu(false);
    };
    if (showMenu) {
      window.addEventListener('click', closeAll);
    }
    return () => window.removeEventListener('click', closeAll);
  }, [showMenu]);

  return (
    <>
      <div
        ref={iconRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onContextMenu={handleContextMenu}
        style={{
          position: 'absolute',
          left: `${localPos.x}px`,
          top: `${localPos.y}px`,
          touchAction: 'none', // Prevents default scrolling on iPad while dragging
          zIndex: isDragging ? 50 : 20,
        }}
        className={`flex flex-col items-center justify-center p-2 rounded-xl cursor-pointer w-22 text-center group transition-shadow duration-150 select-none border border-transparent ${
          isDragging
            ? 'bg-white/15 shadow-md border-white/10 opacity-90 scale-102'
            : 'hover:bg-white/10 hover:border-white/5 active:scale-95'
        }`}
        title={`Double click to open ${title}`}
        id={`desktop-shortcut-${id}`}
      >
        <div className="w-12 h-12 mb-1.5 flex items-center justify-center select-none group-hover:scale-105 transition-transform duration-200">
          {type === 'file' && icon === 'doc-txt' ? (
            <AppIcon id="doc-txt" size={42} />
          ) : (
            <AppIcon id={icon} size={42} />
          )}
        </div>

        {isEditing ? (
          <div className="w-full px-1">
            <input
              type="text"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleRenameSubmit();
                } else if (e.key === 'Escape') {
                  setIsEditing(false);
                  setEditTitle(title);
                }
              }}
              onBlur={handleRenameSubmit}
              className="text-[11px] leading-tight text-slate-800 font-semibold bg-white border border-blue-500 rounded px-1 py-0.5 focus:outline-none w-full text-center shadow-xs"
              autoFocus
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            />
          </div>
        ) : (
          <span className="text-[11px] font-semibold text-white tracking-wide text-shadow-md truncate w-full px-1 leading-normal select-none">
            {title}
          </span>
        )}
      </div>

      {/* Floating Custom Context Menu */}
      {showMenu && (
        <div
          style={{
            position: 'fixed',
            left: `${menuPos.x}px`,
            top: `${menuPos.y}px`,
            zIndex: 9999,
          }}
          className="bg-white/95 backdrop-blur-md text-gray-800 rounded-lg shadow-xl border border-gray-200/50 py-1.5 min-w-[140px] text-xs font-medium animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={() => {
              setShowMenu(false);
              onOpen();
            }}
            className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition-colors"
          >
            <span className="text-gray-400">📂</span>
            <span>Open</span>
          </button>

          {type === 'app' && onTogglePin && (
            <button
              onClick={() => {
                setShowMenu(false);
                onTogglePin(id);
              }}
              className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition-colors text-gray-700"
            >
              <span className="text-gray-400">{isPinned ? '❌' : '📌'}</span>
              <span>{isPinned ? 'ピン留めを外す' : 'タスクバーにピン留めする'}</span>
            </button>
          )}

          <button
            onClick={() => {
              setShowMenu(false);
              setIsEditing(true);
            }}
            className="w-full text-left px-3.5 py-1.5 hover:bg-slate-100 flex items-center gap-2.5 transition-colors text-gray-700"
          >
            <Edit2 className="w-3.5 h-3.5 text-gray-400" />
            <span>Rename</span>
          </button>

          {type !== 'recycle' && onDelete && (
            <button
              onClick={() => {
                setShowMenu(false);
                onDelete(id);
              }}
              className="w-full text-left px-3.5 py-1.5 hover:bg-red-50 text-red-600 flex items-center gap-2.5 transition-colors border-t border-gray-100 mt-1"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </>
  );
};
