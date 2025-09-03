# Phase 2 Tasks: Core Logic Refactoring

This document contains all specific tasks required to complete Phase 2 of the Jest Runner to Pytest Runner refactoring.

## Task Categories

- 🔧 **Core Classes**: Main class transformations and logic updates
- 📦 **Dependencies**: Package and build system updates
- 🐍 **Python Integration**: New Python-specific functionality
- 🧪 **Testing**: Test file updates and validation
- 🎯 **Validation**: Integration testing and verification

---

## 2.1 Configuration Management Transformation

### 🔧 TASK-2.1.1: Rename and Update JestRunnerConfig Class
- [ ] Rename file: `src/jestRunnerConfig.ts` → `src/pytestRunnerConfig.ts`
- [ ] Rename class: `JestRunnerConfig` → `PytestRunnerConfig`
- [ ] Update all imports in other files to use `PytestRunnerConfig`
- [ ] Update class documentation to reference pytest instead of Jest

### 🔧 TASK-2.1.2: Transform Configuration Properties
- [ ] Replace `jestCommand` getter with `pytestCommand` getter
- [ ] Replace `jestBinPath` with `pytestBinPath` property
- [ ] Remove `isYarnPnpSupportEnabled` property (Jest-specific)
- [ ] Remove `yarnPnpCommand` property (Jest-specific)
- [ ] Update all `vscode.workspace.getConfiguration()` calls from `'jestrunner.*'` to `'pytestrunner.*'`

### 🔧 TASK-2.1.3: Add Poetry Integration Properties
- [ ] Add `usePoetry` getter that reads `pytestrunner.usePoetry` setting
- [ ] Add `poetryPath` getter that reads `pytestrunner.poetryPath` setting  
- [ ] Add `virtualEnvPath` getter that reads `pytestrunner.virtualEnvPath` setting
- [ ] Add `pytestArgs` getter that reads `pytestrunner.pytestArgs` setting

### 🔧 TASK-2.1.4: Implement Poetry Project Detection
- [ ] Add `detectPoetryProject()` method to check for `pyproject.toml` with `[tool.poetry]`
- [ ] Add `getVirtualEnvPath()` method that executes `poetry env info --path`
- [ ] Add `getPoetryProjectRoot()` method to find nearest `pyproject.toml`
- [ ] Add error handling for Poetry command failures

### 🔧 TASK-2.1.5: Update Pytest Command Building
- [ ] Implement `pytestCommand` getter that builds Poetry or direct pytest commands
- [ ] Add logic: if `usePoetry` and poetry project detected → `poetry run pytest`
- [ ] Add logic: else → direct `pytest` command
- [ ] Include `pytestArgs` in command building
- [ ] Update `quote()` usage for Python path handling

### 🔧 TASK-2.1.6: Update Configuration File Resolution
- [ ] Remove Jest config resolution logic (`jest.config.js`, etc.)
- [ ] Add pytest config resolution: `pytest.ini`, `pyproject.toml`, `setup.cfg`
- [ ] Implement `resolvePytestConfig()` method
- [ ] Add support for `pytestrunner.configPath` setting override

---

## 2.2 Test File Parsing Transformation

### 🔧 TASK-2.2.1: Remove Jest Parser Dependencies
- [ ] Remove `jest-editor-support` import from `src/parser.ts`
- [ ] Remove `ParsedNode` type export
- [ ] Remove `parse` function export from jest-editor-support
- [ ] Update package.json to remove `jest-editor-support` dependency

### 🐍 TASK-2.2.2: Implement Python AST Parser (Option 1: Subprocess)
- [ ] Create `src/python-parser/ast_parser.py` Python script
- [ ] Implement Python AST parsing for test functions (`def test_*`)
- [ ] Implement Python AST parsing for test classes (`class Test*`)
- [ ] Add support for parametrized tests detection
- [ ] Return JSON output with test names, line numbers, and types

### 🔧 TASK-2.2.3: Create TypeScript Parser Interface
- [ ] Create `PythonTestParser` class in `src/parser.ts`
- [ ] Implement `parseTestFile(filePath: string)` method using subprocess
- [ ] Create `PythonTestNode` interface (equivalent to `ParsedNode`)
- [ ] Add error handling for Python subprocess execution
- [ ] Add fallback regex parsing for when Python is unavailable

### 🔧 TASK-2.2.4: Update Parser Output Format
- [ ] Define `PythonTestNode` interface with: name, line, type, children
- [ ] Ensure compatibility with existing CodeLens provider expectations
- [ ] Handle test classes containing test methods (nested structure)
- [ ] Support pytest fixtures and parametrized test detection

