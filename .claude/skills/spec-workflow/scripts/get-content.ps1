# Script: get-content.ps1
# Purpose: Helper script for spec-workflow agents to load template and spec files (Windows)
# Usage: get-content.ps1 "C:\path\to\file.md"

param(
    [Parameter(Mandatory=$true)]
    [string]$FilePath
)

# Check if file exists
if (-not (Test-Path -Path $FilePath -PathType Leaf)) {
    Write-Error "Error: File not found: $FilePath"
    Write-Host "Please check the path and try again."
    exit 1
}

# Output file content with header for clarity
Write-Host "=== Content of: $FilePath ===" -ForegroundColor Cyan
Write-Host ""
Get-Content -Path $FilePath
Write-Host ""
Write-Host "=== End of file ===" -ForegroundColor Cyan
