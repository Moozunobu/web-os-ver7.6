import React, { useRef, useEffect, useState } from 'react';
import { WindowInstance } from '../types';
import { Minimize2, Square, Copy, X } from 'lucide-react';

interface WindowProps {
  windowState: WindowInstance;
  onUpdate: (id: string, updates: Partial<WindowInstance>) => void;
  onFocus: (id: string) => void;
  onClose: (id: string) => void;
  children: React.ReactNode;
  isTaskbarHidden?: boolean;
  isToggleTaskbarWithQ?: boolean;
}

export const Window: React.FC<WindowProps> = ({
  windowState,
  onUpdate,
  onFocus,
  onClose,
  children,
  isTaskbarHidden = false,
  isToggleTaskbarWithQ = false,
}) => {
  const { id, title, icon, x, y, width, height, isMaximized, isMinimized, zIndex, minWidth = 300, minHeight = 200 } = windowState;

  const [isInteracting, setIsInteracting] = useState(false);
  const [isOpening, setIsOpening] = useState(true);
  const [isClosing, setIsClosing] = useState(false);
  const windowRef = useRef<HTMLDivElement>(null);

  const dragStart = useRef<{ pointerId: number; target: HTMLElement; mouseX: number; mouseY: number; winX: number; winY: number } | null>(null);
  const resizeStart = useRef<{ pointerId: number; target: HTMLElement; mouseX: number; mouseY: number; winW: number; winH: number; handle: string } | null>(null);

  // Track dimensions in ref for high-frequency direct DOM styling
  const lastProps = useRef({ x, y, width, height });

  // Sync coordinate prop updates when idle
  useEffect(() => {
    if (!dragStart.current && !resizeStart.current) {
      lastProps.current = { x, y, width, height };
    }
  }, [x, y, width, height]);

  // Start opening animation on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setIsOpening(false);
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(id);
    }, 200); // matches the 200ms duration-200 animation
  };

  // Focus window on click anywhere inside
  const handlePointerDown = () => {
    onFocus(id);
  };

  // Drag Titlebar handlers
  const handleTitleDragStart = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;
    onFocus(id);
    e.preventDefault();

    setIsInteracting(true);

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("Failed to set pointer capture", err);
    }

    dragStart.current = {
      pointerId: e.pointerId,
      target,
      mouseX: e.clientX,
      mouseY: e.clientY,
      winX: lastProps.current.x,
      winY: lastProps.current.y,
    };

    document.addEventListener('pointermove', handleTitleDrag);
    document.addEventListener('pointerup', handleDragEnd);
  };

  const tickingDrag = useRef(false);
  const handleTitleDrag = (e: PointerEvent) => {
    if (!dragStart.current) return;
    if (tickingDrag.current) return;

    tickingDrag.current = true;
    window.requestAnimationFrame(() => {
      if (!dragStart.current) {
        tickingDrag.current = false;
        return;
      }

      const deltaX = e.clientX - dragStart.current.mouseX;
      const deltaY = e.clientY - dragStart.current.mouseY;

      // Bounds checking: prevent window from going completely off-screen
      const newX = Math.max(-lastProps.current.width + 100, Math.min(window.innerWidth - 100, dragStart.current.winX + deltaX));
      const newY = Math.max(0, Math.min(window.innerHeight - 80, dragStart.current.winY + deltaY));

      if (windowRef.current) {
        windowRef.current.style.left = `${newX}px`;
        windowRef.current.style.top = `${newY}px`;
      }

      lastProps.current.x = newX;
      lastProps.current.y = newY;

      tickingDrag.current = false;
    });
  };

  // Resize border handlers
  const handleResizeStart = (e: React.PointerEvent<HTMLDivElement>, handle: string) => {
    if (isMaximized) return;
    e.stopPropagation();
    e.preventDefault();
    onFocus(id);

    setIsInteracting(true);

    const target = e.currentTarget;
    try {
      target.setPointerCapture(e.pointerId);
    } catch (err) {
      console.warn("Failed to set pointer capture", err);
    }

    resizeStart.current = {
      pointerId: e.pointerId,
      target,
      mouseX: e.clientX,
      mouseY: e.clientY,
      winW: lastProps.current.width,
      winH: lastProps.current.height,
      handle,
    };

    document.addEventListener('pointermove', handleResize);
    document.addEventListener('pointerup', handleDragEnd);
  };

  const tickingResize = useRef(false);
  const handleResize = (e: PointerEvent) => {
    if (!resizeStart.current) return;
    if (tickingResize.current) return;

    tickingResize.current = true;
    window.requestAnimationFrame(() => {
      if (!resizeStart.current) {
        tickingResize.current = false;
        return;
      }

      const deltaX = e.clientX - resizeStart.current.mouseX;
      const deltaY = e.clientY - resizeStart.current.mouseY;
      const { handle, winW, winH } = resizeStart.current;

      let newW = lastProps.current.width;
      let newH = lastProps.current.height;

      if (handle.includes('r')) {
        newW = Math.max(minWidth, winW + deltaX);
      }
      if (handle.includes('b')) {
        newH = Math.max(minHeight, winH + deltaY);
      }

      if (windowRef.current) {
        if (handle.includes('r')) {
          windowRef.current.style.width = `${newW}px`;
        }
        if (handle.includes('b')) {
          windowRef.current.style.height = `${newH}px`;
        }
      }

      lastProps.current.width = newW;
      lastProps.current.height = newH;

      tickingResize.current = false;
    });
  };

  const handleDragEnd = () => {
    let wasInteracting = false;

    if (dragStart.current) {
      wasInteracting = true;
      const { pointerId, target } = dragStart.current;
      try {
        if (target && target.hasPointerCapture(pointerId)) {
          target.releasePointerCapture(pointerId);
        }
      } catch (err) {
        // Ignore
      }
    }
    if (resizeStart.current) {
      wasInteracting = true;
      const { pointerId, target } = resizeStart.current;
      try {
        if (target && target.hasPointerCapture(pointerId)) {
          target.releasePointerCapture(pointerId);
        }
      } catch (err) {
        // Ignore
      }
    }

    dragStart.current = null;
    resizeStart.current = null;

    document.removeEventListener('pointermove', handleTitleDrag);
    document.removeEventListener('pointermove', handleResize);
    document.removeEventListener('pointerup', handleDragEnd);

    if (wasInteracting) {
      setIsInteracting(false);
      // Persist the final calculated coordinates to React state
      onUpdate(id, {
        x: lastProps.current.x,
        y: lastProps.current.y,
        width: lastProps.current.width,
        height: lastProps.current.height,
      });
    }
  };

  // Cleanup event listeners on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener('pointermove', handleTitleDrag);
      document.removeEventListener('pointermove', handleResize);
      document.removeEventListener('pointerup', handleDragEnd);
    };
  }, []);

  const toggleMaximize = () => {
    if (isMaximized) {
      // Restore coordinates
      onUpdate(id, {
        isMaximized: false,
        x: windowState.prevX,
        y: windowState.prevY,
        width: windowState.prevWidth,
        height: windowState.prevHeight,
      });
    } else {
      // Save current coordinates and maximize
      onUpdate(id, {
        isMaximized: true,
        prevX: x,
        prevY: y,
        prevWidth: width,
        prevHeight: height,
        x: 0,
        y: 0,
        width: window.innerWidth,
        height: isTaskbarHidden ? window.innerHeight : window.innerHeight - 48, // Taskbar is 48px
      });
    }
  };

  const animationClass = isClosing
    ? 'scale-95 opacity-0 pointer-events-none transition-all duration-200 ease-out'
    : isOpening
      ? 'scale-95 opacity-0 pointer-events-none'
      : isMinimized
        ? 'opacity-0 scale-95 pointer-events-none invisible transition-all duration-200 ease-in-out'
        : isInteracting
          ? 'scale-100 opacity-100'
          : 'scale-100 opacity-100 transition-all duration-200 ease-in-out';

  return (
    <div
      ref={windowRef}
      onPointerDown={handlePointerDown}
      className={`absolute flex flex-col rounded-t-xl overflow-hidden border select-text shadow-2xl origin-center ${
        id === 'sprout'
          ? 'bg-[#1e1e1e] border-zinc-800'
          : 'bg-white border-gray-200/80'
      } ${
        isMaximized
          ? 'rounded-none border-none'
          : id === 'sprout'
            ? 'ring-1 ring-black/40'
            : 'ring-1 ring-black/5'
      } ${animationClass}`}
      style={{
        left: isMaximized ? 0 : x,
        top: isMaximized ? 0 : y,
        width: isMaximized ? '100vw' : width,
        height: isMaximized ? (isTaskbarHidden ? '100vh' : 'calc(100vh - 48px)') : height,
        zIndex,
        willChange: isInteracting || isOpening || isClosing ? 'top, left, width, height, transform, opacity' : 'auto',
      }}
      id={`window-${id}`}
    >
      {/* Title Bar */}
      <div
        onPointerDown={handleTitleDragStart}
        className={`h-10 shrink-0 flex items-center justify-between pl-3 pr-2 select-none cursor-move touch-none ${
          id === 'sprout'
            ? 'bg-[#181818] border-b border-[#2d2d2d] text-zinc-300'
            : 'bg-[#f3f4f6]/95 border-b border-gray-200/80 text-gray-800'
        }`}
        id={`window-titlebar-${id}`}
      >
        <div className="flex items-center gap-2 max-w-[60%]">
          {!(id === 'sprout' && isToggleTaskbarWithQ) && (
            <>
              {icon === 'browser' && <span className="w-4.5 h-4.5 shrink-0 select-none">🌐</span>}
              {icon === 'notepad' && <span className="w-4.5 h-4.5 shrink-0 select-none">📝</span>}
              {icon === 'calculator' && <span className="w-4.5 h-4.5 shrink-0 select-none">🧮</span>}
              {icon === 'paint' && <span className="w-4.5 h-4.5 shrink-0 select-none">🎨</span>}
              {icon === 'files' && <span className="w-4.5 h-4.5 shrink-0 select-none">📁</span>}
              {icon === 'terminal' && <span className="w-4.5 h-4.5 shrink-0 select-none">⚙️</span>}
              {icon === 'excel' && <span className="w-4.5 h-4.5 shrink-0 select-none">📊</span>}
              {icon === 'settings' && <span className="w-4.5 h-4.5 shrink-0 select-none">⚙️</span>}
              {icon === 'word' && <span className="w-4.5 h-4.5 shrink-0 select-none">📘</span>}
              {icon === 'powerpoint' && <span className="w-4.5 h-4.5 shrink-0 select-none">🍊</span>}
              {icon === 'sprout' && <span className="w-4.5 h-4.5 shrink-0 select-none">🌱</span>}
              <span className={`text-xs font-semibold truncate ${id === 'sprout' ? 'text-zinc-300' : 'text-gray-700'}`}>{title}</span>
            </>
          )}
        </div>

        {/* Action Window Controls */}
        <div className="flex items-center gap-0.5 select-none" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => onUpdate(id, { isMinimized: true })}
            className={`p-1.5 rounded transition-colors ${
              id === 'sprout'
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                : 'text-gray-500 hover:bg-gray-200'
            }`}
            title="Minimize"
            id={`window-ctrl-min-${id}`}
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleMaximize}
            className={`p-1.5 rounded transition-colors ${
              id === 'sprout'
                ? 'text-zinc-400 hover:bg-zinc-800 hover:text-zinc-100'
                : 'text-gray-500 hover:bg-gray-200'
            }`}
            title={isMaximized ? 'Restore Down' : 'Maximize'}
            id={`window-ctrl-max-${id}`}
          >
            {isMaximized ? <Copy className="w-3.5 h-3.5" /> : <Square className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleClose}
            className={`p-1.5 rounded transition-colors ${
              id === 'sprout'
                ? 'text-zinc-400 hover:bg-red-600 hover:text-white'
                : 'text-gray-500 hover:bg-red-600 hover:text-white'
            }`}
            title="Close"
            id={`window-ctrl-close-${id}`}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Window Frame Contents */}
      <div className="flex-1 overflow-hidden relative min-h-0 min-w-0" id={`window-content-${id}`}>
        {children}
      </div>

      {/* Resize border handles (only show if not maximized) */}
      {!isMaximized && (
        <>
          {/* East (Right border) */}
          <div
            onPointerDown={(e) => handleResizeStart(e, 'r')}
            className="absolute top-0 right-0 w-1.5 h-full cursor-e-resize z-20 select-none touch-none"
            id={`window-resize-r-${id}`}
          />
          {/* South (Bottom border) */}
          <div
            onPointerDown={(e) => handleResizeStart(e, 'b')}
            className="absolute bottom-0 left-0 h-1.5 w-full cursor-s-resize z-20 select-none touch-none"
            id={`window-resize-b-${id}`}
          />
          {/* South-East (Bottom-Right corner) */}
          <div
            onPointerDown={(e) => handleResizeStart(e, 'br')}
            className="absolute bottom-0 right-0 w-4.5 h-4.5 cursor-se-resize z-30 select-none touch-none"
            id={`window-resize-br-${id}`}
          />
        </>
      )}
    </div>
  );
};
