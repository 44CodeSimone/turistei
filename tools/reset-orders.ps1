# reset-orders.ps1
# Zera o arquivo pedido.json de forma segura

$ErrorActionPreference = "Stop"

$pedidoPath = ".\pedido.json"

Write-Host "== TURISTEI RESET ORDERS ==" -ForegroundColor Cyan

if (-not (Test-Path $pedidoPath)) {
    Write-Host "ERRO: pedido.json nao encontrado." -ForegroundColor Red
    exit 1
}

$backupDir = ".\backups\manual-reset"
if (-not (Test-Path $backupDir)) {
    New-Item -ItemType Directory -Path $backupDir | Out-Null
}

$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
$backupFile = "$backupDir\pedido.backup_$timestamp.json"

Copy-Item $pedidoPath $backupFile
Write-Host "Backup criado em: $backupFile" -ForegroundColor Yellow

@'
{
  "orders": []
}
'@ | Set-Content -Path $pedidoPath -Encoding UTF8

Write-Host "pedido.json foi resetado com sucesso." -ForegroundColor Green
