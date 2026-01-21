import fs from 'fs';
import path from 'path';

export interface ModuleMetadata {
    moduleCode: string;
    moduleName: string;
    credits: number;
    year: string;
    semester: string;
}

interface MetadataStore {
    [pdfPath: string]: Partial<ModuleMetadata>;
}

/**
 * Get metadata file path
 */
function getMetadataPath(): string {
    return path.join(process.cwd(), 'data', 'metadata.json');
}

/**
 * Load all module metadata from JSON file
 */
export function loadModuleMetadata(): MetadataStore {
    const metadataPath = getMetadataPath();

    try {
        if (fs.existsSync(metadataPath)) {
            const data = fs.readFileSync(metadataPath, 'utf-8');
            return JSON.parse(data);
        }
    } catch (error) {
        console.error('Error loading metadata:', error);
    }

    return {};
}

/**
 * Save all module metadata to JSON file
 */
export function saveModuleMetadata(metadata: MetadataStore): void {
    const metadataPath = getMetadataPath();

    try {
        // Ensure data directory exists
        const dataDir = path.dirname(metadataPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }

        fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
        console.log('✅ Metadata saved successfully');
    } catch (error) {
        console.error('Error saving metadata:', error);
        throw error;
    }
}

/**
 * Get metadata for a specific PDF
 */
export function getModuleMetadata(pdfPath: string): Partial<ModuleMetadata> | null {
    const allMetadata = loadModuleMetadata();
    return allMetadata[pdfPath] || null;
}

/**
 * Update metadata for  a specific PDF
 */
export function updateModuleMetadata(
    pdfPath: string,
    metadata: Partial<ModuleMetadata>
): void {
    const allMetadata = loadModuleMetadata();

    // Merge existing metadata with new metadata
    allMetadata[pdfPath] = {
        ...allMetadata[pdfPath],
        ...metadata,
    };

    saveModuleMetadata(allMetadata);
}
