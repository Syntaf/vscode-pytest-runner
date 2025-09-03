import * as path from 'path';
import { execSync } from 'child_process';
import * as mm from 'micromatch';
import * as vscode from 'vscode';
import * as fs from 'fs';

export function getDirName(filePath: string): string {
  return path.dirname(filePath);
}

export function getFileName(filePath: string): string {
  return path.basename(filePath);
}

export function isWindows(): boolean {
  return process.platform.includes('win32');
}

export function normalizePath(path: string): string {
  return isWindows() ? path.replace(/\\/g, '/') : path;
}

export function escapeRegExp(s: string): string {
  const escapedString = s.replace(/[.*+?^${}<>()|[\]\\]/g, '\\$&'); // $& means the whole matched string
  return escapedString.replace(/\\\(\\\.\\\*\\\?\\\)/g, '(.*?)'); // should revert the escaping of match all regex patterns.
}

export function escapeRegExpForPath(s: string): string {
  return s.replace(/[*+?^${}<>()|[\]]/g, '\\$&'); // $& means the whole matched string
}

export function findFullTestName(selectedLine: number, children: any[]): string | undefined {
  if (!children) {
    return;
  }
  // Handle Python test nodes
  for (const element of children) {
    // For Python classes and functions, check if the line matches
    if (selectedLine === element.line) {
      return element.fullName || element.name;
    }
    // For range-based matching (if we have end line info)
    if (element.endLine && selectedLine >= element.line && selectedLine <= element.endLine) {
      return element.fullName || element.name;
    }
  }
  // Check nested children (for test methods in classes)
  for (const element of children) {
    if (element.children) {
      const result = findFullTestName(selectedLine, element.children);
      if (result) {
        return result; // Python already includes class name in fullName
      }
    }
  }
}

const QUOTES: Record<string, boolean> = {
  '"': true,
  "'": true,
  '`': true,
};

function resolveTestNameStringInterpolation(s: string): string {
  const variableRegex = /(\${?[A-Za-z0-9_]+}?|%[psdifjo#%])/gi;
  const matchAny = '(.*?)';
  return s.replace(variableRegex, matchAny);
}

export function escapeSingleQuotes(s: string): string {
  return isWindows() ? s : s.replace(/'/g, "'\\''");
}

export function quote(s: string): string {
  const q = isWindows() ? '"' : `'`;
  return [q, s, q].join('');
}

export function unquote(s: string): string {
  if (QUOTES[s[0]]) {
    s = s.substring(1);
  }

  if (QUOTES[s[s.length - 1]]) {
    s = s.substring(0, s.length - 1);
  }

  return s;
}

export function pushMany<T>(arr: T[], items: T[]): number {
  return Array.prototype.push.apply(arr, items);
}

export type CodeLensOption = 'run' | 'debug' | 'watch' | 'coverage';

function isCodeLensOption(option: string): option is CodeLensOption {
  return ['run', 'debug', 'watch', 'coverage'].includes(option);
}

export function validateCodeLensOptions(maybeCodeLensOptions: string[]): CodeLensOption[] {
  return [...new Set(maybeCodeLensOptions)].filter((value) => isCodeLensOption(value)) as CodeLensOption[];
}

export function isPythonExecutable(pythonPath: string): boolean {
  try {
    execSync(`${pythonPath} --version`, { timeout: 5000 });
    return true;
  } catch (err) {
    return false;
  }
}

export function updateTestNameIfUsingProperties(receivedTestName?: string) {
  if (receivedTestName === undefined) {
    return undefined;
  }

  const namePropertyRegex = /(?<=\S)\\.name/g;
  const testNameWithoutNameProperty = receivedTestName.replace(namePropertyRegex, '');

  const prototypePropertyRegex = /\w*\\.prototype\\./g;
  return testNameWithoutNameProperty.replace(prototypePropertyRegex, '');
}

export function resolveConfigPathOrMapping(
  configPathOrMapping: string | Record<string, string> | undefined,
  targetPath: string,
): string | undefined {
  if (['string', 'undefined'].includes(typeof configPathOrMapping)) {
    return configPathOrMapping as string | undefined;
  }
  for (const [key, value] of Object.entries(configPathOrMapping as Record<string, string>)) {
    const isMatch = mm.matcher(key);
    // try the glob against normalized and non-normalized path
    if (isMatch(targetPath) || isMatch(normalizePath(targetPath))) {
      return normalizePath(value);
    }
  }
  if (configPathOrMapping && Object.keys(configPathOrMapping).length > 0) {
    vscode.window.showWarningMessage(
      `None of the glob patterns in the configPath mapping matched the target file. Make sure you're using correct glob pattern syntax. Pytest-runner uses the same library (micromatch) for evaluating glob patterns.`,
    );
  }

  return undefined;
}

/**
 * Traverse from starting path to and including ancestor path calling the callback function with each path.
 * If the callback function returns a non-falsy value, the traversal will stop and the value will be returned.
 * Returns false if the traversal completes without the callback returning a non-false value.
 * @param ancestorPath
 * @param startingPath
 * @param callback <T>(currentFolderPath: string) => false | T
 */
export function searchPathToParent<T>(
  startingPath: string,
  ancestorPath: string,
  callback: (currentFolderPath: string) => false | undefined | null | 0 | T,
) {
  let currentFolderPath = fs.statSync(startingPath).isDirectory() ? startingPath : path.dirname(startingPath);
  const endPath = path.dirname(ancestorPath);
  const resolvedStart = path.resolve(currentFolderPath);
  const resolvedEnd = path.resolve(endPath);
  // this might occur if you've opened a file outside of the workspace
  if (!resolvedStart.startsWith(resolvedEnd)) {
    return false;
  }

  // prevent edge case of workdir at root path ie, '/' -> '..' -> '/'
  let lastPath: null | string = null;
  do {
    const result = callback(currentFolderPath);
    if (result) {
      return result;
    }
    lastPath = currentFolderPath;
    currentFolderPath = path.dirname(currentFolderPath);
  } while (currentFolderPath !== endPath && currentFolderPath !== lastPath);

  return false;
}

/**
 * Check if a file appears to be a Python test file
 */
export function isPythonTestFile(filePath: string): boolean {
  const fileName = path.basename(filePath);
  return fileName.endsWith('.py') && (
    fileName.startsWith('test_') ||
    fileName.endsWith('_test.py') ||
    fileName.includes('test')
  );
}

/**
 * Format pytest test name for command line execution
 */
export function formatPytestTestName(testName: string, filePath?: string): string {
  if (filePath && testName.includes('::')) {
    // Already formatted with class::method syntax
    return `${filePath}::${testName}`;
  } else if (filePath) {
    // Simple test function
    return `${filePath}::${testName}`;
  }
  return testName;
}

/**
 * Check if Poetry is available in the system
 */
export function isPoetryAvailable(poetryPath: string = 'poetry'): boolean {
  try {
    execSync(`${poetryPath} --version`, { timeout: 5000 });
    return true;
  } catch (err) {
    return false;
  }
}

/**
 * Extract Python test class and method from full name
 */
export function parseTestFullName(fullName: string): { className?: string; methodName: string } {
  if (fullName.includes('::')) {
    const parts = fullName.split('::');
    return {
      className: parts[0],
      methodName: parts[1]
    };
  }
  return { methodName: fullName };
}