### 🐍 TASK-2.2.5: Alternative: Tree-sitter Implementation (Optional)
- [ ] Research `tree-sitter-python` npm package integration
- [ ] Create TypeScript-native Python parsing (if subprocess approach fails)
- [ ] Implement direct syntax tree traversal for Python tests
- [ ] Benchmark performance vs subprocess approach

---

## 2.3 Command Execution Engine Transformation

### 🔧 TASK-2.3.1: Rename and Update JestRunner Class
- [ ] Rename file: `src/jestRunner.ts` → `src/pytestRunner.ts`
- [ ] Rename class: `JestRunner` → `PytestRunner`
- [ ] Update constructor to accept `PytestRunnerConfig`
- [ ] Update all method signatures and documentation

### 🔧 TASK-2.3.2: Transform Command Building Methods
- [ ] Replace `buildJestCommand()` with `buildPytestCommand()`
- [ ] Update test selection to use pytest's `-k` option instead of Jest patterns
- [ ] Handle Python test file paths and test name formatting
- [ ] Support pytest-specific arguments (--verbose, --tb=short, etc.)

### 🔧 TASK-2.3.3: Update Test Execution Methods
- [ ] Update `runCurrentTest()` method for pytest execution
- [ ] Update `runTestsOnPath()` method for Python files
- [ ] Update `runCurrentFile()` method for .py files
- [ ] Remove `runJestAndUpdateSnapshots()` method (not applicable)
- [ ] Update all methods to use pytest command building

### 🔧 TASK-2.3.4: Transform Test Name Resolution
- [ ] Replace Jest test name pattern matching with Python patterns
- [ ] Update `getCurrentTestName()` to handle Python test functions
- [ ] Support test class and method combinations: `TestClass::test_method`
- [ ] Handle pytest parametrized test selection

### 🐍 TASK-2.3.5: Add Poetry Integration to Command Execution
- [ ] Update command execution to use Poetry virtual environment
- [ ] Add working directory resolution for Poetry projects
- [ ] Handle Poetry environment activation in terminal commands
- [ ] Add fallback to system Python if Poetry unavailable

### 🔧 TASK-2.3.6: Update Debug Configuration Creation
- [ ] Remove Jest debug configuration logic
- [ ] Implement Python debug configuration for VS Code
- [ ] Create debug config template for pytest debugging
- [ ] Handle Poetry virtual environment in debug configuration
- [ ] Support pytest module execution: `python -m pytest`

---

## 2.4 CodeLens Provider Transformation

### 🔧 TASK-2.4.1: Rename and Update CodeLens Provider
- [ ] Rename file: `src/JestRunnerCodeLensProvider.ts` → `src/PytestRunnerCodeLensProvider.ts`
- [ ] Rename class: `JestRunnerCodeLensProvider` → `PytestRunnerCodeLensProvider`
- [ ] Update command mappings from `extension.runJest*` to `extension.runPytest*`
- [ ] Update title mappings to use pytest terminology

### 🔧 TASK-2.4.2: Update File Pattern Matching
- [ ] Update file inclusion logic for Python test files
- [ ] Replace JavaScript/TypeScript patterns with Python patterns
- [ ] Handle `test_*.py` and `*_test.py` file naming conventions
- [ ] Update workspace folder path resolution for Python projects

### 🔧 TASK-2.4.3: Integrate New Python Parser
- [ ] Replace `parse()` call with new `PythonTestParser.parseTestFile()`
- [ ] Handle `PythonTestNode` objects instead of Jest `ParsedNode`
- [ ] Update test block traversal for Python AST structure
- [ ] Handle Python-specific test patterns (classes, functions, methods)

### 🔧 TASK-2.4.4: Update CodeLens Command Generation
- [ ] Remove 'current-test-coverage' option (not initially supported)
- [ ] Update command arguments for pytest test selection
- [ ] Handle test class and method name formatting for commands
- [ ] Support pytest-specific options in CodeLens commands

---

## 2.5 Extension Entry Point Updates

### 🔧 TASK-2.5.1: Update Extension Imports
- [ ] Update import: `JestRunner` → `PytestRunner`
- [ ] Update import: `JestRunnerCodeLensProvider` → `PytestRunnerCodeLensProvider`
- [ ] Update import: `JestRunnerConfig` → `PytestRunnerConfig`
- [ ] Add any new imports for Python integration

