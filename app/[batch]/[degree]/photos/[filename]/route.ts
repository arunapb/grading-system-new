import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ batch: string; degree: string; filename: string }> }
) {
    try {
        const { batch, degree, filename } = await params;

        // Construct the file path
        const photoPath = path.join(
            process.cwd(),
            'data',
            'Students',
            batch,
            degree,
            'photos',
            filename
        );

        // Check if file exists
        if (!fs.existsSync(photoPath)) {
            console.log(`❌ Photo not found: ${photoPath}`);
            return NextResponse.json(
                { error: 'Photo not found' },
                { status: 404 }
            );
        }

        // Read the file
        const fileBuffer = fs.readFileSync(photoPath);

        // Determine content type based on file extension
        const ext = path.extname(filename).toLowerCase();
        const contentType = ext === '.png' ? 'image/png' :
            ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                'image/png';

        // Return the image with appropriate headers
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('❌ Error serving photo:', error);
        return NextResponse.json(
            { error: 'Failed to serve photo' },
            { status: 500 }
        );
    }
}
