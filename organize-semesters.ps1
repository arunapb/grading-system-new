# Script to properly organize semester folders
# Some PDFs are loose in Year folders, need to organize them into Semester 1 and Semester 2

$baseDir = "d:\Grading System\data\input\batch 21\IT"
$years = @("Year 1", "Year 2", "Year 3", "Year 4")

Write-Host "Organizing semester folders..." -ForegroundColor Green

foreach ($year in $years) {
    $yearPath = "$baseDir\$year"
    
    if (Test-Path $yearPath) {
        Write-Host "`nProcessing: $year" -ForegroundColor Yellow
        
        # Create Semester 1 folder if it doesn't exist
        $sem1Path = "$yearPath\Semester 1"
        if (-not (Test-Path $sem1Path)) {
            New-Item -Path $sem1Path -ItemType Directory -Force | Out-Null
            Write-Host "  Created: Semester 1" -ForegroundColor Cyan
        }
        
        # Create Semester 2 folder if it doesn't exist
        $sem2Path = "$yearPath\Semester 2"
        if (-not (Test-Path $sem2Path)) {
            New-Item -Path $sem2Path -ItemType Directory -Force | Out-Null
            Write-Host "  Created: Semester 2" -ForegroundColor Cyan
        }
        
        # Move loose PDF files to appropriate semester folders
        $pdfFiles = Get-ChildItem -Path $yearPath -File -Filter "*.pdf"
        
        foreach ($pdf in $pdfFiles) {
            # Check filename for semester indicator
            if ($pdf.Name -match "Semester 1" -or $pdf.Name -match "Semester_1") {
                Write-Host "  Moving to Semester 1: $($pdf.Name)" -ForegroundColor Gray
                Move-Item -Path $pdf.FullName -Destination $sem1Path -Force
            }
            elseif ($pdf.Name -match "Semester 2" -or $pdf.Name -match "Semester_2") {
                Write-Host "  Moving to Semester 2: $($pdf.Name)" -ForegroundColor Gray
                Move-Item -Path $pdf.FullName -Destination $sem2Path -Force
            }
            else {
                # Default to Semester 1 if no indicator found
                Write-Host "  Moving to Semester 1 (default): $($pdf.Name)" -ForegroundColor Gray
                Move-Item -Path $pdf.FullName -Destination $sem1Path -Force
            }
        }
        
        Write-Host "  Completed: $year" -ForegroundColor Green
    }
}

Write-Host "`nAll semester folders organized!" -ForegroundColor Green
