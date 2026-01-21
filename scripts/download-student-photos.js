const fs = require('fs');
const path = require('path');
const axios = require('axios');

const PROFILES_FILE = path.join(__dirname, '..', 'data', 'student-profiles.json');
const PUBLIC_DIR = path.join(__dirname, '..', 'public');
const PHOTOS_DIR = path.join(PUBLIC_DIR, 'student-photos');

async function downloadPhotos() {
    console.log('📥 Starting photo download process...');

    // Ensure directories exist
    if (!fs.existsSync(PHOTOS_DIR)) {
        fs.mkdirSync(PHOTOS_DIR, { recursive: true });
        console.log(`✅ Created directory: ${PHOTOS_DIR}`);
    }

    // Read profiles
    const profiles = JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf-8'));
    const students = Object.entries(profiles);

    console.log(`👥 Found ${students.length} profiles to process`);

    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const [indexNumber, profile] of students) {
        if (!profile.photoUrl || profile.photoUrl.startsWith('/')) {
            skipped++;
            continue;
        }

        try {
            const photoUrl = profile.photoUrl;
            const extension = path.extname(photoUrl) || '.png';
            const filename = `${indexNumber}${extension}`;
            const localPath = path.join(PHOTOS_DIR, filename);
            const publicPath = `/student-photos/${filename}`;

            // Download image
            const response = await axios({
                method: 'GET',
                url: photoUrl,
                responseType: 'stream'
            });

            const writer = fs.createWriteStream(localPath);
            response.data.pipe(writer);

            await new Promise((resolve, reject) => {
                writer.on('finish', resolve);
                writer.on('error', reject);
            });

            // Update profile with local path
            profiles[indexNumber].photoUrl = publicPath;
            downloaded++;

            // Log progress every 10 items
            if (downloaded % 10 === 0) {
                process.stdout.write('.');
            }

        } catch (error) {
            console.error(`\n❌ Failed to download for ${indexNumber}: ${error.message}`);
            failed++;
        }
    }

    console.log('\n');

    // Save updated profiles
    fs.writeFileSync(PROFILES_FILE, JSON.stringify(profiles, null, 2), 'utf-8');

    console.log('📊 Download Summary:');
    console.log(`   ✅ Downloaded: ${downloaded}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   💾 Updated profiles saved to ${PROFILES_FILE}`);
}

downloadPhotos().catch(console.error);
