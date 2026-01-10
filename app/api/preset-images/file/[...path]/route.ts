import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const MIME_TYPES: Record<string, string> = {
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.webp': 'image/webp',
    '.gif': 'image/gif',
};

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ path: string[] }> }
) {
    try {
        const { path: pathSegments } = await params;
        
        if (!pathSegments || pathSegments.length < 3) {
            return NextResponse.json(
                { error: 'Invalid path' },
                { status: 400 }
            );
        }
        
        // 解码路径段
        const decodedSegments = pathSegments.map(segment => decodeURIComponent(segment));
        const relativePath = path.join(...decodedSegments);
        
        // 安全检查：确保路径不包含 .. 
        if (relativePath.includes('..')) {
            return NextResponse.json(
                { error: 'Invalid path' },
                { status: 400 }
            );
        }
        
        const filePath = path.join(process.cwd(), 'input-assets', relativePath);
        
        // 确保文件在 input-assets 目录内
        const inputAssetsPath = path.join(process.cwd(), 'input-assets');
        if (!filePath.startsWith(inputAssetsPath)) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }
        
        // 检查文件是否存在
        try {
            await fs.access(filePath);
        } catch {
            return NextResponse.json(
                { error: 'File not found' },
                { status: 404 }
            );
        }
        
        // 读取文件
        const fileBuffer = await fs.readFile(filePath);
        const ext = path.extname(filePath).toLowerCase();
        const mimeType = MIME_TYPES[ext] || 'application/octet-stream';
        
        return new NextResponse(fileBuffer, {
            headers: {
                'Content-Type': mimeType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('Error serving preset image:', error);
        return NextResponse.json(
            { error: 'Failed to serve image' },
            { status: 500 }
        );
    }
}
