Param(
  [Parameter(Mandatory=$true)][string]$Repo,
  [string]$Version = "latest",
  [string]$BinDir = "$env:USERPROFILE\\.local\\bin",
  [string]$AppDir = "$env:LOCALAPPDATA\\hardshell\\app"
)

$ErrorActionPreference = "Stop"

function Fail($msg) {
  Write-Error $msg
  exit 1
}

function Ensure-Dir($p) {
  if (!(Test-Path $p)) { New-Item -ItemType Directory -Path $p -Force | Out-Null }
}

# Windows installs only the wrapper + bundle. Container runtime is expected to be used via WSL2.
# The wrapper itself will instruct users to run inside WSL2 for sandboxing.

Ensure-Dir $BinDir
Ensure-Dir $AppDir

$Tmp = New-Item -ItemType Directory -Path ([System.IO.Path]::Combine([System.IO.Path]::GetTempPath(), "hardshell-install-" + [System.Guid]::NewGuid().ToString("n")))

try {
  $Platform = "win32-x64"
  $BinName = "pi-agent-sandbox-$Platform.exe"
  $BundleName = "hardshell-app-bundle.tar.gz"

  if ($Version -eq "latest") {
    $Base = "https://github.com/$Repo/releases/latest/download"
  } else {
    $Base = "https://github.com/$Repo/releases/download/$Version"
  }

  $BinPath = Join-Path $Tmp $BinName
  $BundlePath = Join-Path $Tmp $BundleName

  Write-Host "Downloading $BinName..."
  Invoke-WebRequest -Uri "$Base/$BinName" -OutFile $BinPath

  Write-Host "Downloading $BundleName..."
  Invoke-WebRequest -Uri "$Base/$BundleName" -OutFile $BundlePath

  $InstalledBin = Join-Path $BinDir "pi-agent-sandbox.exe"
  Copy-Item -Force $BinPath $InstalledBin

  # Extract tar.gz using built-in tar on modern Windows.
  Write-Host "Installing app bundle to: $AppDir"
  tar -xzf $BundlePath -C $AppDir

  Write-Host ""
  Write-Host "Installed:"
  Write-Host "- wrapper: $InstalledBin"
  Write-Host "- app bundle: $AppDir"
  Write-Host ""
  Write-Host "Next:"
  Write-Host "- Add $BinDir to PATH"
  Write-Host "- Run inside WSL2 for sandboxing (Linux containers)"
  Write-Host ""
}
finally {
  Remove-Item -Recurse -Force $Tmp
}
