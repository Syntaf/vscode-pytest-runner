#!/usr/bin/env python3
"""
Python AST parser for pytest test discovery.
This script parses Python test files to identify test functions, classes, and methods.
"""

import ast
import json
import sys
import os
from typing import List, Dict, Any, Optional


class PythonTestParser:
    """Parser for Python test files using AST."""
    
    def __init__(self):
        self.tests: List[Dict[str, Any]] = []
    
    def parse_file(self, filepath: str) -> List[Dict[str, Any]]:
        """Parse a Python file and return test information."""
        if not os.path.exists(filepath):
            return []
        
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                content = f.read()
            
            tree = ast.parse(content, filename=filepath)
            self.tests = []
            self._visit_node(tree)
            return self.tests
            
        except (SyntaxError, UnicodeDecodeError, Exception):
            # Return empty list on parse errors
            return []
    
    def _visit_node(self, node: ast.AST, parent_class: Optional[str] = None) -> None:
        """Visit AST nodes and extract test information."""
        if isinstance(node, ast.FunctionDef):
            self._process_function(node, parent_class)
        elif isinstance(node, ast.ClassDef):
            self._process_class(node)
        
        # Recursively visit child nodes
        for child in ast.iter_child_nodes(node):
            if isinstance(node, ast.ClassDef):
                self._visit_node(child, node.name)
            else:
                self._visit_node(child, parent_class)
    
    def _process_function(self, node: ast.FunctionDef, parent_class: Optional[str] = None) -> None:
        """Process a function definition node."""
        name = node.name
        
        # Check if it's a test function
        if self._is_test_function(name):
            test_info = {
                'name': name,
                'line': node.lineno,
                'type': 'method' if parent_class else 'function',
                'class': parent_class,
                'full_name': f"{parent_class}::{name}" if parent_class else name,
                'parametrized': self._is_parametrized(node),
                'async': isinstance(node, ast.AsyncFunctionDef)
            }
            
            # Add fixture information if available
            fixtures = self._extract_fixtures(node)
            if fixtures:
                test_info['fixtures'] = fixtures
            
            self.tests.append(test_info)
    
    def _process_class(self, node: ast.ClassDef) -> None:
        """Process a class definition node."""
        name = node.name
        
        # Check if it's a test class
        if self._is_test_class(name):
            test_info = {
                'name': name,
                'line': node.lineno,
                'type': 'class',
                'class': None,
                'full_name': name,
                'parametrized': False,
                'async': False
            }
            self.tests.append(test_info)
    
    def _is_test_function(self, name: str) -> bool:
        """Check if a function name indicates it's a test function."""
        return name.startswith('test_') or name.startswith('Test')
    
    def _is_test_class(self, name: str) -> bool:
        """Check if a class name indicates it's a test class."""
        return name.startswith('Test') and name != 'Test'
    
    def _is_parametrized(self, node: ast.FunctionDef) -> bool:
        """Check if a function is parametrized with pytest.mark.parametrize."""
        for decorator in node.decorator_list:
            if isinstance(decorator, ast.Call):
                if isinstance(decorator.func, ast.Attribute):
                    # Check for pytest.mark.parametrize
                    if (isinstance(decorator.func.value, ast.Attribute) and
                        hasattr(decorator.func.value, 'attr') and
                        decorator.func.value.attr == 'mark' and
                        decorator.func.attr == 'parametrize'):
                        return True
                elif isinstance(decorator.func, ast.Name):
                    # Check for direct parametrize import
                    if decorator.func.id == 'parametrize':
                        return True
            elif isinstance(decorator, ast.Attribute):
                # Check for @pytest.mark.parametrize without call
                if (isinstance(decorator.value, ast.Attribute) and
                    hasattr(decorator.value, 'attr') and
                    decorator.value.attr == 'mark' and
                    decorator.attr == 'parametrize'):
                    return True
        return False
    
    def _extract_fixtures(self, node: ast.FunctionDef) -> List[str]:
        """Extract fixture names from function arguments."""
        fixtures = []
        for arg in node.args.args:
            # Simple heuristic: arguments that are not 'self' might be fixtures
            if arg.arg != 'self':
                fixtures.append(arg.arg)
        return fixtures


def main():
    """Main entry point for the parser."""
    if len(sys.argv) != 2:
        print(json.dumps({"error": "Usage: python ast_parser.py <filepath>"}))
        sys.exit(1)
    
    filepath = sys.argv[1]
    parser = PythonTestParser()
    tests = parser.parse_file(filepath)
    
    result = {
        "tests": tests,
        "file": filepath,
        "success": True
    }
    
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()