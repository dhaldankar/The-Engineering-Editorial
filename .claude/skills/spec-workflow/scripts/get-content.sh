#!/bin/bash

# Script: get-content.sh
# Purpose: Helper script for spec-workflow agents to load template and spec files
# Usage: get-content.sh "/path/to/file.md"

# Check if file path argument is provided
if [ -z "$1" ]; then
    echo "Error: No file path provided"
    echo "Usage: $0 \"/path/to/file.md\""
    exit 1
fi

FILE_PATH="$1"

# Check if file exists
if [ ! -f "$FILE_PATH" ]; then
    echo "Error: File not found: $FILE_PATH"
    echo "Please check the path and try again."
    exit 1
fi

# Output file content with header for clarity
echo "=== Content of: $FILE_PATH ==="
echo ""
cat "$FILE_PATH"
echo ""
echo "=== End of file ==="
