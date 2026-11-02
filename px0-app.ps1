# Opens px0 as a standalone app window, starting the px0 server first if it isn't up.
# -ServerOnly just ensures the servers are running (used by the login Startup shortcut).
# -Root is the folder px0 starts in.
# px0-tabs.mjs fronts px0 on :7778 with a tabbed web manifest; install the app from that port.
param([switch]$ServerOnly, [string]$Root = $env:USERPROFILE)

$url  = 'http://127.0.0.1:7777/'
$tabsUrl = 'http://127.0.0.1:7778/'
$node = "$env:APPDATA\fnm\aliases\default\node.exe"
$edge = "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"

function Test-Up($u) { try { (Invoke-WebRequest $u -UseBasicParsing -TimeoutSec 1).StatusCode -eq 200 } catch { $false } }

if (-not (Test-Up $url)) {
    Start-Process "$PSScriptRoot\px0.exe" -ArgumentList '-no-open', '-port', '7777' `
        -WorkingDirectory $Root -WindowStyle Hidden
    foreach ($i in 1..20) { if (Test-Up $url) { break }; Start-Sleep -Milliseconds 500 }
}

if (-not (Test-Up $tabsUrl)) {
    Start-Process $node -ArgumentList "`"$PSScriptRoot\px0-tabs.mjs`"" -WindowStyle Hidden
    foreach ($i in 1..10) { if (Test-Up $tabsUrl) { break }; Start-Sleep -Milliseconds 300 }
}

if (-not $ServerOnly) { Start-Process $edge "--app=$tabsUrl" }
