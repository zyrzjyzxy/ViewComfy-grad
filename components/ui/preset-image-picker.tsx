'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { Loader2, ImageIcon, FolderOpen } from 'lucide-react';

interface PresetImage {
    name: string;
    path: string;
    url: string;
    category: string;
    subcategory: string;
}

interface PresetCategory {
    name: string;
    subcategories: {
        name: string;
        images: PresetImage[];
    }[];
}

interface PresetImagePickerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect: (file: File) => void;
    inputTitle?: string; // 用于智能过滤分类
}

// 分类显示名称映射
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
    'fashion-item': '服装',
    'texture': '纹理',
};

// 根据输入标题推断应该显示的分类
function inferCategoryFromTitle(title?: string): string | undefined {
    if (!title) return undefined;
    
    const lowerTitle = title.toLowerCase();
    
    // 服装相关关键词
    const fashionKeywords = ['服装', '衣服', '鞋', '包', '帽', '袋', 'fashion', 'clothing', 'shoe', 'bag'];
    if (fashionKeywords.some(keyword => lowerTitle.includes(keyword))) {
        return 'fashion-item';
    }
    
    // 纹理相关关键词
    const textureKeywords = ['纹理', '材质', '花纹', '图案', 'texture', 'material', 'pattern'];
    if (textureKeywords.some(keyword => lowerTitle.includes(keyword))) {
        return 'texture';
    }
    
    return undefined;
}

export function PresetImagePicker({
    open,
    onOpenChange,
    onSelect,
    inputTitle,
}: PresetImagePickerProps) {
    const [categories, setCategories] = useState<PresetCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedImage, setSelectedImage] = useState<PresetImage | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [activeSubcategory, setActiveSubcategory] = useState<string>('');

    // 根据输入标题推断分类
    const inferredCategory = inferCategoryFromTitle(inputTitle);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const url = inferredCategory 
                ? `/api/preset-images?category=${inferredCategory}`
                : '/api/preset-images';
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Failed to fetch preset images');
            }
            
            const data = await response.json();
            setCategories(data.categories || []);
            
            // 设置默认选中的分类
            if (data.categories && data.categories.length > 0) {
                setActiveCategory(data.categories[0].name);
                if (data.categories[0].subcategories.length > 0) {
                    setActiveSubcategory(data.categories[0].subcategories[0].name);
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载预设图片失败');
        } finally {
            setLoading(false);
        }
    }, [inferredCategory]);

    useEffect(() => {
        if (open) {
            fetchCategories();
            setSelectedImage(null);
        }
    }, [open, fetchCategories]);

    const handleConfirm = async () => {
        if (!selectedImage) return;
        
        try {
            // 从 URL 获取图片并转换为 File
            const response = await fetch(selectedImage.url);
            const blob = await response.blob();
            const file = new File([blob], selectedImage.name, { type: blob.type });
            
            onSelect(file);
            onOpenChange(false);
        } catch (err) {
            console.error('Error loading preset image:', err);
            setError('加载图片失败');
        }
    };

    const currentCategory = categories.find(c => c.name === activeCategory);
    const currentSubcategory = currentCategory?.subcategories.find(s => s.name === activeSubcategory);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <ImageIcon className="h-5 w-5" />
                        预设图库
                        {inferredCategory && (
                            <span className="text-sm font-normal text-muted-foreground">
                                （{CATEGORY_DISPLAY_NAMES[inferredCategory] || inferredCategory}）
                            </span>
                        )}
                    </DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                    </div>
                ) : error ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                        <p className="text-destructive mb-4">{error}</p>
                        <Button variant="outline" onClick={fetchCategories}>
                            重试
                        </Button>
                    </div>
                ) : categories.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                        <FolderOpen className="h-12 w-12 mb-4" />
                        <p>暂无预设图片</p>
                        <p className="text-sm">请在 input-assets 目录中添加图片</p>
                    </div>
                ) : (
                    <div className="flex-1 flex flex-col min-h-0">
                        {/* 分类标签 */}
                        {categories.length > 1 && (
                            <Tabs value={activeCategory} onValueChange={setActiveCategory} className="mb-4">
                                <TabsList>
                                    {categories.map(category => (
                                        <TabsTrigger key={category.name} value={category.name}>
                                            {CATEGORY_DISPLAY_NAMES[category.name] || category.name}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        )}

                        {/* 子分类标签 */}
                        {currentCategory && currentCategory.subcategories.length > 1 && (
                            <div className="flex flex-wrap gap-2 mb-4">
                                {currentCategory.subcategories.map(sub => (
                                    <Button
                                        key={sub.name}
                                        variant={activeSubcategory === sub.name ? 'default' : 'outline'}
                                        size="sm"
                                        onClick={() => setActiveSubcategory(sub.name)}
                                    >
                                        {sub.name}
                                    </Button>
                                ))}
                            </div>
                        )}

                        {/* 图片网格 */}
                        <ScrollArea className="flex-1">
                            <div className="grid grid-cols-4 gap-4 p-1">
                                {currentSubcategory?.images.map(image => (
                                    <button
                                        key={image.path}
                                        onClick={() => setSelectedImage(image)}
                                        className={cn(
                                            'relative aspect-square rounded-lg overflow-hidden border-2 transition-all hover:border-primary/50',
                                            selectedImage?.path === image.path
                                                ? 'border-primary ring-2 ring-primary ring-offset-2'
                                                : 'border-transparent'
                                        )}
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                            {image.name}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </ScrollArea>
                    </div>
                )}

                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        取消
                    </Button>
                    <Button onClick={handleConfirm} disabled={!selectedImage}>
                        确认选择
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default PresetImagePicker;
