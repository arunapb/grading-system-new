import fs from 'fs/promises'
import path from 'path'

/**
 * Migration script to move student profiles from old structure to new structure
 * Old: data/student-profiles.json + public/student-photos/
 * New: data/Students/batch 21/IT/student-profiles.json + photos/
 */
async function migrateStudentProfiles() {
    console.log('🚀 Starting student profiles migration...')

    const oldProfilesPath = path.join(process.cwd(), 'data', 'student-profiles.json')
    const oldPhotosDir = path.join(process.cwd(), 'public', 'student-photos')

    const newBatch = 'batch 21'
    const newDegree = 'IT'
    const newProfilesDir = path.join(process.cwd(), 'data', 'Students', newBatch, newDegree)
    const newPhotosDir = path.join(newProfilesDir, 'photos')
    const newProfilesPath = path.join(newProfilesDir, 'student-profiles.json')

    try {
        // Check if old file exists
        try {
            await fs.access(oldProfilesPath)
        } catch {
            console.log('❌ Old student-profiles.json not found. Nothing to migrate.')
            return
        }

        // Read old profiles
        console.log('📖 Reading old student profiles...')
        const oldProfilesContent = await fs.readFile(oldProfilesPath, 'utf-8')
        const oldProfiles = JSON.parse(oldProfilesContent)

        // Create new directories
        console.log('📁 Creating new directory structure...')
        await fs.mkdir(newProfilesDir, { recursive: true })
        await fs.mkdir(newPhotosDir, { recursive: true })

        // Update photo URLs and copy photos
        console.log('📸 Migrating photos...')
        let photosMoved = 0
        let photosSkipped = 0

        for (const [indexNumber, profile] of Object.entries(oldProfiles)) {
            const typedProfile = profile as { name: string; photoUrl: string | null }

            if (typedProfile.photoUrl) {
                // Extract filename from old URL
                const oldPhotoFilename = path.basename(typedProfile.photoUrl)
                const oldPhotoPath = path.join(oldPhotosDir, oldPhotoFilename)

                try {
                    // Check if photo exists
                    await fs.access(oldPhotoPath)

                    // Copy photo to new location
                    const newPhotoPath = path.join(newPhotosDir, oldPhotoFilename)
                    await fs.copyFile(oldPhotoPath, newPhotoPath)

                    // Update photo URL to relative path
                    typedProfile.photoUrl = `photos/${oldPhotoFilename}`
                    photosMoved++
                } catch {
                    console.warn(`⚠️  Photo not found for ${indexNumber}: ${oldPhotoPath}`)
                    photosSkipped++
                }
            } else {
                photosSkipped++
            }
        }

        console.log(`✅ Moved ${photosMoved} photos, skipped ${photosSkipped}`)

        // Save new profiles file
        console.log('💾 Saving new student profiles...')
        await fs.writeFile(newProfilesPath, JSON.stringify(oldProfiles, null, 2), 'utf-8')

        console.log('✅ Migration completed successfully!')
        console.log(`   Old location: ${oldProfilesPath}`)
        console.log(`   New location: ${newProfilesPath}`)
        console.log(`   Photos: ${newPhotosDir}`)
        console.log('')
        console.log('⚠️  Note: Old files have NOT been deleted. Please verify the migration and delete manually if needed.')

    } catch (error) {
        console.error('❌ Migration failed:', error)
        throw error
    }
}

// Run migration if executed directly
if (require.main === module) {
    migrateStudentProfiles()
        .then(() => process.exit(0))
        .catch((error) => {
            console.error(error)
            process.exit(1)
        })
}

export { migrateStudentProfiles }
