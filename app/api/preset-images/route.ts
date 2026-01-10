import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

export interface PresetImage {
    name: string;
    path: string;
    url: string;
    category: string;
    subcategory: string;
}

export interface PresetCategory {
    name: string;
    subcategories: {
        name: string;
        images: PresetImage[];
    }[];
}

const SUPPORTED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];

async function scanDirectory(dirPath: string, category: string, subcategory: string): Promise<PresetImage[]> {
    const images: PresetImage[] = [];
    
    try {
        const entries = await fs.readdir(dirPath, { withFileTypes: true });
        
        for (const entry of entries) {
            if (entry.isFile()) {
                const ext = path.extname(entry.name).toLowerCase();
                if (SUPPORTED_EXTENSIONS.includes(ext)) {
                    const relativePath = path.join(category, subcategory, entry.name);
                    images.push({
                        name: entry.name,
                        path: relativePath,
                        url: `/api/preset-images/file/${encodeURIComponent(category)}/${encodeURIComponent(subcategory)}/${encodeURIComponent(entry.name)}`,
                        category,
                        subcategory,
                    });
                }
            }
        }
    } catch (error) {
        console.error(`Error scanning directory ${dirPath}:`, error);
    }
    
    return images;
}

async function getPresetCategories(filterCategory?: string): Promise<PresetCategory[]> {
    const inputAssetsPath = path.join(process.cwd(), 'input-assets');
    const categories: PresetCategory[] = [];
    
    try {
        const categoryEntries = await fs.readdir(inputAssetsPath, { withFileTypes: true });
        
        for (const categoryEntry of categoryEntries) {
            if (!categoryEntry.isDirectory()) continue;
            
            // 如果指定了过滤分类，只处理匹配的分类
            if (filterCategory && categoryEntry.name !== filterCategory) continue;
            
            const categoryPath = path.join(inputAssetsPath, categoryEntry.name);
            const subcategories: PresetCategory['subcategories'] = [];
            
            const subcategoryEntries = await fs.readdir(categoryPath, { withFileTypes: true });
            
            for (const subcategoryEntry of subcategoryEntries) {
                if (!subcategoryEntry.isDirectory()) continue;
                
                const subcategoryPath = path.join(categoryPath, subcategoryEntry.name);
                const images = await scanDirectory(subcategoryPath, categoryEntry.name, subcategoryEntry.name);
                
                if (images.length > 0) {
                    subcategories.push({
                        name: subcategoryEntry.name,
                        images,
                    });
                }
            }
            
            if (subcategories.length > 0) {
                categories.push({
                    name: categoryEntry.name,
                    subcategories,
                });
            }
        }
    } catch (error) {
        console.error('Error reading input-assets directory:', error);
    }
    
    return categories;
}

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const category = searchParams.get('category') || undefined;
    
    try {
        const categories = await getPresetCategories(category);
        return NextResponse.json({ categories });
    } catch (error) {
        console.error('Error getting preset images:', error);
        return NextResponse.json(
            { error: 'Failed to get preset images' },
            { status: 500 }
        );
    }
}
