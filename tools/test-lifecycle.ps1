$ErrorActionPreference = "Stop"

# ===============================
# Turistei - Orders Lifecycle Test
# ===============================

$baseUrl = "http://localhost:3000"

# mesmos seeds do tap
$email = "simone@turistei.com"
$password = "123456"

Write-Host "== TURISTEI LIFECYCLE TEST ==" -ForegroundColor Cyan
Write-Host ("BaseURL: " + $baseUrl) -ForegroundColor DarkGray

function Assert-True($cond, $msg) {
  if (-not $cond) { throw ("ASSERT_FAIL: " + $msg) }
}

function Get-OrderEventTypes($order) {
  $types = @()
  if ($order -and $order.PSObject.Properties.Match('history').Count -gt 0) {
    foreach ($h in @($order.history)) {
      if ($h -and $h.PSObject.Properties.Match('type').Count -gt 0) {
        $types += [string]$h.type
      }
    }
  }
  return $types
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

Assert-True ($login -and $login.token) "login must return token"
Write-Host ("LOGIN_OK token_prefix=" + $login.token.Substring(0,30)) -ForegroundColor Green

$headers = @{ Authorization = "Bearer $($login.token)" }

# 3) CREATE (new order)
Write-Host "`n[3/6] CREATE order" -ForegroundColor Cyan
$createBody = '{"items":[{"serviceId":1,"quantity":1}]}'
$order = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders" -Headers $headers -ContentType "application/json" -Body $createBody

Assert-True ($order -and $order.id) "created order must have id"
Assert-True ($order.status -eq "CREATED") "order.status must start as CREATED"

$id = [string]$order.id
Write-Host ("CREATED_ID=" + $id) -ForegroundColor Green

# 4) PAY -> CONFIRM -> COMPLETE
Write-Host "`n[4/6] PAY -> CONFIRM -> COMPLETE" -ForegroundColor Cyan

$orderPay = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id/pay" -Headers $headers
Assert-True ($orderPay.status -eq "PAID") "after pay status must be PAID"

$orderConfirm = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id/confirm" -Headers $headers
Assert-True ($orderConfirm.status -eq "CONFIRMED") "after confirm status must be CONFIRMED"

$orderComplete = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id/complete" -Headers $headers
Assert-True ($orderComplete.status -eq "COMPLETED") "after complete status must be COMPLETED"

$types = Get-OrderEventTypes $orderComplete
Assert-True ($types -contains "ORDER_CREATED") "history must contain ORDER_CREATED"
Assert-True ($types -contains "ORDER_PAID") "history must contain ORDER_PAID"
Assert-True ($types -contains "ORDER_CONFIRMED") "history must contain ORDER_CONFIRMED"
Assert-True ($types -contains "ORDER_COMPLETED") "history must contain ORDER_COMPLETED"

Write-Host "OK: lifecycle CREATED->PAID->CONFIRMED->COMPLETED" -ForegroundColor Green

# 5) CANCEL on a new order + invalid transition check
Write-Host "`n[5/6] CANCEL + invalid transition" -ForegroundColor Cyan

$order2 = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders" -Headers $headers -ContentType "application/json" -Body $createBody
Assert-True ($order2.status -eq "CREATED") "order2 must start as CREATED"

$id2 = [string]$order2.id
Write-Host ("CANCEL_TEST_ID=" + $id2) -ForegroundColor Green

$cancelBody = '{"reason":"Cliente desistiu"}'
$order2Cancelled = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id2/cancel" -Headers $headers -ContentType "application/json" -Body $cancelBody
Assert-True ($order2Cancelled.status -eq "CANCELLED") "after cancel status must be CANCELLED"

# invalid transition: CANCELLED -> COMPLETED must fail
$failedAsExpected = $false
try {
  Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id2/complete" -Headers $headers | Out-Null
} catch {
  $msg = $_.ErrorDetails.Message
  if ($msg -match "INVALID_ORDER_TRANSITION") { $failedAsExpected = $true }
}

Assert-True $failedAsExpected "CANCELLED -> COMPLETED must fail with INVALID_ORDER_TRANSITION"

Write-Host "OK: cancel + invalid transition enforced" -ForegroundColor Green

# 6) Summary
Write-Host "`n[6/6] SUMMARY" -ForegroundColor Cyan
Write-Host ("Lifecycle OK for: " + $id) -ForegroundColor DarkGray
Write-Host ("Cancel+Guard OK for: " + $id2) -ForegroundColor DarkGray

Write-Host "`nDONE OK" -ForegroundColor Green
