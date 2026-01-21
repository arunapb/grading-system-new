const fs = require('fs');
const path = require('path');

/**
 * Fix semester values in metadata.json
 * Extract semester from folder path only, not from filename
 */

const metadataPath = path.join(__dirname, '..', 'data', 'metadata.json');

function extractSemesterFromPath(pdfPath) {
    // Split path and get directory parts only (exclude filename)
    const parts = pdfPath.split(/[\\\/]/);
    const directoryParts = parts.slice(0, -1);

    for (const part of directoryParts) {
        const match = part.match(/Semester\s+(\d+)/i);
        if (match) {
            return match[1]; // Return just the number (1 or 2)
        }
    }

    return null;
}

function extractYearFromPath(pdfPath) {
    // Split path and get directory parts only (exclude filename)
    const parts = pdfPath.split(/[\\\/]/);
    const directoryParts = parts.slice(0, -1);

    for (const part of directoryParts) {
        if (part.match(/Year\s+\d+/i)) {
            return part;
        }
    }

    return null;
}

function main() {
    console.log('🔧 Fixing metadata.json semester values...\n');

    if (!fs.existsSync(metadataPath)) {
        console.error('❌ metadata.json not found:', metadataPath);
        process.exit(1);
    }

    // Read metadata
    const content = fs.readFileSync(metadataPath, 'utf-8');
    const metadata = JSON.parse(content);

    let fixedCount = 0;
    let unchangedCount = 0;

    // Fix each entry
    for (const [pdfPath, data] of Object.entries(metadata)) {
        const correctSemester = extractSemesterFromPath(pdfPath);
        const correctYear = extractYearFromPath(pdfPath);

        let changed = false;

        if (correctSemester && data.semester !== correctSemester) {
            console.log(`✅ Fixed semester for: ${pdfPath}`);
            console.log(`   "${data.semester}" → "${correctSemester}"`);
            data.semester = correctSemester;
            changed = true;
        }

        if (correctYear && data.year !== correctYear) {
            console.log(`✅ Fixed year for: ${pdfPath}`);
            console.log(`   "${data.year}" → "${correctYear}"`);
            data.year = correctYear;
            changed = true;
        }

        if (changed) {
            fixedCount++;
        } else {
            unchangedCount++;
        }
    }

    // Write back
    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');

    console.log('\n📊 Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} entries`);
    console.log(`   ✓  Unchanged: ${unchangedCount} entries`);
    console.log(`   📁 Total: ${Object.keys(metadata).length} entries`);
    console.log('\n✨ metadata.json updated!');
}

main();
