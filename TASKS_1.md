# Phase 1 Tasks: Foundation Changes

This document contains all specific tasks required to complete Phase 1 of the Jest Runner to Pytest Runner refactoring.

## Task Categories

- 🔧 **Configuration**: Package metadata and settings schema updates
- 📝 **Commands**: Command registration and menu integration updates  
- 🎯 **Validation**: Testing and verification tasks

---

## 1.1 Package Metadata Updates

### 🔧 TASK-1.1.1: Update Basic Package Information ✅
- [x] Change `name` from `"vscode-jest-runner"` to `"vscode-pytest-runner"`
- [x] Change `displayName` from `"Jest Runner"` to `"Pytest Runner"`
- [x] Update `description` from Jest-focused to pytest-focused description
- [x] Update `icon` path if needed (consider keeping current icon or creating pytest-themed icon)
- [x] Verify `version` strategy (reset to 0.1.0 or continue current versioning)

### 🔧 TASK-1.1.2: Update Repository and Publishing Information ✅
- [x] Update `repository.url` to new pytest runner repository URL
- [x] Update `author` information if transferring ownership
- [x] Verify `license` remains MIT
- [x] Update `keywords` in package.json to include Python/pytest terms
- [x] Update `categories` if needed (consider "Testing" category)

### 🔧 TASK-1.1.3: Update Engine and Dependency Requirements ✅
- [x] Verify `engines.vscode` minimum version supports Python extension integration
- [x] Add `extensionDependencies` for Python extension: `["ms-python.python"]`
- [x] Review `activationEvents` - consider changing from `"*"` to Python-specific events
- [x] Update `main` entry point if renaming extension.js

---

## 1.2 Configuration Schema Updates

### 🔧 TASK-1.2.1: Remove Jest-Specific Configuration Properties ✅
- [x] Remove `jestrunner.configPath` property
- [x] Remove `jestrunner.jestPath` property  
- [x] Remove `jestrunner.projectPath` property
- [x] Remove `jestrunner.debugOptions` property
- [x] Remove `jestrunner.runOptions` property
- [x] Remove `jestrunner.jestCommand` property
- [x] Remove `jestrunner.enableYarnPnpSupport` property
- [x] Remove `jestrunner.checkRelativePathForJest` property
- [x] Remove `jestrunner.yarnPnpCommand` property

### 🔧 TASK-1.2.2: Add Core Pytest Configuration Properties ✅
- [x] Add `pytestrunner.pytestPath` property
  - Type: string
  - Default: "pytest"  
  - Description: "Path to pytest executable"
- [x] Add `pytestrunner.pytestArgs` property
  - Type: array of strings
  - Default: ["-v"]
  - Description: "Default pytest arguments"
- [x] Add `pytestrunner.configPath` property
  - Type: string
  - Default: ""
  - Description: "Path to pytest config file (pytest.ini, pyproject.toml, setup.cfg)"

### 🔧 TASK-1.2.3: Add Poetry Integration Configuration Properties ✅
- [x] Add `pytestrunner.usePoetry` property
  - Type: boolean
  - Default: true
  - Description: "Use Poetry for dependency management and virtual environment"
- [x] Add `pytestrunner.poetryPath` property
  - Type: string
  - Default: "poetry"
  - Description: "Path to Poetry executable"  
- [x] Add `pytestrunner.virtualEnvPath` property
  - Type: string
  - Default: ""
  - Description: "Custom virtual environment path (overrides Poetry detection)"

### 🔧 TASK-1.2.4: Update UI and Behavior Configuration Properties ✅
- [x] Update `pytestrunner.disableCodeLens` property (rename from jestrunner)
  - Keep same type and default
  - Update description to mention pytest
- [x] Update `pytestrunner.codeLensSelector` property
  - Change default from `"**/*.{test,spec}.{js,jsx,ts,tsx}"` to `"**/{test_*.py,*_test.py}"`
  - Update description for Python files
- [x] Update `pytestrunner.codeLens` property
  - Keep array type with options: run, debug, watch, coverage
  - Remove 'current-test-coverage' option (not applicable to pytest initially)
  - Update description to mention pytest
- [x] Update `pytestrunner.changeDirectoryToWorkspaceRoot` property
  - Update description to mention Poetry project detection
  - Keep same functionality
- [x] Update `pytestrunner.preserveEditorFocus` property (rename from jestrunner)
  - Keep same type and default
  - Update description
- [x] Remove `pytestrunner.runInExternalNativeTerminal` property (remove for now, add back later if needed)

### 🔧 TASK-1.2.5: Update Include/Exclude Configuration ✅
- [x] Update `pytestrunner.include` property
  - Keep same array type
  - Update description for Python test files
- [x] Update `pytestrunner.exclude` property  
  - Keep same array type
  - Update description for Python test files

---

## 1.3 Command Registration Updates

### 🔧 TASK-1.3.1: Update Command Definitions ✅
- [x] Change `extension.runJest` to `extension.runPytest`
  - Update title: "Run Jest" → "Run Pytest"
