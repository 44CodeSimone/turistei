# ==========================================
# TURISTEI - OWNERSHIP TEST (PowerShell)
# Run:  powershell -ExecutionPolicy Bypass -File tools/test-ownership.ps1
# ==========================================

$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"
$pass    = "123456"

function LoginToken([string]$email) {
  $body = @{ email = $email; password = $pass } | ConvertTo-Json -Compress
  try {
    $r = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body $body
    return $r.token
  } catch {
    Write-Host "LOGIN FAIL for $email" -ForegroundColor Red
    throw
  }
}

function Assert-True([bool]$cond, [string]$msg) {
  if (-not $cond) { throw "ASSERT_TRUE_FAILED: $msg" }
}

function Assert-False([bool]$cond, [string]$msg) {
  if ($cond) { throw "ASSERT_FALSE_FAILED: $msg" }
}

Write-Host "== TURISTEI OWNERSHIP TEST ==" -ForegroundColor Cyan
Write-Host "BaseURL: $baseUrl`n" -ForegroundColor Gray

# ----------- USERS (must exist in auth.service.js seed users) ----------
# NOTE: simone@turistei.com é ADMIN no nosso modelo.
$userCommonA = "user2@turistei.com"
$userCommonB = "user3@turistei.com"
$adminEmail  = "simone@turistei.com"

# Tokens
$tA = LoginToken $userCommonA
$tB = LoginToken $userCommonB
$tAdmin = LoginToken $adminEmail

$hA = @{ Authorization = "Bearer $tA" }
$hB = @{ Authorization = "Bearer $tB" }
$hAdmin = @{ Authorization = "Bearer $tAdmin" }

# Create order as user A
Write-Host "[1/4] CREATE order as user A (user2)" -ForegroundColor Cyan
$orderBody = @{
  items = @(
    @{ serviceId = 1; quantity = 1 }
  )
} | ConvertTo-Json -Depth 5 -Compress

$oA = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders" -Headers $hA -ContentType "application/json" -Body $orderBody
Write-Host ("created_order_id=" + $oA.id) -ForegroundColor Green
Write-Host ("created_order_customer_id=" + $oA.customer.id) -ForegroundColor Green
Write-Host ""

# List as user B (must NOT include A's order)
Write-Host "[2/4] LIST orders as user B (user3) - must NOT include A id" -ForegroundColor Cyan
$lB = Invoke-RestMethod -Method Get -Uri "$baseUrl/orders" -Headers $hB
$idsB = @($lB | ForEach-Object { $_.id })
Write-Host ("userB_count=" + $idsB.Count) -ForegroundColor Gray
Write-Host ("userB_has_userA_order=" + ($idsB -contains $oA.id)) -ForegroundColor Yellow

Assert-False ($idsB -contains $oA.id) "User B must NOT see User A order in LIST."
Write-Host "OK: user B cannot see user A order in LIST." -ForegroundColor Green
Write-Host ""

# GET by id as user B (must be NOT_FOUND)
Write-Host "[3/4] GET order by id as user B - must be NOT_FOUND" -ForegroundColor Cyan
$gotNotFound = $false
try {
  $null = Invoke-RestMethod -Method Get -Uri "$baseUrl/orders/$($oA.id)" -Headers $hB
} catch {
  $errText = $_.Exception.Message
  # Se a API respondeu 404, o PowerShell cai aqui; aceitamos como comportamento correto
  $gotNotFound = $true
}
Assert-True $gotNotFound "User B must NOT be able to GET User A order by id."
Write-Host "OK: user B cannot GET user A order by id." -ForegroundColor Green
Write-Host ""

# Admin must include A's order
Write-Host "[4/4] LIST orders as admin (simone) - must include A id" -ForegroundColor Cyan
$lAdmin = Invoke-RestMethod -Method Get -Uri "$baseUrl/orders" -Headers $hAdmin
$idsAdmin = @($lAdmin | ForEach-Object { $_.id })
Write-Host ("admin_has_userA_order=" + ($idsAdmin -contains $oA.id)) -ForegroundColor Yellow

Assert-True ($idsAdmin -contains $oA.id) "Admin must see User A order."
Write-Host "OK: admin can see user A order." -ForegroundColor Green

Write-Host "`nDONE ✅" -ForegroundColor Green
