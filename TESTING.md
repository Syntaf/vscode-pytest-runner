# Pytest Runner Extension - Manual Testing Guide

This document provides comprehensive manual testing instructions for the Pytest Runner VS Code extension to validate the Jest → Pytest transformation.

## Prerequisites

Before testing, ensure you have:
- VS Code installed
- Python 3.7+ installed and available in PATH
- Poetry installed (optional, for Poetry-specific tests)
- A test Python project with pytest test files

## Test Environment Setup

### 1. Extension Development Setup

```bash
cd /path/to/vscode-jest-runner
npm install
npm run build
```

### 2. Create Test Python Project

Create a sample Python project for testing:

```bash
mkdir pytest-test-project
cd pytest-test-project

# Create a simple Python module
cat > calculator.py << 'EOF'
def add(a, b):
    return a + b

def subtract(a, b):
    return a - b

class Calculator:
    def multiply(self, a, b):
        return a * b
    
    def divide(self, a, b):
        if b == 0:
            raise ValueError("Cannot divide by zero")
        return a / b
EOF

# Create test files with various patterns
cat > test_calculator.py << 'EOF'
import pytest
from calculator import add, subtract, Calculator

def test_add():
    assert add(2, 3) == 5

def test_subtract():
    assert subtract(5, 3) == 2

class TestCalculator:
    def test_multiply(self):
        calc = Calculator()
        assert calc.multiply(3, 4) == 12
    
    def test_divide(self):
        calc = Calculator()
        assert calc.divide(8, 2) == 4
    
    def test_divide_by_zero(self):
        calc = Calculator()
        with pytest.raises(ValueError):
            calc.divide(5, 0)

@pytest.mark.parametrize("a,b,expected", [(1, 2, 3), (0, 5, 5), (-1, 1, 0)])
def test_add_parametrized(a, b, expected):
    assert add(a, b) == expected
EOF

cat > calculator_test.py << 'EOF'
# Alternative naming convention
from calculator import add

def test_basic_addition():
    assert add(1, 1) == 2
EOF

# Create pytest configuration
cat > pytest.ini << 'EOF'
[tool:pytest]
testpaths = .
python_files = test_*.py *_test.py
python_functions = test_*
python_classes = Test*
addopts = -v --tb=short
EOF
```

### 3. Poetry Project Setup (Optional)

For Poetry-specific testing:

```bash
cd pytest-test-project
poetry init --no-interaction --dependency pytest
poetry install
```

---

## Testing Checklist

## ✅ **Phase 1: Extension Loading and Activation**

### Test 1.1: Extension Loading
1. **Open VS Code in extension directory**
   ```bash
   cd /path/to/vscode-jest-runner
   code .
   ```

2. **Launch Extension Development Host**
   - Press `F5` or Run → Start Debugging
   - New VS Code window should open with extension loaded

3. **Check Extension Host Output**
   - View → Output
   - Select "Extension Host" from dropdown
   - Look for errors or warnings

**✅ Expected Results:**
- Extension loads without errors
- No red error messages in Extension Host output
- Extension appears in Extensions panel as "Pytest Runner"

**❌ Failure Signs:**
- Error messages mentioning missing modules
- Extension fails to activate
- "Extension Host" shows activation errors

### Test 1.2: Command Registration
1. **Open Command Palette** (`Cmd+Shift+P` / `Ctrl+Shift+P`)
2. **Type "pytest"**

**✅ Expected Results:**
- `Pytest Runner: Run Pytest`
- `Pytest Runner: Debug Pytest`
- `Pytest Runner: Run Pytest on Path`
- `Pytest Runner: Run Previous Test`
- `Pytest Runner: Run Pytest File`
- `Pytest Runner: Run Pytest with Coverage`
- `Pytest Runner: Debug Pytest on Path`

**❌ Failure Signs:**
- Old "Jest" commands still visible
- Pytest commands missing or malformed
- Commands appear but are grayed out

---

## ✅ **Phase 2: Python File Recognition and Parsing**

### Test 2.1: Open Python Test File
1. **Open Extension Development Host** (if not already open)
2. **Open test Python project**
   - File → Open Folder
   - Select `pytest-test-project` folder
