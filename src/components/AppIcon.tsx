import React from 'react';

interface AppIconProps {
  id: string;
  className?: string;
  size?: number;
}

export const AppIcon: React.FC<AppIconProps> = ({ id, className = '', size = 32 }) => {
  const getIcon = () => {
    if (id.startsWith('custom-app-')) {
      const emoji = id.replace('custom-app-', '') || '🌐';
      return (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-amber-500 via-orange-500 to-red-600 rounded-xl shadow-md text-white text-xl font-bold select-none border border-white/20">
          {emoji}
        </div>
      );
    }
    switch (id) {
      case 'noobstore':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="storeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
              <linearGradient id="bagGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#e2e8f0" />
              </linearGradient>
            </defs>
            <rect x="12" y="12" width="76" height="76" rx="16" fill="url(#storeGrad)" />
            {/* Shopping Bag handle */}
            <path d="M 38 42 C 38 28, 62 28, 62 42" fill="none" stroke="url(#bagGrad)" strokeWidth="5.5" strokeLinecap="round" />
            {/* Bag Body */}
            <path d="M 30 42 L 70 42 L 74 80 L 26 80 Z" fill="url(#bagGrad)" opacity="0.95" />
            {/* Big "N" in center */}
            <text x="50" y="67" fontSize="22" fill="#f97316" textAnchor="middle" fontWeight="bold" fontFamily="system-ui, sans-serif">
              N
            </text>
            {/* Hanging star/sparkle decoration */}
            <polygon points="76,30 79,37 86,38 81,43 83,50 76,46 69,50 71,43 66,38 73,37" fill="#fef08a" />
          </svg>
        );

      case 'videoeditor':
        // Fluent Video Editor (clapperboard / film camera blend)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="videoEditorGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#7c3aed" /> {/* Violet 600 */}
                <stop offset="100%" stopColor="#4f46e5" /> {/* Indigo 600 */}
              </linearGradient>
            </defs>
            {/* Clapperboard Body */}
            <rect x="15" y="15" width="70" height="70" rx="8" fill="url(#videoEditorGrad)" />
            {/* Top Bar diagonal stripes */}
            <path d="M 15 23 L 30 15 L 38 15 L 23 23 Z" fill="#ffffff" opacity="0.3" />
            <path d="M 33 23 L 48 15 L 56 15 L 41 23 Z" fill="#ffffff" opacity="0.3" />
            <path d="M 51 23 L 66 15 L 74 15 L 59 23 Z" fill="#ffffff" opacity="0.3" />
            <path d="M 69 23 L 84 15 L 85 15 L 85 19 L 77 23 Z" fill="#ffffff" opacity="0.3" />
            {/* Divider line */}
            <line x1="15" y1="23" x2="85" y2="23" stroke="#ffffff" strokeWidth="2" opacity="0.4" />
            {/* Camera / Film circles or Play Triangle */}
            <polygon points="42,40 68,55 42,70" fill="#ffffff" opacity="0.95" />
            <circle cx="50" cy="55" r="24" fill="none" stroke="#ffffff" strokeWidth="3" opacity="0.25" />
          </svg>
        );

      case 'start':
        // noob os Start Logo
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="12" y="12" width="35" height="35" rx="3" fill="#0078d4" />
            <rect x="53" y="12" width="35" height="35" rx="3" fill="#0078d4" />
            <rect x="12" y="53" width="35" height="35" rx="3" fill="#0078d4" />
            <rect x="53" y="53" width="35" height="35" rx="3" fill="#0078d4" />
          </svg>
        );

      case 'browser':
        // Firefox/Edge Web Browser Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="globeGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00c6ff" />
                <stop offset="100%" stopColor="#0072ff" />
              </linearGradient>
              <linearGradient id="swooshGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#ff416c" />
                <stop offset="100%" stopColor="#ff4b2b" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="40" fill="url(#globeGrad)" />
            <path
              d="M 25 50 C 25 25, 75 25, 75 50 C 75 75, 40 85, 25 50"
              fill="none"
              stroke="#ffffff"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.3"
            />
            <path
              d="M 15 60 C 25 30, 70 20, 85 45 C 90 55, 80 80, 50 85 C 25 87, 12 75, 15 60"
              fill="none"
              stroke="url(#swooshGrad)"
              strokeWidth="10"
              strokeLinecap="round"
            />
            <circle cx="65" cy="40" r="8" fill="#ffffff" opacity="0.9" />
          </svg>
        );

      case 'notepad':
        // Modern Fluent Notepad Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="padGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffeb3b" />
                <stop offset="100%" stopColor="#fbc02d" />
              </linearGradient>
              <linearGradient id="pencilGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#03a9f4" />
                <stop offset="100%" stopColor="#0288d1" />
              </linearGradient>
            </defs>
            {/* Notepad Base */}
            <rect x="20" y="15" width="60" height="70" rx="6" fill="#ffffff" stroke="#e0e0e0" strokeWidth="2" />
            <path d="M 20 25 L 80 25" stroke="#fbc02d" strokeWidth="4" />
            <rect x="20" y="15" width="60" height="10" rx="3" fill="url(#padGrad)" />
            {/* Lines */}
            <line x1="30" y1="40" x2="70" y2="40" stroke="#b0bec5" strokeWidth="3" strokeLinecap="round" />
            <line x1="30" y1="52" x2="65" y2="52" stroke="#b0bec5" strokeWidth="3" strokeLinecap="round" />
            <line x1="30" y1="64" x2="55" y2="64" stroke="#b0bec5" strokeWidth="3" strokeLinecap="round" />
            <line x1="30" y1="76" x2="70" y2="76" stroke="#b0bec5" strokeWidth="3" strokeLinecap="round" />
            {/* Pencil floating */}
            <g transform="translate(55, 50) rotate(-45)">
              <rect x="0" y="0" width="8" height="35" rx="2" fill="url(#pencilGrad)" />
              <path d="M 0 35 L 4 41 L 8 35 Z" fill="#ffcc80" />
              <path d="M 3 40 L 4 41 L 5 40 L 4 39 Z" fill="#37474f" />
              <rect x="0" y="-3" width="8" height="5" rx="1" fill="#e91e63" />
            </g>
          </svg>
        );

      case 'calculator':
        // Fluent Calculator Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="calcGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#00b0ff" />
                <stop offset="100%" stopColor="#0072ff" />
              </linearGradient>
            </defs>
            <rect x="18" y="15" width="64" height="70" rx="8" fill="url(#calcGrad)" />
            {/* Screen */}
            <rect x="26" y="23" width="48" height="18" rx="4" fill="#ffffff" />
            <rect x="60" y="30" width="10" height="4" rx="1" fill="#37474f" />
            {/* Grid of buttons */}
            <circle cx="34" cy="52" r="5" fill="#ffffff" fillOpacity="0.4" />
            <circle cx="50" cy="52" r="5" fill="#ffffff" fillOpacity="0.4" />
            <circle cx="66" cy="52" r="5" fill="#ffffff" fillOpacity="0.4" />

            <circle cx="34" cy="66" r="5" fill="#ffffff" fillOpacity="0.4" />
            <circle cx="50" cy="66" r="5" fill="#ffffff" fillOpacity="0.4" />
            <circle cx="66" cy="66" r="5" fill="#ffffff" fillOpacity="0.4" />

            <rect x="29" y="75" width="26" height="6" rx="3" fill="#ffffff" fillOpacity="0.4" />
            <circle cx="66" cy="78" r="5" fill="#ff5252" />
          </svg>
        );

      case 'paint':
        // Fluent Paint Brush and Palette Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="paletteGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffe082" />
                <stop offset="100%" stopColor="#ffb300" />
              </linearGradient>
            </defs>
            {/* Palette */}
            <path
              d="M 20 45 C 15 25, 60 10, 80 30 C 95 45, 85 75, 65 80 C 50 82, 45 70, 35 70 C 25 70, 25 65, 20 45 Z"
              fill="url(#paletteGrad)"
            />
            {/* Thumb hole */}
            <circle cx="65" cy="62" r="6" fill="#e0a000" />
            <circle cx="65" cy="62" r="5" fill="#1e1e1e" fillOpacity="0.15" />
            {/* Color Blots */}
            <circle cx="35" cy="30" r="7" fill="#e53935" />
            <circle cx="55" cy="25" r="6" fill="#1e88e5" />
            <circle cx="75" cy="40" r="7" fill="#4caf50" />
            <circle cx="45" cy="55" r="8" fill="#e91e63" />
            {/* Paint Brush */}
            <g transform="translate(10, 25) rotate(45)">
              <rect x="0" y="0" width="8" height="50" rx="3" fill="#8d6e63" />
              <rect x="-2" y="45" width="12" height="12" fill="#b0bec5" />
              <path d="M -2 57 Q 4 70, 10 57 Z" fill="#1e1e1e" />
              <path d="M 2 61 Q 4 67, 6 61 Z" fill="#1e88e5" />
            </g>
          </svg>
        );

      case 'files':
        // Fluent File Explorer Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="folderBack" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffe082" />
                <stop offset="100%" stopColor="#ffb300" />
              </linearGradient>
              <linearGradient id="folderFront" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fff8e1" />
                <stop offset="100%" stopColor="#ffe082" />
              </linearGradient>
            </defs>
            {/* Back folder wall & Tab */}
            <path d="M 15 25 L 45 25 L 53 35 L 85 35 L 85 75 L 15 75 Z" fill="url(#folderBack)" />
            {/* Document peaking out */}
            <rect x="25" y="20" width="45" height="40" rx="3" fill="#ffffff" />
            <line x1="32" y1="28" x2="52" y2="28" stroke="#0072ff" strokeWidth="2" />
            <line x1="32" y1="36" x2="62" y2="36" stroke="#cfd8dc" strokeWidth="2" />
            <line x1="32" y1="44" x2="58" y2="44" stroke="#cfd8dc" strokeWidth="2" />
            {/* Front folder wall (steeped perspective) */}
            <path d="M 15 35 L 85 35 L 85 78 A 3 3 0 0 1 82 81 L 18 81 A 3 3 0 0 1 15 78 Z" fill="url(#folderFront)" />
            {/* Little logo in center */}
            <circle cx="50" cy="58" r="7" fill="#0078d4" opacity="0.8" />
            <path d="M 47 58 L 50 55 L 53 58" fill="none" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'terminal':
        // Fluent Command Prompt Terminal Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="termGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#424242" />
                <stop offset="100%" stopColor="#212121" />
              </linearGradient>
            </defs>
            <rect x="15" y="18" width="70" height="64" rx="8" fill="url(#termGrad)" stroke="#616161" strokeWidth="1.5" />
            <rect x="15" y="18" width="70" height="12" rx="3" fill="#1e1e1e" />
            <circle cx="23" cy="24" r="2.5" fill="#ff5252" />
            <circle cx="31" cy="24" r="2.5" fill="#ffeb3b" />
            <circle cx="39" cy="24" r="2.5" fill="#4caf50" />
            {/* Prompt */}
            <path d="M 25 42 L 33 47 L 25 52" fill="none" stroke="#4caf50" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            <line x1="37" y1="52" x2="49" y2="52" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );

      case 'excel':
        // Fluent Excel Sheet Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="excelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#2e7d32" />
                <stop offset="100%" stopColor="#1b5e20" />
              </linearGradient>
            </defs>
            <rect x="22" y="15" width="56" height="70" rx="8" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" />
            <rect x="22" y="15" width="56" height="20" rx="4" fill="url(#excelGrad)" />
            {/* Inner Grid */}
            <rect x="30" y="44" width="40" height="30" fill="none" stroke="#a5d6a7" strokeWidth="1.5" />
            <line x1="30" y1="54" x2="70" y2="54" stroke="#e8f5e9" strokeWidth="1.5" />
            <line x1="30" y1="64" x2="70" y2="64" stroke="#e8f5e9" strokeWidth="1.5" />
            <line x1="43" y1="44" x2="43" y2="74" stroke="#e8f5e9" strokeWidth="1.5" />
            <line x1="56" y1="44" x2="56" y2="74" stroke="#e8f5e9" strokeWidth="1.5" />
            {/* Big X Logo */}
            <rect x="18" y="28" width="22" height="22" rx="4" fill="url(#excelGrad)" />
            <path d="M 23 33 L 35 45 M 35 33 L 23 45" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        );

      case 'settings':
        // Fluent Settings Gear Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="gearGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#78909c" />
                <stop offset="100%" stopColor="#37474f" />
              </linearGradient>
            </defs>
            <circle cx="50" cy="50" r="18" fill="none" stroke="url(#gearGrad)" strokeWidth="8" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="url(#gearGrad)" strokeWidth="6" strokeDasharray="16 7" />
            <circle cx="50" cy="50" r="10" fill="#ffffff" />
          </svg>
        );

      case 'folder':
        // Standard Yellow Directory Icon for File Manager navigation
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="simpleFolder" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ffca28" />
                <stop offset="100%" stopColor="#ff8f00" />
              </linearGradient>
            </defs>
            <path d="M 10 25 L 40 25 L 48 35 L 90 35 L 90 80 L 10 80 Z" fill="url(#simpleFolder)" />
            <path d="M 10 35 L 90 35 L 90 80 A 3 3 0 0 1 87 83 L 13 83 A 3 3 0 0 1 10 80 Z" fill="#ffe082" />
          </svg>
        );

      case 'doc-txt':
        // Text Document Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <rect x="25" y="15" width="50" height="70" rx="4" fill="#ffffff" stroke="#90a4ae" strokeWidth="2" />
            <path d="M 55 15 L 75 35 L 55 35 Z" fill="#cfd8dc" />
            <line x1="35" y1="45" x2="65" y2="45" stroke="#90a4ae" strokeWidth="3" strokeLinecap="round" />
            <line x1="35" y1="57" x2="65" y2="57" stroke="#90a4ae" strokeWidth="3" strokeLinecap="round" />
            <line x1="35" y1="69" x2="55" y2="69" stroke="#90a4ae" strokeWidth="3" strokeLinecap="round" />
          </svg>
        );

      case 'word':
        // Fluent Word Document Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="wordGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1976d2" />
                <stop offset="100%" stopColor="#115293" />
              </linearGradient>
            </defs>
            <rect x="22" y="15" width="56" height="70" rx="8" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" />
            <rect x="22" y="15" width="56" height="20" rx="4" fill="url(#wordGrad)" />
            {/* Lines */}
            <line x1="32" y1="46" x2="68" y2="46" stroke="#90caf9" strokeWidth="2.5" strokeLinecap="round" />
            <line x1="32" y1="56" x2="68" y2="56" stroke="#cfd8dc" strokeWidth="2" strokeLinecap="round" />
            <line x1="32" y1="66" x2="58" y2="66" stroke="#cfd8dc" strokeWidth="2" strokeLinecap="round" />
            <line x1="32" y1="76" x2="64" y2="76" stroke="#cfd8dc" strokeWidth="2" strokeLinecap="round" />
            {/* Big W Logo overlay */}
            <rect x="18" y="28" width="22" height="22" rx="4" fill="url(#wordGrad)" />
            <text x="29" y="44" fontSize="15" fill="#ffffff" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">W</text>
          </svg>
        );

      case 'powerpoint':
        // Fluent PowerPoint Slide Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="pptGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e65100" />
                <stop offset="100%" stopColor="#bf360c" />
              </linearGradient>
            </defs>
            <rect x="22" y="15" width="56" height="70" rx="8" fill="#ffffff" stroke="#e0e0e0" strokeWidth="1.5" />
            <rect x="22" y="15" width="56" height="20" rx="4" fill="url(#pptGrad)" />
            {/* Miniature Slide Layout */}
            <rect x="32" y="44" width="36" height="20" rx="2" fill="none" stroke="#ffcc80" strokeWidth="2" />
            <circle cx="50" cy="54" r="3" fill="#ffb74d" />
            {/* Big P Logo overlay */}
            <rect x="18" y="28" width="22" height="22" rx="4" fill="url(#pptGrad)" />
            <text x="29" y="44" fontSize="15" fill="#ffffff" textAnchor="middle" fontWeight="bold" fontFamily="sans-serif">P</text>
          </svg>
        );

      case 'recycle':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="binGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#90caf9" />
                <stop offset="100%" stopColor="#42a5f5" />
              </linearGradient>
            </defs>
            {/* Empty Recycle Bin */}
            <rect x="25" y="25" width="50" height="55" rx="8" fill="none" stroke="url(#binGrad)" strokeWidth="5" />
            <line x1="20" y1="20" x2="80" y2="20" stroke="url(#binGrad)" strokeWidth="5" strokeLinecap="round" />
            <path d="M 40 20 L 45 12 L 55 12 L 60 20" fill="none" stroke="url(#binGrad)" strokeWidth="4" strokeLinecap="round" />
            {/* Recycling symbol arrows */}
            <path d="M 45 42 L 55 42 L 50 35 Z" fill="#64b5f6" />
            <path d="M 47 42 C 45 48, 50 53, 50 53" fill="none" stroke="#64b5f6" strokeWidth="3" />
            <path d="M 53 42 C 55 48, 50 53, 50 53" fill="none" stroke="#64b5f6" strokeWidth="3" />
            {/* Vertical ridges on the bin */}
            <line x1="38" y1="32" x2="38" y2="70" stroke="url(#binGrad)" strokeWidth="3" strokeDasharray="2,6" />
            <line x1="50" y1="32" x2="50" y2="70" stroke="url(#binGrad)" strokeWidth="3" strokeDasharray="2,6" />
            <line x1="62" y1="32" x2="62" y2="70" stroke="url(#binGrad)" strokeWidth="3" strokeDasharray="2,6" />
          </svg>
        );

      case 'recycle-full':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="binGradFull" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e88e5" />
                <stop offset="100%" stopColor="#1565c0" />
              </linearGradient>
              <linearGradient id="paperGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#cfd8dc" />
                <stop offset="100%" stopColor="#90a4ae" />
              </linearGradient>
            </defs>
            {/* Crumpled paper inside overflowing */}
            <ellipse cx="50" cy="24" rx="20" ry="10" fill="url(#paperGrad)" />
            <path d="M 38 20 Q 32 12, 42 15 Q 48 8, 56 16 Q 64 12, 60 22 Z" fill="url(#paperGrad)" />
            {/* Full Recycle Bin */}
            <rect x="25" y="25" width="50" height="55" rx="8" fill="none" stroke="url(#binGradFull)" strokeWidth="6" />
            <line x1="20" y1="20" x2="80" y2="20" stroke="url(#binGradFull)" strokeWidth="6" strokeLinecap="round" />
            <path d="M 40 20 L 45 12 L 55 12 L 60 20" fill="none" stroke="url(#binGradFull)" strokeWidth="4" strokeLinecap="round" />
            {/* Recycling symbol arrows */}
            <g transform="translate(5, 5)">
              <path d="M 45 42 L 55 42 L 50 35 Z" fill="#42a5f5" />
              <path d="M 47 42 C 45 48, 50 53, 50 53" fill="none" stroke="#42a5f5" strokeWidth="3" />
            </g>
            {/* Vertical ridges on the bin */}
            <line x1="38" y1="32" x2="38" y2="70" stroke="url(#binGradFull)" strokeWidth="3" strokeDasharray="2,6" />
            <line x1="50" y1="32" x2="50" y2="70" stroke="url(#binGradFull)" strokeWidth="3" strokeDasharray="2,6" />
            <line x1="62" y1="32" x2="62" y2="70" stroke="url(#binGradFull)" strokeWidth="3" strokeDasharray="2,6" />
          </svg>
        );

      case 'minecraft':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="grassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#76c035" />
                <stop offset="100%" stopColor="#5c9a24" />
              </linearGradient>
              <linearGradient id="dirtSideGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#8b5a2b" />
                <stop offset="100%" stopColor="#57381b" />
              </linearGradient>
              <linearGradient id="dirtSideGradDark" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#6d441f" />
                <stop offset="100%" stopColor="#402812" />
              </linearGradient>
            </defs>
            {/* Isometric Grass Block */}
            {/* Left Side (Dirt) */}
            <path d="M 50 50 L 15 32 L 15 72 L 50 90 Z" fill="url(#dirtSideGrad)" />
            {/* Right Side (Dirt) */}
            <path d="M 50 50 L 85 32 L 85 72 L 50 90 Z" fill="url(#dirtSideGradDark)" />
            {/* Top Side (Grass) */}
            <path d="M 50 10 L 85 32 L 50 50 L 15 32 Z" fill="url(#grassGrad)" />
            {/* Left Side Grass Hanging Overhang */}
            <path d="M 15 32 L 50 50 L 50 62 L 42 56 L 36 60 L 26 53 L 20 57 L 15 32 Z" fill="#5c9a24" />
            {/* Right Side Grass Hanging Overhang (Darker Shadow) */}
            <path d="M 50 50 L 85 32 L 85 44 L 79 49 L 73 43 L 63 51 L 57 46 L 50 62 Z" fill="#46751c" />
            {/* Extra pixelated dots */}
            <rect x="25" y="70" width="4" height="4" fill="#301a09" opacity="0.4" />
            <rect x="35" y="78" width="4" height="4" fill="#301a09" opacity="0.4" />
            <rect x="60" y="72" width="4" height="4" fill="#1b0e05" opacity="0.4" />
            <rect x="72" y="66" width="4" height="4" fill="#1b0e05" opacity="0.4" />
          </svg>
        );

      case 'dotsandboxes':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="dbBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e291e" />
                <stop offset="100%" stopColor="#0f140f" />
              </linearGradient>
            </defs>
            {/* Felt Board Base */}
            <rect x="10" y="10" width="80" height="80" rx="14" fill="url(#dbBgGrad)" stroke="#78350f" strokeWidth="3" />
            
            {/* Glowing lines */}
            {/* Top Cyan horizontal line */}
            <line x1="25" y1="25" x2="75" y2="25" stroke="#06b6d4" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
            {/* Left Cyan vertical line */}
            <line x1="25" y1="25" x2="25" y2="75" stroke="#06b6d4" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
            {/* Bottom Cyan horizontal line */}
            <line x1="25" y1="75" x2="75" y2="75" stroke="#06b6d4" strokeWidth="5" strokeLinecap="round" opacity="0.9" />
            {/* Right Rose vertical line (making a box) */}
            <line x1="75" y1="25" x2="75" y2="75" stroke="#f43f5e" strokeWidth="5" strokeLinecap="round" opacity="0.9" />

            {/* Filled box center star */}
            <rect x="29" y="29" width="42" height="42" rx="4" fill="#06b6d4" fillOpacity="0.15" />
            <polygon points="50,42 53,49 61,50 55,55 57,63 50,59 43,63 45,55 39,50 47,49" fill="#06b6d4" />

            {/* Brass Dots Grid */}
            <circle cx="25" cy="25" r="5" fill="#fef08a" stroke="#000000" strokeWidth="1.5" />
            <circle cx="75" cy="25" r="5" fill="#fef08a" stroke="#000000" strokeWidth="1.5" />
            <circle cx="25" cy="75" r="5" fill="#fef08a" stroke="#000000" strokeWidth="1.5" />
            <circle cx="75" cy="75" r="5" fill="#fef08a" stroke="#000000" strokeWidth="1.5" />
          </svg>
        );

      case 'blokus':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="blokusBgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1e1e24" />
                <stop offset="100%" stopColor="#0a0a0c" />
              </linearGradient>
              <filter id="tileGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.6" />
              </filter>
            </defs>
            {/* Dark wood felt base */}
            <rect x="10" y="10" width="80" height="80" rx="16" fill="url(#blokusBgGrad)" stroke="#1e293b" strokeWidth="2.5" />
            
            {/* Grid Lines on the background tile */}
            <line x1="10" y1="30" x2="90" y2="30" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="10" y1="50" x2="90" y2="50" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="10" y1="70" x2="90" y2="70" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="30" y1="10" x2="30" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="50" y1="10" x2="50" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />
            <line x1="70" y1="10" x2="70" y2="90" stroke="#334155" strokeWidth="0.5" strokeDasharray="2,2" />

            {/* Overlapping translucent Blokus tiles (Blue, Red, Yellow, Green/Orange) */}
            {/* Blue corner L-shape */}
            <path d="M 22 22 L 54 22 L 54 38 L 38 38 L 38 54 L 22 54 Z" fill="#06b6d4" fillOpacity="0.85" stroke="#22d3ee" strokeWidth="1.5" filter="url(#tileGlow)" />
            <rect x="25" y="25" width="10" height="10" rx="1" fill="#22d3ee" fillOpacity="0.4" />
            <rect x="41" y="25" width="10" height="10" rx="1" fill="#22d3ee" fillOpacity="0.4" />
            <rect x="25" y="41" width="10" height="10" rx="1" fill="#22d3ee" fillOpacity="0.4" />

            {/* Orange Z-shape overlapping */}
            <path d="M 46 46 L 78 46 L 78 62 L 62 62 L 62 78 L 30 78 L 30 62 L 46 62 Z" fill="#f97316" fillOpacity="0.85" stroke="#fb923c" strokeWidth="1.5" filter="url(#tileGlow)" />
            <rect x="49" y="49" width="10" height="10" rx="1" fill="#fb923c" fillOpacity="0.4" />
            <rect x="65" y="49" width="10" height="10" rx="1" fill="#fb923c" fillOpacity="0.4" />
            <rect x="33" y="65" width="10" height="10" rx="1" fill="#fb923c" fillOpacity="0.4" />
            <rect x="49" y="65" width="10" height="10" rx="1" fill="#fb923c" fillOpacity="0.4" />

            {/* Red single block overlap */}
            <rect x="58" y="26" width="16" height="16" rx="2" fill="#f43f5e" fillOpacity="0.9" stroke="#f43f5e" strokeWidth="1.5" filter="url(#tileGlow)" />
            <rect x="61" y="29" width="10" height="10" rx="1" fill="#fca5a5" fillOpacity="0.4" />

            {/* Yellow piece overlap */}
            <rect x="26" y="58" width="16" height="16" rx="2" fill="#eab308" fillOpacity="0.9" stroke="#fde047" strokeWidth="1.5" filter="url(#tileGlow)" />
            <rect x="29" y="61" width="10" height="10" rx="1" fill="#fef08a" fillOpacity="0.4" />
          </svg>
        );

      case 'wetalks':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="wetalksBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#15803d" />
              </linearGradient>
            </defs>
            <path
              d="M 50 15 C 28 15 10 30 10 50 C 10 62 18 73 31 80 C 29 86 24 92 18 95 C 26 95 36 90 42 85 C 45 85 47 85 50 85 C 72 85 90 70 90 50 C 90 30 72 15 50 15 Z"
              fill="url(#wetalksBg)"
            />
            <text x="50" y="58" fontSize="24" fill="#ffffff" textAnchor="middle" fontFamily="sans-serif" fontWeight="900">
              We
            </text>
          </svg>
        );

      case 'nmap':
        // Modern Security Scanner Icon (radar / target shield blend)
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="nmapBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#dc2626" /> {/* Red 600 */}
                <stop offset="100%" stopColor="#7f1d1d" /> {/* Red 900 */}
              </linearGradient>
            </defs>
            <rect x="12" y="12" width="76" height="76" rx="16" fill="url(#nmapBg)" />
            {/* Outer radar circle */}
            <circle cx="50" cy="50" r="28" fill="none" stroke="#fca5a5" strokeWidth="2.5" opacity="0.3" />
            <circle cx="50" cy="50" r="18" fill="none" stroke="#fca5a5" strokeWidth="2" opacity="0.45" />
            <circle cx="50" cy="50" r="8" fill="none" stroke="#ffffff" strokeWidth="1.5" opacity="0.7" />
            {/* Radar sweeps / sweep lines */}
            <line x1="50" y1="15" x2="50" y2="85" stroke="#fca5a5" strokeWidth="1.5" opacity="0.25" />
            <line x1="15" y1="50" x2="85" y2="50" stroke="#fca5a5" strokeWidth="1.5" opacity="0.25" />
            {/* Sweeping radar cone segment */}
            <path d="M 50 50 L 70 30 A 28 28 0 0 0 50 22 Z" fill="#ffffff" opacity="0.22" />
            {/* Little target/blip points */}
            <circle cx="68" cy="42" r="3" fill="#34d399" /> {/* green blip */}
            <circle cx="34" cy="58" r="2.5" fill="#ef4444" /> {/* red warning blip */}
            <circle cx="42" cy="30" r="2" fill="#60a5fa" /> {/* blue blip */}
          </svg>
        );

      case 'flightsim':
        // Modern Aviation / Jet Flight Sim Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="flightsimBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0284c7" /> {/* Sky 600 */}
                <stop offset="50%" stopColor="#0f172a" /> {/* Slate 900 */}
                <stop offset="100%" stopColor="#311042" /> {/* Purple dark */}
              </linearGradient>
              <linearGradient id="planeGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#ffffff" />
                <stop offset="100%" stopColor="#94a3b8" />
              </linearGradient>
            </defs>
            <rect x="12" y="12" width="76" height="76" rx="16" fill="url(#flightsimBg)" />
            
            {/* Artificial Horizon Lines */}
            <line x1="25" y1="50" x2="75" y2="50" stroke="#34d399" strokeWidth="1" strokeDasharray="3,3" opacity="0.4" />
            <circle cx="50" cy="50" r="30" fill="none" stroke="#ffffff" strokeWidth="1" opacity="0.15" />
            
            {/* Pitch scale lines */}
            <line x1="42" y1="40" x2="58" y2="40" stroke="#34d399" strokeWidth="1" opacity="0.3" />
            <line x1="42" y1="60" x2="58" y2="60" stroke="#34d399" strokeWidth="1" opacity="0.3" />
            <line x1="46" y1="45" x2="54" y2="45" stroke="#34d399" strokeWidth="1" opacity="0.3" />
            <line x1="46" y1="55" x2="54" y2="55" stroke="#34d399" strokeWidth="1" opacity="0.3" />
            
            {/* Flightpath Vector (the little circle with wings) */}
            <circle cx="50" cy="46" r="3" fill="none" stroke="#fbbf24" strokeWidth="1.5" />
            <line x1="44" y1="46" x2="47" y2="46" stroke="#fbbf24" strokeWidth="1.5" />
            <line x1="53" y1="46" x2="56" y2="46" stroke="#fbbf24" strokeWidth="1.5" />
            <line x1="50" y1="41" x2="50" y2="43" stroke="#fbbf24" strokeWidth="1.5" />

            {/* Stylized Jet Airplane Silhouette swooping up */}
            <path 
              d="M 50 25 
                 L 53 42 
                 L 80 58 
                 L 80 62 
                 L 55 54 
                 L 53 72 
                 L 64 80 
                 L 64 83 
                 L 50 78 
                 L 36 83 
                 L 36 80 
                 L 47 72 
                 L 45 54 
                 L 20 62 
                 L 20 58 
                 L 47 42 Z" 
              fill="url(#planeGrad)" 
              filter="drop-shadow(0px 3px 4px rgba(0,0,0,0.5))"
            />
            
            {/* Speed trails/wingtip vortices */}
            <path d="M 20 58 Q 15 56 5 52" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
            <path d="M 80 58 Q 85 56 95 52" fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" opacity="0.7" />
          </svg>
        );
      
      case 'chameleon':
        // Custom Styled Chameleon Lizard Icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="chameleonBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" /> {/* Emerald 500 */}
                <stop offset="50%" stopColor="#06b6d4" /> {/* Cyan 500 */}
                <stop offset="100%" stopColor="#3b82f6" /> {/* Blue 500 */}
              </linearGradient>
              <linearGradient id="lizardBody" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a3e635" /> {/* Lime 400 */}
                <stop offset="100%" stopColor="#10b981" /> {/* Emerald 500 */}
              </linearGradient>
            </defs>
            {/* Rounded App Icon Base */}
            <rect x="12" y="12" width="76" height="76" rx="16" fill="url(#chameleonBg)" />
            
            {/* Small Twig */}
            <path d="M 15 74 Q 50 68, 85 64" fill="none" stroke="#78350f" strokeWidth="6" strokeLinecap="round" />
            <path d="M 60 66 Q 68 58, 76 60" fill="none" stroke="#78350f" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 72 60 A 4 4 0 1 1 76 58" fill="#4ade80" /> {/* Little leaf */}

            {/* Chameleon Body & Head */}
            <path 
              d="M 28 65 
                 C 22 55, 26 40, 36 32 
                 C 44 26, 56 26, 62 34 
                 C 68 40, 72 48, 68 56 
                 L 64 68 Z" 
              fill="url(#lizardBody)" 
            />

            {/* Coiled Tail (Cute spiral) */}
            <path 
              d="M 32 62 
                 C 20 62, 14 52, 18 42 
                 C 21 34, 30 30, 34 36 
                 C 36 38, 34 44, 30 42 
                 C 28 41, 26 38, 28 37" 
              fill="none" 
              stroke="#a3e635" 
              strokeWidth="5" 
              strokeLinecap="round" 
            />

            {/* Little Feet grasping the branch */}
            <path d="M 46 64 C 46 68, 42 70, 42 72" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />
            <path d="M 58 63 C 58 67, 56 69, 56 71" fill="none" stroke="#15803d" strokeWidth="3" strokeLinecap="round" />

            {/* Giant bulging chameleon eyes */}
            <circle cx="56" cy="38" r="8.5" fill="#ffffff" />
            <circle cx="56" cy="38" r="4.5" fill="#0f172a" />
            <circle cx="57.5" cy="36.5" r="1.5" fill="#ffffff" /> {/* sparkle */}
            
            <circle cx="42" cy="40" r="7" fill="#ffffff" />
            <circle cx="42" cy="40" r="3.5" fill="#0f172a" />

            {/* Extruded curly tongue with a fly */}
            <path d="M 62 46 Q 78 44, 76 34" fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
            <circle cx="76" cy="34" r="2.5" fill="#fda4af" />
          </svg>
        );

      case 'tetris':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="tetrisBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#0f172a" />
                <stop offset="100%" stopColor="#1e1b4b" />
              </linearGradient>
              <filter id="blockGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="0" stdDeviation="2" floodColor="#d946ef" floodOpacity="0.8" />
              </filter>
            </defs>
            <rect x="12" y="12" width="76" height="76" rx="16" fill="url(#tetrisBg)" stroke="#312e81" strokeWidth="2" />
            
            {/* T-piece (Purple/Pink) in center */}
            <g filter="url(#blockGlow)">
              <rect x="42" y="28" width="16" height="16" rx="2" fill="#d946ef" stroke="#f472b6" strokeWidth="1" />
              <rect x="26" y="44" width="16" height="16" rx="2" fill="#d946ef" stroke="#f472b6" strokeWidth="1" />
              <rect x="42" y="44" width="16" height="16" rx="2" fill="#d946ef" stroke="#f472b6" strokeWidth="1" />
              <rect x="58" y="44" width="16" height="16" rx="2" fill="#d946ef" stroke="#f472b6" strokeWidth="1" />
            </g>

            {/* L-piece (Orange) */}
            <g>
              <rect x="26" y="60" width="16" height="16" rx="2" fill="#f97316" stroke="#fdba74" strokeWidth="1" />
              <rect x="42" y="60" width="16" height="16" rx="2" fill="#f97316" stroke="#fdba74" strokeWidth="1" />
              <rect x="58" y="60" width="16" height="16" rx="2" fill="#f97316" stroke="#fdba74" strokeWidth="1" />
            </g>

            {/* Cyan single line block accent */}
            <rect x="58" y="28" width="16" height="16" rx="2" fill="#06b6d4" stroke="#22d3ee" strokeWidth="1" />
          </svg>
        );

      case 'sprout':
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <defs>
              <linearGradient id="sproutBg" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#047857" />
              </linearGradient>
              <filter id="sproutGlow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#10b981" floodOpacity="0.5" />
              </filter>
            </defs>
            <rect x="12" y="12" width="76" height="76" rx="16" fill="url(#sproutBg)" />
            <g filter="url(#sproutGlow)" stroke="#ffffff" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
              <path d="M 50 80 Q 50 45, 65 25" />
              <path d="M 50 55 Q 32 45, 36 30 Q 50 40, 50 55 Z" fill="#4ade80" fillOpacity="0.4" strokeWidth="3.5" />
              <path d="M 54 42 Q 72 35, 70 20 Q 54 28, 54 42 Z" fill="#4ade80" fillOpacity="0.4" strokeWidth="3.5" />
            </g>
            <rect x="58" y="62" width="24" height="14" rx="4" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
            <text x="70" y="72" fontSize="9" fill="#34d399" textAnchor="middle" fontWeight="bold" fontFamily="monospace">.SP</text>
          </svg>
        );

      default:
        // Fallback generic file/app icon
        return (
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <circle cx="50" cy="50" r="35" fill="#90a4ae" />
            <text x="50" y="58" fontSize="24" fill="#ffffff" textAnchor="middle" fontWeight="bold">?</text>
          </svg>
        );
    }
  };

  return (
    <div
      className={`flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
    >
      {getIcon()}
    </div>
  );
};