### 🔧 TASK-2.5.2: Update Command Registration
- [ ] Update all `vscode.commands.registerCommand` calls to use new pytest command IDs
- [ ] Update `'extension.runJest'` → `'extension.runPytest'` etc.
- [ ] Remove `runJestAndUpdateSnapshots` command registration
- [ ] Verify all command handlers point to correct `PytestRunner` methods

### 🔧 TASK-2.5.3: Update CodeLens Provider Registration
- [ ] Update CodeLens provider instantiation with `PytestRunnerCodeLensProvider`
- [ ] Verify Python file pattern selector is working
- [ ] Update document filter to target Python files appropriately

---

## 2.6 Utility Functions Updates

### 🔧 TASK-2.6.1: Update Test Name Utilities
- [ ] Update `findFullTestName()` function for Python test patterns
- [ ] Modify to handle Python AST node structure instead of Jest nodes
- [ ] Support Python test class and method hierarchies
- [ ] Handle pytest parametrized test names

### 🔧 TASK-2.6.2: Add Poetry Utility Functions
- [ ] Add `detectPoetryProject(projectPath: string): boolean`
- [ ] Add `getPoetryVirtualEnv(projectPath: string): string | null`
- [ ] Add `buildPoetryCommand(baseCommand: string): string`
- [ ] Add error handling utilities for Poetry command failures

### 🔧 TASK-2.6.3: Update Path Utilities
- [ ] Update path resolution functions for Python project structure
- [ ] Add Python virtual environment path handling
- [ ] Update file pattern utilities for Python naming conventions
- [ ] Ensure cross-platform compatibility for Python paths

### 🔧 TASK-2.6.4: Update Configuration Utilities
- [ ] Update `validateCodeLensOptions()` for pytest options
- [ ] Remove Jest-specific configuration validation
- [ ] Add pytest configuration file parsing utilities
- [ ] Add Poetry project detection utilities

---

## 2.7 Dependencies and Build Configuration

### 📦 TASK-2.7.1: Remove Jest-Related Dependencies
- [ ] Remove `jest-editor-support` from package.json dependencies
- [ ] Remove `@types/jest` from devDependencies (keep for testing if needed)
- [ ] Remove `jest` from devDependencies (replace with alternative test runner)
- [ ] Remove `ts-jest` from devDependencies

### 📦 TASK-2.7.2: Add Python Integration Dependencies
- [ ] Research and add Python AST parsing dependencies if needed
- [ ] Consider `tree-sitter-python` if using tree-sitter approach
- [ ] Add any subprocess execution utilities if needed
- [ ] Update TypeScript types for new interfaces

### 📦 TASK-2.7.3: Update Build Scripts
- [ ] Update `npm run test` script to use alternative test runner (or remove)
- [ ] Verify `npm run build` and `npm run watch` still work
- [ ] Update webpack configuration if new dependencies added
- [ ] Test extension packaging with `vscode:prepublish`

### 📦 TASK-2.7.4: Update Development Dependencies
- [ ] Consider replacing Jest with Mocha or Vitest for testing
- [ ] Update test configuration for new test runner
- [ ] Ensure ESLint and Prettier configurations remain compatible
- [ ] Update TypeScript compilation targets if needed

---

## 2.8 Testing and Validation

### 🧪 TASK-2.8.1: Update Unit Tests
- [ ] Rename test files: `jestRunnerConfig.test.ts` → `pytestRunnerConfig.test.ts`
- [ ] Update test cases for `PytestRunnerConfig` class
- [ ] Update utility function tests for Python patterns
- [ ] Remove Jest-specific test cases

### 🧪 TASK-2.8.2: Create Python Parser Tests
- [ ] Create test cases for `PythonTestParser` class
- [ ] Test Python AST parsing with sample test files
- [ ] Test error handling for invalid Python syntax
- [ ] Test subprocess execution and fallback mechanisms

### 🧪 TASK-2.8.3: Create Integration Tests
- [ ] Create sample Python test files for testing
- [ ] Test end-to-end command execution (without actual pytest execution)
- [ ] Test CodeLens provider with Python test files
- [ ] Test Poetry project detection and virtual environment resolution

### 🧪 TASK-2.8.4: Create Poetry Integration Tests
- [ ] Test Poetry project detection in various scenarios
- [ ] Test virtual environment path resolution
- [ ] Test command building with and without Poetry
- [ ] Test fallback behavior when Poetry unavailable

---

## 🎯 Validation Tasks

### 🔧 TASK-2.V.1: Code Compilation and Build Validation
- [ ] Verify all TypeScript files compile without errors
- [ ] Run `npm run build` and ensure successful webpack compilation
- [ ] Test `npm run watch` mode for development
- [ ] Verify no broken imports or missing dependencies

