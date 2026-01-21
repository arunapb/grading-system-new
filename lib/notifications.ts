import fs from "fs";
import path from "path";

export interface Notification {
  id: string;
  type: "unparsed_pdf" | "new_result";
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  metadata?: {
    batch?: string;
    degree?: string;
    year?: string;
    semester?: string;
    filename?: string;
    moduleCode?: string;
    moduleName?: string;
    studentCount?: number;
    count?: number;
  };
}

const NOTIFICATIONS_DIR = path.join(process.cwd(), "data", "notifications");
const LAST_CHECK_FILE = path.join(NOTIFICATIONS_DIR, "last-check.json");
const MAX_NOTIFICATIONS = 20;

/**
 * Ensure notifications directory exists
 */
function ensureNotificationsDir() {
  if (!fs.existsSync(NOTIFICATIONS_DIR)) {
    fs.mkdirSync(NOTIFICATIONS_DIR, { recursive: true });
  }
}

/**
 * Get last check timestamp
 */
export function getLastCheck(type: "admin" | "user"): Date {
  ensureNotificationsDir();

  try {
    if (fs.existsSync(LAST_CHECK_FILE)) {
      const data = JSON.parse(fs.readFileSync(LAST_CHECK_FILE, "utf-8"));
      const timestamp =
        type === "admin" ? data.lastAdminCheck : data.lastUserCheck;
      return timestamp ? new Date(timestamp) : new Date(0);
    }
  } catch (error) {
    console.error("Error reading last check:", error);
  }

  return new Date(0);
}

/**
 * Update last check timestamp
 */
export function updateLastCheck(type: "admin" | "user") {
  ensureNotificationsDir();

  let data: { lastAdminCheck: string | null; lastUserCheck: string | null } = {
    lastAdminCheck: null,
    lastUserCheck: null,
  };

  try {
    if (fs.existsSync(LAST_CHECK_FILE)) {
      data = JSON.parse(fs.readFileSync(LAST_CHECK_FILE, "utf-8"));
    }
  } catch (error) {
    console.error("Error reading last check:", error);
  }

  if (type === "admin") {
    data.lastAdminCheck = new Date().toISOString();
  } else {
    data.lastUserCheck = new Date().toISOString();
  }

  fs.writeFileSync(LAST_CHECK_FILE, JSON.stringify(data, null, 2), "utf-8");
}

/**
 * Find unparsed PDFs for admin notifications
 */
export function findUnparsedPDFs(): Notification[] {
  const notifications: Notification[] = [];
  const inputBase = path.join(process.cwd(), "data", "input");
  const outputBase = path.join(process.cwd(), "data", "output");

  if (!fs.existsSync(inputBase)) {
    return notifications;
  }

  try {
    const batches = fs
      .readdirSync(inputBase, { withFileTypes: true })
      .filter((d: any) => d.isDirectory())
      .map((d: any) => d.name);

    for (const batch of batches) {
      const batchPath = path.join(inputBase, batch);
      const degrees = fs
        .readdirSync(batchPath, { withFileTypes: true })
        .filter((d: any) => d.isDirectory())
        .map((d: any) => d.name);

      for (const degree of degrees) {
        const unparsedFiles: string[] = [];

        // Scan all years and semesters
        const degreePath = path.join(batchPath, degree);
        scanForUnparsedPDFs(
          degreePath,
          path.join(outputBase, batch, degree),
          "",
          unparsedFiles,
        );

        if (unparsedFiles.length > 0) {
          notifications.push({
            id: `unparsed-${batch}-${degree}-${Date.now()}`,
            type: "unparsed_pdf",
            title: "Unparsed PDFs Found",
            message: `${unparsedFiles.length} PDF(s) in ${batch}/${degree} need parsing`,
            timestamp: new Date().toISOString(),
            read: false,
            metadata: {
              batch,
              degree,
              count: unparsedFiles.length,
            },
          });
        }
      }
    }
  } catch (error) {
    console.error("Error finding unparsed PDFs:", error);
  }

  return notifications.slice(0, MAX_NOTIFICATIONS);
}

/**
 * Recursively scan for unparsed PDFs
 */
function scanForUnparsedPDFs(
  inputDir: string,
  outputDir: string,
  relativePath: string,
  unparsedFiles: string[],
) {
  try {
    const entries = fs.readdirSync(inputDir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(inputDir, entry.name);
      const relPath = path.join(relativePath, entry.name);

      if (entry.isDirectory()) {
        scanForUnparsedPDFs(entryPath, outputDir, relPath, unparsedFiles);
      } else if (entry.isFile() && entry.name.toLowerCase().endsWith(".pdf")) {
        const jsonName = entry.name.replace(/\.pdf$/i, ".json");
        const jsonPath = path.join(outputDir, relativePath, jsonName);

        if (!fs.existsSync(jsonPath)) {
          unparsedFiles.push(relPath);
        }
      }
    }
  } catch (error) {
    // Directory might not exist, skip
  }
}

/**
 * Find new results for user notifications
 */
export function findNewResults(lastCheck: Date): Notification[] {
  const notifications: Notification[] = [];
  const outputBase = path.join(process.cwd(), "data", "output");

  if (!fs.existsSync(outputBase)) {
    return notifications;
  }

  try {
    const batches = fs
      .readdirSync(outputBase, { withFileTypes: true })
      .filter((d: any) => d.isDirectory())
      .map((d: any) => d.name);

    for (const batch of batches) {
      const batchPath = path.join(outputBase, batch);
      const degrees = fs
        .readdirSync(batchPath, { withFileTypes: true })
        .filter((d: any) => d.isDirectory())
        .map((d: any) => d.name);

      for (const degree of degrees) {
        const degreePath = path.join(batchPath, degree);
        scanForNewResults(degreePath, batch, degree, lastCheck, notifications);
      }
    }
  } catch (error) {
    console.error("Error finding new results:", error);
  }

  // Sort by timestamp (newest first) and limit
  return notifications
    .sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    )
    .slice(0, MAX_NOTIFICATIONS);
}

/**
 * Recursively scan for new JSON results
 */
function scanForNewResults(
  dir: string,
  batch: string,
  degree: string,
  lastCheck: Date,
  notifications: Notification[],
) {
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        scanForNewResults(entryPath, batch, degree, lastCheck, notifications);
      } else if (
        entry.isFile() &&
        entry.name.toLowerCase().endsWith(".json") &&
        !entry.name.includes("metadata")
      ) {
        const stats = fs.statSync(entryPath);

        if (stats.mtime > lastCheck) {
          try {
            const content = fs.readFileSync(entryPath, "utf-8");
            const data = JSON.parse(content);

            let moduleCode = "Unknown";
            let moduleName = "Unknown Module";
            let studentCount = 0;

            if (Array.isArray(data)) {
              studentCount = data.length;
            } else if (data.moduleCode) {
              moduleCode = data.moduleCode;
              moduleName = data.moduleName || moduleCode;
              studentCount = data.students?.length || 0;
            }

            notifications.push({
              id: `new-result-${batch}-${degree}-${entry.name}-${stats.mtime.getTime()}`,
              type: "new_result",
              title: "New Results Available",
              message: `Results for ${moduleName} (${moduleCode}) in ${batch}/${degree}`,
              timestamp: stats.mtime.toISOString(),
              read: false,
              metadata: {
                batch,
                degree,
                moduleCode,
                moduleName,
                studentCount,
              },
            });
          } catch (error) {
            // Skip invalid JSON files
          }
        }
      }
    }
  } catch (error) {
    // Directory might not exist, skip
  }
}
