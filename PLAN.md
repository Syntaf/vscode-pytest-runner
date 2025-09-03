# Pytest Runner Extension - Refactoring Plan

## Overview

This document outlines the comprehensive plan for refactoring the VSCode Jest Runner extension to create a Pytest Runner extension that works with Python tests using pytest and Poetry package management.

## Objectives

- Transform Jest Runner into Pytest Runner while maintaining the same user experience
- Support Python test files with pytest test discovery
- Integrate with Poetry for dependency management and virtual environment handling
- Provide CodeLens functionality for Python test functions and classes
- Support pytest configuration files and command-line options
- Enable debugging of Python tests through VS Code's Python debugger

## Architecture Changes

### Core Component Transformations

| Current (Jest) | New (Pytest) | Changes Required |
|---------------|-------------|------------------|
| `jest-editor-support` parser | Python AST parser | Replace JavaScript/TypeScript parsing with Python AST parsing |
| Jest command building | Pytest command building | Build `pytest` commands instead of `jest` commands |
| Node.js/npm ecosystem | Python/Poetry ecosystem | Replace npm/yarn with Poetry commands |
| Jest config resolution | Pytest config resolution | Handle `pytest.ini`, `pyproject.toml`, `setup.cfg` |
| JavaScript test patterns | Python test patterns | Match `test_*.py`, `*_test.py` files |
| Node.js debugging | Python debugging | Use VS Code Python debugger configuration |

### New Dependencies Required

- **Python AST parsing**: Built-in `ast` module via Python subprocess or `tree-sitter-python`
- **Poetry integration**: Execute Poetry commands for environment management
- **Pytest discovery**: Run `pytest --collect-only` for test discovery
- **Python debugging**: Integrate with VS Code Python extension debugging

## Implementation Phases

### Phase 1: Foundation Changes (Core Architecture)

#### 1.1 Update Package Metadata
- **File**: `package.json`
- **Changes**:
  - Update name: `vscode-jest-runner` → `vscode-pytest-runner`
  - Update displayName: `Jest Runner` → `Pytest Runner`
  - Update description to reflect Python/pytest functionality
  - Add dependency on VS Code Python extension
  - Update keywords and categories

#### 1.2 Configuration Schema Updates
- **File**: `package.json` (contributes.configuration)
- **Changes**:
  - Replace `jestrunner.*` settings with `pytestrunner.*`
  - Add Poetry-specific settings:
    - `pytestrunner.poetryPath`: Path to Poetry executable
    - `pytestrunner.usePoetry`: Enable/disable Poetry integration
    - `pytestrunner.virtualEnvPath`: Custom virtual environment path
  - Update pytest-specific settings:
    - `pytestrunner.pytestPath`: Path to pytest executable
    - `pytestrunner.configPath`: pytest.ini, pyproject.toml, setup.cfg
    - `pytestrunner.pytestArgs`: Default pytest arguments
    - `pytestrunner.codeLensSelector`: Python test file pattern

#### 1.3 Command Registration Updates
- **File**: `package.json` (contributes.commands)
- **Changes**:
  - Rename commands: `extension.runJest*` → `extension.runPytest*`
  - Update command titles to reflect pytest functionality
  - Update context menu integration for Python files

### Phase 2: Core Logic Refactoring

#### 2.1 Configuration Management
- **File**: `src/jestRunnerConfig.ts` → `src/pytestRunnerConfig.ts`
- **Changes**:
  - Replace Jest path resolution with pytest/Poetry path resolution
  - Add Poetry virtual environment detection
  - Handle Poetry project detection (`pyproject.toml` presence)
  - Update pytest configuration file resolution (pytest.ini, pyproject.toml, setup.cfg)
  - Add Poetry command building (e.g., `poetry run pytest`)

#### 2.2 Test File Parsing
- **File**: `src/parser.ts`
- **Changes**:
  - Remove `jest-editor-support` dependency
  - Implement Python AST parsing for test discovery
  - Parse Python test functions (`def test_*`) and test classes (`class Test*`)
  - Extract test names and line numbers for CodeLens positioning
  - Support pytest parametrized tests and fixtures

