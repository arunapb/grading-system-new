const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const path = require('path');

/**
 * Scrape student profiles from UOM website
 * Extracts: index number, name, photo URL
 */

const URL = 'https://uom.lk/student/it-batch-21.php';
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'student-profiles.json');

async function scrapeStudentProfiles() {
    console.log('🌐 Fetching student data from UOM website...\n');
    console.log(`URL: ${URL}\n`);

    try {
        // Fetch the HTML
        const response = await axios.get(URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const html = response.data;
        const $ = cheerio.load(html);

        console.log('✅ Page fetched successfully\n');
        console.log('🔍 Parsing student data...\n');

        const profiles = {};
        let studentCount = 0;

        // Find all table rows
        const rows = $('tbody tr');

        // Process rows in pairs (image row + text row)
        for (let i = 0; i < rows.length; i += 2) {
            const imageRow = $(rows[i]);
            const textRow = $(rows[i + 1]);

            if (!textRow.length) continue;

            // Get all images from the image row
            const images = imageRow.find('img');
            // Get all text cells from the text row
            const textCells = textRow.find('td');

            // Process each student (4 students per row pair)
            images.each((idx, img) => {
                const $img = $(img);
                const $textCell = $(textCells[idx]);

                if (!$textCell.length) return;

                // Extract photo URL from img src
                let photoUrl = null;
                const src = $img.attr('src');
                if (src && !src.includes('anon.png')) {
                    // Convert relative URL to absolute
                    photoUrl = src.startsWith('http')
                        ? src
                        : `https://uom.lk/student/${src}`;
                }

                // Extract text content
                const cellText = $textCell.html();
                if (!cellText) return;

                // Parse index number and name
                // Format: "Reg. No&nbsp; 214001A<br> AATHEEK M.M"
                const match = cellText.match(/Reg\.\s*No[&nbsp;\s]+(\d{6}[A-Z])<br[^>]*>\s*([^<]+)/i);

                if (match) {
                    const indexNumber = match[1].trim();
                    const name = match[2].trim();

                    profiles[indexNumber] = {
                        name: name || null,
                        photoUrl: photoUrl
                    };

                    studentCount++;
                    console.log(`✓ ${indexNumber} - ${name}`);
                }
            });
        }

        console.log(`\n📊 Summary:`);
        console.log(`   Total students found: ${studentCount}`);
        console.log(`   Students with names: ${Object.values(profiles).filter(p => p.name).length}`);
        console.log(`   Students with photos: ${Object.values(profiles).filter(p => p.photoUrl).length}`);

        // Save to file
        const outputDir = path.dirname(OUTPUT_FILE);
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(profiles, null, 2), 'utf-8');
        console.log(`\n✅ Profiles saved to: ${OUTPUT_FILE}`);

        return profiles;

    } catch (error) {
        console.error('\n❌ Error scraping profiles:', error.message);
        throw error;
    }
}

// Run the scraper
scrapeStudentProfiles()
    .then(() => {
        console.log('\n✨ Scraping complete!');
        process.exit(0);
    })
    .catch((error) => {
        console.error('\n💥 Scraping failed:', error);
        process.exit(1);
    });
