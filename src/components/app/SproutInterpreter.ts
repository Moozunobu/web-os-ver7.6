// Sprout Programming Language Interpreter
// Fully implements the Sprout specification from the specification PDF

export interface ParsedLine {
  originalText: string;
  lineNumber: number;
  indent: number;
  type: 
    | 'comment'
    | 'make'
    | 'assign'
    | 'list_assign'
    | 'list_add'
    | 'display'
    | 'input'
    | 'import'
    | 'import_use'
    | 'output'
    | 'if'
    | 'else_if'
    | 'else'
    | 'for'
    | 'while'
    | 'break'
    | 'function'
    | 'return'
    | 'statement_expr'; // for raw function calls like display(Add(3,2))
  
  // Parsed subcomponents
  varName?: string;
  varType?: string;
  valueExpr?: string;
  indexExpr?: string;
  conditionExpr?: string;
  loopStartExpr?: string;
  loopEndExpr?: string;
  loopStepExpr?: string;
  loopVar?: string;
  funcName?: string;
  funcArgs?: string[];
  funcHasReturn?: boolean;

  // Compile-time jump targets
  jumpTarget?: number;
}

export class SproutInterpreter {
  public variables: Map<string, { type: string; value: any }> = new Map();
  private functions: Map<string, { args: string[]; hasReturn: boolean; bodyLines: ParsedLine[]; startPC: number; endPC: number }> = new Map();
  private anonymousLoopCounters: { [key: number]: { start: number; end: number; step: number; current: number } } = {};
  private listIndexBase: number = 1; // default is 1-based index (unless Zone/Zero imported)
  private isRunning: boolean = false;
  private currentLines: ParsedLine[] = [];
  private pc: number = 0;
  private callStack: { pc: number; scope: Map<string, any>; currentLines: ParsedLine[] }[] = [];
  
  // Module support
  public importedModules: Map<string, string> = new Map();
  public moduleReturnValue: any = 0;
  private onReadFile?: (filename: string) => string | undefined;
  
  // Callbacks
  private onOutput: (text: string) => void;
  private onInputPrompt: (promptText: string) => Promise<string>;
  private onComplete: () => void;
  private onError: (error: string, lineNumber: number) => void;

  constructor(options: {
    onOutput: (text: string) => void;
    onInputPrompt: (promptText: string) => Promise<string>;
    onComplete: () => void;
    onError: (error: string, lineNumber: number) => void;
    onReadFile?: (filename: string) => string | undefined;
  }) {
    this.onOutput = options.onOutput;
    this.onInputPrompt = options.onInputPrompt;
    this.onComplete = options.onComplete;
    this.onError = options.onError;
    this.onReadFile = options.onReadFile;
  }

  public stop() {
    this.isRunning = false;
  }