**New Parser Implementation Options:**
1. **Python subprocess approach**: Run Python script to parse AST
2. **Tree-sitter approach**: Use `tree-sitter-python` for parsing
3. **Regex approach**: Simple pattern matching (fallback)

#### 2.3 Command Execution Engine
- **File**: `src/jestRunner.ts` → `src/pytestRunner.ts`
- **Changes**:
  - Replace Jest command building with pytest command building
  - Add Poetry integration (`poetry run pytest` vs direct `pytest`)
  - Handle Python virtual environment activation
  - Update test name formatting for pytest's `-k` option
  - Support pytest-specific arguments (`--verbose`, `--tb=short`, etc.)

#### 2.4 CodeLens Provider
- **File**: `src/JestRunnerCodeLensProvider.ts` → `src/PytestRunnerCodeLensProvider.ts`
- **Changes**:
  - Update file pattern matching for Python test files
  - Adapt to new Python parser output format
  - Update CodeLens command mappings
  - Handle Python-specific test structures (classes, methods, functions)

### Phase 3: Python Integration Features

#### 3.1 Poetry Integration
- **New functionality**:
  - Detect Poetry projects (`pyproject.toml` with `[tool.poetry]`)
  - Resolve virtual environment path from Poetry
  - Build commands with `poetry run` prefix when applicable
  - Handle Poetry dependency groups (dev, test)

#### 3.2 Pytest Configuration Resolution
- **New functionality**:
  - Parse `pytest.ini` files
  - Extract pytest configuration from `pyproject.toml` (`[tool.pytest.ini_options]`)
  - Handle `setup.cfg` pytest configuration
  - Support pytest plugins and markers

### Phase 4: Debug Integration

#### 4.1 Python Debug Configuration
- **File**: `src/pytestRunner.ts` (debug methods)
- **Changes**:
  - Create VS Code Python debug configurations
  - Integration with Python extension's debugger
  - Handle Poetry virtual environment in debug config
  - Support pytest debugging with breakpoints

#### 4.2 Debug Configuration Template
```json
{
  "name": "Debug Pytest",
  "type": "python",
  "request": "launch",
  "module": "pytest",
  "args": ["${file}::${function}", "-s", "-v"],
  "console": "integratedTerminal",
  "python": "${workspaceFolder}/.venv/bin/python"
}
```

### Phase 5: File Structure Updates

#### 5.1 Utility Functions
- **File**: `src/util.ts`
- **Changes**:
  - Add Poetry project detection functions
  - Add Python virtual environment path resolution
  - Update path utilities for Python conventions
  - Add pytest configuration parsing utilities

#### 5.2 Extension Entry Point
- **File**: `src/extension.ts`
- **Changes**:
  - Update imports to use new class names
  - Register new command handlers
  - Update CodeLens provider registration with Python file patterns

## Technical Implementation Details

### Python Test Parsing Strategy

#### Option 1: Python AST via Subprocess (Recommended)
```python
# Helper Python script for test parsing
import ast
import json
import sys

def parse_test_file(filepath):
    with open(filepath, 'r') as f:
        tree = ast.parse(f.read())
    
    tests = []
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef) and node.name.startswith('test_'):
            tests.append({
                'name': node.name,
                'line': node.lineno,
                'type': 'function'
            })
        elif isinstance(node, ast.ClassDef) and node.name.startswith('Test'):
            tests.append({
                'name': node.name,
                'line': node.lineno,
                'type': 'class'
            })
    
    return tests
```

#### Option 2: Tree-sitter Integration
- Use `tree-sitter-python` npm package
- Parse Python syntax tree directly in TypeScript
- More complex but keeps everything in Node.js

### Poetry Integration Strategy

