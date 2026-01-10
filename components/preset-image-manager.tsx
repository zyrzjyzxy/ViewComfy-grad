'use client';

import * as React from 'react';
import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { 
    Loader2, 
    ImageIcon, 
    FolderOpen, 
    Trash2, 
    Plus, 
    Upload,
    FolderPlus,
    AlertCircle
} from 'lucide-react';
import { Dropzone } from '@/components/ui/dropzone';

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

// 分类显示名称映射
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
    'fashion-item': '服装',
    'texture': '纹理',
};

export function PresetImageManager() {
    const [categories, setCategories] = useState<PresetCategory[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('');
    const [activeSubcategory, setActiveSubcategory] = useState<string>('');
    
    // 对话框状态
    const [showUploadDialog, setShowUploadDialog] = useState(false);
    const [showNewSubcategoryDialog, setShowNewSubcategoryDialog] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [imageToDelete, setImageToDelete] = useState<PresetImage | null>(null);
    
    // 上传状态
    const [uploadFile, setUploadFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [newSubcategoryName, setNewSubcategoryName] = useState('');

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        setError(null);
        
        try {
            const response = await fetch('/api/preset-images');
            
            if (!response.ok) {
                throw new Error('Failed to fetch preset images');
            }
            
            const data = await response.json();
            setCategories(data.categories || []);
            
            // 设置默认选中的分类
            if (data.categories && data.categories.length > 0) {
                if (!activeCategory) {
                    setActiveCategory(data.categories[0].name);
                    if (data.categories[0].subcategories.length > 0) {
                        setActiveSubcategory(data.categories[0].subcategories[0].name);
                    }
                }
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : '加载预设图片失败');
        } finally {
            setLoading(false);
        }
    }, [activeCategory]);

    useEffect(() => {
        fetchCategories();
    }, []);

    // 上传图片
    const handleUpload = async () => {
        if (!uploadFile || !activeCategory || !activeSubcategory) return;
        
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', uploadFile);
            formData.append('category', activeCategory);
            formData.append('subcategory', activeSubcategory);
            
            const response = await fetch('/api/preset-images/manage', {
                method: 'POST',
                body: formData,
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Upload failed');
            }
            
            setShowUploadDialog(false);
            setUploadFile(null);
            fetchCategories();
        } catch (err) {
            setError(err instanceof Error ? err.message : '上传失败');
        } finally {
            setUploading(false);
        }
    };

    // 删除图片
    const handleDeleteImage = async () => {
        if (!imageToDelete) return;
        
        try {
            const response = await fetch(`/api/preset-images/manage?path=${encodeURIComponent(imageToDelete.path)}`, {
                method: 'DELETE',
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Delete failed');
            }
            
            setShowDeleteConfirm(false);
            setImageToDelete(null);
            fetchCategories();
        } catch (err) {
            setError(err instanceof Error ? err.message : '删除失败');
        }
    };

    // 创建子分类
    const handleCreateSubcategory = async () => {
        if (!newSubcategoryName || !activeCategory) return;
        
        try {
            const response = await fetch('/api/preset-images/subcategory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    category: activeCategory,
                    subcategory: newSubcategoryName,
                }),
            });
            
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Create failed');
            }
            
            setShowNewSubcategoryDialog(false);
            setNewSubcategoryName('');
            setActiveSubcategory(newSubcategoryName);
            fetchCategories();
        } catch (err) {
            setError(err instanceof Error ? err.message : '创建失败');
        }
    };

    const currentCategory = categories.find(c => c.name === activeCategory);
    const currentSubcategory = currentCategory?.subcategories.find(s => s.name === activeSubcategory);

    return (
        <div className="flex flex-col h-full p-4">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    预设图片管理
                </h2>
                <Button
                    size="sm"
                    onClick={() => fetchCategories()}
                    variant="ghost"
                    disabled={loading}
                >
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : '刷新'}
                </Button>
            </div>

            {error && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-destructive/10 text-destructive rounded-md">
                    <AlertCircle className="h-4 w-4" />
                    <span className="text-sm">{error}</span>
                    <Button size="sm" variant="ghost" onClick={() => setError(null)} className="ml-auto">
                        关闭
                    </Button>
                </div>
            )}

            {loading && categories.length === 0 ? (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : categories.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <FolderOpen className="h-12 w-12 mb-4" />
                    <p>暂无预设图片</p>
                    <p className="text-sm">请先创建分类目录</p>
                </div>
            ) : (
                <div className="flex-1 flex flex-col min-h-0">
                    {/* 分类标签 */}
                    <Tabs value={activeCategory} onValueChange={(v) => {
                        setActiveCategory(v);
                        const cat = categories.find(c => c.name === v);
                        if (cat && cat.subcategories.length > 0) {
                            setActiveSubcategory(cat.subcategories[0].name);
                        } else {
                            setActiveSubcategory('');
                        }
                    }} className="mb-4">
                        <TabsList>
                            {categories.map(category => (
                                <TabsTrigger key={category.name} value={category.name}>
                                    {CATEGORY_DISPLAY_NAMES[category.name] || category.name}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </Tabs>

                    {/* 子分类和操作按钮 */}
                    <div className="flex flex-wrap items-center gap-2 mb-4">
                        {currentCategory?.subcategories.map(sub => (
                            <Button
                                key={sub.name}
                                variant={activeSubcategory === sub.name ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setActiveSubcategory(sub.name)}
                            >
                                {sub.name} ({sub.images.length})
                            </Button>
                        ))}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowNewSubcategoryDialog(true)}
                            className="border-dashed"
                        >
                            <FolderPlus className="h-4 w-4 mr-1" />
                            新建子分类
                        </Button>
                    </div>

                    {/* 上传按钮 */}
                    {activeSubcategory && (
                        <div className="mb-4">
                            <Button onClick={() => setShowUploadDialog(true)} size="sm">
                                <Upload className="h-4 w-4 mr-2" />
                                上传图片到 "{activeSubcategory}"
                            </Button>
                        </div>
                    )}

                    {/* 图片网格 */}
                    <ScrollArea className="flex-1">
                        {currentSubcategory && currentSubcategory.images.length > 0 ? (
                            <div className="grid grid-cols-3 gap-3 p-1">
                                {currentSubcategory.images.map(image => (
                                    <div
                                        key={image.path}
                                        className="relative aspect-square rounded-lg overflow-hidden border group"
                                    >
                                        <img
                                            src={image.url}
                                            alt={image.name}
                                            className="w-full h-full object-cover"
                                            loading="lazy"
                                        />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                onClick={() => {
                                                    setImageToDelete(image);
                                                    setShowDeleteConfirm(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1 truncate">
                                            {image.name}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <ImageIcon className="h-8 w-8 mb-2" />
                                <p className="text-sm">该分类下暂无图片</p>
                            </div>
                        )}
                    </ScrollArea>
                </div>
            )}

            {/* 上传对话框 */}
            <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>上传预设图片</DialogTitle>
                        <DialogDescription>
                            上传到: {CATEGORY_DISPLAY_NAMES[activeCategory] || activeCategory} / {activeSubcategory}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Dropzone
                            onChange={setUploadFile}
                            fileExtensions={['png', 'jpg', 'jpeg', 'webp', 'gif']}
                            className="h-32"
                            inputPlaceholder={uploadFile?.name || '拖拽或点击上传图片'}
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                            取消
                        </Button>
                        <Button onClick={handleUpload} disabled={!uploadFile || uploading}>
                            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                            上传
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 新建子分类对话框 */}
            <Dialog open={showNewSubcategoryDialog} onOpenChange={setShowNewSubcategoryDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>新建子分类</DialogTitle>
                        <DialogDescription>
                            在 "{CATEGORY_DISPLAY_NAMES[activeCategory] || activeCategory}" 下创建新的子分类
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                        <Label htmlFor="subcategory-name">子分类名称</Label>
                        <Input
                            id="subcategory-name"
                            value={newSubcategoryName}
                            onChange={(e) => setNewSubcategoryName(e.target.value)}
                            placeholder="例如: Sneakers"
                            className="mt-2"
                        />
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowNewSubcategoryDialog(false)}>
                            取消
                        </Button>
                        <Button onClick={handleCreateSubcategory} disabled={!newSubcategoryName}>
                            创建
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* 删除确认对话框 */}
            <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>确认删除</DialogTitle>
                        <DialogDescription>
                            确定要删除图片 "{imageToDelete?.name}" 吗？此操作不可撤销。
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
                            取消
                        </Button>
                        <Button variant="destructive" onClick={handleDeleteImage}>
                            删除
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

export default PresetImageManager;
