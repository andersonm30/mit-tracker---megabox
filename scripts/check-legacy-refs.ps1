# TRAVA C: Grep obrigatório no pipeline CI/CD (PowerShell)
# Bloqueia merge se encontrar window.$traccar ou window.$tarkan

Write-Host "Verificando refs legadas (window.traccar / window.tarkan)..." -ForegroundColor Cyan

$traccarRefs = Select-String -Pattern "window\.\`$traccar" -Path src\**\*.js,src\**\*.vue `
  -Exclude "*runtimeApi.js","*traccarConnector.js","*.backup.*" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count

$tarkanRefs = Select-String -Pattern "window\.\`$tarkan" -Path src\**\*.js,src\**\*.vue `
  -Exclude "*runtimeApi.js","*tarkanConnector.js","*.backup.*" -ErrorAction SilentlyContinue | Measure-Object | Select-Object -ExpandProperty Count

$total = $traccarRefs + $tarkanRefs

if ($total -gt 0) {
  Write-Host ""
  Write-Host "FALHOU: $total refs legadas encontradas!" -ForegroundColor Red
  Write-Host ""
  Write-Host "   window.`$traccar: $traccarRefs refs" -ForegroundColor Yellow
  Write-Host "   window.`$tarkan:  $tarkanRefs refs" -ForegroundColor Yellow
  Write-Host ""
  Write-Host "   Use runtimeApi (inject/getRuntimeApi) ao inves de window.`$traccar/`$tarkan." -ForegroundColor Yellow
  Write-Host "   Veja: src/services/runtimeApi.js" -ForegroundColor Yellow
  exit 1
} else {
  Write-Host "PASSOU: 0 refs legadas encontradas." -ForegroundColor Green
  exit 0
}
