import fs from "fs";
import path from "path";

export interface StudentProfile {
  name: string | null;
  photoUrl: string | null;
}

type ProfileMap = Record<string, StudentProfile>;

let profileCache: Map<string, ProfileMap> = new Map();

/**
 * Load student profiles from JSON file for a specific batch/degree
 * @param batch - Batch name (e.g., "batch 21")
 * @param degree - Degree name (e.g., "IT")
 */
export function loadStudentProfiles(
  batch?: string,
  degree?: string,
): ProfileMap {
  // Create cache key
  const cacheKey =
    batch && degree ? `${batch}|${degree}` : batch ? `${batch}|all` : "legacy";

  // Return cached if available
  if (profileCache.has(cacheKey)) {
    return profileCache.get(cacheKey)!;
  }

  let profiles: ProfileMap = {};

  if (batch && degree) {
    // Load profiles for specific batch and degree
    const profilePath = path.join(
      process.cwd(),
      "data",
      "Students",
      batch,
      degree,
      "student-profiles.json",
    );

    if (fs.existsSync(profilePath)) {
      try {
        const content = fs.readFileSync(profilePath, "utf-8");
        profiles = JSON.parse(content);
        console.log(
          `✅ Loaded ${Object.keys(profiles).length} student profiles from ${profilePath}`,
        );
      } catch (error) {
        console.error(
          `❌ Error loading student profiles from ${profilePath}:`,
          error,
        );
      }
    } else {
      console.warn(`⚠️ Student profiles file not found: ${profilePath}`);
    }
  } else if (batch) {
    // Load profiles from all degrees in this batch
    const batchPath = path.join(process.cwd(), "data", "Students", batch);

    if (fs.existsSync(batchPath)) {
      try {
        const degreeEntries = fs.readdirSync(batchPath, {
          withFileTypes: true,
        });

        for (const degreeEntry of degreeEntries) {
          if (!degreeEntry.isDirectory()) continue;

          const profilePath = path.join(
            batchPath,
            degreeEntry.name,
            "student-profiles.json",
          );

          if (fs.existsSync(profilePath)) {
            try {
              const content = fs.readFileSync(profilePath, "utf-8");
              const degreeProfiles = JSON.parse(content);
              // Merge profiles from this degree
              profiles = { ...profiles, ...degreeProfiles };
            } catch (error) {
              console.error(
                `❌ Error loading profiles from ${profilePath}:`,
                error,
              );
            }
          }
        }

        console.log(
          `✅ Loaded ${Object.keys(profiles).length} student profiles from batch ${batch}`,
        );
      } catch (error) {
        console.error(`❌ Error scanning degrees in batch ${batch}:`, error);
      }
    }
  } else {
    // Legacy structure: data/student-profiles.json
    const profilePath = path.join(
      process.cwd(),
      "data",
      "student-profiles.json",
    );

    if (fs.existsSync(profilePath)) {
      try {
        const content = fs.readFileSync(profilePath, "utf-8");
        profiles = JSON.parse(content);
        console.log(
          `✅ Loaded ${Object.keys(profiles).length} student profiles from ${profilePath}`,
        );
      } catch (error) {
        console.error(
          `❌ Error loading student profiles from ${profilePath}:`,
          error,
        );
      }
    } else {
      console.warn(`⚠️ Student profiles file not found: ${profilePath}`);
    }
  }

  profileCache.set(cacheKey, profiles);
  return profiles;
}

/**
 * Get profile for a specific student
 * @param indexNumber - Student index number
 * @param batch - Optional batch context
 * @param degree - Optional degree context
 */
export function getStudentProfile(
  indexNumber: string,
  batch?: string,
  degree?: string,
): StudentProfile | null {
  const profiles = loadStudentProfiles(batch, degree);
  // Return a shallow copy to avoid mutating the cache
  const profile = profiles[indexNumber] ? { ...profiles[indexNumber] } : null;

  // Convert relative photo URLs to absolute URLs
  if (profile && profile.photoUrl && batch && degree) {
    // If photoUrl is relative (e.g., "photos/214084D.png"), convert to absolute
    if (profile.photoUrl.startsWith("photos/")) {
      const filename = profile.photoUrl.replace("photos/", "").trim();
      profile.photoUrl = `/${batch}/${degree}/photos/${filename}`;
    }
  }

  return profile;
}

/**
 * Get all profiles for a batch/degree
 */
export function getAllProfiles(batch?: string, degree?: string): ProfileMap {
  return loadStudentProfiles(batch, degree);
}

/**
 * Clear profile cache (for testing/updates)
 */
export function clearProfileCache(): void {
  profileCache.clear();
}