```typescript
class PytestRunnerConfig {
  private detectPoetryProject(): boolean {
    return fs.existsSync(path.join(this.projectRoot, 'pyproject.toml'));
  }
  
  private getVirtualEnvPath(): string {
    if (this.usePoetry) {
      try {
        const result = execSync('poetry env info --path', { cwd: this.projectRoot });
        return result.toString().trim();
      } catch {
        return null;
      }
    }
    return this.config.get('virtualEnvPath');
  }
  
  public get pytestCommand(): string {
    const baseCommand = this.usePoetry ? 'poetry run pytest' : 'pytest';
    return `${baseCommand} ${this.pytestArgs.join(' ')}`;
  }
}
```

### Test Execution Examples

```typescript
// Run specific test function
const command = `${this.pytestCommand} ${testFile}::${testFunction} -v`;

// Run test class
const command = `${this.pytestCommand} ${testFile}::${testClass} -v`;

// Run with coverage
const command = `${this.pytestCommand} ${testFile} --cov --cov-report=html`;
```

## Configuration Migration

### New VS Code Settings Schema

```json
{
  "pytestrunner.usePoetry": {
    "type": "boolean",
    "default": true,
    "description": "Use Poetry for dependency management and virtual environment"
  },
  "pytestrunner.poetryPath": {
    "type": "string", 
    "default": "poetry",
    "description": "Path to Poetry executable"
  },
  "pytestrunner.pytestPath": {
    "type": "string",
    "default": "pytest",
    "description": "Path to pytest executable"
  },
  "pytestrunner.configPath": {
    "type": "string",
    "default": "",
    "description": "Path to pytest configuration file (pytest.ini, pyproject.toml, setup.cfg)"
  },
  "pytestrunner.pytestArgs": {
    "type": "array",
    "default": ["-v"],
    "description": "Default pytest arguments"
  },
  "pytestrunner.codeLensSelector": {
    "type": "string", 
    "default": "**/{test_*.py,*_test.py}",
    "description": "File pattern for showing CodeLens on Python test files"
  }
}
```

## Testing Strategy

### Unit Tests
- **File**: `src/test/pytestRunnerConfig.test.ts`
- Test Poetry detection and path resolution
- Test pytest configuration parsing
- Test command building with various scenarios

### Integration Tests
- Test end-to-end test execution
- Test CodeLens provider with sample Python files
- Test debug configuration creation

### Sample Test Files
Create sample Python test files for testing:
```python
# test_sample.py
import pytest

def test_simple():
    assert True

def test_parametrized():
    assert 1 + 1 == 2

class TestClass:
    def test_method(self):
        assert True
```

## Migration Considerations

### Breaking Changes
- Complete rebranding from Jest Runner to Pytest Runner
- All configuration keys change from `jestrunner.*` to `pytestrunner.*`
- File patterns change from JS/TS to Python
- Command names change for all registered commands

### Backward Compatibility
- None - this is a complete pivot to a different language ecosystem
- Users would need to uninstall Jest Runner and install Pytest Runner

### Documentation Updates
- Update README.md with Python/pytest examples
- Update configuration documentation
- Add Poetry-specific setup instructions
- Update CodeLens examples with Python syntax

## Success Criteria

1. **Functional Parity**: All Jest Runner features work with pytest
2. **Poetry Integration**: Seamless Poetry project support
3. **Python CodeLens**: Inline run/debug buttons on Python test functions
4. **Debug Support**: Full debugging integration with VS Code Python extension
5. **Configuration**: Comprehensive pytest and Poetry configuration support
6. **Performance**: Fast test discovery and execution
7. **User Experience**: Intuitive interface matching Jest Runner UX

## Timeline Estimate

- **Phase 1**: 2-3 days (Foundation changes)
- **Phase 2**: 4-5 days (Core logic refactoring)  
- **Phase 3**: 3-4 days (Python integration)
- **Phase 4**: 2-3 days (Debug integration)
- **Phase 5**: 1-2 days (Cleanup and testing)

**Total**: 12-17 days for complete refactoring

## Next Steps

1. Set up development environment with Python and Poetry
2. Create sample Python test project for testing
3. Begin Phase 1 implementation with package metadata updates
4. Implement Python AST parsing proof of concept
5. Build Poetry integration layer
6. Create comprehensive test suite for validation