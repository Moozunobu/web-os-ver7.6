import React, { useState, useEffect, useRef } from 'react';
import {
  Presentation,
  Play,
  Plus,
  Trash2,
  FolderOpen,
  Save,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
} from 'lucide-react';

interface Slide {
  id: string;
  title: string;
  subtitle: string;
}

interface PresentationData {
  id: string;
  title: string;
  slides: Slide[];
  lastModified: string;
}

const DEFAULT_SLIDES: Slide[] = [
  {
    id: 's1',
    title: 'Welcome to PowerPoint WebOS',
    subtitle: 'A fully responsive, slide deck presentation creator inside noob os.',
  },
  {
    id: 's2',
    title: 'Fully Persistent Storage',
    subtitle: 'Create as many slides and presentations as you want. All edits are saved instantly to local storage.',
  },
  {
    id: 's3',
    title: 'Interactive Presentation Mode',
    subtitle: 'Click "Present" above to enter full-window slide show mode with navigation support.',
  },
];

export const PowerPointApp: React.FC = () => {
  const [presentations, setPresentations] = useState<PresentationData[]>([]);
  const [currentPresId, setCurrentPresId] = useState<string>('');
  const [presTitle, setPresTitle] = useState('My Presentation');
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES);
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('webos_ppt_decks');
      if (stored) {
        const parsed = JSON.parse(stored) as PresentationData[];
        setPresentations(parsed);
        if (parsed.length > 0) {
          const first = parsed[0];
          setCurrentPresId(first.id);
          setPresTitle(first.title);
          setSlides(first.slides);
          setActiveSlideIndex(0);
        }
      } else {
        // Initial setup
        const initialDeck: PresentationData = {
          id: 'initial-ppt',
          title: 'Welcome Presentation.pptx',
          slides: DEFAULT_SLIDES,
          lastModified: new Date().toISOString(),
        };
        setPresentations([initialDeck]);
        setCurrentPresId(initialDeck.id);
        setPresTitle(initialDeck.title);
        setSlides(initialDeck.slides);
        setActiveSlideIndex(0);
        localStorage.setItem('webos_ppt_decks', JSON.stringify([initialDeck]));
      }
    } catch (e) {
      console.error('Failed to load PPT presentations', e);
    }
  }, []);

  // Sync keyboard controls for presentation mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isPreviewing) return;
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        handleNextSlide();
      } else if (e.key === 'ArrowLeft') {
        handlePrevSlide();
      } else if (e.key === 'Escape') {
        setIsPreviewing(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPreviewing, activeSlideIndex, slides.length]);

  const handleSave = () => {
    let updated = [...presentations];
    const matchIndex = presentations.findIndex((p) => p.id === currentPresId);

    const deckToSave: PresentationData = {
      id: currentPresId || `ppt-${Date.now()}`,
      title: presTitle.endsWith('.pptx') ? presTitle : `${presTitle}.pptx`,
      slides,
      lastModified: new Date().toISOString(),
    };

    if (matchIndex >= 0) {
      updated[matchIndex] = deckToSave;
    } else {
      updated.push(deckToSave);
      setCurrentPresId(deckToSave.id);
    }

    setPresentations(updated);
    localStorage.setItem('webos_ppt_decks', JSON.stringify(updated));
    alert(`"${deckToSave.title}" has been saved successfully to local storage.`);
  };

  const handleNewPres = () => {
    const newId = `ppt-${Date.now()}`;
    setCurrentPresId(newId);
    setPresTitle('Untitled Presentation');
    const newSlides = [
      {
        id: `slide-${Date.now()}`,
        title: 'Click to add title',
        subtitle: 'Click to add subtitle',
      },
    ];
    setSlides(newSlides);
    setActiveSlideIndex(0);
  };

  const handleLoadPres = (deck: PresentationData) => {
    setCurrentPresId(deck.id);
    setPresTitle(deck.title);
    setSlides(deck.slides);
    setActiveSlideIndex(0);
    setShowLoadModal(false);
  };

  const handleDeletePres = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = presentations.filter((p) => p.id !== id);
    setPresentations(filtered);
    localStorage.setItem('webos_ppt_decks', JSON.stringify(filtered));

    if (currentPresId === id) {
      if (filtered.length > 0) {
        handleLoadPres(filtered[0]);
      } else {
        handleNewPres();
      }
    }
  };

  // Slides CRUD operations
  const handleAddSlide = () => {
    const newSlide: Slide = {
      id: `slide-${Date.now()}`,
      title: 'Title Slide',
      subtitle: 'Body details go here.',
    };
    const updated = [...slides];
    updated.splice(activeSlideIndex + 1, 0, newSlide);
    setSlides(updated);
    setActiveSlideIndex(activeSlideIndex + 1);
  };

  const handleDeleteSlide = (indexToDelete: number, event?: React.MouseEvent) => {
    if (event) event.stopPropagation();
    if (slides.length <= 1) {
      alert('Your presentation must have at least one slide!');
      return;
    }
    const updated = slides.filter((_, i) => i !== indexToDelete);
    setSlides(updated);
    if (activeSlideIndex >= updated.length) {
      setActiveSlideIndex(updated.length - 1);
    }
  };

  const handleSlideContentChange = (field: 'title' | 'subtitle', value: string) => {
    const updated = slides.map((slide, i) => {
      if (i === activeSlideIndex) {
        return { ...slide, [field]: value };
      }
      return slide;
    });
    setSlides(updated);
  };

  // slide index transitions
  const handlePrevSlide = () => {
    if (activeSlideIndex > 0) {
      setActiveSlideIndex(activeSlideIndex - 1);
    }
  };

  const handleNextSlide = () => {
    if (activeSlideIndex < slides.length - 1) {
      setActiveSlideIndex(activeSlideIndex + 1);
    }
  };

  const currentSlide = slides[activeSlideIndex] || { title: '', subtitle: '' };

  return (
    <div className="flex flex-col h-full bg-[#f3f2f1] text-gray-800 font-sans relative overflow-hidden select-none" id="ppt-app-container">
      {/* PPT Banner Header */}
      <div className="bg-[#b7472a] text-white px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <Presentation className="w-5 h-5 text-white animate-pulse" />
          <input
            type="text"
            value={presTitle}
            onChange={(e) => setPresTitle(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-orange-300 focus:border-white focus:outline-none text-sm font-semibold px-1 py-0.5 rounded transition-all max-w-[200px] sm:max-w-[300px]"
            title="Rename Presentation"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNewPres}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-md transition-all border border-white/10"
            id="ppt-btn-new"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
          <button
            onClick={() => setShowLoadModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-md transition-all border border-white/10"
            id="ppt-btn-open"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-gray-100 text-[#b7472a] rounded-md transition-all shadow-sm"
            id="ppt-btn-save"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={() => setIsPreviewing(true)}
            className="flex items-center gap-1 px-3 py-1 text-xs font-bold bg-green-600 hover:bg-green-700 text-white rounded-md transition-all shadow-sm pl-2"
            id="ppt-btn-present"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Present</span>
          </button>
        </div>
      </div>

      {/* Main PPT Workspace layout: Left Sidebar + Central Slide Panel */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Thumbnail view */}
        <div className="w-48 sm:w-56 border-r border-gray-200 bg-white flex flex-col shrink-0 overflow-y-auto select-none">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between bg-gray-50/50 shrink-0">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Slides</span>
            <button
              onClick={handleAddSlide}
              className="flex items-center gap-0.5 px-2 py-1 text-[10px] font-bold bg-[#b7472a] text-white rounded hover:bg-[#a13b20] transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span>Add</span>
            </button>
          </div>

          <div className="p-2 space-y-2 flex-1">
            {slides.map((slide, index) => (
              <div
                key={slide.id}
                onClick={() => setActiveSlideIndex(index)}
                className={`group p-2.5 rounded-lg border-2 text-left cursor-pointer transition-all relative flex flex-col ${
                  index === activeSlideIndex
                    ? 'border-[#b7472a] bg-orange-50/20'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="absolute top-1.5 left-2 text-[10px] font-bold text-gray-400">
                  {index + 1}
                </div>
                <div className="pt-2 flex-1">
                  <div className="text-xs font-semibold text-gray-800 line-clamp-1 break-all mb-0.5 pr-4">
                    {slide.title || '(No Title)'}
                  </div>
                  <div className="text-[9px] text-gray-400 line-clamp-2 leading-snug break-all">
                    {slide.subtitle || '(No Content)'}
                  </div>
                </div>
                {slides.length > 1 && (
                  <button
                    onClick={(e) => handleDeleteSlide(index, e)}
                    className="absolute top-1 right-1 p-0.5 rounded opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 hover:bg-gray-100 transition-all"
                    title="Delete slide"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Central Workspace Canvas */}
        <div className="flex-1 bg-[#eae9e8] p-4 sm:p-10 flex flex-col items-center justify-center overflow-auto">
          {/* Active slide element */}
          <div className="w-full max-w-3xl aspect-[16/9] bg-white rounded shadow-xl border border-gray-300/60 p-8 sm:p-12 flex flex-col justify-center relative">
            <div className="absolute top-4 left-4 text-xs font-semibold text-gray-400">
              Slide {activeSlideIndex + 1} of {slides.length}
            </div>

            <div className="space-y-4">
              {/* Title input box */}
              <div className="border border-dashed border-gray-300 hover:border-gray-400 focus-within:border-orange-400 p-3 rounded transition-colors text-center">
                <input
                  type="text"
                  value={currentSlide.title}
                  onChange={(e) => handleSlideContentChange('title', e.target.value)}
                  className="w-full bg-transparent text-center font-bold text-xl sm:text-3xl text-gray-800 outline-none placeholder:text-gray-300 focus:placeholder-transparent"
                  placeholder="Click to add title"
                />
              </div>

              {/* Subtitle/Body input box */}
              <div className="border border-dashed border-gray-300 hover:border-gray-400 focus-within:border-orange-400 p-3 rounded transition-colors text-center">
                <textarea
                  value={currentSlide.subtitle}
                  onChange={(e) => handleSlideContentChange('subtitle', e.target.value)}
                  className="w-full bg-transparent text-center text-sm sm:text-base text-gray-500 outline-none placeholder:text-gray-300 focus:placeholder-transparent resize-none h-24 font-normal"
                  placeholder="Click to add subtitle / body text"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom status bar */}
      <div className="bg-[#f3f2f1] border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs font-semibold text-gray-500 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>Microsoft PowerPoint Clone</span>
          <span>•</span>
          <span className="text-orange-600">Saved locally</span>
        </div>
        <div>
          <span>Slide {activeSlideIndex + 1} of {slides.length}</span>
        </div>
      </div>

      {/* Full-screen / Immersive Presentation Slide Show Mode overlay */}
      {isPreviewing && (
        <div className="absolute inset-0 bg-[#111] z-50 flex flex-col items-center justify-center p-6 sm:p-12 animate-in fade-in duration-200">
          {/* Close button top-right */}
          <button
            onClick={() => setIsPreviewing(false)}
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 p-2 rounded-full text-white/80 hover:text-white transition-colors z-55 shadow"
            title="Exit Presentation (Esc)"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Slide container */}
          <div className="w-full max-w-4xl aspect-[16/9] bg-white rounded-lg shadow-2xl p-10 sm:p-20 flex flex-col justify-center relative select-text">
            <div className="absolute bottom-6 right-8 text-xs font-medium text-gray-400">
              Slide {activeSlideIndex + 1} of {slides.length}
            </div>
            <div className="text-center space-y-6">
              <h1 className="text-3xl sm:text-5xl font-extrabold text-gray-800 tracking-tight leading-tight">
                {currentSlide.title}
              </h1>
              <p className="text-base sm:text-xl text-gray-500 max-w-2xl mx-auto leading-relaxed">
                {currentSlide.subtitle}
              </p>
            </div>
          </div>

          {/* On-screen controls overlay bottom */}
          <div className="absolute bottom-6 flex items-center gap-4 bg-black/60 backdrop-blur p-2.5 px-4 rounded-full text-white/80 shadow border border-white/10">
            <button
              onClick={handlePrevSlide}
              disabled={activeSlideIndex === 0}
              className="p-1 rounded-full hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Previous slide (Arrow Left)"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="text-xs font-semibold select-none min-w-[60px] text-center">
              {activeSlideIndex + 1} / {slides.length}
            </span>
            <button
              onClick={handleNextSlide}
              disabled={activeSlideIndex === slides.length - 1}
              className="p-1 rounded-full hover:bg-white/15 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
              title="Next slide (Arrow Right)"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Load Presentation Dialog/Modal */}
      {showLoadModal && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#b7472a] text-white p-4 flex items-center justify-between">
              <span className="font-semibold text-sm">Open Presentation Deck</span>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4 max-h-72 overflow-y-auto">
              {presentations.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No saved presentations found in Local Storage.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {presentations.map((deck) => (
                    <div
                      key={deck.id}
                      onClick={() => handleLoadPres(deck)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-orange-50/50 border border-gray-100 hover:border-orange-200 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-600" />
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{deck.title}</div>
                          <div className="text-[10px] text-gray-400">
                            Slides: {deck.slides.length} • Modified: {new Date(deck.lastModified).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeletePres(deck.id, e)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete presentation"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-3 bg-gray-50 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => setShowLoadModal(false)}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 rounded-md"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
