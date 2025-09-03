# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VSCode Jest Runner is a Visual Studio Code extension that provides an easy way to run or debug Jest tests from the editor context menu, CodeLens, or command palette. It focuses on running specific tests rather than entire test suites.

## Development Commands

- **Build**: `npm run build` or `webpack --mode development`
- **Watch mode**: `npm run watch` or `webpack --mode development --watch`
- **Test**: `npm run test` (runs `jest .src/test`)
- **Lint**: `npm run eslint:fix`
- **Format**: `npm run prettier`
- **Publish**: `npm run vscode:prepublish` (webpack production build)

## Architecture

### Core Components

- **`src/extension.ts`** - Main entry point that activates the extension and registers all VS Code commands and providers
- **`src/jestRunner.ts`** - Core `JestRunner` class that handles test execution, debugging, and terminal management
- **`src/jestRunnerConfig.ts`** - `JestRunnerConfig` class that manages extension configuration and Jest command building
- **`src/JestRunnerCodeLensProvider.ts`** - Provides CodeLens functionality to show run/debug buttons above test functions
- **`src/parser.ts`** - Parses test files to identify test blocks and describe blocks using `jest-editor-support`
- **`src/util.ts`** - Utility functions for path handling, escaping, and configuration validation

### Key Architecture Patterns

1. **Command Registration**: All Jest runner commands are registered in `extension.ts` and delegate to `JestRunner` methods
2. **Configuration Management**: Extension settings are centralized in `JestRunnerConfig` with dynamic Jest path resolution
3. **Test Discovery**: Uses `jest-editor-support` library for parsing test files and identifying runnable test blocks
4. **Terminal Management**: Supports both integrated VS Code terminal and external native terminal execution
5. **CodeLens Integration**: Provides inline run/debug buttons above test functions based on configurable selectors

### Extension Configuration

The extension supports extensive configuration through VS Code settings (all prefixed with `jestrunner.`):
- Jest path and config resolution (supports monorepos and custom setups)
- Debug options and runtime configuration
- CodeLens customization and file selectors
- Yarn PnP support
- Custom Jest commands (e.g., for Create React App)

### Development Setup

The extension is built with:
- **TypeScript** with strict configuration
- **Webpack** for bundling (excludes `vscode` module)
- **ESLint + Prettier** for code quality
- **Jest** for testing (tests in `src/test/`)

### Test Execution Flow

1. User triggers command via context menu, CodeLens, or command palette
2. `JestRunner` resolves the appropriate Jest configuration and command
3. Parser identifies the specific test or test suite to run
4. Command is executed in terminal with proper working directory and arguments
5. For debugging, VS Code debug configuration is dynamically created and launched