import fs from 'fs';
import path from 'path';

/**
 * Migration script to move existing data from legacy structure to new batch/degree structure
 * 
 * Legacy: data/output/Year X/Semester Y/...
 * New: data/output/batch 21/IT/Year X/Semester Y/...
 */

const TARGET_BATCH = 'batch 21';
const TARGET_DEGREE = 'IT';

function migrateData() {
    const dataDir = path.join(process.cwd(), 'data');
    const outputDir = path.join(dataDir, 'output');
    const newOutputDir = path.join(outputDir, TARGET_BATCH, TARGET_DEGREE);

    console.log('🔄 Starting data migration...');
    console.log(`📂 Source: ${outputDir}`);
    console.log(`📂 Target: ${newOutputDir}`);

    // Check if output directory exists
    if (!fs.existsSync(outputDir)) {
        console.error('❌ Output directory does not exist:', outputDir);
        return;
    }

    // Create target directory
    if (!fs.existsSync(newOutputDir)) {
        fs.mkdirSync(newOutputDir, { recursive: true });
        console.log('✅ Created target directory:', newOutputDir);
    }

    // Find all Year folders in output directory
    const entries = fs.readdirSync(outputDir, { withFileTypes: true });
    const yearFolders = entries.filter(entry =>
        entry.isDirectory() && entry.name.match(/^Year\s+\d+$/i)
    );

    if (yearFolders.length === 0) {
        console.log('ℹ️ No Year folders found to migrate');
        return;
    }

    console.log(`📦 Found ${yearFolders.length} Year folders to migrate:`, yearFolders.map(f => f.name));

    let movedCount = 0;
    let skippedCount = 0;

    for (const yearFolder of yearFolders) {
        const sourcePath = path.join(outputDir, yearFolder.name);
        const targetPath = path.join(newOutputDir, yearFolder.name);

        // Check if target already exists
        if (fs.existsSync(targetPath)) {
            console.log(`⚠️ Skipping ${yearFolder.name} (already exists in target)`);
            skippedCount++;
            continue;
        }

        try {
            // Copy the entire folder
            copyFolderRecursive(sourcePath, targetPath);
            console.log(`✅ Migrated: ${yearFolder.name}`);
            movedCount++;

            // Remove the original folder after successful copy
            fs.rmSync(sourcePath, { recursive: true, force: true });
            console.log(`🗑️ Removed original: ${yearFolder.name}`);
        } catch (error) {
            console.error(`❌ Error migrating ${yearFolder.name}:`, error);
        }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Migrated: ${movedCount} folders`);
    console.log(`   ⚠️ Skipped: ${skippedCount} folders`);
    console.log(`   📁 Target location: ${newOutputDir}`);
    console.log('\n✨ Migration complete!');
}

/**
 * Recursively copy a folder and all its contents
 */
function copyFolderRecursive(source: string, target: string) {
    // Create target directory
    if (!fs.existsSync(target)) {
        fs.mkdirSync(target, { recursive: true });
    }

    // Read source directory
    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            // Recursively copy subdirectory
            copyFolderRecursive(sourcePath, targetPath);
        } else {
            // Copy file
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

// Run migration
migrateData();
