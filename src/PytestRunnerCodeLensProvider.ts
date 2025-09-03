import { parse, PythonTestNode } from './parser';
import { CodeLens, CodeLensProvider, Range, TextDocument, window, workspace } from 'vscode';
import { CodeLensOption, normalizePath, isPythonTestFile } from './util';
import { sync } from 'fast-glob';

function getCodeLensForOption(range: Range, codeLensOption: CodeLensOption, fullTestName: string): CodeLens {  
  const titleMap: Record<CodeLensOption, string> = {
    run: 'Run',
    debug: 'Debug',
    watch: 'Run --watch',
    coverage: 'Run --coverage'
  };
  const commandMap: Record<CodeLensOption, string> = {
    run: 'extension.runPytest',
    debug: 'extension.debugPytest',
    watch: 'extension.watchPytest',
    coverage: 'extension.runPytestCoverage'
  };
  return new CodeLens(range, {
    arguments: [fullTestName],
    title: titleMap[codeLensOption],
    command: commandMap[codeLensOption],
  });
}

function getTestsBlocks(
  testNodes: PythonTestNode[],
  codeLensOptions: CodeLensOption[]
): CodeLens[] {
  const codeLens: CodeLens[] = [];

  testNodes.forEach((testNode) => {
    // Create range for the test node (line-based, as we don't have column info from AST)
    const range = new Range(
      testNode.line - 1, // Convert to 0-based line numbering
      0, // Start at beginning of line
      testNode.line - 1, // End at same line
      100 // Arbitrary end column, VS Code will adjust
    );

    // Add CodeLens for this test
    const fullTestName = testNode.fullName;
    codeLens.push(...codeLensOptions.map((option) => 
      getCodeLensForOption(range, option, fullTestName)
    ));

    // Recursively handle children (test methods in classes)
    if (testNode.children && testNode.children.length > 0) {
      codeLens.push(...getTestsBlocks(testNode.children, codeLensOptions));
    }
  });

  return codeLens;
}

export class PytestRunnerCodeLensProvider implements CodeLensProvider {
  private lastSuccessfulCodeLens: CodeLens[] = [];

  constructor(private readonly codeLensOptions: CodeLensOption[]) {}

  private get currentWorkspaceFolderPath(): string {
    const editor = window.activeTextEditor;
    if (!editor) {
      return workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    }
    return workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath ?? '';
  }

  public async provideCodeLenses(document: TextDocument): Promise<CodeLens[]> {
    try {
      // Check if this is a Python test file
      if (!isPythonTestFile(document.fileName)) {
        return [];
      }

      const config = workspace.getConfiguration('pytestrunner');
      const include = config.get<string[]>('include', []);
      const exclude = config.get<string[]>('exclude', []);

      const filePath = normalizePath(document.fileName);
      const workspaceRoot = normalizePath(this.currentWorkspaceFolderPath);

      // Apply include/exclude filters
      const globOptions = { cwd: workspaceRoot, absolute: true };
      if (include.length > 0 && !sync(include, globOptions).includes(filePath)) {
        return [];
      }

      if (exclude.length > 0 && sync(exclude, globOptions).includes(filePath)) {
        return [];
      }

      // Parse the Python test file
      const testNodes = parse(document.fileName);
      
      if (testNodes && testNodes.length > 0) {
        this.lastSuccessfulCodeLens = getTestsBlocks(testNodes, this.codeLensOptions);
      } else {
        this.lastSuccessfulCodeLens = [];
      }
    } catch (e) {
      console.error('Python test parser returned error', e);
      // Return last successful parse results on error
      return this.lastSuccessfulCodeLens;
    }
    
    return this.lastSuccessfulCodeLens;
  }
}