import { type NextRequest, NextResponse } from 'next/server';
import path from 'node:path';
import fs from 'node:fs/promises';
import { viewComfyFileName } from "@/config/constants";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { viewComfyJSON } = body;

        if (!viewComfyJSON) {
            return NextResponse.json(
                { error: 'viewComfyJSON is required' },
                { status: 400 }
            );
        }

        const viewComfyPath = path.join(process.cwd(), viewComfyFileName);
        const jsonString = JSON.stringify(viewComfyJSON, null, 2);
        
        await fs.writeFile(viewComfyPath, jsonString, 'utf8');

        return NextResponse.json({ 
            success: true, 
            message: `Saved to ${viewComfyFileName}`,
            path: viewComfyPath 
        });
    } catch (error) {
        console.error('Error saving view_comfy.json:', error);
        return NextResponse.json(
            { error: 'Failed to save file', details: String(error) },
            { status: 500 }
        );
    }
}
