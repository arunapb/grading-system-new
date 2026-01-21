const fs = require('fs');
const path = require('path');

/**
 * Migration script to fix semester values in JSON files
 * Extracts semester from folder path, not from filename
 */

const outputDir = path.join(__dirname, '..', 'data', 'output');

function findJSONFiles(dir, basePath = '') {
    const results = [];
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        const relativePath = path.join(basePath, entry.name);

        if (entry.isDirectory()) {
            results.push(...findJSONFiles(fullPath, relativePath));
        } else if (entry.name.endsWith('.json') && !entry.name.includes('metadata')) {
            results.push({ fullPath, relativePath });
        }
    }

    return results;
}

function extractSemesterFromPath(relativePath) {
    // Extract semester from folder structure only
    const parts = relativePath.split(/[\\\/]/);

    for (const part of parts) {
        const match = part.match(/Semester\s+(\d+)/i);
        if (match) {
            return match[1]; // Return just the number (1 or 2)
        }
    }

    return null;
}

function fixSemesterInFile(fileInfo) {
    try {
        const { fullPath, relativePath } = fileInfo;
        const content = fs.readFileSync(fullPath, 'utf-8');
        const data = JSON.parse(content);

        // Extract correct semester from folder path
        const correctSemester = extractSemesterFromPath(relativePath);

        if (!correctSemester) {
            console.log(`⚠️  Skipped: ${path.basename(fullPath)} (no semester in path)`);
            return false;
        }

        // Check if semester needs fixing
        if (data.semester !== correctSemester) {
            const oldValue = data.semester;
            data.semester = correctSemester;

            // Write back to file
            fs.writeFileSync(fullPath, JSON.stringify(data, null, 2), 'utf-8');
            console.log(`✅ Fixed: ${path.basename(fullPath)}`);
            console.log(`   Path: ${relativePath}`);
            console.log(`   "${oldValue}" → "${correctSemester}"`);
            return true;
        }

        console.log(`✓ OK: ${path.basename(fullPath)} (already "${correctSemester}")`);
        return false;
    } catch (error) {
        console.error(`❌ Error processing ${fileInfo.fullPath}:`, error.message);
        return false;
    }
}

function main() {
    console.log('🔧 Starting semester format migration (from folder path)...\n');

    if (!fs.existsSync(outputDir)) {
        console.error('❌ Output directory does not exist:', outputDir);
        process.exit(1);
    }

    const jsonFiles = findJSONFiles(outputDir);
    console.log(`📁 Found ${jsonFiles.length} JSON files\n`);

    let fixedCount = 0;
    let okCount = 0;
    let skippedCount = 0;

    for (const fileInfo of jsonFiles) {
        const result = fixSemesterInFile(fileInfo);
        if (result === true) {
            fixedCount++;
        } else if (result === false && fileInfo.relativePath.includes('Semester')) {
            okCount++;
        } else {
            skippedCount++;
        }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Fixed: ${fixedCount} files`);
    console.log(`   ✓  Already correct: ${okCount} files`);
    console.log(`   ⏭️  Skipped: ${skippedCount} files`);
    console.log(`   📁 Total: ${jsonFiles.length} files`);
    console.log('\n✨ Migration complete!');
}

main();
