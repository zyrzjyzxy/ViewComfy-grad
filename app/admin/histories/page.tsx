'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Search, Trash2, Calendar, Filter, Loader2, AlertCircle, Image as ImageIcon, Eye, Download } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

interface History {
  id: number;
  userId: number;
  user: {
    email: string;
    name: string | null;
  };
  textureName: string | null;
  fashionName: string | null;
  fashionType: string | null;
  prompt: string;
  imagePath: string;
  createdAt: string;
}

export default function AdminHistories() {
  const { user: adminUser } = useAuth();
  const router = useRouter();
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewHistory, setPreviewHistory] = useState<History | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [exportLoading, setExportLoading] = useState(false);
  const limit = 20;

  // 为搜索添加防抖
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchHistories();
  }, [page, debouncedSearch, userFilter, startDate, endDate]);

  const fetchHistories = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (debouncedSearch) {
        params.append('search', debouncedSearch);
      }

      if (userFilter) {
        params.append('userId', userFilter);
      }

      if (startDate) {
        params.append('startDate', startDate);
      }

      if (endDate) {
        params.append('endDate', endDate);
      }

      const response = await fetch(`/api/admin/histories?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistories(data.histories);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('获取历史记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(histories.map(h => h.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: number, checked: boolean | string) => {
    const isChecked = typeof checked === 'boolean' ? checked : checked === 'true';
    if (isChecked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const handlePreview = (history: History) => {
    setPreviewHistory(history);
    setIsPreviewOpen(true);
  };

  const handleBatchDelete = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/histories/batch', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ids: selectedIds }),
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedIds([]);
        fetchHistories();
      } else {
        const data = await response.json();
        setActionError(data.error || '批量删除失败');
      }
    } catch (error) {
      setActionError('批量删除失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchExport = async () => {
    setExportLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        ids: selectedIds.join(','),
      });

      const response = await fetch(`/api/history/export?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `histories_export_${new Date().getTime()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        const data = await response.json();
        alert(data.error || '导出失败');
      }
    } catch (error) {
      alert('导出失败');
    } finally {
      setExportLoading(false);
    }
  };

  const handleSingleDelete = async (id: number) => {
    setActionLoading(true);
    setActionError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/histories/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        fetchHistories();
      } else {
        const data = await response.json();
        setActionError(data.error || '删除失败');
      }
    } catch (error) {
      setActionError('删除失败');
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">生成记录管理</h1>
          <p className="text-gray-600">查看和管理所有用户的生成记录</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索记录..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex gap-4">
                <Input
                  type="date"
                  placeholder="开始日期"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-[160px]"
                />
                <Input
                  type="date"
                  placeholder="结束日期"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-[160px]"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : histories.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <FileText className="h-12 w-12 mb-4" />
                <p>暂无生成记录</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={selectedIds.length === histories.length && histories.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                      </TableHead>
                      <TableHead>ID</TableHead>
                      <TableHead>用户邮箱</TableHead>
                      <TableHead>纹理名称</TableHead>
                      <TableHead>服装名称</TableHead>
                      <TableHead>服装类型</TableHead>
                      <TableHead>生成时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {histories.map((history) => (
                      <TableRow key={history.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.includes(history.id)}
                            onCheckedChange={(checked) => handleSelectOne(history.id, checked)}
                          />
                        </TableCell>
                        <TableCell>{history.id}</TableCell>
                        <TableCell>{history.user.email}</TableCell>
                        <TableCell>{history.textureName || '-'}</TableCell>
                        <TableCell>{history.fashionName || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {history.fashionType || '-'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(history.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handlePreview(history)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSingleDelete(history.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-600">
                      显示 {(page - 1) * limit + 1} - {Math.min(page * limit, total)} 条，共 {total} 条
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        上一页
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page === totalPages}
                      >
                        下一页
                      </Button>
                    </div>
                  </div>
                )}

                {selectedIds.length > 0 && (
                  <div className="flex items-center justify-between mt-6 border-t pt-6">
                    <div className="text-sm text-gray-600">
                      已选择 {selectedIds.length} 条记录
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedIds([])}
                        disabled={exportLoading}
                      >
                        取消选择
                      </Button>
                      <Button
                        variant="outline"
                        onClick={handleBatchExport}
                        disabled={exportLoading}
                      >
                        {exportLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                        批量导出
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        disabled={actionLoading}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        批量删除
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <DialogTitle>记录详情</DialogTitle>
              <DialogDescription>查看生成记录的详细信息</DialogDescription>
            </DialogHeader>
            {previewHistory && (
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>纹理名称</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {previewHistory.textureName || '-'}</div>
                  </div>
                  <div>
                    <Label>服装名称</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {previewHistory.fashionName || '-'}</div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>服装类型</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {previewHistory.fashionType || '-'}</div>
                  </div>
                  <div>
                    <Label>生成时间</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md">
                      {new Date(previewHistory.createdAt).toLocaleString('zh-CN')}</div>
                  </div>
                </div>
                <div>
                  <Label>用户邮箱</Label>
                  <div className="mt-1 p-3 bg-gray-50 rounded-md">
                    {previewHistory.user.email}</div>
                  </div>
                  <div>
                    <Label>提示词</Label>
                    <div className="mt-1 p-3 bg-gray-50 rounded-md break-all">
                      {previewHistory.prompt}</div>
                  </div>
                  {previewHistory.imagePath && (
                    <div>
                      <Label>生成图片</Label>
                      <div className="mt-1">
                        <img
                          src={previewHistory.imagePath}
                          alt="生成图片"
                          className="max-w-full rounded-lg border"
                        />
                      </div>
                    </div>
                  )}
                </div>
              )}
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>
                    关闭
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>确认批量删除</DialogTitle>
                  <DialogDescription>
                    确定要删除选中的 {selectedIds.length} 条记录吗？此操作无法撤销。</DialogDescription>
                  </DialogHeader>
                  {actionError && (
                    <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {actionError}
                    </div>
                  )}
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleBatchDelete} disabled={actionLoading} className="bg-destructive hover:bg-destructive/90">
                      {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                      确认删除
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
          </div>
      </div>
  );
}