### 🔧 TASK-2.V.2: Extension Loading Validation
- [ ] Test extension loads in VS Code without errors
- [ ] Verify all commands are registered and appear in command palette
- [ ] Test that Python file CodeLens appears on test files
- [ ] Verify context menus work with Python test files

### 🔧 TASK-2.V.3: Python Integration Validation
- [ ] Test with Poetry project: virtual environment detection works
- [ ] Test with non-Poetry project: direct pytest execution works
- [ ] Test Python test file parsing with various test structures
- [ ] Verify error handling when Python/Poetry unavailable

### 🔧 TASK-2.V.4: Command Functionality Validation
- [ ] Test pytest command building produces valid commands
- [ ] Test test name resolution works with Python test functions
- [ ] Test working directory resolution for Poetry projects
- [ ] Verify debug configuration creation (structure only, not execution)

### 🔧 TASK-2.V.5: Comprehensive Integration Testing
- [ ] Test complete workflow: open Python test file → see CodeLens → verify commands
- [ ] Test with sample Poetry project structure
- [ ] Test with non-Poetry Python project
- [ ] Test error scenarios: no Python, no pytest, invalid files

---

## Dependencies Between Tasks

### Critical Path Dependencies:
1. **2.1 → 2.3, 2.5**: Configuration must be updated before runner and extension
2. **2.2 → 2.4**: Parser must be implemented before CodeLens provider
3. **2.1, 2.2, 2.3, 2.4 → 2.5**: All core classes before extension updates
4. **2.7.1 → 2.2**: Remove jest-editor-support before implementing new parser
5. **All core tasks → 2.8, 2.V**: Implementation before testing/validation

### Parallel Development Opportunities:
- 2.1 (Config) and 2.2 (Parser) can be developed simultaneously
- 2.6 (Utils) can be updated alongside other components
- 2.7 (Dependencies) can be started early
- 2.8 (Testing) can begin as soon as core classes are available

---

## Implementation Strategy

### 🔄 Recommended Order:
1. **Start with 2.7.1**: Remove Jest dependencies to avoid conflicts
2. **Implement 2.1**: Configuration transformation (foundation)
3. **Implement 2.2**: Python parser (critical new functionality)
4. **Implement 2.6**: Utility function updates (supporting functions)
5. **Implement 2.3**: Command execution engine (core logic)
6. **Implement 2.4**: CodeLens provider (user interface)
7. **Implement 2.5**: Extension entry point (integration)
8. **Complete 2.7**: Build system updates
9. **Execute 2.8 & 2.V**: Testing and validation

### ⚠️ Important Considerations:
- **Incremental Testing**: Test each component as it's completed
- **Backup Strategy**: Commit after each major task section
- **Error Handling**: Implement robust error handling for Python integration
- **Cross-Platform**: Ensure Windows/Mac/Linux compatibility
- **Performance**: Consider subprocess execution performance implications

---

## Success Criteria

Phase 2 is complete when:
- [ ] All TypeScript files compile without errors
- [ ] Extension loads in VS Code without configuration errors
- [ ] Python test files display CodeLens with run/debug options
- [ ] Poetry projects are detected and virtual environments resolved
- [ ] Pytest commands are built correctly (structure validation)
- [ ] Debug configurations are created properly (structure validation)
- [ ] No Jest-related code or dependencies remain
- [ ] All unit tests pass with new implementation
- [ ] Integration tests demonstrate end-to-end functionality

---

**Total Tasks**: 89 individual tasks across 8 categories
**Estimated Time**: 4-5 days for experienced developer
**Prerequisites**: Phase 1 completion, Python/Poetry development environment
**Next Phase**: Phase 3 - Python Integration Features

---

## Quick Reference: File Transformations

| Current File | New File | Status |
|-------------|----------|---------|
| `src/jestRunnerConfig.ts` | `src/pytestRunnerConfig.ts` | Rename + Transform |
| `src/jestRunner.ts` | `src/pytestRunner.ts` | Rename + Transform |
| `src/JestRunnerCodeLensProvider.ts` | `src/PytestRunnerCodeLensProvider.ts` | Rename + Transform |
| `src/parser.ts` | `src/parser.ts` | Complete Rewrite |
| `src/extension.ts` | `src/extension.ts` | Update Imports/Commands |
| `src/util.ts` | `src/util.ts` | Add Python/Poetry Utils |
| `src/test/*.test.ts` | `src/test/*.test.ts` | Update for New Classes |
| - | `src/python-parser/ast_parser.py` | New Python Script |