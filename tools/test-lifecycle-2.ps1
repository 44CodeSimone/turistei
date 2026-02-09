$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"

$email = "simone@turistei.com"
$password = "123456"

Write-Host "== TURISTEI LIFECYCLE TEST 2 (CANCEL + INVALID) ==" -ForegroundColor Cyan
Write-Host ("BaseURL: " + $baseUrl) -ForegroundColor DarkGray

function Assert-True($cond, $msg) {
  if (-not $cond) { throw ("ASSERT_FAIL: " + $msg) }
}

function Expect-HttpError($scriptBlock, $expectedStatus, $label) {
  try {
    & $scriptBlock
    throw ("EXPECTED_HTTP_ERROR_BUT_SUCCEEDED: " + $label)
  } catch {
    $msg = $_.Exception.Message

    $ok = $false
    if ($msg -match "\b$expectedStatus\b") { $ok = $true }

    if (-not $ok) {
      throw ("EXPECTED_STATUS_" + $expectedStatus + "_BUT_GOT: " + $msg)
    }

    Write-Host ("EXPECTED_ERROR_OK (" + $label + ") status=" + $expectedStatus) -ForegroundColor Green
  }
}

# 1) LOGIN
Write-Host "`n[1/6] LOGIN" -ForegroundColor Cyan
$body = @{ email = $email; password = $password } | ConvertTo-Json -Compress
$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body $body
Assert-True ($login.token) "login must return token"
Write-Host ("LOGIN_OK token_prefix=" + $login.token.Substring(0,30)) -ForegroundColor Green
$headers = @{ Authorization = "Bearer $($login.token)" }

# 2) CREATE ORDER
Write-Host "`n[2/6] CREATE ORDER" -ForegroundColor Cyan
$createBody = '{"items":[{"serviceId":1,"quantity":1}]}'
$created = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders" -Headers $headers -ContentType "application/json" -Body $createBody
Assert-True ($created -and $created.id) "create must return created.id"
Write-Host ("CREATED_ID=" + $created.id) -ForegroundColor Green
Assert-True ($created.status -eq "CREATED") "new order status must be CREATED"

$id = $created.id

# 3) CANCEL (CREATED -> CANCELLED) com reason
Write-Host "`n[3/6] CANCEL (CREATED -> CANCELLED)" -ForegroundColor Cyan
$cancelBody = '{"reason":"Cliente desistiu"}'
$cancelled = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id/cancel" -Headers $headers -ContentType "application/json" -Body $cancelBody
Assert-True ($cancelled.status -eq "CANCELLED") "status must be CANCELLED after cancel"

# 4) TENTAR PAY DEPOIS DE CANCELLED (deve dar 409)
Write-Host "`n[4/6] INVALID TRANSITION: CANCELLED -> PAID (must 409)" -ForegroundColor Cyan
Expect-HttpError { Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id/pay" -Headers $headers } 409 "cancelled_to_paid"

# 5) CREATE ORDER 2 (para testar invalid PAY->COMPLETED direto)
Write-Host "`n[5/6] CREATE ORDER 2" -ForegroundColor Cyan
$created2 = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders" -Headers $headers -ContentType "application/json" -Body $createBody
Assert-True ($created2 -and $created2.id) "create2 must return id"
Write-Host ("CREATED2_ID=" + $created2.id) -ForegroundColor Green

$id2 = $created2.id

# 6) PAY e depois tentar COMPLETE direto (PAID -> COMPLETED deve dar 409)
Write-Host "`n[6/6] INVALID TRANSITION: PAID -> COMPLETED (must 409)" -ForegroundColor Cyan
$paid2 = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id2/pay" -Headers $headers
Assert-True ($paid2.status -eq "PAID") "status must be PAID after pay (order2)"

Expect-HttpError { Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id2/complete" -Headers $headers } 409 "paid_to_completed"

Write-Host "`nDONE OK" -ForegroundColor Green
