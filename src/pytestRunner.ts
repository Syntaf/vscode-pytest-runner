import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

import { PytestRunnerConfig } from './pytestRunnerConfig';
import { parse } from './parser';
import {
  escapeRegExp,
  escapeRegExpForPath,
  escapeSingleQuotes,
  findFullTestName,
  getFileName,
  getDirName,
  normalizePath,
  pushMany,
  quote,
  unquote,
  isPythonTestFile,
  formatPytestTestName,
  parseTestFullName,
} from './util';

interface DebugCommand {
  documentUri: vscode.Uri;
  config: vscode.DebugConfiguration;
}

export class PytestRunner {
  private previousCommand: string | DebugCommand | undefined;

  private terminal: vscode.Terminal | undefined;

  // support for running in a native external terminal
  // force runTerminalCommand to push to a queue and run in a native external
  // terminal after all commands been pushed
  private openNativeTerminal: boolean;
  private commands: string[] = [];

  constructor(private readonly config: PytestRunnerConfig) {
    this.setup();
    this.openNativeTerminal = config.isRunInExternalNativeTerminal;
  }

  //
  // public methods
  //

  public async runTestsOnPath(path: string): Promise<void> {
    const command = this.buildPytestCommand(path);

    this.previousCommand = command;

    await this.goToCwd();
    await this.runTerminalCommand(command);

    await this.runExternalNativeTerminalCommand(this.commands);
  }

  public async runCurrentTest(
    argument?: Record<string, unknown> | string,
    options?: string[],
    collectCoverageFromCurrentFile?: boolean,
  ): Promise<void> {
    const currentTestName = typeof argument === 'string' ? argument : undefined;
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    await editor.document.save();

    const filePath = editor.document.fileName;

    // Check if it's a Python test file
    if (!isPythonTestFile(filePath)) {
      vscode.window.showWarningMessage('Current file does not appear to be a Python test file.');
      return;
    }

    const finalOptions = options || [];
    if (collectCoverageFromCurrentFile) {
      const targetFileDir = getDirName(filePath);
      const targetFileName = getFileName(filePath)
        .replace(/test_/, '')
        .replace(/_test\.py$/, '.py');

      // if a file does not exist with the same name as the test file but without the test part
      // use test file's directory for coverage target
      const coverageTarget = fs.existsSync(`${targetFileDir}/${targetFileName}`)
        ? targetFileName
        : targetFileDir;

      finalOptions.push('--cov', coverageTarget);
    }

    const testName = currentTestName || this.findCurrentTestName(editor);
    const command = this.buildPytestCommand(filePath, testName, finalOptions);

    this.previousCommand = command;

    await this.goToCwd();
    await this.runTerminalCommand(command);

    await this.runExternalNativeTerminalCommand(this.commands);
  }

  public async runCurrentFile(options?: string[]): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    await editor.document.save();

    const filePath = editor.document.fileName;

    // Check if it's a Python test file
    if (!isPythonTestFile(filePath)) {
      vscode.window.showWarningMessage('Current file does not appear to be a Python test file.');
      return;
    }

    const command = this.buildPytestCommand(filePath, undefined, options);

    this.previousCommand = command;

    await this.goToCwd();
    await this.runTerminalCommand(command);

