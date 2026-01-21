# Script to reorganize data folder structure
# New structure: data/input/batch XX/[IT|ITM|AI]/Year X

$baseDir = "d:\Grading System\data"

# Create the new folder structure
Write-Host "Creating new folder structure..." -ForegroundColor Green

# Create input folder
New-Item -Path "$baseDir\input" -ItemType Directory -Force | Out-Null

# Create batch folders
$batches = @("batch 20", "batch 21", "batch 22")
$departments = @("IT", "ITM", "AI")
$years = @("Year 1", "Year 2", "Year 3", "Year 4")

foreach ($batch in $batches) {
    foreach ($dept in $departments) {
        foreach ($year in $years) {
            $path = "$baseDir\input\$batch\$dept\$year"
            New-Item -Path $path -ItemType Directory -Force | Out-Null
            Write-Host "Created: $path" -ForegroundColor Cyan
        }
    }
}

# Move existing Year folders to batch 21/IT/
Write-Host "`nMoving existing Year folders to batch 21/IT/..." -ForegroundColor Green

foreach ($year in $years) {
    $sourcePath = "$baseDir\$year"
    $destPath = "$baseDir\input\batch 21\IT\$year"
    
    if (Test-Path $sourcePath) {
        Write-Host "Moving $sourcePath to $destPath" -ForegroundColor Yellow
        
        # Copy the entire folder
        Copy-Item -Path $sourcePath -Destination $destPath -Recurse -Force
        
        # Remove the original folder
        Remove-Item -Path $sourcePath -Recurse -Force
        
        Write-Host "Moved: $year" -ForegroundColor Green
    } else {
        Write-Host "Source not found: $sourcePath" -ForegroundColor Red
    }
}

Write-Host "`nReorganization complete!" -ForegroundColor Green
Write-Host "`nNew structure created at: $baseDir\input" -ForegroundColor Cyan
