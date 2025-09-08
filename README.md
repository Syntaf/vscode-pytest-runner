# vscode-pytest-runner

A simple and fast way to run or debug specific pytest tests directly from VS Code.

## Visual Studio Code Marketplace

*Coming soon - this extension will be published to the VS Code Marketplace*

## Comparison with other Python test extensions

`vscode-pytest-runner` is focused on **running or debugging a specific test** or test suite quickly and efficiently, while other extensions may focus on test discovery, continuous testing, or full test suite management. This extension prioritizes speed and simplicity.

## Features

Simple, fast way to run or debug specific pytest tests
*Similar to the experience in PyCharm / IntelliJ*

Run & Debug your pytest tests from:
- **Context Menu** - Right-click on test files or functions
- **CodeLens** - Inline "Run" and "Debug" buttons above test functions
- **Command Palette** - `Ctrl+Shift+P` (Windows/Linux) or `Cmd+Shift+P` (Mac)

## Supports

- **Poetry projects** with automatic virtual environment detection
- **Standard Python projects** with pip, conda, etc.
- **Dynamic pytest configuration** resolution (`pytest.ini`, `pyproject.toml`, `setup.cfg`)
- **Parametrized tests** and **async test functions**
- **Test classes and methods**
- **Workspace folders** and monorepos

![Extension Demo](https://github.com/grant.mercer/vscode-pytest-runner/raw/main/assets/demo.gif)

## Quick Start

1. **Install the extension** from the VS Code marketplace
2. **Open a Python project** with pytest tests
3. **Click "Run" or "Debug"** CodeLens buttons above your test functions

The extension works out of the box for most Python projects!

## Poetry Projects

For Poetry projects, the extension automatically:
- Detects `pyproject.toml` files with `[tool.poetry]` sections
- Uses `poetry run pytest` instead of direct `pytest` commands
- Finds the correct virtual environment path
- Supports Poetry dependency groups and configurations

## Extension Settings

Pytest Runner works out of the box with standard pytest configurations. Use these settings for custom setups:

| Setting | Description | Default |
|---------|-------------|---------|
| `pytestrunner.pytestPath` | Path to pytest executable | `pytest` |
| `pytestrunner.usePoetry` | Enable Poetry integration | `true` |
| `pytestrunner.poetryPath` | Path to Poetry executable | `poetry` |
| `pytestrunner.configPath` | Path to pytest config file (pytest.ini, pyproject.toml, setup.cfg) | `""` |
| `pytestrunner.pytestArgs` | Default pytest arguments | `["-v"]` |
| `pytestrunner.virtualEnvPath` | Custom virtual environment path | `""` |
| `pytestrunner.disableCodeLens` | Disable CodeLens feature | `false` |
| `pytestrunner.codeLensSelector` | Pattern for files to show CodeLens | `**/{test_*.py,*_test.py}` |
| `pytestrunner.codeLens` | Which CodeLens options to show | `["run", "debug"]` |
| `pytestrunner.debugOptions` | VS Code debug configuration overrides | `{}` |
| `pytestrunner.changeDirectoryToWorkspaceRoot` | Change to workspace root before running | `true` |
| `pytestrunner.preserveEditorFocus` | Keep focus on editor after running tests | `false` |

### Example Configuration

For a custom Poetry setup:
```json
{
  "pytestrunner.usePoetry": true,
  "pytestrunner.poetryPath": "/usr/local/bin/poetry",
  "pytestrunner.pytestArgs": ["-v", "--tb=short"],
  "pytestrunner.codeLensSelector": "**/test_*.py"
}
```

For a standard pip environment:
```json
{
  "pytestrunner.usePoetry": false,
  "pytestrunner.pytestPath": "/home/user/.local/bin/pytest",
  "pytestrunner.virtualEnvPath": "/home/user/myproject/.venv"
}
```

### Config Path as Glob Map

You can specify different pytest configs for different test types using glob patterns:

```json
{
  "pytestrunner.configPath": {
    "**/integration/**/*.py": "./pytest.integration.ini",
    "**/unit/**/*.py": "./pytest.unit.ini",
    "**/*_test.py": "./pytest.default.ini"
  }
}
```

Note: More specific patterns should come first, as the extension uses the first matching pattern.

## Keyboard Shortcuts

Add these shortcuts via **Command Palette** → **Preferences: Open Keyboard Shortcuts (JSON)**:

```json
[
  {
    "key": "alt+1",
    "command": "extension.runPytest"
  },
  {
    "key": "alt+2", 
    "command": "extension.debugPytest"
  },
  {
    "key": "alt+3",
    "command": "extension.runPytestFile"
  },
  {
    "key": "alt+4",
    "command": "extension.runPrevPytest"
  }
]
```

## Requirements

- **Python** 3.6+ installed and accessible in PATH
- **pytest** installed in your project (`pip install pytest` or `poetry add pytest`)
- **VS Code Python Extension** (recommended but not required)

### For Poetry Projects
- **Poetry** installed and accessible in PATH
- Valid `pyproject.toml` with `[tool.poetry]` section

## Supported Test File Patterns

The extension automatically recognizes these test file patterns:
- `test_*.py` (e.g., `test_example.py`)
- `*_test.py` (e.g., `example_test.py`) 
- Files containing `test` in the name

And these test function/class patterns:
- `def test_*()` - Test functions
- `async def test_*()` - Async test functions  
- `class Test*` - Test classes

## Development

Want to contribute? Here's how to set up the development environment:

### Prerequisites
- **Node.js** 16+ and **npm**
- **VS Code** with Extension Development Host

### Steps to run in development mode

1. **Clone the repository**
   ```bash
   git clone https://github.com/grant.mercer/vscode-pytest-runner.git
   cd vscode-pytest-runner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start debugging**
   - Open the project in VS Code
   - Press `F5` or go to **Run** → **Start Debugging**
   - A new VS Code window opens with the extension loaded

### Build Commands

- `npm run compile` - Compile TypeScript
- `npm run watch` - Watch mode for development
- `npm run lint` - Run ESLint
- `npm run test` - Run test suite
- `npm run package` - Package the extension

## Contributing

Issues and pull requests are welcome! Check out the [open issues](https://github.com/grant.mercer/vscode-pytest-runner/issues) to get started.

### Areas where help is needed:
- Additional pytest configuration support
- Windows compatibility testing  
- Performance optimizations
- Documentation improvements

## License

MIT License - see [LICENSE](LICENSE) for details.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.