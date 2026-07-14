import React, { useState } from 'react';
import { Delete } from 'lucide-react';

export const CalculatorApp: React.FC = () => {
  const [display, setDisplay] = useState('0');
  const [equation, setEquation] = useState('');
  const [resetOnNextInput, setResetOnNextInput] = useState(false);

  const handleDigit = (digit: string) => {
    if (display === '0' || resetOnNextInput) {
      setDisplay(digit);
      setResetOnNextInput(false);
    } else {
      setDisplay(display + digit);
    }
  };

  const handleDecimal = () => {
    if (resetOnNextInput) {
      setDisplay('0.');
      setResetOnNextInput(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay(display + '.');
    }
  };

  const handleOperator = (op: string) => {
    setEquation(display + ' ' + op + ' ');
    setResetOnNextInput(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setEquation('');
    setResetOnNextInput(false);
  };

  const handleBackspace = () => {
    if (display.length > 1) {
      setDisplay(display.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handlePercent = () => {
    try {
      const val = parseFloat(display);
      setDisplay((val / 100).toString());
    } catch {
      setDisplay('Error');
    }
  };

  const handleNegate = () => {
    if (display !== '0') {
      if (display.startsWith('-')) {
        setDisplay(display.slice(1));
      } else {
        setDisplay('-' + display);
      }
    }
  };

  const handleEqual = () => {
    if (!equation) return;
    
    const fullEquation = equation + display;
    try {
      // Evaluate basic arithmetic expression safely without eval
      const tokens = fullEquation.split(' ');
      if (tokens.length < 3) return;

      const num1 = parseFloat(tokens[0]);
      const op = tokens[1];
      const num2 = parseFloat(tokens[2]);

      let result = 0;
      switch (op) {
        case '+':
          result = num1 + num2;
          break;
        case '-':
          result = num1 - num2;
          break;
        case '×':
          result = num1 * num2;
          break;
        case '÷':
          if (num2 === 0) {
            setDisplay('Cannot divide by 0');
            setEquation('');
            setResetOnNextInput(true);
            return;
          }
          result = num1 / num2;
          break;
        default:
          return;
      }

      // Format result to avoid rounding float errors
      const formattedResult = Number(result.toFixed(8)).toString();
      setDisplay(formattedResult);
      setEquation('');
      setResetOnNextInput(true);
    } catch (e) {
      setDisplay('Error');
      setEquation('');
      setResetOnNextInput(true);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#f3f3f3] text-gray-800 font-sans p-4 justify-between" id="calculator-app">
      {/* Display Screen */}
      <div className="text-right flex flex-col justify-end flex-1 mb-4 px-2 select-all">
        <div className="text-sm text-gray-500 h-6 truncate font-medium font-mono">
          {equation}
        </div>
        <div className="text-3xl font-semibold tracking-tight truncate font-mono text-gray-900">
          {display}
        </div>
      </div>

      {/* Button Grid */}
      <div className="grid grid-cols-4 gap-1.5 select-none">
        {/* Row 1 */}
        <button
          onClick={handleClear}
          className="h-12 text-sm font-medium bg-[#f9f9f9] hover:bg-gray-200 border border-gray-200 rounded transition-colors text-red-500"
          id="calc-btn-c"
        >
          C
        </button>
        <button
          onClick={handleNegate}
          className="h-12 text-sm font-medium bg-[#f9f9f9] hover:bg-gray-200 border border-gray-200 rounded transition-colors"
          id="calc-btn-neg"
        >
          +/-
        </button>
        <button
          onClick={handlePercent}
          className="h-12 text-sm font-medium bg-[#f9f9f9] hover:bg-gray-200 border border-gray-200 rounded transition-colors"
          id="calc-btn-pct"
        >
          %
        </button>
        <button
          onClick={handleBackspace}
          className="h-12 flex items-center justify-center bg-[#f9f9f9] hover:bg-gray-200 border border-gray-200 rounded transition-colors text-gray-600"
          id="calc-btn-back"
        >
          <Delete className="w-4 h-4" />
        </button>

        {/* Row 2 */}
        <button
          onClick={() => handleDigit('7')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-7"
        >
          7
        </button>
        <button
          onClick={() => handleDigit('8')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-8"
        >
          8
        </button>
        <button
          onClick={() => handleDigit('9')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-9"
        >
          9
        </button>
        <button
          onClick={() => handleOperator('÷')}
          className="h-12 text-lg font-medium bg-[#eef1f6] hover:bg-gray-200 border border-gray-200 rounded transition-colors text-blue-600"
          id="calc-btn-div"
        >
          ÷
        </button>

        {/* Row 3 */}
        <button
          onClick={() => handleDigit('4')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-4"
        >
          4
        </button>
        <button
          onClick={() => handleDigit('5')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-5"
        >
          5
        </button>
        <button
          onClick={() => handleDigit('6')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-6"
        >
          6
        </button>
        <button
          onClick={() => handleOperator('×')}
          className="h-12 text-lg font-medium bg-[#eef1f6] hover:bg-gray-200 border border-gray-200 rounded transition-colors text-blue-600"
          id="calc-btn-mul"
        >
          ×
        </button>

        {/* Row 4 */}
        <button
          onClick={() => handleDigit('1')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-1"
        >
          1
        </button>
        <button
          onClick={() => handleDigit('2')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-2"
        >
          2
        </button>
        <button
          onClick={() => handleDigit('3')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-3"
        >
          3
        </button>
        <button
          onClick={() => handleOperator('-')}
          className="h-12 text-lg font-medium bg-[#eef1f6] hover:bg-gray-200 border border-gray-200 rounded transition-colors text-blue-600"
          id="calc-btn-sub"
        >
          -
        </button>

        {/* Row 5 */}
        <button
          onClick={() => handleDigit('0')}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-0"
        >
          0
        </button>
        <button
          onClick={handleDecimal}
          className="h-12 text-base font-semibold bg-white hover:bg-gray-100 border border-gray-200 rounded transition-colors"
          id="calc-btn-dec"
        >
          .
        </button>
        <button
          onClick={() => handleOperator('+')}
          className="h-12 text-lg font-medium bg-[#eef1f6] hover:bg-gray-200 border border-gray-200 rounded transition-colors text-blue-600"
          id="calc-btn-add"
        >
          +
        </button>
        <button
          onClick={handleEqual}
          className="h-12 text-lg font-bold bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors shadow-sm"
          id="calc-btn-eq"
        >
          =
        </button>
      </div>
    </div>
  );
};
