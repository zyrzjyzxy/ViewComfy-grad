import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';
import { writeFile, mkdir } from 'fs/promises';

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

// POST - 上传图片
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const category = formData.get('category') as string;
        const subcategory = formData.get('subcategory') as string;

        if (!file || !category || !subcategory) {
            return NextResponse.json(
                { error: 'Missing required fields: file, category, subcategory' },
                { status: 400 }
            );
        }

        // 验证文件类型
        const ext = path.extname(file.name).toLowerCase();
        if (!SUPPORTED_EXTENSIONS.includes(ext)) {
            return NextResponse.json(
                { error: `Unsupported file type. Allowed: ${SUPPORTED_EXTENSIONS.join(', ')}` },
                { status: 400 }
            );
        }

        // 安全检查
        if (category.includes('..') || subcategory.includes('..')) {
            return NextResponse.json(
                { error: 'Invalid path' },
                { status: 400 }
            );
        }

        const inputAssetsPath = path.join(process.cwd(), 'input-assets');
        const targetDir = path.join(inputAssetsPath, category, subcategory);

        // 确保目录存在
        await mkdir(targetDir, { recursive: true });

        // 生成唯一文件名（避免覆盖）
        let fileName = file.name;
        let filePath = path.join(targetDir, fileName);
        let counter = 1;
        
        while (true) {
            try {
                await fs.access(filePath);
                // 文件存在，添加后缀
                const nameWithoutExt = path.basename(file.name, ext);
                fileName = `${nameWithoutExt}_${counter}${ext}`;
                filePath = path.join(targetDir, fileName);
                counter++;
            } catch {
                // 文件不存在，可以使用
                break;
            }
        }

        // 写入文件
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        return NextResponse.json({
            success: true,
            fileName,
            path: `${category}/${subcategory}/${fileName}`,
            url: `/api/preset-images/file/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}/${encodeURIComponent(fileName)}`,
        });
    } catch (error) {
        console.error('Error uploading preset image:', error);
        return NextResponse.json(
            { error: 'Failed to upload image' },
            { status: 500 }
        );
    }
}

// DELETE - 删除图片
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const imagePath = searchParams.get('path');

        if (!imagePath) {
            return NextResponse.json(
                { error: 'Missing required parameter: path' },
                { status: 400 }
            );
        }

        // 安全检查
        if (imagePath.includes('..')) {
            return NextResponse.json(
                { error: 'Invalid path' },
                { status: 400 }
            );
        }

        const inputAssetsPath = path.join(process.cwd(), 'input-assets');
        const filePath = path.join(inputAssetsPath, imagePath);

        // 确保文件在 input-assets 目录内
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

        // 删除文件
        await fs.unlink(filePath);

        return NextResponse.json({
            success: true,
            message: 'Image deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting preset image:', error);
        return NextResponse.json(
            { error: 'Failed to delete image' },
            { status: 500 }
        );
    }
}
