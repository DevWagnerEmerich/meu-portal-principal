# Script para encontrar marcadores de conflito do Git
Write-Host "Procurando por marcadores de conflito do Git..." -ForegroundColor Yellow
Write-Host ""

$conflictMarkers = @("<<<<<<< HEAD", "=======", ">>>>>>>")
$foundConflicts = $false

foreach ($marker in $conflictMarkers) {
    Write-Host "Procurando por: $marker" -ForegroundColor Cyan
    $files = Get-ChildItem -Path . -Recurse -File -Exclude "*.md","*.txt","node_modules","*.log",".git" | 
        Select-String -Pattern $marker -List | 
        Select-Object -ExpandProperty Path -Unique
    
    if ($files) {
        $foundConflicts = $true
        Write-Host "Encontrado em:" -ForegroundColor Red
        foreach ($file in $files) {
            Write-Host "  - $file" -ForegroundColor Red
        }
    } else {
        Write-Host "  Nenhum encontrado" -ForegroundColor Green
    }
    Write-Host ""
}

if (-not $foundConflicts) {
    Write-Host "✅ Nenhum marcador de conflito encontrado!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Marcadores de conflito encontrados! Corrija os arquivos acima." -ForegroundColor Yellow
}