3. **Open `test_calculator.py`**

**✅ Expected Results:**
- File opens without errors
- Python syntax highlighting works
- No parser errors in Output panel

### Test 2.2: CodeLens Appearance
1. **With `test_calculator.py` open, look above test functions**

**✅ Expected Results:**
- "Run | Debug" CodeLens appears above:
  - `def test_add():`
  - `def test_subtract():`
  - `class TestCalculator:`
  - `def test_multiply(self):`
  - `def test_divide(self):`
  - `def test_divide_by_zero(self):`
  - `def test_add_parametrized(...):`

**❌ Failure Signs:**
- No CodeLens appears
- CodeLens shows old "Jest" commands
- CodeLens appears on non-test functions
- Parser errors in Output → "Pytest Runner"

### Test 2.3: Alternative File Naming
1. **Open `calculator_test.py`**

**✅ Expected Results:**
- CodeLens appears above `def test_basic_addition():`
- Extension recognizes `*_test.py` naming pattern

---

## ✅ **Phase 3: Command Execution**

### Test 3.1: Run Single Test Function
1. **In `test_calculator.py`, click "Run" CodeLens above `test_add`**

**✅ Expected Results:**
- Terminal opens with command like: `pytest test_calculator.py::test_add -v`
- Command executes successfully
- Test passes with green output

**❌ Failure Signs:**
- Command uses Jest syntax
- "pytest command not found" error
- Incorrect file path or test name

### Test 3.2: Run Test Class
1. **Click "Run" CodeLens above `class TestCalculator:`**

**✅ Expected Results:**
- Command like: `pytest test_calculator.py::TestCalculator -v`
- All methods in class execute

### Test 3.3: Run Entire File
1. **Right-click in `test_calculator.py`**
2. **Select "Run Pytest on File"**

**✅ Expected Results:**
- Command like: `pytest test_calculator.py -v`
- All tests in file execute

### Test 3.4: Run from Context Menu
1. **Right-click on `test_calculator.py` in Explorer**
2. **Select "Run Pytest on Path"**

**✅ Expected Results:**
- Same behavior as running entire file
- Context menu shows Pytest options (not Jest)

---

## ✅ **Phase 4: Debug Functionality**

### Test 4.1: Debug Single Test
1. **Click "Debug" CodeLens above `test_divide_by_zero`**

**✅ Expected Results:**
- Debug session starts
- Debugger configuration uses Python type
- Can set breakpoints in test function
- Exception handling works correctly

**❌ Failure Signs:**
- Debugger tries to use Node.js
- Debug configuration errors
- Cannot set Python breakpoints

### Test 4.2: Debug with Breakpoints
1. **Set breakpoint in `test_multiply` method**
2. **Click "Debug" CodeLens above the method**

**✅ Expected Results:**
- Execution stops at breakpoint
- Can inspect variables
- Can step through Python code

---

## ✅ **Phase 5: Poetry Integration**

### Test 5.1: Poetry Project Detection
1. **Open Poetry-enabled test project**
2. **Check Output panel for Poetry detection**

**✅ Expected Results:**
- Extension detects Poetry project
- Commands use `poetry run pytest` prefix
- Virtual environment path resolved correctly

### Test 5.2: Poetry Command Execution
1. **Run test in Poetry project**

**✅ Expected Results:**
- Terminal command: `poetry run pytest test_calculator.py::test_add -v`
- Uses Poetry virtual environment
- Dependencies resolved through Poetry

### Test 5.3: Non-Poetry Fallback
1. **Test in project without Poetry**
2. **Disable Poetry in settings: `pytestrunner.usePoetry: false`**

**✅ Expected Results:**
- Commands use direct `pytest` (no poetry prefix)
- Still executes correctly

---

## ✅ **Phase 6: Configuration and Settings**

### Test 6.1: Pytest Arguments
1. **Open VS Code Settings**
2. **Search for "pytestrunner"**
3. **Modify `pytestrunner.pytestArgs` to `["-v", "--tb=long"]`**
4. **Run a test**

**✅ Expected Results:**
- Command includes custom arguments
- Verbose output and long traceback format