- [x] Change `extension.runJestPath` to `extension.runPytestPath`  
  - Update title: "Run Jest on Path" → "Run Pytest on Path"
- [x] Change `extension.runJestCoverage` to `extension.runPytestCoverage`
  - Update title: "Run Jest and generate Coverage" → "Run Pytest with Coverage"
- [x] Remove `extension.runJestAndUpdateSnapshots` command (not applicable to pytest)
- [x] Change `extension.runPrevJest` to `extension.runPrevPytest`
  - Update title: "Run Jest - Run Previous Test" → "Run Pytest - Run Previous Test"
- [x] Change `extension.runJestFile` to `extension.runPytestFile`
  - Update title: "Run Jest on File" → "Run Pytest on File"
- [x] Change `extension.debugJest` to `extension.debugPytest`
  - Update title: "Debug Jest" → "Debug Pytest"
- [x] Change `extension.debugJestPath` to `extension.debugPytestPath`
  - Update title: "Debug Jest on Path" → "Debug Pytest on Path"
- [x] Change `extension.runJestFileWithCoverage` to `extension.runPytestFileWithCoverage`
  - Update title: "Run Jest File and generate Coverage" → "Run Pytest File with Coverage"
- [x] Change `extension.runJestFileWithWatchMode` to `extension.runPytestFileWithWatchMode`
  - Update title: "Run Jest File in Watch Mode" → "Run Pytest File in Watch Mode"
- [x] Change `extension.watchJest` to `extension.watchPytest`
  - Update title: "Run Jest --watch" → "Run Pytest --watch"

### 🔧 TASK-1.3.2: Update Context Menu Integration ✅
- [x] Update `editor/context` menu commands
  - Change `extension.runJest` to `extension.runPytest`
  - Change `extension.debugJest` to `extension.debugPytest`  
  - Change group from `"02_jest"` to `"02_pytest"`
- [x] Update `explorer/context` menu commands
  - Change `extension.runJestPath` to `extension.runPytestPath`
  - Change `extension.debugJestPath` to `extension.debugPytestPath`
  - Update file pattern condition from JavaScript/TypeScript to Python:
    - From: `resourceFilename =~ /.*\\.(spec|test)\\.(js|jsx|ts|tsx)$/`
    - To: `resourceFilename =~ /.*(test_.*\\.py|.*_test\\.py)$/`
  - Change group from `"02_jest@1"` and `"02_jest@2"` to `"02_pytest@1"` and `"02_pytest@2"`

---

## 🎯 Validation Tasks

### 📝 TASK-1.V.1: Configuration Schema Validation ✅
- [x] Validate all configuration properties have correct JSON schema types
- [x] Verify all default values are appropriate for pytest usage
- [x] Test configuration property descriptions are clear and accurate
- [x] Ensure no Jest-specific terminology remains in descriptions

### 📝 TASK-1.V.2: Command Registration Validation ✅
- [x] Verify all command IDs are updated consistently
- [x] Test that command titles are user-friendly and pytest-focused
- [x] Validate context menu integration works with Python files
- [x] Check that removed commands (snapshots) don't break anything

### 📝 TASK-1.V.3: Package Metadata Validation ✅
- [x] Verify package.json is valid JSON after all changes
- [x] Test that VS Code recognizes the extension with new metadata
- [x] Confirm Python extension dependency is correctly specified
- [x] Validate icon and display information appears correctly in VS Code

### 📝 TASK-1.V.4: Comprehensive Review ✅
- [x] Search entire package.json for any remaining "jest" references
- [x] Search entire package.json for any remaining "Jest" references  
- [x] Verify all new "pytest" references are spelled consistently
- [x] Review that all changes align with the master plan in PLAN.md

---

## Notes for Implementation

### ⚠️ Important Considerations
- **Backup**: Create git commit before starting Phase 1 changes
- **Testing**: After each major section (1.1, 1.2, 1.3), test that VS Code can still load the extension
- **Dependencies**: Phase 1 changes will break functionality until Phase 2 code changes are complete
- **Rollback Plan**: Keep detailed notes on changes for potential rollback

### 🔄 Dependencies for Next Phase
After completing Phase 1, the following will be needed for Phase 2:
- All source files in `src/` directory will need corresponding updates
- New dependencies will need to be added to package.json
- Extension will not be functional until Phase 2 core logic is complete

### 📋 Completion Criteria ✅ PHASE 1 COMPLETE!
Phase 1 is complete when:
- [x] All configuration properties are updated from Jest to Pytest terminology
- [x] All command registrations use new pytest command IDs and titles
- [x] Context menus target Python files instead of JavaScript/TypeScript files  
- [x] Package metadata reflects pytest runner branding
- [x] No Jest-specific references remain in package.json
- [x] VS Code can load the extension without configuration errors (even if commands don't work yet)

---

**Total Tasks**: 47 individual tasks across 4 categories
**Estimated Time**: 2-3 days  
**Prerequisites**: Git backup, VS Code development environment setup
**Next Phase**: Phase 2 - Core Logic Refactoring