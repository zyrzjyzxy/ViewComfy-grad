import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// POST - 创建新的子分类
export async function POST(request: NextRequest) {
    try {
        const { category, subcategory } = await request.json();

        if (!category || !subcategory) {
            return NextResponse.json(
                { error: 'Missing required fields: category, subcategory' },
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
        await fs.mkdir(targetDir, { recursive: true });

        return NextResponse.json({
            success: true,
            message: 'Subcategory created successfully',
            path: `${category}/${subcategory}`,
        });
    } catch (error) {
        console.error('Error creating subcategory:', error);
        return NextResponse.json(
            { error: 'Failed to create subcategory' },
            { status: 500 }
        );
    }
}

// DELETE - 删除子分类（仅当为空时）
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');
        const subcategory = searchParams.get('subcategory');

        if (!category || !subcategory) {
            return NextResponse.json(
                { error: 'Missing required parameters: category, subcategory' },
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

        // 确保目录在 input-assets 内
        if (!targetDir.startsWith(inputAssetsPath)) {
            return NextResponse.json(
                { error: 'Access denied' },
                { status: 403 }
            );
        }

        // 检查目录是否存在
        try {
            await fs.access(targetDir);
        } catch {
            return NextResponse.json(
                { error: 'Directory not found' },
                { status: 404 }
            );
        }

        // 检查目录是否为空
        const entries = await fs.readdir(targetDir);
        if (entries.length > 0) {
            return NextResponse.json(
                { error: 'Directory is not empty. Please delete all images first.' },
                { status: 400 }
            );
        }

        // 删除空目录
        await fs.rmdir(targetDir);

        return NextResponse.json({
            success: true,
            message: 'Subcategory deleted successfully',
        });
    } catch (error) {
        console.error('Error deleting subcategory:', error);
        return NextResponse.json(
            { error: 'Failed to delete subcategory' },
            { status: 500 }
        );
    }
}
