import React, { useState, useEffect, useRef } from 'react';
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Save,
  Plus,
  Trash2,
  FolderOpen,
  FileText,
  Download,
} from 'lucide-react';

interface SavedDoc {
  id: string;
  title: string;
  content: string;
  lastModified: string;
}

interface WordAppProps {
  initialFileContent?: string;
  initialFileName?: string;
  onFileSaved?: () => void;
}

export const WordApp: React.FC<WordAppProps> = ({
  initialFileContent,
  initialFileName,
  onFileSaved,
}) => {
  const [docs, setDocs] = useState<SavedDoc[]>([]);
  const [currentDocId, setCurrentDocId] = useState<string>('');
  const [docTitle, setDocTitle] = useState('Untitled Document');
  const [wordCount, setWordCount] = useState(0);
  const [charCount, setCharCount] = useState(0);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);

  // Load custom admin/external document if payload is received
  useEffect(() => {
    if (initialFileContent) {
      const newId = `doc-${Date.now()}`;
      const title = initialFileName || 'Admin Message.docx';
      const newDoc: SavedDoc = {
        id: newId,
        title,
        content: initialFileContent,
        lastModified: new Date().toISOString(),
      };

      setDocs((prev) => {
        const filtered = prev.filter((d) => d.title !== title);
        const updated = [newDoc, ...filtered];
        localStorage.setItem('webos_word_docs', JSON.stringify(updated));
        return updated;
      });
      setCurrentDocId(newId);
      setDocTitle(title);
      setTimeout(() => {
        if (editorRef.current) {
          editorRef.current.innerHTML = initialFileContent;
          updateCounts();
        }
      }, 50);

      if (onFileSaved) {
        onFileSaved();
      }
    }
  }, [initialFileContent, initialFileName, onFileSaved]);

  // Load list of documents from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('webos_word_docs');
      if (stored) {
        const parsed = JSON.parse(stored) as SavedDoc[];
        setDocs(parsed);
        if (parsed.length > 0) {
          // Load the last modified or first doc
          const first = parsed[0];
          setCurrentDocId(first.id);
          setDocTitle(first.title);
          setTimeout(() => {
            if (editorRef.current) {
              editorRef.current.innerHTML = first.content;
              updateCounts();
            }
          }, 50);
        }
      } else {
        // Create an initial sample document
        const initialDoc: SavedDoc = {
          id: 'sample-doc',
          title: 'Welcome to Word.docx',
          content: `
            <h1 style="text-align: center; color: #185abd; font-family: sans-serif;">Welcome to Microsoft Word WebOS</h1>
            <p style="text-align: center; color: #555; font-size: 14px;"><em>Your fully-featured rich text processor inside your browser!</em></p>
            <hr />
            <p>This is a complete, interactive document editor mimicking Microsoft Word. You can utilize the toolbar ribbon above to style your document:</p>
            <ul>
              <li><strong>Bold text</strong> to make headings pop out.</li>
              <li><em>Italics</em> for emphasis or quotes.</li>
              <li><u>Underline</u> text for important links or topics.</li>
              <li>Align paragraphs Left, Center, or Right.</li>
              <li>Adjust text size and select custom highlights or text colors.</li>
            </ul>
            <p>All of your documents are stored in <strong>local storage</strong> and automatically synchronized. Feel free to delete, create new, and save custom files.</p>
          `,
          lastModified: new Date().toISOString(),
        };
        setDocs([initialDoc]);
        setCurrentDocId(initialDoc.id);
        setDocTitle(initialDoc.title);
        setTimeout(() => {
          if (editorRef.current) {
            editorRef.current.innerHTML = initialDoc.content;
            updateCounts();
          }
        }, 50);
        localStorage.setItem('webos_word_docs', JSON.stringify([initialDoc]));
      }
    } catch (e) {
      console.error('Failed to load Word documents', e);
    }
  }, []);

  // Update counts
  const updateCounts = () => {
    if (!editorRef.current) return;
    const text = editorRef.current.innerText || '';
    setCharCount(text.length);
    const cleanText = text.trim().replace(/\s+/g, ' ');
    setWordCount(cleanText === '' ? 0 : cleanText.split(' ').length);
  };

  // Run formatting commands
  const executeCommand = (command: string, value: string = '') => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
    }
    updateCounts();
  };

  // Save Current Document
  const handleSave = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;

    let updatedDocs = [...docs];
    const matchIndex = docs.findIndex((d) => d.id === currentDocId);

    const docToSave: SavedDoc = {
      id: currentDocId || `doc-${Date.now()}`,
      title: docTitle.endsWith('.docx') ? docTitle : `${docTitle}.docx`,
      content,
      lastModified: new Date().toISOString(),
    };

    if (matchIndex >= 0) {
      updatedDocs[matchIndex] = docToSave;
    } else {
      updatedDocs.push(docToSave);
      setCurrentDocId(docToSave.id);
    }

    setDocs(updatedDocs);
    localStorage.setItem('webos_word_docs', JSON.stringify(updatedDocs));
    alert(`"${docToSave.title}" has been saved successfully to local storage.`);
  };

  // Create a New Document
  const handleNewDoc = () => {
    const newId = `doc-${Date.now()}`;
    setCurrentDocId(newId);
    setDocTitle('Untitled Document');
    if (editorRef.current) {
      editorRef.current.innerHTML = '<h2>Start writing your masterpiece here...</h2><p></p>';
    }
    updateCounts();
  };

  // Load a document
  const handleLoadDoc = (doc: SavedDoc) => {
    setCurrentDocId(doc.id);
    setDocTitle(doc.title);
    if (editorRef.current) {
      editorRef.current.innerHTML = doc.content;
    }
    updateCounts();
    setShowLoadModal(false);
  };

  // Delete a document
  const handleDeleteDoc = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const filtered = docs.filter((d) => d.id !== id);
    setDocs(filtered);
    localStorage.setItem('webos_word_docs', JSON.stringify(filtered));

    if (currentDocId === id) {
      if (filtered.length > 0) {
        handleLoadDoc(filtered[0]);
      } else {
        handleNewDoc();
      }
    }
  };

  // Export as raw HTML/Text file
  const handleExport = () => {
    if (!editorRef.current) return;
    const content = editorRef.current.innerHTML;
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = docTitle.endsWith('.html') ? docTitle : `${docTitle.split('.')[0] || 'document'}.html`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f2f1] text-gray-800 font-sans select-none" id="word-app-container">
      {/* Word Header Ribbon banner */}
      <div className="bg-[#185abd] text-white px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-white" />
          <input
            type="text"
            value={docTitle}
            onChange={(e) => setDocTitle(e.target.value)}
            className="bg-transparent border-b border-transparent hover:border-blue-300 focus:border-white focus:outline-none text-sm font-semibold px-1 py-0.5 rounded transition-all max-w-[200px] sm:max-w-[300px]"
            title="Rename Document"
          />
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleNewDoc}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-md transition-all border border-white/10"
            id="word-btn-new"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New</span>
          </button>
          <button
            onClick={() => setShowLoadModal(true)}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white/15 hover:bg-white/25 rounded-md transition-all border border-white/10"
            id="word-btn-open"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Open</span>
          </button>
          <button
            onClick={handleSave}
            className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-white hover:bg-gray-100 text-[#185abd] rounded-md transition-all shadow-sm"
            id="word-btn-save"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save</span>
          </button>
          <button
            onClick={handleExport}
            className="flex items-center justify-center p-1.5 bg-white/15 hover:bg-white/25 rounded-md transition-all text-white border border-white/10"
            title="Download HTML Document"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Office Ribbon Editor Toolbar */}
      <div className="bg-white border-b border-gray-200 p-2 flex flex-wrap items-center gap-1.5 shrink-0 select-none">
        {/* Style Commands */}
        <div className="flex items-center border-r border-gray-200 pr-2 mr-0.5 gap-1">
          <button
            onClick={() => executeCommand('bold')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 active:bg-gray-200"
            title="Bold"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand('italic')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 active:bg-gray-200"
            title="Italic"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand('underline')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 active:bg-gray-200"
            title="Underline"
          >
            <Underline className="w-4 h-4" />
          </button>
        </div>

        {/* Alignment */}
        <div className="flex items-center border-r border-gray-200 pr-2 mr-0.5 gap-1">
          <button
            onClick={() => executeCommand('justifyLeft')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 active:bg-gray-200"
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand('justifyCenter')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 active:bg-gray-200"
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand('justifyRight')}
            className="p-1.5 rounded hover:bg-gray-100 text-gray-700 active:bg-gray-200"
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>
        </div>

        {/* Font Size Selector */}
        <div className="flex items-center border-r border-gray-200 pr-2 mr-0.5 gap-2">
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">Size</span>
          <select
            onChange={(e) => executeCommand('fontSize', e.target.value)}
            defaultValue="3"
            className="bg-gray-50 border border-gray-200 text-xs text-gray-700 rounded p-1 outline-none focus:ring-1 focus:ring-[#185abd]"
          >
            <option value="1">Smallest</option>
            <option value="2">Small</option>
            <option value="3">Normal</option>
            <option value="4">Large</option>
            <option value="5">Larger</option>
            <option value="6">Very Large</option>
            <option value="7">Huge</option>
          </select>
        </div>

        {/* Font Color Picker */}
        <div className="flex items-center gap-1.5 pl-1">
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">Color</span>
          <input
            type="color"
            onChange={(e) => executeCommand('foreColor', e.target.value)}
            className="w-6 h-6 border border-gray-200 rounded cursor-pointer p-0.5 bg-transparent"
            title="Font Color"
            defaultValue="#000000"
          />
        </div>
      </div>

      {/* Main Page Area Container */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex justify-center bg-[#f3f2f1]" onClick={() => editorRef.current?.focus()}>
        {/* Mock paper sheet */}
        <div
          ref={editorRef}
          contentEditable
          onInput={updateCounts}
          className="w-full max-w-4xl min-h-[842px] bg-white shadow-lg border border-gray-200 rounded p-10 sm:p-14 outline-none text-gray-900 leading-relaxed font-sans cursor-text text-sm sm:text-base select-text"
          style={{
            minHeight: '800px',
          }}
          id="word-editor-sheet"
        />
      </div>

      {/* Bottom Status Bar */}
      <div className="bg-[#f3f2f1] border-t border-gray-200 px-4 py-1.5 flex items-center justify-between text-xs font-semibold text-gray-500 shrink-0 select-none">
        <div className="flex items-center gap-3">
          <span>Microsoft Word Clone</span>
          <span>•</span>
          <span className="text-blue-600">Connected to Cloud (Offline Cache)</span>
        </div>
        <div className="flex items-center gap-3">
          <span>Words: <strong className="text-gray-700">{wordCount}</strong></span>
          <span>Characters: <strong className="text-gray-700">{charCount}</strong></span>
        </div>
      </div>

      {/* Open/Load Document Dialog/Modal */}
      {showLoadModal && (
        <div className="absolute inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="bg-[#185abd] text-white p-4 flex items-center justify-between">
              <span className="font-semibold text-sm">Open Saved Document</span>
              <button
                onClick={() => setShowLoadModal(false)}
                className="text-white/80 hover:text-white font-bold text-lg leading-none"
              >
                &times;
              </button>
            </div>
            <div className="p-4 max-h-72 overflow-y-auto">
              {docs.length === 0 ? (
                <div className="text-center py-6 text-gray-400 text-sm">
                  No saved documents found in Local Storage.
                </div>
              ) : (
                <div className="space-y-1.5">
                  {docs.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => handleLoadDoc(doc)}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-blue-50/50 border border-gray-100 hover:border-blue-200 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <div>
                          <div className="text-sm font-semibold text-gray-800">{doc.title}</div>
                          <div className="text-[10px] text-gray-400">
                            Modified: {new Date(doc.lastModified).toLocaleDateString()} {new Date(doc.lastModified).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={(e) => handleDeleteDoc(doc.id, e)}
                        className="p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete document"
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
