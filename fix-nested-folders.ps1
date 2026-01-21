# Script to fix nested Year folders
# Current: data/input/batch 21/IT/Year 1/Year 1/Semester X
# Target: data/input/batch 21/IT/Year 1/Semester X

$baseDir = "d:\Grading System\data\input\batch 21\IT"
$years = @("Year 1", "Year 2", "Year 3", "Year 4")

Write-Host "Fixing nested Year folders..." -ForegroundColor Green

foreach ($year in $years) {
    $parentPath = "$baseDir\$year"
    $nestedPath = "$parentPath\$year"
    
    if (Test-Path $nestedPath) {
        Write-Host "`nProcessing: $year" -ForegroundColor Yellow
        
        # Create a temporary folder
        $tempPath = "$baseDir\temp_$year"
        
        # Move contents from nested folder to temp
        Write-Host "  Moving contents from nested folder to temp..." -ForegroundColor Cyan
        Move-Item -Path "$nestedPath\*" -Destination $tempPath -Force
        
        # Remove the now-empty nested folder
        Remove-Item -Path $nestedPath -Force
        
        # Move contents from temp to parent
        Write-Host "  Moving contents to correct location..." -ForegroundColor Cyan
        Move-Item -Path "$tempPath\*" -Destination $parentPath -Force
        
        # Remove temp folder
        Remove-Item -Path $tempPath -Force
        
        Write-Host "  Fixed: $year" -ForegroundColor Green
    }
    else {
        Write-Host "  No nested folder found in: $year" -ForegroundColor Gray
    }
}

Write-Host "`nAll nested folders fixed!" -ForegroundColor Green
