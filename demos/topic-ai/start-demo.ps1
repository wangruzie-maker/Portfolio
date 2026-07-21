# Full local demo (Windows) for cuddly-guacamole experience pack
$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$out = Join-Path $PSScriptRoot "output"
New-Item -ItemType Directory -Force -Path $out | Out-Null
New-Item -ItemType Directory -Force -Path (Join-Path $out "channels") | Out-Null
Copy-Item "demo\sample_data\xhs_accumulated.json" (Join-Path $out "accumulated.json") -Force
Copy-Item "demo\sample_data\channels_accumulated.json" (Join-Path $out "channels\accumulated.json") -Force
New-Item -ItemType File -Force -Path (Join-Path $out ".demo_mode") | Out-Null

$env:DEMO_MODE = "1"
$env:PYTHONUTF8 = "1"

Write-Host "Installing deps if needed..."
py -3 -m pip install -r requirements.txt -q

Write-Host "Starting demo server http://127.0.0.1:8765/?demo=1"
Write-Host "Ctrl+C to stop"
py -3 -m uvicorn web_server:app --host 127.0.0.1 --port 8765
