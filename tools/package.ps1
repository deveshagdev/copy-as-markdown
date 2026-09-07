# Builds the distributable zip from extension/, named by the manifest version.
# Run: powershell -ExecutionPolicy Bypass -File tools/package.ps1
#
# Uses `git archive` rather than Compress-Archive: PowerShell stores zip paths
# with backslashes, which violates the ZIP spec (forward slashes only) and can
# be rejected by store upload tooling.
#
# Archiving HEAD:extension zips the *contents* of extension/, which is what the
# stores expect, and guarantees the artifact matches a specific commit.
# Uncommitted changes are therefore NOT included - the script warns about them.

$ErrorActionPreference = "Stop"

$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

$dirty = git status --porcelain -- extension
if ($dirty) {
  Write-Warning "extension/ has uncommitted changes; they will NOT be in the zip:"
  $dirty | ForEach-Object { Write-Warning "  $_" }
}

$manifest = Get-Content (Join-Path $root "extension\manifest.json") -Raw | ConvertFrom-Json
$out = Join-Path $root "copy-as-markdown-v$($manifest.version).zip"
if (Test-Path $out) { Remove-Item $out -Force }

git archive --format=zip --output $out HEAD:extension
if ($LASTEXITCODE -ne 0) { throw "git archive failed" }

Add-Type -AssemblyName System.IO.Compression.FileSystem
$zip = [System.IO.Compression.ZipFile]::OpenRead($out)
$entries = $zip.Entries | ForEach-Object { $_.FullName }
$zip.Dispose()

"built $([System.IO.Path]::GetFileName($out))  ($([math]::Round((Get-Item $out).Length / 1KB, 1)) KB)"
$entries | Sort-Object | ForEach-Object { "  $_" }

if ($entries -notcontains "manifest.json") { throw "manifest.json is not at the zip root" }
if ($entries | Where-Object { $_ -like "*\*" }) { throw "zip contains backslash paths" }
