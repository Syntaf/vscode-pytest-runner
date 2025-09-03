'use strict';
import * as vscode from 'vscode';

import { PytestRunner } from './pytestRunner';
import { PytestRunnerCodeLensProvider } from './PytestRunnerCodeLensProvider';
import { PytestRunnerConfig } from './pytestRunnerConfig';

export function activate(context: vscode.ExtensionContext): void {
  const config = new PytestRunnerConfig();
  const pytestRunner = new PytestRunner(config);
  const codeLensProvider = new PytestRunnerCodeLensProvider(config.codeLensOptions);

  const runPytest = vscode.commands.registerCommand(
    'extension.runPytest',
    async (argument: Record<string, unknown> | string) => {
      return pytestRunner.runCurrentTest(argument);
    }
  );

  const runPytestCoverage = vscode.commands.registerCommand(
    'extension.runPytestCoverage',
    async (argument: Record<string, unknown> | string) => {
      return pytestRunner.runCurrentTest(argument, ['--cov']);
    }
  );

  const runPytestPath = vscode.commands.registerCommand('extension.runPytestPath', async (argument: vscode.Uri) =>
    pytestRunner.runTestsOnPath(argument.fsPath)
  );

  const runPrevPytest = vscode.commands.registerCommand('extension.runPrevPytest', async () => 
    pytestRunner.runPreviousTest()
  );

  const runPytestFile = vscode.commands.registerCommand('extension.runPytestFile', async () => 
    pytestRunner.runCurrentFile()
  );

  const debugPytest = vscode.commands.registerCommand(
    'extension.debugPytest',
    async (argument: Record<string, unknown> | string) => {
      if (typeof argument === 'string') {
        return pytestRunner.debugCurrentTest(argument);
      } else {
        return pytestRunner.debugCurrentTest();
      }
    }
  );

  const debugPytestPath = vscode.commands.registerCommand('extension.debugPytestPath', async (argument: vscode.Uri) =>
    pytestRunner.debugTestsOnPath(argument.fsPath)
  );

  const runPytestFileWithCoverage = vscode.commands.registerCommand('extension.runPytestFileWithCoverage', async () =>
    pytestRunner.runCurrentFile(['--cov'])
  );

  const runPytestFileWithWatchMode = vscode.commands.registerCommand('extension.runPytestFileWithWatchMode', async () =>
    pytestRunner.runCurrentFile(['--looponfail'])
  );

  const watchPytest = vscode.commands.registerCommand(
    'extension.watchPytest',
    async (argument: Record<string, unknown> | string) => {
      return pytestRunner.runCurrentTest(argument, ['--looponfail']);
    }
  );

  // Register CodeLens provider if not disabled
  if (!config.isCodeLensDisabled) {
    const docSelectors: vscode.DocumentFilter[] = [
      {
        pattern: config.codeLensSelector,
      },
    ];
    const codeLensProviderDisposable = vscode.languages.registerCodeLensProvider(docSelectors, codeLensProvider);
    context.subscriptions.push(codeLensProviderDisposable);
  }

  // Add all command subscriptions
  context.subscriptions.push(runPytest);
  context.subscriptions.push(runPytestCoverage);
  context.subscriptions.push(runPytestPath);
  context.subscriptions.push(runPrevPytest);
  context.subscriptions.push(runPytestFile);
  context.subscriptions.push(debugPytest);
  context.subscriptions.push(debugPytestPath);
  context.subscriptions.push(runPytestFileWithCoverage);
  context.subscriptions.push(runPytestFileWithWatchMode);
  context.subscriptions.push(watchPytest);
}

export function deactivate(): void {
  // deactivate
}