  // Pre-process and parse the Sprout source code
  public parse(code: string): ParsedLine[] {
    const lines = code.split('\n');
    const result: ParsedLine[] = [];

    lines.forEach((rawLine, idx) => {
      const lineNumber = idx + 1;
      
      // Calculate indentation (number of leading spaces)
      const indentMatch = rawLine.match(/^(\s*)/);
      const indent = indentMatch ? indentMatch[1].length : 0;

      // Extract raw statement and remove comments
      // Be careful of comments inside quotes
      let cleanLine = rawLine.trim();
      if (!cleanLine) {
        return; // skip completely empty lines
      }

      // Check if comment
      if (cleanLine.startsWith('#')) {
        result.push({ originalText: rawLine, lineNumber, indent, type: 'comment' });
        return;
      }

      // Remove trailing comments if any
      // Simple splitter: if there is a '#' not in a string
      let statement = '';
      let inQuotes = false;
      let quoteChar = '';
      for (let i = 0; i < cleanLine.length; i++) {
        const char = cleanLine[i];
        if (inQuotes) {
          statement += char;
          if (char === quoteChar) {
            inQuotes = false;
          }
        } else if (char === '"' || char === "'") {
          inQuotes = true;
          quoteChar = char;
          statement += char;
        } else if (char === '#') {
          // Comment starts here
          break;
        } else {
          statement += char;
        }
      }
      statement = statement.trim();

      if (!statement) {
        result.push({ originalText: rawLine, lineNumber, indent, type: 'comment' });
        return;
      }

      // 1. Import module list Zero / default
      if (statement.startsWith('import module list')) {
        const type = statement.includes('Zero') ? 'Zero' : 'default';
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'import',
          valueExpr: type
        });
        return;
      }

      // 1b. Import module use (e.g. import module use math.sp)
      if (statement.startsWith('import module use')) {
        let filename = statement.replace('import module use', '').trim();
        if (filename.endsWith('.')) {
          filename = filename.slice(0, -1).trim();
        }
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'import_use',
          valueExpr: filename
        });
        return;
      }

      // 1c. Import make module (e.g. import make module.)
      if (statement === 'import make module.' || statement === 'import make module') {
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'import',
          valueExpr: 'make_module'
        });
        return;
      }

      // 2. Make list (make list food [a, b, c].) or empty (make list food.)
      const makeListMatch = statement.match(/^make\s+list\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s+(.*))?$/);
      if (makeListMatch) {
        let valExpr = makeListMatch[2] ? makeListMatch[2].trim() : '';
        if (valExpr.endsWith('.')) {
          valExpr = valExpr.slice(0, -1).trim();
        }
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'make',
          varType: 'list',
          varName: makeListMatch[1],
          valueExpr: valExpr
        });
        return;
      }

      // 3. Make variable (make int/string/bool/flort age : 24. or make int count.)
      const makeVarMatch = statement.match(/^make\s+(int|string|bool|flort)\s+([a-zA-Z_][a-zA-Z0-9_]*)(?:\s*:\s*(.*))?$/);
      if (makeVarMatch) {
        let valExpr = makeVarMatch[3] ? makeVarMatch[3].trim() : '';
        if (valExpr.endsWith('.')) {
          valExpr = valExpr.slice(0, -1).trim();
        }
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'make',
          varType: makeVarMatch[1],
          varName: makeVarMatch[2],
          valueExpr: valExpr
        });
        return;
      }

      // 4. List add element (food add kakin.)
      const listAddMatch = statement.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s+add\s+(.*)$/);
      if (listAddMatch) {
        let valExpr = listAddMatch[2].trim();
        if (valExpr.endsWith('.')) {
          valExpr = valExpr.slice(0, -1).trim();
        }
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'list_add',
          varName: listAddMatch[1],
          valueExpr: valExpr
        });
        return;
      }

      // 5. List index assignment (food : 1 = kakin or food.[1] = kakin)
      if (statement.includes('=')) {
        const parts = this.splitAtDepth0(statement, '=');
        if (parts.length === 2) {
          const left = parts[0].trim();
          const right = parts[1].trim();
          
          if (left.includes(':')) {
            const listParts = this.splitAtDepth0(left, ':');
            if (listParts.length === 2) {
              result.push({
                originalText: rawLine,
                lineNumber,
                indent,
                type: 'list_assign',
                varName: listParts[0].trim(),
                indexExpr: listParts[1].trim(),
                valueExpr: right
              });
              return;
            }
          } else if (left.endsWith(']')) {
            // Check for .[ index syntax
            let bracketDepth = 0;
            let targetStart = -1;
            for (let i = left.length - 1; i >= 0; i--) {
              const char = left[i];
              if (char === ']') {
                bracketDepth++;
              } else if (char === '[') {
                bracketDepth--;
                if (bracketDepth === 0) {
                  if (i > 0 && left[i - 1] === '.') {
                    targetStart = i - 1;
                    break;
                  }
                }
              }
            }
            if (targetStart !== -1) {
              result.push({
                originalText: rawLine,
                lineNumber,
                indent,
                type: 'list_assign',
                varName: left.substring(0, targetStart).trim(),
                indexExpr: left.substring(targetStart + 2, left.length - 1).trim(),
                valueExpr: right
              });
              return;
            }
          }
        }
      }

      // 5b. Input statement (e.g. input : prompt, var. or input: prompt, var)
      const inputMatch = statement.match(/^input\s*:\s*(.*)$/);
      if (inputMatch) {
        let content = inputMatch[1].trim();
        if (content.endsWith('.')) {
          content = content.slice(0, -1).trim();
        }
        const parts = this.splitAtDepth0(content, ',');
        if (parts.length === 2) {
          result.push({
            originalText: rawLine,
            lineNumber,
            indent,
            type: 'input',
            valueExpr: parts[0].trim(), // prompt text
            varName: parts[1].trim() // target variable
          });
          return;
        } else if (parts.length === 1) {
          result.push({
            originalText: rawLine,
            lineNumber,
            indent,
            type: 'input',
            valueExpr: 'None', // no prompt
            varName: parts[0].trim() // target variable
          });
          return;
        }
      }

      // 5c. Output statement (e.g. output : expression. or output: expression)
      const outputMatch = statement.match(/^output\s*:\s*(.*)$/);
      if (outputMatch) {
        let content = outputMatch[1].trim();
        if (content.endsWith('.')) {
          content = content.slice(0, -1).trim();
        }
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'output',
          valueExpr: content
        });
        return;
      }

      // 6. Variable assignment (age : 25)
      // Make sure it doesn't match for loops or ifs which end with :
      if (statement.includes(':') && !statement.endsWith(':')) {
        const parts = this.splitAtDepth0(statement, ':');
        if (parts.length === 2) {
          let valExpr = parts[1].trim();
          if (valExpr.endsWith('.')) {
            valExpr = valExpr.slice(0, -1).trim();
          }
          result.push({
            originalText: rawLine,
            lineNumber,
            indent,
            type: 'assign',
            varName: parts[0].trim(),
            valueExpr: valExpr
          });
          return;
        }
      }

      // 6b. Variable assignment with = (e.g. count = count + 1)
      const assignEqMatch = statement.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(.*)$/);
      if (assignEqMatch) {
        let valExpr = assignEqMatch[2].trim();
        if (valExpr.endsWith('.')) {
          valExpr = valExpr.slice(0, -1).trim();
        }
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'assign',
          varName: assignEqMatch[1],
          valueExpr: valExpr
        });
        return;
      }

      // 7. Display statement (display(a, b))
      if (statement.startsWith('display(') && statement.endsWith(')')) {
        const argStr = statement.slice(8, -1).trim();
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'display',
          valueExpr: argStr
        });
        return;
      }

      // 9. If / Else If / Else
      if (statement.startsWith('if ') && statement.endsWith(':')) {
        const cond = statement.slice(3, -1).trim();
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'if',
          conditionExpr: cond
        });
        return;
      }

      if (statement.startsWith('else if ') && statement.endsWith(':')) {
        const cond = statement.slice(8, -1).trim();
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'else_if',
          conditionExpr: cond
        });
        return;
      }

      if (statement === 'else:' || statement === 'else :') {
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'else'
        });
        return;
      }

      // 10. For loop:
      // Loop with variable: for [start] to [end] step [increment] of [loopVar] :
      // Loop count: for [start] to [end] step [increment] :
      if (statement.startsWith('for ') && statement.endsWith(':')) {
        const forContent = statement.slice(4, -1).trim(); // strip 'for ' and trailing ':'
        
        // Check if there is "of "
        const ofParts = this.splitAtDepth0(forContent, ' of ');
        let loopVar: string | undefined;
        let mainFor = forContent;
        if (ofParts.length === 2) {
          mainFor = ofParts[0].trim();
          loopVar = ofParts[1].trim();
        }

        const toParts = this.splitAtDepth0(mainFor, ' to ');
        if (toParts.length === 2) {
          const startExpr = toParts[0].trim();
          const rightPart = toParts[1].trim();
          const stepParts = this.splitAtDepth0(rightPart, ' step ');
          
          if (stepParts.length === 2) {
            result.push({
              originalText: rawLine,
              lineNumber,
              indent,
              type: 'for',
              loopStartExpr: startExpr,
              loopEndExpr: stepParts[0].trim(),
              loopStepExpr: stepParts[1].trim(),
              loopVar
            });
            return;
          }
        }
      }

      // 11. While loop: while [condition] :
      if (statement.startsWith('while ') && statement.endsWith(':')) {
        const cond = statement.slice(6, -1).trim();
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'while',
          conditionExpr: cond
        });
        return;
      }

      // 12. Break: break. or break
      if (statement === 'break' || statement === 'break.') {
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'break'
        });
        return;
      }

      // 13. Functions: function [関数名]([引数], [引数]), [true/false]:
      if (statement.startsWith('function ') && statement.endsWith(':')) {
        const sig = statement.slice(9, -1).trim(); // strip 'function ' and ':'
        const commaParts = this.splitAtDepth0(sig, ',');
        
        if (commaParts.length >= 1) {
          const hasReturnStr = commaParts[commaParts.length - 1].trim();
          const hasReturn = hasReturnStr === 'true';
          
          // Re-assemble function name and arguments signature (e.g. Add(num1, num2))
          const fnSig = sig.substring(0, sig.lastIndexOf(',')).trim();
          const parenOpen = fnSig.indexOf('(');
          const parenClose = fnSig.lastIndexOf(')');
          
          if (parenOpen !== -1 && parenClose !== -1) {
            const funcName = fnSig.substring(0, parenOpen).trim();
            const argsStr = fnSig.substring(parenOpen + 1, parenClose).trim();
            const funcArgs = argsStr ? argsStr.split(',').map(s => s.trim()) : [];
            
            result.push({
              originalText: rawLine,
              lineNumber,
              indent,
              type: 'function',
              funcName,
              funcArgs,
              funcHasReturn: hasReturn
            });
            return;
          }
        }
      }

      // 14. Return: return [expr]
      if (statement.startsWith('return ') || statement === 'return' || statement.startsWith('return.')) {
        let expr = statement.slice(6).trim();
        if (expr.endsWith('.')) {
          expr = expr.slice(0, -1).trim();
        }
        result.push({
          originalText: rawLine,
          lineNumber,
          indent,
          type: 'return',
          valueExpr: expr
        });
        return;
      }

      // 15. Fallback expression/raw function call
      result.push({
        originalText: rawLine,
        lineNumber,
        indent,
        type: 'statement_expr',
        valueExpr: statement
      });
    });

    return result;
  }

  // Pre-computes loop/conditional jumps using standard stack-based block compiler
  private compile(lines: ParsedLine[]): ParsedLine[] {
    const executable = lines.filter(l => l.type !== 'comment');
    
    // Find block end boundaries and bind jump targets
    for (let i = 0; i < executable.length; i++) {
      const line = executable[i];
      
      if (line.type === 'if' || line.type === 'else_if' || line.type === 'else' || line.type === 'for' || line.type === 'while' || line.type === 'function') {
        // Find block end: the first subsequent line with <= indentation
        let blockEndIndex = executable.length;
        for (let j = i + 1; j < executable.length; j++) {
          if (executable[j].indent <= line.indent) {
            blockEndIndex = j;
            break;
          }
        }
        
        line.jumpTarget = blockEndIndex; // if falsy/skip, jump here
      }
    }

    // Connect If-Else chains
    for (let i = 0; i < executable.length; i++) {
      const line = executable[i];
      if (line.type === 'if') {
        // We want to find the whole contiguous chain of else_if and else blocks
        const chain: number[] = [i];
        let currentEnd = line.jumpTarget || executable.length;
        
        while (currentEnd < executable.length) {
          const nextLine = executable[currentEnd];
          if (nextLine && (nextLine.type === 'else_if' || nextLine.type === 'else') && nextLine.indent === line.indent) {
            chain.push(currentEnd);
            currentEnd = nextLine.jumpTarget || executable.length;
          } else {
            break;
          }
        }

        const chainEnd = currentEnd; // after the whole if-else-if-else structure
        
        // Set individual branch jump targets:
        // - if condition is false, jump to the next branch in the chain
        // - if condition is true, execute body and then jump to the end of the entire chain
        for (let idx = 0; idx < chain.length; idx++) {
          const chainLineIndex = chain[idx];
          const chainLine = executable[chainLineIndex];
          
          // Set falsy jump target:
          if (idx + 1 < chain.length) {
            chainLine.jumpTarget = chain[idx + 1]; // next branch
          } else {
            chainLine.jumpTarget = chainEnd; // after the chain
          }

          // We'll handle the success branch jump-to-end dynamically in the executor
          // or we can attach a property
          (chainLine as any).chainEndTarget = chainEnd;
        }
      }
    }

    // Connect Breaks inside loops to their outer loop's end
    for (let i = 0; i < executable.length; i++) {
      const line = executable[i];
      if (line.type === 'break') {
        // Find nearest enclosing loop (for/while) by comparing indentation
        let loopEnd = executable.length;
        for (let j = i - 1; j >= 0; j--) {
          const prev = executable[j];
          if ((prev.type === 'for' || prev.type === 'while') && line.indent > prev.indent) {
            loopEnd = prev.jumpTarget || executable.length;
            break;
          }
        }
        line.jumpTarget = loopEnd;
      }
    }

    // Register all function definitions
    this.functions.clear();
    for (let i = 0; i < executable.length; i++) {
      const line = executable[i];
      if (line.type === 'function' && line.funcName) {
        const bodyLines: ParsedLine[] = [];
        const bodyEnd = line.jumpTarget || executable.length;
        for (let j = i + 1; j < bodyEnd; j++) {
          bodyLines.push(executable[j]);
        }
        this.functions.set(line.funcName, {
          args: line.funcArgs || [],
          hasReturn: !!line.funcHasReturn,
          bodyLines,
          startPC: i + 1,
          endPC: bodyEnd
        });
      }
    }

    return executable;
  }

  // Launches asynchronous program execution
  public async execute(code: string) {
    this.variables.clear();
    this.listIndexBase = 1; // Default
    this.isRunning = true;
    this.pc = 0;
    this.moduleReturnValue = 0;
    this.anonymousLoopCounters = {};
    
    const parsed = this.parse(code);
    this.currentLines = this.compile(parsed);

    this.callStack = [];

    try {
      while (this.pc < this.currentLines.length && this.isRunning) {
        // Coherence timeout check to keep main browser thread completely free
        if (this.pc % 20 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }

        const line = this.currentLines[this.pc];
        const backupPc = this.pc;

        await this.executeInstruction(line);

        if (this.pc === backupPc) {
          this.pc++;
        }

        // Loop end jump-back logic
        if (this.pc > 0) {
          const prevLine = this.currentLines[this.pc - 1];
          if (prevLine && (prevLine.type === 'if' || prevLine.type === 'else_if' || prevLine.type === 'else')) {
            const endTarget = (prevLine as any).chainEndTarget;
            if (endTarget && this.pc < endTarget) {
              this.pc = endTarget; // bypass remaining branches in if chain
            }
          }
        }

        // End of loop body redirects back to header for re-evaluation
        if (line && line.type !== 'break') {
          for (let i = 0; i < this.currentLines.length; i++) {
            const loopHeader = this.currentLines[i];
            if ((loopHeader.type === 'while' || loopHeader.type === 'for') && loopHeader.jumpTarget === this.pc) {
              if (backupPc === loopHeader.jumpTarget - 1) {
                this.pc = i; // jump back to header
                break;
              }
            }
          }
        }
      }

      if (this.isRunning) {
        this.onComplete();
      }
    } catch (err: any) {
      const origLine = this.currentLines[this.pc]?.lineNumber || 1;
      this.onError(err.message, origLine);
    } finally {
      this.isRunning = false;
    }
  }

  // Evaluates complex sub-expressions asynchronously
  private async evaluateExpression(expr: string): Promise<any> {
    expr = expr.trim();
    if (!expr) return '';

    // Handle parentheses
    if (expr.startsWith('(') && expr.endsWith(')')) {
      return this.evaluateExpression(expr.slice(1, -1));
    }

    // Handle return type prefix or casting prefix, e.g. "int count", "string val", "bool is_end"
    const typeCastMatch = expr.match(/^(int|string|bool|flort|list)\s+(.+)$/);
    if (typeCastMatch) {
      const castType = typeCastMatch[1];
      const subExpr = typeCastMatch[2].trim();
      const val = await this.evaluateExpression(subExpr);
      return this.coerceValue(val, castType);
    }

    // Binary comparison operators
    const compOp = this.findOperator(expr, ['no =', '<=', '>=', '<', '>', '=']);
    if (compOp) {
      const left = await this.evaluateExpression(expr.substring(0, compOp.index).trim());
      const right = await this.evaluateExpression(expr.substring(compOp.index + compOp.op.length).trim());
      switch (compOp.op) {
        case '=': return left == right;
        case 'no =': return left != right;
        case '<': return Number(left) < Number(right);
        case '>': return Number(left) > Number(right);
        case '<=': return Number(left) <= Number(right);
        case '>=': return Number(left) >= Number(right);
      }
    }

    // Binary Add / Sub operators
    const addOp = this.findOperator(expr, ['+', '-']);
    if (addOp) {
      const left = await this.evaluateExpression(expr.substring(0, addOp.index).trim());
      const right = await this.evaluateExpression(expr.substring(addOp.index + addOp.op.length).trim());
      if (addOp.op === '+') {
        // String concatenation or mathematical addition
        if (typeof left === 'string' || typeof right === 'string') {
          return String(left) + String(right);
        }
        return Number(left) + Number(right);
      } else {
        return Number(left) - Number(right);
      }
    }

    // Binary Mul / Div operators
    const mulOp = this.findOperator(expr, ['*', '/']);
    if (mulOp) {
      const left = await this.evaluateExpression(expr.substring(0, mulOp.index).trim());
      const right = await this.evaluateExpression(expr.substring(mulOp.index + mulOp.op.length).trim());
      if (mulOp.op === '*') {
        return Number(left) * Number(right);
      } else {
        // Sprout Spec Division
        // If both are integers, we use floor division (integer division) for fizzbuzz mod calculations
        if (Number.isInteger(Number(left)) && Number.isInteger(Number(right)) && right !== 0) {
          return Math.floor(Number(left) / Number(right));
        }
        return Number(left) / Number(right);
      }
    }

    // Exponentiation **
    const powOp = this.findOperator(expr, ['**']);
    if (powOp) {
      const left = await this.evaluateExpression(expr.substring(0, powOp.index).trim());
      const right = await this.evaluateExpression(expr.substring(powOp.index + powOp.op.length).trim());
      return Math.pow(Number(left), Number(right));
    }

    // List/String lookup query `food : i` or `value : count`
    const listIndexOp = this.findOperator(expr, [':']);
    if (listIndexOp) {
      const listName = expr.substring(0, listIndexOp.index).trim();
      const idxExpr = expr.substring(listIndexOp.index + 1).trim();
      if (this.variables.has(listName)) {
        const v = this.variables.get(listName)!;
        if (v.type === 'list') {
          const rawIdx = await this.evaluateExpression(idxExpr);
          const index = Number(rawIdx) - this.listIndexBase;
          if (index >= 0 && index < v.value.length) {
            return v.value[index];
          }
          throw new Error(`配列 "${listName}" のインデックス ${rawIdx} は範囲外です。`);
        } else if (v.type === 'string') {
          const rawIdx = await this.evaluateExpression(idxExpr);
          const index = Number(rawIdx) - this.listIndexBase;
          if (index >= 0 && index < v.value.length) {
            return v.value[index];
          }
          return null; // Return None (null) if out of bounds (which represents termination)
        }
      }
    }

    // Array / String bracket index access: expr.[idx]
    if (expr.endsWith(']')) {
      // Find the corresponding `.[`
      let bracketDepth = 0;
      let targetStart = -1;
      for (let i = expr.length - 1; i >= 0; i--) {
        const char = expr[i];
        if (char === ']') {
          bracketDepth++;
        } else if (char === '[') {
          bracketDepth--;
          if (bracketDepth === 0) {
            // Check if preceded by '.'
            if (i > 0 && expr[i - 1] === '.') {
              targetStart = i - 1;
              break;
            }
          }
        }
      }

      if (targetStart !== -1) {
        const baseExpr = expr.substring(0, targetStart).trim();
        const indexExpr = expr.substring(targetStart + 2, expr.length - 1).trim();
        
        // Evaluate baseExpr first (it should be an array or string)
        const baseValue = await this.evaluateExpression(baseExpr);
        // Evaluate indexExpr (number, variable, etc.)
        const rawIdx = await this.evaluateExpression(indexExpr);
        const index = Number(rawIdx) - this.listIndexBase;

        if (Array.isArray(baseValue)) {
          if (index >= 0 && index < baseValue.length) {
            return baseValue[index];
          }
          throw new Error(`配列 "${baseExpr}" のインデックス ${rawIdx} は範囲外です。(配列サイズ: ${baseValue.length})`);
        } else if (typeof baseValue === 'string') {
          if (index >= 0 && index < baseValue.length) {
            return baseValue[index];
          }
          throw new Error(`文字列 "${baseExpr}" のインデックス ${rawIdx} は範囲外です。(文字列の長さ: ${baseValue.length})`);
        } else {
          throw new Error(`"${baseExpr}" は配列または文字列ではありません。`);
        }
      }
    }

    // Type query `varName?`
    if (expr.endsWith('?')) {
      const varName = expr.slice(0, -1).trim();
      if (this.variables.has(varName)) {
        return this.variables.get(varName)!.type;
      }
      return 'None';
    }

    // Scale query `varName scale?`
    if (expr.endsWith('scale?')) {
      const varName = expr.slice(0, -6).trim();
      if (this.variables.has(varName)) {
        const v = this.variables.get(varName)!;
        if (v.type === 'string') {
          return v.value.length;
        } else if (v.type === 'int' || v.type === 'flort') {
          return v.value.toString().replace(/[^0-9]/g, '').length;
        } else if (v.type === 'list') {
          return v.value.length;
        }
      }
      return 0;
    }

    // Module function calls `Scale:add(5, 4)`
    const moduleFuncMatch = expr.match(/^([a-zA-Z0-9_\-\.]+):([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/);
    if (moduleFuncMatch) {
      const moduleName = moduleFuncMatch[1];
      const funcName = moduleFuncMatch[2];
      const argsStr = moduleFuncMatch[3].trim();
      
      const passedArgs = argsStr ? this.splitAtDepth0(argsStr, ',').map(a => a.trim()) : [];
      const evaluatedArgs: any[] = [];
      
      for (const arg of passedArgs) {
        evaluatedArgs.push(await this.evaluateExpression(arg));
      }

      // Check if it's an imported module
      const moduleCode = this.importedModules.get(moduleName) || this.importedModules.get(moduleName + '.sp');
      if (!moduleCode) {
        throw new Error(`モジュール "${moduleName}" はインポートされていません。`);
      }

      let moduleError: string | null = null;
      const subInterpreter = new SproutInterpreter({
        onOutput: (text) => this.onOutput(text),
        onInputPrompt: (promptText) => this.onInputPrompt(promptText),
        onComplete: () => {},
        onError: (err, lineNum) => {
          moduleError = `${err} (モジュール "${moduleName}" の ${lineNum} 行目)`;
        },
        onReadFile: this.onReadFile
      });
      
      // Pass down imported modules
      for (const [key, val] of this.importedModules.entries()) {
        subInterpreter.importedModules.set(key, val);
      }
      
      // Load module code (compile to register its functions)
      const parsed = subInterpreter.parse(moduleCode);
      const compiled = subInterpreter.compile(parsed);
      subInterpreter.currentLines = compiled;
      subInterpreter.isRunning = true;

      // Apply any top-level imports in the module (like zero-based indexing or default index)
      for (const line of compiled) {
        if (line.type === 'import') {
          if (line.valueExpr === 'Zero') {
            (subInterpreter as any).listIndexBase = 0;
          } else {
            (subInterpreter as any).listIndexBase = 1;
          }
        }
      }
      
      if (!subInterpreter.functions.has(funcName)) {
        throw new Error(`モジュール "${moduleName}" に関数 "${funcName}" は見つかりません。`);
      }

      const result = await subInterpreter.callFunctionInternal(funcName, evaluatedArgs);
      if (moduleError) {
        throw new Error(moduleError);
      }
      return result;
    }

    // Module use calls `module.use.filename(args)`
    const moduleUseMatch = expr.match(/^module\.use\.([a-zA-Z0-9_\-\.]+)\s*\((.*)\)$/);
    if (moduleUseMatch) {
      const moduleName = moduleUseMatch[1];
      const argsStr = moduleUseMatch[2].trim();
      
      const passedArgs = argsStr ? this.splitAtDepth0(argsStr, ',').map(a => a.trim()) : [];
      const evaluatedArgs: any[] = [];
      
      for (const arg of passedArgs) {
        evaluatedArgs.push(await this.evaluateExpression(arg));
      }

      // Check if it's an imported module
      const moduleCode = this.importedModules.get(moduleName) || this.importedModules.get(moduleName + '.sp');
      if (!moduleCode) {
        throw new Error(`モジュール "${moduleName}" はインポートされていません。`);
      }

      // Validate argument count matching between files
      this.validateModuleArgs(moduleName, moduleCode, evaluatedArgs.length);

      let moduleResult: any = 0;
      let moduleError: string | null = null;
      
      const subInterpreter = new SproutInterpreter({
        onOutput: (text) => this.onOutput(text),
        onInputPrompt: (promptText) => this.onInputPrompt(promptText),
        onComplete: () => {},
        onError: (err, lineNum) => {
          moduleError = `${err} (モジュール "${moduleName}" の ${lineNum} 行目)`;
        },
        onReadFile: this.onReadFile
      });
      
      // Pass down imported modules
      for (const [key, val] of this.importedModules.entries()) {
        subInterpreter.importedModules.set(key, val);
      }
      
      // Bind arguments
      if (evaluatedArgs.length >= 1) {
        const arg0 = evaluatedArgs[0];
        let arg0Type = 'string';
        if (typeof arg0 === 'number') arg0Type = Number.isInteger(arg0) ? 'int' : 'flort';
        else if (typeof arg0 === 'boolean') arg0Type = 'bool';
        else if (Array.isArray(arg0)) arg0Type = 'list';
        subInterpreter.variables.set('list', { type: arg0Type, value: arg0 });
        subInterpreter.variables.set('val', { type: arg0Type, value: arg0 });
        subInterpreter.variables.set('value', { type: arg0Type, value: arg0 });
      }
      
      if (evaluatedArgs.length >= 2) {
        const arg1 = evaluatedArgs[1];
        let arg1Type = 'string';
        if (typeof arg1 === 'number') arg1Type = Number.isInteger(arg1) ? 'int' : 'flort';
        else if (typeof arg1 === 'boolean') arg1Type = 'bool';
        else if (Array.isArray(arg1)) arg1Type = 'list';
        subInterpreter.variables.set('(send)', { type: arg1Type, value: arg1 });
        subInterpreter.variables.set('send', { type: arg1Type, value: arg1 });
        subInterpreter.variables.set('v', { type: arg1Type, value: arg1 });
      }
      
      await subInterpreter.execute(moduleCode);
      
      if (moduleError) {
        throw new Error(moduleError);
      }
      
      moduleResult = subInterpreter.moduleReturnValue !== undefined ? subInterpreter.moduleReturnValue : 0;
      return moduleResult;
    }

    // Function calls `Add(6, 2)`
    const funcMatch = expr.match(/^([a-zA-Z_][a-zA-Z0-9_]*)\s*\((.*)\)$/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      const argsStr = funcMatch[2].trim();
      
      const passedArgs = argsStr ? this.splitAtDepth0(argsStr, ',').map(a => a.trim()) : [];
      const evaluatedArgs: any[] = [];
      
      for (const arg of passedArgs) {
        evaluatedArgs.push(await this.evaluateExpression(arg));
      }

      // Check if it's an imported module
      if (this.importedModules.has(funcName)) {
        const moduleCode = this.importedModules.get(funcName)!;

        // Validate argument count matching between files
        this.validateModuleArgs(funcName, moduleCode, evaluatedArgs.length);

        let moduleResult: any = 0;
        let moduleError: string | null = null;
        
        const subInterpreter = new SproutInterpreter({
          onOutput: (text) => this.onOutput(text),
          onInputPrompt: (promptText) => this.onInputPrompt(promptText),
          onComplete: () => {},
          onError: (err, lineNum) => {
            moduleError = `${err} (モジュール "${funcName}" の ${lineNum} 行目)`;
          },
          onReadFile: this.onReadFile
        });
        
        // Pass down imported modules
        for (const [key, val] of this.importedModules.entries()) {
          subInterpreter.importedModules.set(key, val);
        }
        
        // Bind arguments
        if (evaluatedArgs.length >= 1) {
          const arg0 = evaluatedArgs[0];
          let arg0Type = 'string';
          if (typeof arg0 === 'number') arg0Type = Number.isInteger(arg0) ? 'int' : 'flort';
          else if (typeof arg0 === 'boolean') arg0Type = 'bool';
          else if (Array.isArray(arg0)) arg0Type = 'list';
          subInterpreter.variables.set('list', { type: arg0Type, value: arg0 });
          subInterpreter.variables.set('val', { type: arg0Type, value: arg0 });
          subInterpreter.variables.set('value', { type: arg0Type, value: arg0 });
        }
        
        if (evaluatedArgs.length >= 2) {
          const arg1 = evaluatedArgs[1];
          let arg1Type = 'string';
          if (typeof arg1 === 'number') arg1Type = Number.isInteger(arg1) ? 'int' : 'flort';
          else if (typeof arg1 === 'boolean') arg1Type = 'bool';
          else if (Array.isArray(arg1)) arg1Type = 'list';
          subInterpreter.variables.set('(send)', { type: arg1Type, value: arg1 });
          subInterpreter.variables.set('send', { type: arg1Type, value: arg1 });
          subInterpreter.variables.set('v', { type: arg1Type, value: arg1 });
        }
        
        await subInterpreter.execute(moduleCode);
        
        if (moduleError) {
          throw new Error(moduleError);
        }
        
        moduleResult = subInterpreter.moduleReturnValue !== undefined ? subInterpreter.moduleReturnValue : 0;
        return moduleResult;
      }

      // Built-in error message function
      if (funcName === 'error_messag') {
        throw new Error(evaluatedArgs[0] || 'エラーが発生しました。');
      }

      return await this.callFunctionInternal(funcName, evaluatedArgs);
    }

    // Resolve variable value
    const resolvedVar = this.getVariable(expr);
    if (resolvedVar) {
      return resolvedVar.value;
    }

    // Constants
    if (expr === 'true') return true;
    if (expr === 'false') return false;
    if (expr === 'None') return null;

    // Numerical literals
    if (!isNaN(expr as any)) {
      return Number(expr);
    }

    // Strip quotation strings
    if ((expr.startsWith('"') && expr.endsWith('"')) || (expr.startsWith("'") && expr.endsWith("'"))) {
      return expr.slice(1, -1);
    }

    // Treat as plain text string literal
    return expr;
  }

  private getVariable(name: string): { type: string; value: any } | undefined {
    if (this.variables.has(name)) {
      return this.variables.get(name);
    }
    // Search up the call stack (innermost/most recent frame first)
    for (let i = this.callStack.length - 1; i >= 0; i--) {
      const frame = this.callStack[i];
      if (frame.scope.has(name)) {
        return frame.scope.get(name);
      }
    }
    return undefined;
  }

  private setVariable(name: string, value: { type: string; value: any }): boolean {
    if (this.variables.has(name)) {
      this.variables.set(name, value);
      return true;
    }
    for (let i = this.callStack.length - 1; i >= 0; i--) {
      const frame = this.callStack[i];
      if (frame.scope.has(name)) {
        frame.scope.set(name, value);
        return true;
      }
    }
    return false;
  }

  private findParentLoopPc(jumpTarget: number): number | null {
    for (let i = 0; i < this.currentLines.length; i++) {
      const line = this.currentLines[i];
      if ((line.type === 'for' || line.type === 'while') && line.jumpTarget === jumpTarget) {
        return i;
      }
    }
    return null;
  }

  private async callFunctionInternal(funcName: string, evaluatedArgs: any[]): Promise<any> {
    if (this.functions.has(funcName)) {
      const fn = this.functions.get(funcName)!;
      
      // Establish localized sandbox scope
      const localScope: Map<string, { type: string; value: any }> = new Map();
      fn.args.forEach((argName, idx) => {
        const val = evaluatedArgs[idx] !== undefined ? evaluatedArgs[idx] : null;
        // Dynamically detect type
        let type = 'string';
        if (typeof val === 'number') {
          type = Number.isInteger(val) ? 'int' : 'flort';
        } else if (typeof val === 'boolean') {
          type = 'bool';
        } else if (Array.isArray(val)) {
          type = 'list';
        }
        localScope.set(argName, { type, value: val });
      });

      // Save execution context and push to stack
      const savedPc = this.pc;
      const savedScope = this.variables;
      const savedLines = this.currentLines;

      this.callStack.push({
        pc: savedPc,
        scope: savedScope,
        currentLines: savedLines
      });

      this.variables = localScope;
      this.pc = fn.startPC;
      (this as any).lastReturnValue = null;

      while (this.pc < fn.endPC && this.isRunning) {
        if (this.pc % 20 === 0) {
          await new Promise(r => setTimeout(r, 0));
        }

        const fnLine = this.currentLines[this.pc];
        
        if (fnLine.type === 'return') {
          if (!fn.hasReturn) {
            throw new Error(`関数 "${funcName}" は戻り値を持つことができません (定義で戻り値が false に指定されています)。`);
          }
          const ret = await this.evaluateExpression(fnLine.valueExpr!);
          (this as any).lastReturnValue = ret;
          break;
        }

        const backupPc = this.pc;
        await this.executeInstruction(fnLine);

        if (this.pc === backupPc) {
          this.pc++;
        }

        // Loop end jump-back logic inside function
        if (this.pc > 0) {
          const prevLine = this.currentLines[this.pc - 1];
          if (prevLine && (prevLine.type === 'if' || prevLine.type === 'else_if' || prevLine.type === 'else')) {
            const endTarget = (prevLine as any).chainEndTarget;
            if (endTarget && this.pc < endTarget) {
              this.pc = endTarget; // bypass remaining branches in if chain
            }
          }
        }

        // End of loop body redirects back to header for re-evaluation
        if (fnLine && fnLine.type !== 'break') {
          for (let i = fn.startPC; i < fn.endPC; i++) {
            const loopHeader = this.currentLines[i];
            if ((loopHeader.type === 'while' || loopHeader.type === 'for') && loopHeader.jumpTarget === this.pc) {
              if (backupPc === loopHeader.jumpTarget - 1) {
                this.pc = i; // jump back to header
                break;
              }
            }
          }
        }
      }

      const resultValue = (this as any).lastReturnValue;

      // Restore context
      this.callStack.pop();
      this.pc = savedPc;
      this.variables = savedScope;
      this.currentLines = savedLines;

      if (!fn.hasReturn) {
        return null;
      }
      return resultValue !== undefined ? resultValue : null;
    } else {
      throw new Error(`関数 "${funcName}" は見つかりません。`);
    }
  }

  // Executes a single instruction
  private async executeInstruction(line: ParsedLine) {
    switch (line.type) {
      case 'import': {
        if (line.valueExpr === 'Zero') {
          this.listIndexBase = 0;
        } else {
          this.listIndexBase = 1;
        }
        break;
      }

      case 'import_use': {
        const filename = line.valueExpr!;
        if (!this.onReadFile) {
          throw new Error('ファイルの読み込み機能が利用できません。');
        }
        const fileContent = this.onReadFile(filename);
        if (fileContent === undefined) {
          throw new Error(`モジュールファイル "${filename}" が見つかりません。`);
        }
        this.importedModules.set(filename, fileContent);
        const baseName = filename.endsWith('.sp') ? filename.slice(0, -3) : filename;
        this.importedModules.set(baseName, fileContent);
        break;
      }

      case 'output': {
        const trimmedExpr = line.valueExpr!.trim();
        if (trimmedExpr.match(/^[a-zA-Z_][a-zA-Z0-9_]*\s*\(.*\)$/) || !trimmedExpr.includes(' ')) {
          const res = await this.evaluateExpression(trimmedExpr);
          this.moduleReturnValue = res;
        } else {
          const parts = this.splitAtDepth0(trimmedExpr, ' ');
          if (parts.length >= 1) {
            const funcName = parts[0].trim();
            const rawArgs = parts.slice(1).map(a => a.trim());
            const evaluatedArgs: any[] = [];
            for (const arg of rawArgs) {
              evaluatedArgs.push(await this.evaluateExpression(arg));
            }
            const res = await this.callFunctionInternal(funcName, evaluatedArgs);
            this.moduleReturnValue = res;
          }
        }
        this.isRunning = false;
        break;
      }

      case 'make': {
        const varName = line.varName!;
        const type = line.varType!;
        const valExpr = line.valueExpr || '';

        if (type === 'list') {
          let listVals: any[] = [];
          if (valExpr.startsWith('[') && valExpr.endsWith(']')) {
            const inner = valExpr.slice(1, -1).trim();
            if (inner) {
              listVals = this.splitAtDepth0(inner, ',').map(item => {
                const trimmed = item.trim();
                if (trimmed === 'true') return true;
                if (trimmed === 'false') return false;
                if (!isNaN(trimmed as any)) return Number(trimmed);
                return trimmed;
              });
            }
          }
          this.variables.set(varName, { type: 'list', value: listVals });
        } else {
          const val = await this.evaluateExpression(valExpr);
          const coerced = this.coerceValue(val, type);
          this.variables.set(varName, { type, value: coerced });
        }
        break;
      }

      case 'assign': {
        const varName = line.varName!;
        const currentVar = this.getVariable(varName);
        if (!currentVar) {
          throw new Error(`変数 "${varName}" は定義されていません。"make"を使って作成してください。`);
        }
        const val = await this.evaluateExpression(line.valueExpr!);
        const coerced = this.coerceValue(val, currentVar.type);
        this.setVariable(varName, { type: currentVar.type, value: coerced });
        break;
      }

      case 'list_assign': {
        const listName = line.varName!;
        const listVar = this.getVariable(listName);
        if (!listVar) {
          throw new Error(`配列 "${listName}" は定義されていません。`);
        }
        if (listVar.type !== 'list') {
          throw new Error(`"${listName}" は配列ではありません。`);
        }

        const rawIndex = await this.evaluateExpression(line.indexExpr!);
        const index = Number(rawIndex) - this.listIndexBase;
        const value = await this.evaluateExpression(line.valueExpr!);

        const listArr = [...listVar.value];
        if (value === 'None' || value === null || value === undefined) {
          if (index >= 0 && index < listArr.length) {
            listArr.splice(index, 1);
          }
        } else {
          if (index >= 0 && index <= listArr.length) {
            listArr[index] = value;
          } else {
            throw new Error(`インデックス ${rawIndex} は配列 "${listName}" の範囲外です。(配列サイズ: ${listArr.length})`);
          }
        }
        this.setVariable(listName, { type: 'list', value: listArr });
        break;
      }

      case 'list_add': {
        const listName = line.varName!;
        const listVar = this.getVariable(listName);
        if (!listVar) {
          throw new Error(`配列 "${listName}" は定義されていません。`);
        }
        if (listVar.type !== 'list') {
          throw new Error(`"${listName}" は配列ではありません。`);
        }
        const val = await this.evaluateExpression(line.valueExpr!);
        const listArr = [...listVar.value, val];
        this.setVariable(listName, { type: 'list', value: listArr });
        break;
      }

      case 'display': {
        const expressions = this.splitAtDepth0(line.valueExpr!, ',');
        let outParts: string[] = [];
        for (const expr of expressions) {
          const trimmed = expr.trim();
          if (trimmed.startsWith('./')) {
            const varName = trimmed.slice(2).trim();
            const resolved = this.getVariable(varName);
            if (!resolved) {
              throw new Error(`配列 "${varName}" は定義されていません。`);
            }
            if (Array.isArray(resolved.value)) {
              outParts.push(resolved.value.join(', '));
            } else {
              outParts.push(String(resolved.value));
            }
          } else if (trimmed.startsWith('.')) {
            const varName = trimmed.slice(1).trim();
            const resolved = this.getVariable(varName);
            if (!resolved) {
              throw new Error(`変数 "${varName}" は定義されていません。`);
            }
            if (Array.isArray(resolved.value)) {
              outParts.push(resolved.value.join(', '));
            } else if (resolved.value === null || resolved.value === undefined) {
              outParts.push('None');
            } else {
              outParts.push(String(resolved.value));
            }
          } else {
            const isIdentifier = /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(trimmed);
            const isKeyword = trimmed === 'true' || trimmed === 'false' || trimmed === 'None';
            if (isIdentifier && !isKeyword) {
              outParts.push(trimmed);
            } else {
              const res = await this.evaluateExpression(trimmed);
              if (Array.isArray(res)) {
                outParts.push(res.join(', '));
              } else if (res === null || res === undefined) {
                outParts.push('None');
              } else {
                outParts.push(String(res));
              }
            }
          }
        }
        this.onOutput(outParts.join(''));
        break;
      }

      case 'input': {
        const promptExpr = line.valueExpr || '';
        const varName = line.varName!;

        const currentVar = this.getVariable(varName);
        if (!currentVar) {
          throw new Error(`変数 "${varName}" は定義されていません。"make"を使って作成してください。`);
        }

        const promptText = promptExpr === 'None' ? '' : String(await this.evaluateExpression(promptExpr));
        const userInput = await this.onInputPrompt(promptText);
        
        const coerced = this.coerceValue(userInput, currentVar.type);
        this.setVariable(varName, { type: currentVar.type, value: coerced });
        break;
      }

      case 'if':
      case 'else_if': {
        const cond = await this.evaluateExpression(line.conditionExpr!);
        if (!cond) {
          this.pc = line.jumpTarget!;
        }
        break;
      }

      case 'else': {
        this.pc = (line as any).chainEndTarget || line.jumpTarget!;
        break;
      }

      case 'for': {
        const startVal = Number(await this.evaluateExpression(line.loopStartExpr!));
        const endVal = Number(await this.evaluateExpression(line.loopEndExpr!));
        const stepVal = Number(await this.evaluateExpression(line.loopStepExpr!));

        const isFirstRun = this.anonymousLoopCounters[this.pc] === undefined;
        if (isFirstRun) {
          this.anonymousLoopCounters[this.pc] = {
            start: startVal,
            end: endVal,
            step: stepVal,
            current: startVal
          };
          if (line.loopVar) {
            this.variables.set(line.loopVar, { type: 'int', value: startVal });
          }
        } else {
          const counter = this.anonymousLoopCounters[this.pc];
          counter.current += counter.step;
          if (line.loopVar) {
            this.setVariable(line.loopVar, { type: 'int', value: counter.current });
          }
        }

        const counter = this.anonymousLoopCounters[this.pc];
        const continues = counter.step >= 0 
          ? counter.current <= counter.end 
          : counter.current >= counter.end;

        if (!continues) {
          delete this.anonymousLoopCounters[this.pc];
          this.pc = line.jumpTarget!;
        }
        break;
      }

      case 'while': {
        const cond = await this.evaluateExpression(line.conditionExpr!);
        if (!cond) {
          this.pc = line.jumpTarget!;
        }
        break;
      }

      case 'break': {
        this.pc = line.jumpTarget!;
        const parentLoopPc = this.findParentLoopPc(this.pc);
        if (parentLoopPc !== null) {
          delete this.anonymousLoopCounters[parentLoopPc];
        }
        break;
      }

      case 'function': {
        this.pc = line.jumpTarget!;
        break;
      }

      case 'return': {
        const retValue = await this.evaluateExpression(line.valueExpr!);
        if (this.callStack.length > 0) {
          const frame = this.callStack.pop()!;
          this.pc = frame.pc;
          this.variables = frame.scope;
          this.currentLines = frame.currentLines;
          (this as any).lastReturnValue = retValue;
        } else {
          this.moduleReturnValue = retValue;
          this.isRunning = false;
        }
        break;
      }

      case 'statement_expr': {
        const result = await this.evaluateExpression(line.valueExpr!);
        if (this.callStack.length === 0) {
          this.moduleReturnValue = result;
        }
        break;
      }
    }
  }

  // Type Coercion Utility
  private coerceValue(val: any, type: string): any {
    if (val === null || val === undefined || val === '') {
      switch (type) {
        case 'int': return 0;
        case 'flort': return 0.0;
        case 'bool': return false;
        case 'string': return '';
        default: return null;
      }
    }
    switch (type) {
      case 'int':
        return isNaN(val) ? 0 : Math.floor(Number(val));
      case 'flort':
        return isNaN(val) ? 0.0 : Number(val);
      case 'bool':
        return val === 'true' || val === true;
      case 'string':
        return String(val);
      default:
        return val;
    }
  }

  // Bracket/Quotes aware operator finder
  private findOperator(expr: string, operators: string[]): { index: number; op: string } | null {
    let parenDepth = 0;
    let bracketDepth = 0;
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < expr.length; i++) {
      const char = expr[i];
      if (inQuotes) {
        if (char === quoteChar) {
          inQuotes = false;
        }
        continue;
      }
      if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
        continue;
      }
      if (char === '(') {
        parenDepth++;
        continue;
      }
      if (char === ')') {
        parenDepth--;
        continue;
      }
      if (char === '[') {
        bracketDepth++;
        continue;
      }
      if (char === ']') {
        bracketDepth--;
        continue;
      }

      if (parenDepth === 0 && bracketDepth === 0) {
        for (const op of operators) {
          if (expr.startsWith(op, i)) {
            // Guard special operator overlaps like = and <=, >=, no =
            if (op === '=' && (expr.startsWith('no =', i - 3) || expr.startsWith('<=', i - 1) || expr.startsWith('>=', i - 1))) {
              continue;
            }
            return { index: i, op };
          }
        }
      }
    }
    return null;
  }

  // Robust depth 0 splitter for commas, colons, of keyword etc.
  private splitAtDepth0(str: string, separator: string): string[] {
    const parts: string[] = [];
    let current = '';
    let parenDepth = 0;
    let bracketDepth = 0;
    let inQuotes = false;
    let quoteChar = '';

    for (let i = 0; i < str.length; i++) {
      const char = str[i];
      if (inQuotes) {
        current += char;
        if (char === quoteChar) {
          inQuotes = false;
        }
        continue;
      }
      if (char === '"' || char === "'") {
        inQuotes = true;
        quoteChar = char;
        current += char;
        continue;
      }
      if (char === '(') {
        parenDepth++;
      } else if (char === ')') {
        parenDepth--;
      } else if (char === '[') {
        bracketDepth++;
      } else if (char === ']') {
        bracketDepth--;
      }

      if (parenDepth === 0 && bracketDepth === 0 && str.startsWith(separator, i)) {
        parts.push(current);
        current = '';
        i += separator.length - 1; // skip separator
      } else {
        current += char;
      }
    }
    parts.push(current);
    return parts;
  }

  // Validate that the number of passed arguments matches the expected arguments in the module file
  private validateModuleArgs(moduleName: string, moduleCode: string, passedArgsCount: number) {
    const linesWithoutComments = moduleCode.split('\n').map(l => {
      const idx = l.indexOf('#');
      return idx !== -1 ? l.substring(0, idx) : l;
    }).join('\n');

    let expectedArgsCount = 0;
    if (/(?:^|[^a-zA-Z0-9_\(\)])(?:send|\(send\))(?:$|[^a-zA-Z0-9_\(\)])/.test(linesWithoutComments)) {
      expectedArgsCount = 2;
    } else if (/(?:^|[^a-zA-Z0-9_])list(?:$|[^a-zA-Z0-9_])/.test(linesWithoutComments)) {
      expectedArgsCount = 1;
    }

    if (passedArgsCount !== expectedArgsCount) {
      throw new Error(`モジュール "${moduleName}" の呼び出し引数の数が定義側と一致しません。(期待される引数の数: ${expectedArgsCount}、渡された引数の数: ${passedArgsCount})`);
    }
  }
}
