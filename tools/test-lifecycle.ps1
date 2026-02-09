$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"

$email = "simone@turistei.com"
$password = "123456"

Write-Host "== TURISTEI LIFECYCLE TEST ==" -ForegroundColor Cyan
Write-Host ("BaseURL: " + $baseUrl) -ForegroundColor DarkGray

function Assert-True($cond, $msg) {
  if (-not $cond) { throw ("ASSERT_FAIL: " + $msg) }
}

# 1) LOGIN
Write-Host "`n[1/5] LOGIN" -ForegroundColor Cyan
$body = @{ email = $email; password = $password } | ConvertTo-Json -Compress
$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body $body
Assert-True ($login.token) "login must return token"
Write-Host ("LOGIN_OK token_prefix=" + $login.token.Substring(0,30)) -ForegroundColor Green
$headers = @{ Authorization = "Bearer $($login.token)" }

# 2) CREATE ORDER
Write-Host "`n[2/5] CREATE ORDER" -ForegroundColor Cyan
$createBody = '{"items":[{"serviceId":1,"quantity":1}]}'
$created = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders" -Headers $headers -ContentType "application/json" -Body $createBody
Assert-True ($created -and $created.id) "create must return created.id"
Write-Host ("CREATED_ID=" + $created.id) -ForegroundColor Green
Assert-True ($created.status -eq "CREATED") "new order status must be CREATED"

$id = $created.id

# 3) PAY (CREATED -> PAID)
Write-Host "`n[3/5] PAY (CREATED -> PAID)" -ForegroundColor Cyan
$paid = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id/pay" -Headers $headers
Assert-True ($paid.status -eq "PAID") "status must be PAID after pay"

# 4) CONFIRM (PAID -> CONFIRMED)
Write-Host "`n[4/5] CONFIRM (PAID -> CONFIRMED)" -ForegroundColor Cyan
$confirmed = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id/confirm" -Headers $headers
Assert-True ($confirmed.status -eq "CONFIRMED") "status must be CONFIRMED after confirm"

# 5) COMPLETE (CONFIRMED -> COMPLETED)
Write-Host "`n[5/5] COMPLETE (CONFIRMED -> COMPLETED)" -ForegroundColor Cyan
$completed = Invoke-RestMethod -Method Post -Uri "$baseUrl/orders/$id/complete" -Headers $headers
Assert-True ($completed.status -eq "COMPLETED") "status must be COMPLETED after complete"

Write-Host "`nDONE OK" -ForegroundColor Green
