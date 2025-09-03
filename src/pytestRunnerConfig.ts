import * as path from 'path';
import * as fs from 'fs';
import * as vscode from 'vscode';
import { execSync } from 'child_process';
import {
  normalizePath,
  validateCodeLensOptions,
  CodeLensOption,
  resolveConfigPathOrMapping,
  searchPathToParent,
} from './util';

export class PytestRunnerConfig {
  /**
   * The command that runs pytest.
   * Defaults to: "pytest" or "poetry run pytest" for Poetry projects
   */
  public get pytestCommand(): string {
    const baseCommand = this.usePoetry && this.detectPoetryProject() ? 'poetry run pytest' : this.pytestPath;
    const args = this.pytestArgs.join(' ');
    return `${baseCommand}${args ? ' ' + args : ''}`;
  }

  public get changeDirectoryToWorkspaceRoot(): boolean {
    return vscode.workspace.getConfiguration().get('pytestrunner.changeDirectoryToWorkspaceRoot') ?? true;
  }

  public get preserveEditorFocus(): boolean {
    return vscode.workspace.getConfiguration().get('pytestrunner.preserveEditorFocus') || false;
  }

  public get pytestPath(): string {
    const pytestPath: string | undefined = vscode.workspace.getConfiguration().get('pytestrunner.pytestPath');
    return pytestPath ?? 'pytest';
  }

  public get usePoetry(): boolean {
    const usePoetry: boolean | undefined = vscode.workspace.getConfiguration().get('pytestrunner.usePoetry');
    return usePoetry !== undefined ? usePoetry : true;
  }

  public get poetryPath(): string {
    const poetryPath: string | undefined = vscode.workspace.getConfiguration().get('pytestrunner.poetryPath');
    return poetryPath ?? 'poetry';
  }

  public get virtualEnvPath(): string {
    const customPath: string | undefined = vscode.workspace.getConfiguration().get('pytestrunner.virtualEnvPath');
    if (customPath) {
      return customPath;
    }

    // Try to get Poetry virtual environment path
    if (this.usePoetry && this.detectPoetryProject()) {
      const poetryEnvPath = this.getPoetryVirtualEnvPath();
      if (poetryEnvPath) {
        return poetryEnvPath;
      }
    }

    return '';
  }

  public get pytestArgs(): string[] {
    const args = vscode.workspace.getConfiguration().get('pytestrunner.pytestArgs');
    if (Array.isArray(args)) {
      return args;
    }
    return ['-v']; // Default verbose output
  }

  public get cwd(): string {
    // For Poetry projects, always use the project root (where pyproject.toml is located)
    if (this.usePoetry && this.detectPoetryProject()) {
      const poetryRoot = this.getPoetryProjectRoot();
      if (poetryRoot) {
        return poetryRoot;
      }
    }

    // For non-Poetry projects, use virtual environment path if specified
    const venvPath = this.virtualEnvPath;
    if (venvPath) {
      return venvPath;
    }

    return this.currentWorkspaceFolderPath;
  }

