param(
    [switch]$Quiet
)

$ErrorActionPreference = 'Stop'
$MasarRoot = Split-Path -Parent $PSScriptRoot

function Fail-Gate {
    param([string]$Message)
    Write-Host "[FAIL] $Message" -ForegroundColor Red
    exit 1
}

if (-not $Quiet) {
    Write-Host "=== MASAR PRO Quality & Verification Gate ===" -ForegroundColor Cyan
}

# 1. JS Syntax Check (client/js & tests & scripts)
$jsFiles = @()
foreach ($sub in @('client\js', 'tests', 'scripts')) {
    $dir = Join-Path $MasarRoot $sub
    if (Test-Path $dir) {
        $jsFiles += Get-ChildItem -Path $dir -Recurse -Filter *.js
    }
}
foreach ($f in $jsFiles) {
    & node --check $f.FullName
    if ($LASTEXITCODE -ne 0) {
        Fail-Gate "JS syntax check failed in $($f.FullName)"
    }
}
if (-not $Quiet) {
    Write-Host "[PASS] JS syntax OK ($($jsFiles.Count) files)" -ForegroundColor Green
}

# 2. Check host/src/*.jsx sync & Strict ExtendScript ES3 & AE Locale Guard
$buildHost = Join-Path $MasarRoot 'scripts\build-host.js'
& node $buildHost --check
if ($LASTEXITCODE -ne 0) {
    Fail-Gate "host/bootstrap.jsx is out of sync with host/src/*.jsx"
}
$linter = Join-Path $MasarRoot 'scripts\lint-es3-host.js'
$hostBootstrap = Join-Path $MasarRoot 'host\bootstrap.jsx'
& node $linter $hostBootstrap
if ($LASTEXITCODE -ne 0) {
    Fail-Gate "ES3 / AE Locale Guard failed on host/bootstrap.jsx"
}

# 3. CSS Brace Balance Check across all active stylesheets
$cssRelPaths = @(
    'client\assets\fonts\cairo\cairo.css',
    'client\assets\fonts\phosphor\phosphor.css',
    'client\css\01-tokens.css',
    'client\css\02-base-layout.css',
    'client\css\03-cards.css',
    'client\css\04-controls-theme.css'
)
foreach ($rel in $cssRelPaths) {
    $fullCss = Join-Path $MasarRoot $rel
    if (-not (Test-Path $fullCss)) {
        Fail-Gate "Missing expected CSS file: $rel"
    }
    $cssText = [System.IO.File]::ReadAllText($fullCss)
    $cssClean = [regex]::Replace($cssText, '/\*[\s\S]*?\*/', '')
    $depth = 0
    foreach ($ch in $cssClean.ToCharArray()) {
        if ($ch -eq '{') { $depth++ }
        elseif ($ch -eq '}') {
            $depth--
            if ($depth -lt 0) {
                Fail-Gate "Stray closing brace in CSS file: $rel"
            }
        }
    }
    if ($depth -ne 0) {
        Fail-Gate "Unclosed brace(s) (depth=$depth) in CSS file: $rel"
    }
}
if (-not $Quiet) {
    Write-Host "[PASS] CSS brace balance OK ($($cssRelPaths.Count) files)" -ForegroundColor Green
}

# 4. Run Automated Node Harnesses
$harnesses = @(
    'tests\masar-bootstrap-harness.js',
    'tests\masar-client-integration-harness.js',
    'tests\shapes-sync-harness.js'
)
foreach ($h in $harnesses) {
    $hPath = Join-Path $MasarRoot $h
    & node $hPath
    if ($LASTEXITCODE -ne 0) {
        Fail-Gate "Test harness failed: $h"
    }
}

Write-Host "=== ALL MASAR QUALITY GATES PASSED (Exit Code 0) ===" -ForegroundColor Green
exit 0

