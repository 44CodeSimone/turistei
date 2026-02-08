# ==========================================
# TURISTEI - REVIEW BUNDLE EXPORT (PowerShell)
# Generates: ./review_bundle_<timestamp>.zip
# Safe by default: excludes .env, node_modules, pedido.json, backups
# Also prunes old bundles (keep N, default = 1)
# ==========================================

$ErrorActionPreference = "Stop"

function NowStamp() {
  return (Get-Date).ToString("yyyyMMdd_HHmmss")
}

$root = (Resolve-Path ".").Path
$stamp = NowStamp
$outDirName = "review_bundle_$stamp"
$outDir = Join-Path $root $outDirName

# Safety excludes
$excludeDirs = @(
  "node_modules",
  ".git",
  ".vscode",
  "storage",
  "coverage",
  "dist",
  "build"
)

$excludeFiles = @(
  ".env",
  ".env.local",
  ".env.development",
  ".env.test",
  ".env.production",
  "pedido.json"
)

Write-Host "== TURISTEI REVIEW BUNDLE ==" -ForegroundColor Cyan
Write-Host "Root: $root" -ForegroundColor Gray
Write-Host "Output: $outDirName" -ForegroundColor Gray
Write-Host ""

# Create output dir
New-Item -ItemType Directory -Path $outDir -Force | Out-Null

# 1) META: versions
"node $(node -v)" | Out-File -FilePath (Join-Path $outDir "meta_versions.txt") -Encoding utf8
"npm  $(npm -v)"  | Out-File -FilePath (Join-Path $outDir "meta_versions.txt") -Append -Encoding utf8

# 2) META: basic tree (safe)
Get-ChildItem -Path $root -Recurse -File |
  Where-Object {
    $p = $_.FullName.Substring($root.Length).TrimStart("\")
    # exclude dirs
    foreach ($d in $excludeDirs) { if ($p -like "$d\*") { return $false } }
    # exclude files
    foreach ($f in $excludeFiles) { if ($_.Name -ieq $f) { return $false } }
    # exclude backups
    if ($_.Name -like "pedido.backup.*.json") { return $false }
    return $true
  } |
  ForEach-Object {
    $_.FullName.Substring($root.Length).TrimStart("\")
  } |
  Sort-Object |
  Out-File -FilePath (Join-Path $outDir "meta_tree_files.txt") -Encoding utf8

# 3) Copy key folders/files
function Copy-IfExists($path) {
  $full = Join-Path $root $path
  if (Test-Path $full) {
    $dest = Join-Path $outDir $path
    $destDir = Split-Path $dest -Parent
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Copy-Item -Path $full -Destination $dest -Force
    Write-Host "Copied: $path" -ForegroundColor Green
  }
}

Copy-IfExists "package.json"
Copy-IfExists "package-lock.json"
Copy-IfExists "README.md"

# Copy src and tools (excluding unsafe files)
function Copy-FolderSafe($folder) {
  $src = Join-Path $root $folder
  if (!(Test-Path $src)) { return }

  $files = Get-ChildItem -Path $src -Recurse -File
  foreach ($file in $files) {
    $rel = $file.FullName.Substring($root.Length).TrimStart("\")
    $skip = $false

    foreach ($d in $excludeDirs) { if ($rel -like "$d\*") { $skip = $true } }
    foreach ($f in $excludeFiles) { if ($file.Name -ieq $f) { $skip = $true } }
    if ($file.Name -like "pedido.backup.*.json") { $skip = $true }

    if ($skip) { continue }

    $dest = Join-Path $outDir $rel
    $destDir = Split-Path $dest -Parent
    New-Item -ItemType Directory -Path $destDir -Force | Out-Null
    Copy-Item -Path $file.FullName -Destination $dest -Force
  }

  Write-Host "Copied folder safely: $folder" -ForegroundColor Green
}

Copy-FolderSafe "src"
Copy-FolderSafe "tools"
Copy-FolderSafe "docs"

# 4) Run tests and save output (best-effort)
function Run-And-Capture($cmd, $outFile) {
  Write-Host "Running: $cmd" -ForegroundColor Cyan
  try {
    $output = Invoke-Expression $cmd 2>&1 | Out-String
    $output | Out-File -FilePath (Join-Path $outDir $outFile) -Encoding utf8
    Write-Host "Saved: $outFile" -ForegroundColor Green
  } catch {
    "ERROR running: $cmd`n$($_.Exception.Message)" | Out-File -FilePath (Join-Path $outDir $outFile) -Encoding utf8
    Write-Host "Saved (with error): $outFile" -ForegroundColor Yellow
  }
}

# Usa seus atalhos do profile quando existirem
Run-And-Capture "to2" "test_to2_output.txt"
Run-And-Capture "tap" "test_tap_output.txt"

# 5) Zip it
$zipPath = Join-Path $root "$outDirName.zip"
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }

Compress-Archive -Path $outDir\* -DestinationPath $zipPath -Force
Write-Host ""
Write-Host "DONE ✅ Bundle created:" -ForegroundColor Green
Write-Host $zipPath -ForegroundColor Gray

# ─────────────────────────────────────────────────────────────
# Turistei: manter apenas os últimos N review bundles (dirs+zips)
# Default: 1
# Config opcional: $env:TURISTEI_REVIEW_BUNDLE_KEEP = "1"
# ─────────────────────────────────────────────────────────────
try {
  $keepCount = 1
  if ($env:TURISTEI_REVIEW_BUNDLE_KEEP) {
    $n = [int]$env:TURISTEI_REVIEW_BUNDLE_KEEP
    if ($n -gt 0) { $keepCount = $n }
  }

  # Pastas review_bundle_*
  $bundleDirs = Get-ChildItem -Directory -Filter "review_bundle_*" |
    Sort-Object Name -Descending

  if ($bundleDirs.Count -gt $keepCount) {
    $toDeleteDirs = $bundleDirs | Select-Object -Skip $keepCount
    foreach ($d in $toDeleteDirs) {
      Remove-Item -Recurse -Force $d.FullName
    }
  }

  # Zips review_bundle_*.zip
  $bundleZips = Get-ChildItem -File -Filter "review_bundle_*.zip" |
    Sort-Object Name -Descending

  if ($bundleZips.Count -gt $keepCount) {
    $toDeleteZips = $bundleZips | Select-Object -Skip $keepCount
    foreach ($z in $toDeleteZips) {
      Remove-Item -Force $z.FullName
    }
  }

  Write-Host "[Turistei] Review bundles: mantendo $keepCount (dirs+zips), antigos removidos." -ForegroundColor Green
} catch {
  Write-Host "[Turistei] Aviso: falha ao limpar review bundles antigos (não é crítico)." -ForegroundColor Yellow
}
