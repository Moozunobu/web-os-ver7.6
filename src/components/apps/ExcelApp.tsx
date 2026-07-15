import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, ChevronRight, Check } from 'lucide-react';

export const ExcelApp: React.FC = () => {
  const COLS = ['A', 'B', 'C', 'D', 'E', 'F'];
  const ROWS = Array.from({ length: 12 }, (_, i) => i + 1);

  // Grid Data: coordinate ("A1", "C4") -> raw input string ("=SUM(A1:A3)" or "100")
  const [gridData, setGridData] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem('webos_excel_data');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error(e);
    }
    // Default sheet contents
    return {
      A1: 'Monthly Budget',
      A3: 'Rent', B3: '1200',
      A4: 'Groceries', B4: '350',
      A5: 'Internet', B5: '60',
      A6: 'Power/Water', B6: '140',
      A7: 'Entertainment', B7: '150',
      A9: 'Total Cost', B9: '=SUM(B3:B7)',
      C9: 'Average Cost', D9: '=AVG(B3:B7)',
    };
  });

  const [activeCell, setActiveCell] = useState<string>('A1');
  const [editingValue, setEditingValue] = useState<string>('Monthly Budget');
  const [isEditing, setIsEditing] = useState<boolean>(false);

  // Save sheet data to localStorage on changes
  useEffect(() => {
    localStorage.setItem('webos_excel_data', JSON.stringify(gridData));
  }, [gridData]);

  // Handle cell click
  const handleCellClick = (cellId: string) => {
    setActiveCell(cellId);
    setEditingValue(gridData[cellId] || '');
    setIsEditing(false);
  };

  const handleCellDblClick = (cellId: string) => {
    setActiveCell(cellId);
    setEditingValue(gridData[cellId] || '');
    setIsEditing(true);
  };

  // Submit edits
  const handleSaveCell = (cellId: string, val: string) => {
    setGridData((prev) => ({
      ...prev,
      [cellId]: val,
    }));
    setIsEditing(false);
  };

  // Safe formula parser / evaluator
  const evaluateCell = (cellId: string, visited: Set<string> = new Set()): string => {
    const rawVal = gridData[cellId];
    if (!rawVal) return '';

    // If no formula, return string
    if (!rawVal.startsWith('=')) {
      return rawVal;
    }

    // Circular dependency check
    if (visited.has(cellId)) {
      return '#CIRCULAR!';
    }
    visited.add(cellId);

    const expr = rawVal.substring(1).toUpperCase().trim();

    try {
      // 1. SUM Range formula: SUM(A1:A5)
      if (expr.startsWith('SUM(') && expr.endsWith(')')) {
        const rangeStr = expr.substring(4, expr.length - 1);
        const cells = parseRange(rangeStr);
        let sum = 0;
        cells.forEach((c) => {
          const val = parseFloat(evaluateCell(c, new Set(visited)));
          if (!isNaN(val)) sum += val;
        });
        return sum.toString();
      }

      // 2. AVG Range formula: AVG(A1:A5)
      if (expr.startsWith('AVG(') && expr.endsWith(')')) {
        const rangeStr = expr.substring(4, expr.length - 1);
        const cells = parseRange(rangeStr);
        let sum = 0;
        let count = 0;
        cells.forEach((c) => {
          const val = parseFloat(evaluateCell(c, new Set(visited)));
          if (!isNaN(val)) {
            sum += val;
            count++;
          }
        });
        return count > 0 ? (sum / count).toFixed(1) : '0';
      }

      // 3. Simple addition / math: A1+A2 or A1-A2
      const mathPattern = /^([A-F][1-9]|1[0-2])\s*([+\-*/])\s*([A-F][1-9]|1[0-2])$/;
      const match = expr.match(mathPattern);
      if (match) {
        const cell1 = match[1];
        const op = match[2];
        const cell2 = match[3];

        const val1 = parseFloat(evaluateCell(cell1, new Set(visited)));
        const val2 = parseFloat(evaluateCell(cell2, new Set(visited)));

        if (isNaN(val1) || isNaN(val2)) return '#VALUE!';

        switch (op) {
          case '+': return (val1 + val2).toString();
          case '-': return (val1 - val2).toString();
          case '*': return (val1 * val2).toString();
          case '/': return val2 !== 0 ? (val1 / val2).toString() : '#DIV/0!';
          default: return '#ERROR!';
        }
      }

      return '#ERROR!';
    } catch {
      return '#ERROR!';
    }
  };

  // Helper to expand range "A1:A5" into ["A1", "A2", "A3", "A4", "A5"]
  const parseRange = (rangeStr: string): string[] => {
    const parts = rangeStr.split(':');
    if (parts.length !== 2) return [];

    const start = parts[0].trim();
    const end = parts[1].trim();

    const startCol = start[0];
    const startRow = parseInt(start.substring(1));
    const endCol = end[0];
    const endRow = parseInt(end.substring(1));

    const colIndex1 = COLS.indexOf(startCol);
    const colIndex2 = COLS.indexOf(endCol);

    if (colIndex1 === -1 || colIndex2 === -1 || isNaN(startRow) || isNaN(endRow)) {
      return [];
    }

    const colMin = Math.min(colIndex1, colIndex2);
    const colMax = Math.max(colIndex1, colIndex2);
    const rowMin = Math.min(startRow, endRow);
    const rowMax = Math.max(startRow, endRow);

    const cells: string[] = [];
    for (let c = colMin; c <= colMax; c++) {
      for (let r = rowMin; r <= rowMax; r++) {
        cells.push(`${COLS[c]}${r}`);
      }
    }
    return cells;
  };

  const handleClearSheet = () => {
    if (confirm('Clear spreadsheet cells?')) {
      setGridData({});
      setActiveCell('A1');
      setEditingValue('');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white text-gray-800 font-sans" id="excel-app">
      {/* Top Banner Menu */}
      <div className="bg-[#107c41] text-white p-2.5 flex items-center justify-between select-none">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-green-100" />
          <span className="font-semibold text-sm">Microsoft Excel Online Mockup</span>
        </div>
        <button
          onClick={handleClearSheet}
          className="text-xs bg-[#0b592e] hover:bg-green-800 px-3 py-1.5 rounded transition-colors font-medium border border-[#1b6339]"
          id="excel-btn-clear"
        >
          Reset Grid
        </button>
      </div>

      {/* Formula Bar */}
      <div className="bg-[#f3f2f1] border-b border-gray-200 px-3 py-2 flex items-center select-none text-xs text-gray-600 gap-2 font-medium">
        <div className="bg-white border border-gray-300 font-bold px-2 py-1 rounded w-12 text-center text-[#107c41] font-mono">
          {activeCell}
        </div>
        <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
        <span className="font-mono text-gray-500 font-bold italic mr-1">fx</span>
        {/* Cell editing input */}
        <input
          type="text"
          value={editingValue}
          onChange={(e) => setEditingValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSaveCell(activeCell, editingValue);
            }
          }}
          placeholder="Enter values or simple formulas like =SUM(B3:B7) or =B3+B4"
          className="flex-1 bg-white border border-gray-300 rounded px-2 py-1 outline-none text-gray-700 font-mono text-xs focus:ring-1 focus:ring-[#107c41]"
          id="excel-formula-input"
        />
        <button
          onClick={() => handleSaveCell(activeCell, editingValue)}
          className="p-1 hover:bg-gray-200 rounded text-[#107c41]"
          title="Apply Value"
          id="excel-btn-save-cell"
        >
          <Check className="w-4 h-4" />
        </button>
      </div>

      {/* Grid Canvas Table */}
      <div className="flex-1 overflow-auto bg-[#f3f2f1] p-1 select-none">
        <table className="border-collapse bg-white shadow-xs border border-gray-300 text-xs w-full min-w-[500px]">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 w-10 text-center text-gray-500 font-bold bg-gray-50 font-mono py-1"></th>
              {COLS.map((col) => (
                <th
                  key={col}
                  className="border border-gray-300 font-semibold text-gray-600 bg-gray-50 py-1 px-4 text-center font-mono"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row}>
                {/* Row Header column */}
                <td className="border border-gray-300 text-center font-bold text-gray-500 bg-gray-100 w-10 select-none font-mono py-1.5">
                  {row}
                </td>
                {COLS.map((col) => {
                  const cellId = `${col}${row}`;
                  const isCellSelected = activeCell === cellId;
                  const rawVal = gridData[cellId] || '';
                  const evaluated = evaluateCell(cellId);
                  const isFormula = rawVal.startsWith('=');

                  return (
                    <td
                      key={col}
                      onClick={() => handleCellClick(cellId)}
                      onDoubleClick={() => handleCellDblClick(cellId)}
                      className={`border border-gray-200 relative min-w-[80px] h-8 truncate ${
                        isCellSelected
                          ? 'outline outline-2 outline-[#107c41] outline-offset-[-2px] bg-green-50/20'
                          : 'hover:bg-gray-50'
                      }`}
                    >
                      {isEditing && isCellSelected ? (
                        <input
                          type="text"
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.target.value)}
                          onBlur={() => handleSaveCell(cellId, editingValue)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleSaveCell(cellId, editingValue);
                            } else if (e.key === 'Escape') {
                              setIsEditing(false);
                            }
                          }}
                          className="absolute inset-0 w-full h-full bg-white outline-none border-none px-2 font-mono"
                          autoFocus
                          id={`excel-cell-input-${cellId}`}
                        />
                      ) : (
                        <div
                          className={`w-full h-full px-2.5 flex items-center overflow-hidden font-mono truncate cursor-cell ${
                            !isNaN(parseFloat(evaluated)) && !isFormula
                              ? 'justify-end text-blue-800 font-medium'
                              : isFormula && evaluated.startsWith('#')
                              ? 'text-red-500 font-bold'
                              : 'text-gray-700'
                          }`}
                        >
                          {evaluated}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Grid Footer details status */}
      <div className="bg-[#f3f2f1] border-t border-gray-200 p-1.5 px-3 flex justify-between select-none text-[10px] text-gray-400 font-mono">
        <span>Coordinate index range: A1:F12</span>
        <span className="text-gray-500">Double click cells to edit in-place</span>
      </div>
    </div>
  );
};
