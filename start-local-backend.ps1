# ==========================================================================
# Cesamar Turismo - sobe o banco (Docker) e a API/site (.NET 8) localmente
# Uso: powershell -ExecutionPolicy Bypass -File .\start-local-backend.ps1
# Site: http://localhost:5080   Retaguarda: http://localhost:5080/retaguarda/
# ==========================================================================
$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host ""
Write-Host "== Cesamar Turismo - ambiente local ==" -ForegroundColor Cyan

# 1) Docker / PostgreSQL
if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    Write-Host "Docker nao encontrado. Abra o Docker Desktop e tente de novo." -ForegroundColor Red
    exit 1
}
Write-Host "[1/3] Subindo PostgreSQL (container cesamar-postgres, porta 5433)..."
docker compose up -d | Out-Host

$ok = $false
for ($i = 0; $i -lt 40; $i++) {
    $status = docker inspect -f "{{.State.Health.Status}}" cesamar-postgres 2>$null
    if ($status -eq "healthy") { $ok = $true; break }
    Start-Sleep -Seconds 2
}
if (-not $ok) {
    Write-Host "O banco nao ficou pronto. Veja: docker logs cesamar-postgres" -ForegroundColor Red
    exit 1
}
Write-Host "      Banco pronto." -ForegroundColor Green

# 2) .NET
if (-not (Get-Command dotnet -ErrorAction SilentlyContinue)) {
    Write-Host ".NET SDK 8 nao encontrado. Instale em https://dotnet.microsoft.com/download/dotnet/8.0" -ForegroundColor Red
    exit 1
}
$proj = Join-Path $root "src\backend\Cesamar.Api\Cesamar.Api.csproj"
Write-Host "[2/3] Compilando a API..."
dotnet build $proj -c Release --nologo -v q | Out-Host
if ($LASTEXITCODE -ne 0) { Write-Host "Falha no build." -ForegroundColor Red; exit 1 }

# 3) Executar
Write-Host "[3/3] Iniciando em http://localhost:5080  (Ctrl+C para parar)" -ForegroundColor Green
Write-Host "      Retaguarda: http://localhost:5080/retaguarda/  (token em appsettings.Development.json)"
Start-Job { Start-Sleep -Seconds 4; Start-Process "http://localhost:5080" } | Out-Null
dotnet run --project $proj -c Release --no-build --launch-profile Cesamar.Api
