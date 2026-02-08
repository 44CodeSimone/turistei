$ErrorActionPreference = "Stop"

$baseUrl = "http://localhost:3000"

Write-Host "== TURISTEI ADMIN TEST ==" -ForegroundColor Cyan
Write-Host "BaseURL: $baseUrl"

# Login admin (seed user do auth.service)
$loginBody = @{
  email = "simone@turistei.com"
  password = "123456"
} | ConvertTo-Json

$login = Invoke-RestMethod -Method Post -Uri "$baseUrl/auth/login" -ContentType "application/json" -Body $loginBody
if (-not $login.token) { throw "LOGIN FAILED: token missing" }

$headers = @{ Authorization = "Bearer $($login.token)" }

Write-Host ""
Write-Host "[1/2] ADMIN /summary (admin)" -ForegroundColor Yellow
$summary = Invoke-RestMethod -Method Get -Uri "$baseUrl/admin/summary" -Headers $headers

# Checks mínimos
if ($summary.status -ne "ok") { throw "Expected status=ok" }
if ($summary.service -ne "admin") { throw "Expected service=admin" }
if ($summary.user.role -ne "admin") { throw "Expected role=admin" }

$summary | ConvertTo-Json -Depth 10
Write-Host ""
Write-Host "DONE " -ForegroundColor Green