### Test 6.2: CodeLens Selector
1. **Create file `my_tests.py` (non-standard naming)**
2. **Add test function**
3. **Update `pytestrunner.codeLensSelector` to include pattern**

**✅ Expected Results:**
- CodeLens appears on custom file patterns
- Respects include/exclude settings

### Test 6.3: Disable CodeLens
1. **Set `pytestrunner.disableCodeLens: true`**
2. **Reload window**

**✅ Expected Results:**
- No CodeLens appears on test files
- Commands still available via Command Palette

---

## ✅ **Phase 7: Error Handling and Edge Cases**

### Test 7.1: Python Not Available
1. **Temporarily rename python executable or remove from PATH**
2. **Try running tests**

**✅ Expected Results:**
- Graceful error message
- Falls back to regex parsing (no AST)
- Extension doesn't crash

### Test 7.2: Invalid Python Syntax
1. **Create test file with syntax errors**
2. **Open in editor**

**✅ Expected Results:**
- Parser handles errors gracefully
- Falls back to regex parsing
- Some CodeLens still appears for valid functions

### Test 7.3: Missing Pytest
1. **Remove pytest from environment**
2. **Try running tests**

**✅ Expected Results:**
- Clear error message about pytest not found
- Suggests installation steps

### Test 7.4: No Test Files
1. **Open Python project with no test files**
2. **Open regular .py files**

**✅ Expected Results:**
- No CodeLens on non-test files
- Extension doesn't interfere with regular Python development

---

## ✅ **Phase 8: Integration Testing**

### Test 8.1: Complete Workflow
1. **Create new test file**
2. **Write test function**
3. **See CodeLens appear automatically**
4. **Run test and verify output**
5. **Debug test with breakpoints**

### Test 8.2: Multiple File Types
1. **Test with different naming conventions:**
   - `test_*.py`
   - `*_test.py`
   - Files in `tests/` directory

### Test 8.3: Complex Test Structures
1. **Test with:**
   - Nested test classes
   - Parametrized tests
   - Fixtures
   - Async test functions

**✅ Expected Results:**
- All patterns recognized correctly
- Commands generated properly
- Execution works for complex scenarios

---

## 🐛 **Troubleshooting Common Issues**

### Extension Won't Load
- Check Extension Host output for specific errors
- Verify TypeScript compilation: `npm run build`
- Check for missing dependencies: `npm install`

### CodeLens Not Appearing
- Verify file matches pattern: `**/{test_*.py,*_test.py}`
- Check `pytestrunner.disableCodeLens` setting
- Look for parser errors in Output panel

### Commands Fail to Execute
- Verify Python and pytest are in PATH
- Check virtual environment activation
- Verify file paths and test names in terminal command

### Poetry Integration Issues
- Confirm `pyproject.toml` exists with `[tool.poetry]` section
- Verify Poetry is installed and in PATH
- Check Poetry virtual environment: `poetry env info`

---

## 📝 **Test Results Documentation**

For each test phase, document:

- ✅ **PASS**: Expected behavior observed
- ❌ **FAIL**: Issue description and steps to reproduce
- ⚠️ **PARTIAL**: Works but with limitations/warnings

### Example Test Result:
```
✅ Test 3.1: Run Single Test Function - PASS
- CodeLens appeared correctly
- Command: pytest test_calculator.py::test_add -v
- Test executed and passed
- Terminal output clean and readable

❌ Test 4.1: Debug Single Test - FAIL  
- Debug session starts but uses wrong Python interpreter
- Issue: Virtual environment not detected in debug config
- Workaround: Manually select Python interpreter
```

---

## 🚀 **Success Criteria**

Phase 2 manual testing is **COMPLETE** when:

- ✅ Extension loads without errors
- ✅ All pytest commands registered and functional
- ✅ CodeLens appears on Python test files
- ✅ Test execution works with proper pytest syntax
- ✅ Debug functionality works with Python debugger
- ✅ Poetry integration detects projects and uses virtual environments
- ✅ Error handling is graceful and informative
- ✅ No Jest-related functionality remains visible

**The extension should be fully functional as a Pytest Runner with Poetry support!**