# TIME RULER - developer installer for Windows (unsigned panel)
# Usage:
#   powershell -ExecutionPolicy Bypass -File install-dev-windows.ps1              # install/refresh copy
#   powershell -ExecutionPolicy Bypass -File install-dev-windows.ps1 -EnableDebug # also enable PlayerDebugMode
#   powershell -ExecutionPolicy Bypass -File install-dev-windows.ps1 -Uninstall   # remove installed copy
param(
    [switch]$EnableDebug,
    [switch]$Uninstall
)
$ErrorActionPreference = 'Stop'

$projectRoot = Split-Path -Parent $PSScriptRoot
$dest        = Join-Path $env:APPDATA 'Adobe\CEP\extensions\TIME_RULER'

if ($Uninstall) {
    if (Test-Path $dest) {
        Remove-Item -LiteralPath $dest -Recurse -Force
        Write-Host "Removed: $dest"
    } else {
        Write-Host "Nothing to remove at: $dest"
    }
    exit 0
}

# Copy the extension payload (manifest must sit directly in the extension folder)
$items = @('CSXS', 'client', 'host', 'presets', 'README.md', 'CHANGELOG.md', 'LICENSES.md')
New-Item -ItemType Directory -Force -Path $dest | Out-Null
foreach ($item in $items) {
    $src = Join-Path $projectRoot $item
    if (Test-Path $src) {
        Copy-Item -LiteralPath $src -Destination $dest -Recurse -Force
    } else {
        Write-Warning "Missing (skipped): $src"
    }
}

if (-not (Test-Path (Join-Path $dest 'CSXS\manifest.xml'))) {
    throw "Install incomplete: CSXS/manifest.xml not found in $dest"
}

if ($EnableDebug) {
    # Unsigned extensions require PlayerDebugMode (development only).
    # AE 2023 ships CEP 11; AE 2024/2025 may ship CEP 12. Setting both is harmless.
    foreach ($v in @('CSXS.11', 'CSXS.12')) {
        $key = "HKCU:\Software\Adobe\$v"
        if (-not (Test-Path $key)) { New-Item -Path $key -Force | Out-Null }
        Set-ItemProperty -Path $key -Name 'PlayerDebugMode' -Value '1' -Type String
        Write-Host "PlayerDebugMode=1 set under $key"
    }
}

Write-Host ""
Write-Host "Installed to: $dest"
Write-Host "Next steps:"
Write-Host "  1. Restart After Effects (fully quit and relaunch)."
Write-Host "  2. Open the panel: Window > Extensions > TIME RULER."
if (-not $EnableDebug) {
    Write-Host "  NOTE: unsigned panels also need PlayerDebugMode (run with -EnableDebug, or use enable-debug-windows.reg)."
}
