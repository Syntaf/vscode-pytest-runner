import * as path from 'path';
import * as fs from 'fs';
import { execSync } from 'child_process';

/**
 * Interface representing a Python test node (function, class, or method)
 */
export interface PythonTestNode {
  name: string;
  line: number;
  type: 'function' | 'method' | 'class';
  class?: string | null;
  fullName: string;
  parametrized: boolean;
  async: boolean;
  fixtures?: string[];
  children?: PythonTestNode[];
}

/**
 * Result structure from Python AST parser
 */
interface PythonParserResult {
  tests: PythonTestNode[];
  file: string;
  success: boolean;
  error?: string;
}


/**
 * Python test parser that uses AST parsing via subprocess
 */
export class PythonTestParser {
  private pythonParserPath: string;
  
  constructor() {
    this.pythonParserPath = path.join(__dirname, 'python-parser', 'ast_parser.py');
  }

  /**
   * Parse a Python test file and return test information
   * @param filePath Path to the Python test file
   * @returns Array of test nodes found in the file
   */
  public parseTestFile(filePath: string): PythonTestNode[] {
    if (!fs.existsSync(filePath)) {
      return [];
    }

    // Check if it's likely a Python test file
    if (!this.isTestFile(filePath)) {
      return [];
    }

    try {
      // Try Python AST parsing first
      const result = this.parsePythonFile(filePath);
      if (result.length > 0) {
        return result;
      }
      
      // Fallback to regex parsing if AST parsing fails
      return this.parseWithRegex(filePath);
    } catch (error) {
      // Fallback to regex parsing on any error
      return this.parseWithRegex(filePath);
    }
  }

  /**
   * Check if a file appears to be a Python test file
   */
  private isTestFile(filePath: string): boolean {
    const fileName = path.basename(filePath);
    return fileName.endsWith('.py') && (
      fileName.startsWith('test_') ||
      fileName.endsWith('_test.py') ||
      fileName.includes('test')
    );
  }

  /**
   * Parse Python file using the AST parser subprocess
   */
  private parsePythonFile(filePath: string): PythonTestNode[] {
    try {
      if (!fs.existsSync(this.pythonParserPath)) {
        throw new Error('Python parser script not found');
      }

      const command = `python "${this.pythonParserPath}" "${filePath}"`;
      const output = execSync(command, {
        encoding: 'utf8',
        timeout: 10000, // 10 second timeout
        maxBuffer: 1024 * 1024 // 1MB buffer
      });

      const result: PythonParserResult = JSON.parse(output);
      
      if (result.success && Array.isArray(result.tests)) {
        return this.processTestNodes(result.tests);
      }
      
      return [];
    } catch (error) {
      // Silently fail and let fallback handle it
      return [];
    }
  }

  /**
   * Process raw test nodes from Python parser and add children relationships
   */
  private processTestNodes(tests: any[]): PythonTestNode[] {
    const processedTests: PythonTestNode[] = [];
    const testsByClass = new Map<string, PythonTestNode[]>();

    // First pass: convert and group by class
    tests.forEach(test => {
      const node: PythonTestNode = {
        name: test.name,
        line: test.line || 1,
        type: test.type || 'function',
        class: test.class || null,
        fullName: test.full_name || test.name,
        parametrized: test.parametrized || false,
        async: test.async || false,
        fixtures: test.fixtures || []
      };

      if (node.class) {
        if (!testsByClass.has(node.class)) {
          testsByClass.set(node.class, []);
        }
        testsByClass.get(node.class)!.push(node);
      } else {
        processedTests.push(node);
      }
    });

    // Second pass: create class nodes with children
    testsByClass.forEach((methods, className) => {
      const classNode = tests.find(test => test.name === className && test.type === 'class');
      if (classNode) {
        const node: PythonTestNode = {
          name: className,
          line: classNode.line || 1,
          type: 'class',
          class: null,
          fullName: className,
          parametrized: false,
          async: false,
          children: methods
        };
        processedTests.push(node);
      } else {
        // No class definition found, add methods directly
        processedTests.push(...methods);
      }
    });

    return processedTests.sort((a, b) => a.line - b.line);
  }

  /**
   * Fallback regex-based parser for when AST parsing fails
   */
  private parseWithRegex(filePath: string): PythonTestNode[] {
    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const tests: PythonTestNode[] = [];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmedLine = line.trim();
        
        // Match test functions: def test_*(...):
        const functionMatch = trimmedLine.match(/^def\s+(test_\w*)\s*\(/);
        if (functionMatch) {
          tests.push({
            name: functionMatch[1],
            line: i + 1,
            type: 'function',
            class: null,
            fullName: functionMatch[1],
            parametrized: false,
            async: false
          });
          continue;
        }

        // Match test classes: class Test*:
        const classMatch = trimmedLine.match(/^class\s+(Test\w*)\s*[\(\:]/);
        if (classMatch) {
          tests.push({
            name: classMatch[1],
            line: i + 1,
            type: 'class',
            class: null,
            fullName: classMatch[1],
            parametrized: false,
            async: false
          });
          continue;
        }

        // Match async test functions
        const asyncFunctionMatch = trimmedLine.match(/^async\s+def\s+(test_\w*)\s*\(/);
        if (asyncFunctionMatch) {
          tests.push({
            name: asyncFunctionMatch[1],
            line: i + 1,
            type: 'function',
            class: null,
            fullName: asyncFunctionMatch[1],
            parametrized: false,
            async: true
          });
        }
      }

      return tests;
    } catch (error) {
      return [];
    }
  }

}

/**
 * Parse a Python test file using the default parser instance
 * @param filePath Path to the Python test file
 * @returns Array of test nodes
 */
export function parse(filePath: string): PythonTestNode[] {
  const parser = new PythonTestParser();
  return parser.parseTestFile(filePath);
}

// Export the main interfaces and types
export type ParsedNode = PythonTestNode;