    await this.runExternalNativeTerminalCommand(this.commands);
  }

  public async runPreviousTest(): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    await editor.document.save();

    if (typeof this.previousCommand === 'string') {
      await this.goToCwd();
      await this.runTerminalCommand(this.previousCommand);
    } else if (this.previousCommand) {
      await this.executeDebugCommand(this.previousCommand);
    }

    await this.runExternalNativeTerminalCommand(this.commands);
  }

  public async debugTestsOnPath(path: string): Promise<void> {
    const debugConfig = this.getDebugConfig(path);

    await this.goToCwd();
    await this.executeDebugCommand({
      config: debugConfig,
      documentUri: vscode.Uri.file(path),
    });

    await this.runExternalNativeTerminalCommand(this.commands);
  }

  public async debugCurrentTest(currentTestName?: string): Promise<void> {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return;
    }

    await editor.document.save();

    const filePath = editor.document.fileName;

    // Check if it's a Python test file
    if (!isPythonTestFile(filePath)) {
      vscode.window.showWarningMessage('Current file does not appear to be a Python test file.');
      return;
    }

    const testName = currentTestName || this.findCurrentTestName(editor);
    const debugConfig = this.getDebugConfig(filePath, testName);

    await this.goToCwd();
    await this.executeDebugCommand({
      config: debugConfig,
      documentUri: editor.document.uri,
    });

    await this.runExternalNativeTerminalCommand(this.commands);
  }

  //
  // private methods
  //

  private async executeDebugCommand(debugCommand: DebugCommand) {
    // prevent open of external terminal when debug command is executed
    this.openNativeTerminal = false;

    for (const command of this.commands) {
      await this.runTerminalCommand(command);
    }
    this.commands = [];

    vscode.debug.startDebugging(undefined, debugCommand.config);

    this.previousCommand = debugCommand;
  }

  private getDebugConfig(filePath: string, currentTestName?: string): vscode.DebugConfiguration {
    const config: vscode.DebugConfiguration = {
      name: 'Debug Pytest Tests',
      type: 'python',
      request: 'launch',
      module: 'pytest',
      console: 'integratedTerminal',
      cwd: this.config.cwd,
      ...this.config.debugOptions,
    };

    config.args = config.args ? config.args.slice() : [];

    const standardArgs = this.buildPytestArgs(filePath, currentTestName, false);
    pushMany(config.args, standardArgs);
    
    // Add debugging specific args
    config.args.push('-s'); // Don't capture stdout (for better debugging)
    config.args.push('--tb=short'); // Short traceback format

    // Set Python path if virtual environment is detected
    const pythonPath = this.getPythonPath();
    if (pythonPath) {
      config.python = pythonPath;
    }

    return config;
  }

  private getPythonPath(): string | undefined {
    const virtualEnvPath = this.config.virtualEnvPath;
    if (virtualEnvPath) {
      const pythonPath = process.platform === 'win32'
        ? path.join(virtualEnvPath, 'Scripts', 'python.exe')
        : path.join(virtualEnvPath, 'bin', 'python');
      
      if (fs.existsSync(pythonPath)) {
        return pythonPath;
      }
    }
    return undefined;
  }

  private findCurrentTestName(editor: vscode.TextEditor): string | undefined {
    // from selection
    const { selection, document } = editor;
    if (!selection.isEmpty) {
      return unquote(document.getText(selection));
    }

    const selectedLine = selection.active.line + 1;
    const filePath = editor.document.fileName;
    const testFile = parse(filePath);

    const fullTestName = findFullTestName(selectedLine, testFile);
    return fullTestName;
  }

  private buildPytestCommand(filePath: string, testName?: string, options?: string[]): string {
    const args = this.buildPytestArgs(filePath, testName, true, options);
    return `${this.config.pytestCommand} ${args.join(' ')}`;
  }

  private buildPytestArgs(filePath: string, testName?: string, withQuotes: boolean = true, options: string[] = []): string[] {
    const args: string[] = [];
    const quoter = withQuotes ? quote : (str: string) => str;

    // Add the file path
    args.push(quoter(normalizePath(filePath)));

    // Add test name if specified
    if (testName) {
      // Handle pytest test selection with -k option
      if (testName.includes('::')) {
        // Class::method format
        args.push('-k', quoter(testName.replace('::', ' and ')));
      } else {
        // Simple test function name
        args.push('-k', quoter(testName));
      }
    }

    // Add pytest configuration file if available
    const pytestConfigPath = this.config.getPytestConfigPath(filePath);
    if (pytestConfigPath) {
      args.push('-c', quoter(normalizePath(pytestConfigPath)));
    }

    // Add pytest arguments from configuration
    const configArgs = this.config.pytestArgs;
    if (configArgs && configArgs.length > 0) {
      args.push(...configArgs);
    }

    // Add additional options
    if (options && options.length > 0) {
      const setOptions = new Set(options);
      args.push(...setOptions);
    }

    return args;
  }

  private async goToCwd() {
    const command = `cd ${quote(this.config.cwd)}`;
    if (this.config.changeDirectoryToWorkspaceRoot) {
      await this.runTerminalCommand(command);
    }
  }

  private buildNativeTerminalCommand(toRun: string): string {
    const command = `ttab -t 'pytest-runner' "${toRun}"`;
    return command;
  }

  private async runExternalNativeTerminalCommand(commands: string[]): Promise<void> {
    if (!this.openNativeTerminal) {
      this.commands = [];
      return;
    }

    const command: string = commands.join('; ');
    const externalCommand: string = this.buildNativeTerminalCommand(command);
    this.commands = [];

    if (!this.terminal) {
      this.terminal = vscode.window.createTerminal('pytest');
    }

    this.terminal.show(this.config.preserveEditorFocus);
    await vscode.commands.executeCommand('workbench.action.terminal.clear');
    this.terminal.sendText(externalCommand);
  }

  private async runTerminalCommand(command: string) {
    if (this.openNativeTerminal) {
      this.commands.push(command);
      return;
    }

    if (!this.terminal) {
      this.terminal = vscode.window.createTerminal('pytest');
    }
    this.terminal.show(this.config.preserveEditorFocus);
    await vscode.commands.executeCommand('workbench.action.terminal.clear');
    this.terminal.sendText(command);
  }

  private setup() {
    vscode.window.onDidCloseTerminal((closedTerminal: vscode.Terminal) => {
      if (this.terminal === closedTerminal) {
        this.terminal = undefined;
      }
    });
  }
}