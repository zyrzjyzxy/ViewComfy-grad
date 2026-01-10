'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Loader2, 
  Trash2, 
  Eye, 
  Grid3X3, 
  List, 
  ImageIcon,
  Calendar,
  Hash,
  Shirt,
  Palette,
  AlertCircle
} from 'lucide-react';

interface HistoryItem {
  id: number;
  textureName: string | null;
  textureImage: string | null;
  fashionName: string | null;
  fashionImage: string | null;
  fashionType: string | null;
  prompt: string;
  imagePath: string;
  seed: number | null;
  createdAt: string;
}

type ViewMode = 'grid' | 'table';

export default function HistoryPage() {
  const { user, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<HistoryItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  // 解决 hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('未找到登录凭证，请重新登录');
        setLoading(false);
        return;
      }
      
      const res = await fetch('/api/history', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        // 如果 token 无效，提示重新登录
        if (res.status === 401) {
          setError('登录已过期，请重新登录');
          // 可选：自动登出
          // logout();
          setLoading(false);
          return;
        }
        throw new Error(errorData.error || `获取历史失败 (${res.status})`);
      }
      const data = await res.json();
      setHistories(Array.isArray(data) ? data : []);
      setError('');
    } catch (err: any) {
      console.error('获取历史记录错误:', err);
      setError(err.message || '获取历史失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    
    if (!user) {
      setError('请先登录');
      setLoading(false);
      return;
    }
    fetchHistory();
  }, [mounted, user]);

  const handleDelete = async () => {
    if (!itemToDelete) return;
    
    setDeleting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`/api/history?id=${itemToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!res.ok) throw new Error('删除失败');
      
      setHistories(histories.filter(h => h.id !== itemToDelete.id));
      setShowDeleteConfirm(false);
      setItemToDelete(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const getImageUrl = (path: string | null) => {
    if (!path) return '';
    if (path.startsWith('http')) return path;
    // 使用代理获取 ComfyUI 图片，避免 CORS 问题
    const comfyUrl = `http://localhost:8188${path}`;
    return `/api/media-proxy?url=${encodeURIComponent(comfyUrl)}`;
  };

  // 图片加载失败时的处理
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    // 显示父元素的占位符
    if (target.parentElement) {
      target.parentElement.classList.add('image-error');
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 未 mounted 或加载状态 - 统一显示加载界面防止 hydration 问题
  if (!mounted || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">加载历史记录中...</span>
      </div>
    );
  }

  // 未登录状态
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold">请先登录</h2>
          <p className="mt-4 text-muted-foreground">登录后才能查看你的生成历史</p>
          <Button
            onClick={() => window.open('/', '_self')}
            className="mt-6"
          >
            返回首页登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="mx-auto max-w-7xl">
        {/* 头部 */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold">生成历史</h1>
            <p className="text-muted-foreground mt-1">
              共 {histories.length} 条记录
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('grid')}
            >
              <Grid3X3 className="h-4 w-4 mr-1" />
              网格
            </Button>
            <Button
              variant={viewMode === 'table' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setViewMode('table')}
            >
              <List className="h-4 w-4 mr-1" />
              表格
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-destructive/10 text-destructive rounded-md flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
            <Button size="sm" variant="ghost" onClick={() => setError('')} className="ml-auto">
              关闭
            </Button>
          </div>
        )}

        {histories.length === 0 ? (
          <div className="text-center py-20">
            <ImageIcon className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-2xl text-muted-foreground">暂无生成记录</p>
            <p className="mt-4 text-muted-foreground">去 Playground 生成一些图片吧！</p>
            <Button
              onClick={() => window.open('/playground', '_self')}
              className="mt-8"
            >
              去生成图片
            </Button>
          </div>
        ) : viewMode === 'grid' ? (
          /* 网格视图 */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {histories.map((item) => (
              <Card
                key={item.id}
                className="overflow-hidden cursor-pointer transition-all hover:shadow-lg group"
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetailDialog(true);
                }}
              >
                <div className="relative aspect-square">
                  <img
                    src={getImageUrl(item.imagePath)}
                    alt="生成结果"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button size="sm" variant="secondary">
                      <Eye className="h-4 w-4 mr-1" />
                      查看详情
                    </Button>
                  </div>
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(item.createdAt)}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {item.fashionType && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                        <Shirt className="h-3 w-3" />
                        {item.fashionType}
                      </span>
                    )}
                    {item.seed && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 bg-muted text-muted-foreground text-xs rounded-full">
                        <Hash className="h-3 w-3" />
                        {item.seed}
                      </span>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* 表格视图 */
          <Card>
            <ScrollArea className="h-[calc(100vh-200px)]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">生成结果</TableHead>
                    <TableHead className="w-[100px]">输入服装</TableHead>
                    <TableHead className="w-[100px]">输入纹理</TableHead>
                    <TableHead>服装类型</TableHead>
                    <TableHead>Seed</TableHead>
                    <TableHead>生成时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {histories.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div className="relative w-16 h-16 rounded overflow-hidden">
                          <img
                            src={getImageUrl(item.imagePath)}
                            alt="生成结果"
                            className="w-full h-full object-cover cursor-pointer hover:scale-110 transition-transform"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDetailDialog(true);
                            }}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.fashionImage ? (
                          <div className="relative w-16 h-16 rounded overflow-hidden">
                            <img
                              src={getImageUrl(item.fashionImage)}
                              alt={item.fashionName || '服装'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.textureImage ? (
                          <div className="relative w-16 h-16 rounded overflow-hidden">
                            <img
                              src={getImageUrl(item.textureImage)}
                              alt={item.textureName || '纹理'}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.fashionType ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">
                            <Shirt className="h-3 w-3" />
                            {item.fashionType}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {item.seed ? (
                          <code className="px-2 py-1 bg-muted rounded text-xs">
                            {item.seed}
                          </code>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(item.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                              setSelectedItem(item);
                              setShowDetailDialog(true);
                            }}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => {
                              setItemToDelete(item);
                              setShowDeleteConfirm(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          </Card>
        )}
      </div>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>生成详情</DialogTitle>
            <DialogDescription>
              {selectedItem && formatDate(selectedItem.createdAt)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
              {/* 生成结果 */}
              <div className="md:col-span-2">
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  生成结果
                </h3>
                <div className="relative aspect-video rounded-lg overflow-hidden bg-muted">
                  <img
                    src={getImageUrl(selectedItem.imagePath)}
                    alt="生成结果"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              {/* 输入服装 */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Shirt className="h-4 w-4" />
                  输入服装
                </h3>
                {selectedItem.fashionImage ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={getImageUrl(selectedItem.fashionImage)}
                      alt={selectedItem.fashionName || '服装'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    无图片
                  </div>
                )}
                {selectedItem.fashionName && (
                  <p className="mt-2 text-sm text-muted-foreground">{selectedItem.fashionName}</p>
                )}
              </div>

              {/* 输入纹理 */}
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  输入纹理
                </h3>
                {selectedItem.textureImage ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-muted">
                    <img
                      src={getImageUrl(selectedItem.textureImage)}
                      alt={selectedItem.textureName || '纹理'}
                      className="w-full h-full object-contain"
                    />
                  </div>
                ) : (
                  <div className="aspect-square rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    无图片
                  </div>
                )}
                {selectedItem.textureName && (
                  <p className="mt-2 text-sm text-muted-foreground">{selectedItem.textureName}</p>
                )}
              </div>

              {/* 其他信息 */}
              <div className="md:col-span-2 grid grid-cols-2 gap-4">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">服装类型</p>
                  <p className="font-medium">{selectedItem.fashionType || '-'}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">Seed</p>
                  <p className="font-mono font-medium">{selectedItem.seed || '-'}</p>
                </div>
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button
              variant="destructive"
              onClick={() => {
                setItemToDelete(selectedItem);
                setShowDeleteConfirm(true);
                setShowDetailDialog(false);
              }}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              删除记录
            </Button>
            <Button variant="outline" onClick={() => setShowDetailDialog(false)}>
              关闭
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
              确定要删除这条生成记录吗？此操作不可撤销。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteConfirm(false)}>
              取消
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