  private get currentWorkspaceFolderPath(): string {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ?? '';
    }
    return vscode.workspace.getWorkspaceFolder(editor.document.uri)?.uri.fsPath ?? '';
  }

  /**
   * Detect if the current project is a Poetry project by looking for pyproject.toml with [tool.poetry]
   */
  public detectPoetryProject(): boolean {
    const projectRoot = this.getPoetryProjectRoot();
    if (!projectRoot) {
      return false;
    }

    const pyprojectPath = path.join(projectRoot, 'pyproject.toml');
    if (!fs.existsSync(pyprojectPath)) {
      return false;
    }

    try {
      const content = fs.readFileSync(pyprojectPath, 'utf8');
      return content.includes('[tool.poetry]');
    } catch {
      return false;
    }
  }

  /**
   * Find the Poetry project root by looking for pyproject.toml
   */
  public getPoetryProjectRoot(): string | null {
    // Start from the active file directory, or workspace root if no active file
    const startPath = vscode.window.activeTextEditor?.document?.uri?.fsPath
      ? path.dirname(vscode.window.activeTextEditor.document.uri.fsPath)
      : this.currentWorkspaceFolderPath;

    // Helper function to check if a directory contains a Poetry project
    const checkPoetryProject = (dirPath: string): string | null => {
      const pyprojectPath = path.join(dirPath, 'pyproject.toml');
      if (fs.existsSync(pyprojectPath)) {
        try {
          const content = fs.readFileSync(pyprojectPath, 'utf8');
          if (content.includes('[tool.poetry]')) {
            return dirPath;
          }
        } catch {
          // If we can't read the file, skip it
        }
      }
      return null;
    };

    // Check workspace root first (common case for Poetry projects)
    const workspaceCheck = checkPoetryProject(this.currentWorkspaceFolderPath);
    if (workspaceCheck) {
      return normalizePath(workspaceCheck);
    }

    // Then search from current file up to workspace root
    const foundPath = searchPathToParent<string>(
      startPath,
      this.currentWorkspaceFolderPath,
      (currentFolderPath: string) => checkPoetryProject(currentFolderPath),
    );

    return foundPath ? normalizePath(foundPath) : null;
  }

  /**
   * Get Poetry virtual environment path by executing 'poetry env info --path'
   */
  public getPoetryVirtualEnvPath(): string | null {
    const projectRoot = this.getPoetryProjectRoot();
    if (!projectRoot) {
      return null;
    }
    try {
      const result = execSync(`${this.poetryPath} env info --path`, {
        cwd: projectRoot,
        encoding: 'utf8',
        timeout: 5000,
      });
      return result.toString().trim();
    } catch {
      return null;
    }
  }

  public getPytestConfigPath(targetPath: string): string {
    // custom
    const configPathOrMapping: string | Record<string, string> | undefined = vscode.workspace
      .getConfiguration()
      .get('pytestrunner.configPath');

    const configPath = resolveConfigPathOrMapping(configPathOrMapping, targetPath);
    if (!configPath) {
      return this.findPytestConfigPath(targetPath);
    }

    // default
    return normalizePath(path.resolve(this.currentWorkspaceFolderPath, configPath));
  }

  public findPytestConfigPath(targetPath?: string): string {
    const foundPath = searchPathToParent<string>(
      targetPath ||
        path.dirname(vscode.window.activeTextEditor?.document?.uri?.fsPath || this.currentWorkspaceFolderPath),
      this.currentWorkspaceFolderPath,
      (currentFolderPath: string) => {
        // Check for pytest configuration files in order of precedence
        for (const configFilename of ['pytest.ini', 'pyproject.toml', 'setup.cfg']) {
          const currentFolderConfigPath = path.join(currentFolderPath, configFilename);

          if (fs.existsSync(currentFolderConfigPath)) {
            return currentFolderConfigPath;
          }
        }
      },
    );
    return foundPath ? normalizePath(foundPath) : '';
  }

  public get runOptions(): string[] | null {
    // This was Jest-specific, keeping for compatibility but may not be used
    return null;
  }

  public get debugOptions(): Partial<vscode.DebugConfiguration> {
    const debugOptions = vscode.workspace.getConfiguration().get('pytestrunner.debugOptions');
    if (debugOptions) {
      return debugOptions;
    }

    // default Python debug configuration for pytest
    return {
      type: 'python',
      request: 'launch',
      module: 'pytest',
      console: 'integratedTerminal',
      python: this.getPythonPath(),
    };
  }

  /**
   * Get the Python executable path for the virtual environment
   */
  private getPythonPath(): string {
    const venvPath = this.virtualEnvPath;
    if (venvPath) {
      const pythonPath =
        process.platform === 'win32'
          ? path.join(venvPath, 'Scripts', 'python.exe')
          : path.join(venvPath, 'bin', 'python');
      if (fs.existsSync(pythonPath)) {
        return pythonPath;
      }
    }
    return 'python'; // fallback to system python
  }

  public get isCodeLensDisabled(): boolean {
    const isCodeLensDisabled: boolean | undefined = vscode.workspace
      .getConfiguration()
      .get('pytestrunner.disableCodeLens');
    return isCodeLensDisabled ?? false;
  }

  public get isRunInExternalNativeTerminal(): boolean {
    // Keep this for compatibility, though it may not be used in pytest version
    return false;
  }

  public get codeLensOptions(): CodeLensOption[] {
    const codeLensOptions = vscode.workspace.getConfiguration().get('pytestrunner.codeLens');
    if (Array.isArray(codeLensOptions)) {
      return validateCodeLensOptions(codeLensOptions);
    }
    return ['run', 'debug']; // default options for pytest
  }

  public get codeLensSelector(): string {
    const selector: string | undefined = vscode.workspace.getConfiguration().get('pytestrunner.codeLensSelector');
    return selector ?? '**/{test_*.py,*_test.py}';
  }

  public get includePatterns(): string[] {
    const patterns = vscode.workspace.getConfiguration().get('pytestrunner.include');
    return Array.isArray(patterns) ? patterns : [];
  }

  public get excludePatterns(): string[] {
    const patterns = vscode.workspace.getConfiguration().get('pytestrunner.exclude');
    return Array.isArray(patterns) ? patterns : [];
  }
}
