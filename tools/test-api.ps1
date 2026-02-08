$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"

$email = "simone@turistei.com"
$password = "123456"

Write-Host "== TURISTEI TEST ==" -ForegroundColor Cyan
Write-Host ("BaseURL: " + $baseUrl) -ForegroundColor DarkGray

function Assert-True($cond, $msg) {
  if (-not $cond) { throw ("ASSERT_FAIL: " + $msg) }
}

function Parse-Date($v) {
  try { [DateTime]::Parse($v) } catch { [DateTime]::MinValue }
}

function Get-CustomerEmail($o) {
  try {
    if (-not $o) { return $null }
    if (-not $o.PSObject.Properties.Match('customer')) { return $null }

    $c = $o.customer
    if (-not $c) { return $null }
    if (-not $c.PSObject.Properties.Match('email')) { return $null }

    $e = $c.email
    if ($null -eq $e) { return $null }

    $s = [string]$e
    if ([string]::IsNullOrWhiteSpace($s)) { return $null }
    return $s
  } catch {
    return $null
  }
}

# 1) HEALTH
Write-Host "`n[1/6] HEALTH" -ForegroundColor Cyan
$health = Invoke-RestMethod -Method Get -Uri "$baseUrl/health"
$health | Format-Table -AutoSize
Assert-True ($health.status -eq "ok") "health.status must be ok"

# 2) LOGIN
Write-Host "`n[2/6] LOGIN" -ForegroundColor Cyan
$body = @{ email = $email; password = $password } | ConvertTo-Json -Compress
$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body $body
Assert-True ($login.token) "login must return token"
Write-Host ("LOGIN_OK token_prefix=" + $login.token.Substring(0,30)) -ForegroundColor Green
$headers = @{ Authorization = "Bearer $($login.token)" }

# 3) AUTH/ME
Write-Host "`n[3/6] AUTH/ME" -ForegroundColor Cyan
$me = Invoke-RestMethod -Method Get -Uri "$baseUrl/auth/me" -Headers $headers
$me | ConvertTo-Json -Depth 10

# 4) ORDERS (LIST)
Write-Host "`n[4/6] ORDERS (LIST)" -ForegroundColor Cyan
$orders = Invoke-RestMethod -Method Get -Uri "$baseUrl/orders" -Headers $headers

# só considera pedidos com customer.email válido (sem quebrar se não existir)
$validOrders = @($orders) | Where-Object { (Get-CustomerEmail $_) }

$sorted = $validOrders | Sort-Object { Parse-Date $_.updatedAt } -Descending

$orders_count = @($sorted).Count
$lastUpdated = if ($orders_count -gt 0) { $sorted[0].updatedAt } else { "n/a" }

Write-Host ("orders_count=" + $orders_count)
Write-Host ("orders_lastUpdated=" + $lastUpdated)

$sorted | Select-Object id, status, @{n="gross";e={$_.totals.gross}}, @{n="customer";e={ Get-CustomerEmail $_ }} | Format-Table -AutoSize

# 5) ORDERS (GET BY ID)
Write-Host "`n[5/6] ORDERS (GET BY ID)" -ForegroundColor Cyan

$testingOrder = if ($orders_count -gt 0) { $sorted[0] } else { $null }
$testingId = if ($testingOrder) { $testingOrder.id } else { $null }

Write-Host ("TESTING_ID=" + $testingId)

if ($testingId) {
  $orderById = Invoke-RestMethod -Method Get -Uri "$baseUrl/orders/$testingId" -Headers $headers
  $orderById | ConvertTo-Json -Depth 25
}

# 6) ORDERS (CREATE + GET)
Write-Host "`n[6/6] ORDERS (CREATE + GET)" -ForegroundColor Cyan

$createBody = '{"items":[{"serviceId":1,"quantity":1}]}'
$created = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders" -Headers $headers -ContentType "application/json" -Body $createBody

Write-Host ("CREATED_ID=" + $created.id)
$created | ConvertTo-Json -Depth 25

Write-Host "`nDONE OK" -ForegroundColor Green
