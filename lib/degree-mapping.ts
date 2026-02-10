/**
 * Degree prefix mapping utilities.
 *
 * Maps 3-digit index number prefixes to degree short names.
 * Example: Index "240123A" → prefix "240" → degree "IT"
 *
 * The prefix map is now provided dynamically by the user via the UI,
 * rather than being hardcoded here.
 */

export type DegreePrefixMap = Record<string, string>;

/**
 * Infer degree from student index number using a provided prefix map.
 * @param indexNumber - Student index number (e.g. "240123A")
 * @param prefixMap - User-provided mapping of 3-digit prefixes to degree names
 * @returns degree short name (e.g. "IT") or null if no match
 */
export function inferDegreeFromIndex(
  indexNumber: string,
  prefixMap: DegreePrefixMap,
): string | null {
  if (!indexNumber || indexNumber.length < 2) return null;
  if (!prefixMap || Object.keys(prefixMap).length === 0) return null;

  // Try matching prefixes of length 4, 3, and 2
  for (let len = 4; len >= 2; len--) {
    if (indexNumber.length < len) continue;
    const prefix = indexNumber.substring(0, len);
    if (prefixMap[prefix]) {
      return prefixMap[prefix];
    }
  }

  return null;
}

/**
 * Infer batch from student index number.
 * First 2 digits of the index number represent the batch.
 * Example: "240123A" → "Batch 24"
 * @returns batch name (e.g. "Batch 24") or null if invalid
 */
export function inferBatchFromIndex(indexNumber: string): string | null {
  if (!indexNumber || indexNumber.length < 2) return null;

  const prefix2 = indexNumber.substring(0, 2);
  if (/^\d{2}$/.test(prefix2)) {
    return `Batch ${prefix2}`;
  }
  return null;
}

/**
 * Get all known degree names from a prefix map.
 */
export function getAllMappedDegrees(prefixMap: DegreePrefixMap): string[] {
  return [...new Set(Object.values(prefixMap))];
}

export function parsePrefixMappingEntries(
  entries: Array<{ prefixes: string; degree: string }>,
): DegreePrefixMap {
  const map: DegreePrefixMap = {};
  for (const entry of entries) {
    if (!entry.degree.trim()) continue;
    const prefixes = entry.prefixes
      .split(",")
      // Clean up whitespace and ensure we only keep valid numeric prefixes
      .map((p) => p.trim())
      .filter((p) => /^\d{2,5}$/.test(p)); // Allow 2 to 5 digits

    for (const prefix of prefixes) {
      map[prefix] = entry.degree.trim().toUpperCase();
    }
  }
  return map;
}
