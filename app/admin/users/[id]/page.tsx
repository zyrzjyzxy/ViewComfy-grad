'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, KeyRound, Trash2, Calendar } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, FileText } from 'lucide-react';

interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
}

interface History {
  id: number;
  textureName: string | null;
  fashionName: string | null;
  fashionType: string | null;
  createdAt: string;
}

export default function UserDetail() {
  const { user: adminUser } = useAuth();
  const router = useRouter();
  const params = useParams();
  const userId = parseInt(params.id as string);
  const [user, setUser] = useState<User | null>(null);
  const [histories, setHistories] = useState<History[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', name: '', role: 'USER' });
  const [resetPassword, setResetPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    if (userId) {
      fetchUserDetail();
      fetchUserHistories();
    }
  }, [userId]);

  const fetchUserDetail = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('获取用户详情失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistories = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setHistories(data.user.histories);
      }
    } catch (error) {
      console.error('获取用户历史记录失败:', error);
    }
  };

  const handleEdit = () => {
    setEditForm({
      email: user?.email || '',
      name: user?.name || '',
      role: user?.role || 'USER',
    });
    setIsEditDialogOpen(true);
  };

  const handleResetPassword = () => {
    setResetPassword('');
    setIsResetPasswordDialogOpen(true);
  };

  const handleDelete = () => {
    if (confirm('确定要删除此用户吗？此操作将同时删除该用户的所有历史记录。')) {
      deleteUser();
    }
  };

  const deleteUser = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        router.push('/admin/users');
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

  const handleSaveEdit = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        fetchUserDetail();
      } else {
        const data = await response.json();
        setActionError(data.error || '更新失败');
      }
    } catch (error) {
      setActionError('更新失败');
    } finally {
      setActionLoading(false);
    }
  };

  const handleSaveResetPassword = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${userId}/reset-password`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword: resetPassword }),
      });

      if (response.ok) {
        setIsResetPasswordDialogOpen(false);
        setResetPassword('');
      } else {
        const data = await response.json();
        setActionError(data.error || '重置密码失败');
      }
    } catch (error) {
      setActionError('重置密码失败');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">加载中...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={() => router.push('/admin/users')}
              className="mb-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              返回用户列表
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">用户详情</h1>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>基本信息</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-4">
                    <div>
                      <Label>ID</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {user.id}
                      </div>
                    </div>
                    <div>
                      <Label>邮箱</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {user.email}
                      </div>
                    </div>
                    <div>
                      <Label>姓名</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {user.name || '-'}
                      </div>
                    </div>
                    <div>
                      <Label>角色</Label>
                      <div className="mt-1">
                        <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                          {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label>创建时间</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {new Date(user.createdAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div>
                      <Label>更新时间</Label>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md">
                        {new Date(user.updatedAt).toLocaleString('zh-CN')}
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <Button onClick={handleEdit} className="flex-1">
                        <Edit className="mr-2 h-4 w-4" />
                        编辑信息
                      </Button>
                      <Button onClick={handleResetPassword} className="flex-1">
                        <KeyRound className="mr-2 h-4 w-4" />
                        重置密码
                      </Button>
                    </div>
                    <Button onClick={handleDelete} variant="destructive" className="w-full">
                      <Trash2 className="mr-2 h-4 w-4" />
                      删除用户
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    加载中...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>历史记录统计</CardTitle>
              </CardHeader>
              <CardContent>
                {user ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-50 rounded-md">
                      <div>
                        <div className="text-2xl font-bold text-blue-600">{histories.length}</div>
                        <div className="text-sm text-gray-600">总记录数</div>
                      </div>
                      <FileText className="h-8 w-8 text-blue-400" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-green-50 rounded-md">
                        <div className="text-2xl font-bold text-green-600">
                          {histories.filter(h => {
                            const date = new Date(h.createdAt);
                            const today = new Date();
                            return date.toDateString() === today.toDateString();
                          }).length}
                        </div>
                        <div className="text-sm text-gray-600">今日记录</div>
                      </div>
                      <div className="p-4 bg-purple-50 rounded-md">
                        <div className="text-2xl font-bold text-purple-600">
                          {histories.filter(h => {
                            const date = new Date(h.createdAt);
                            const weekAgo = new Date();
                            weekAgo.setDate(weekAgo.getDate() - 7);
                            return date >= weekAgo;
                          }).length}
                        </div>
                        <div className="text-sm text-gray-600">本周记录</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    加载中...
                  </div>
                )}
              </CardContent>
            </Card>

            <Card className="lg:col-span-3">
              <CardHeader>
                <CardTitle>最近记录</CardTitle>
              </CardHeader>
              <CardContent>
                {histories.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>ID</TableHead>
                        <TableHead>纹理名称</TableHead>
                        <TableHead>服装名称</TableHead>
                        <TableHead>服装类型</TableHead>
                        <TableHead>生成时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {histories.slice(0, 10).map((history) => (
                        <TableRow key={history.id}>
                          <TableCell>{history.id}</TableCell>
                          <TableCell>{history.textureName || '-'}</TableCell>
                          <TableCell>{history.fashionName || '-'}</TableCell>
                          <TableCell>{history.fashionType || '-'}</TableCell>
                          <TableCell>
                            {new Date(history.createdAt).toLocaleString('zh-CN')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    暂无记录
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>编辑用户信息</DialogTitle>
                <DialogDescription>修改用户的基本信息</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {actionError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {actionError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-email">邮箱</Label>
                  <Input
                    id="edit-email"
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-name">姓名</Label>
                  <Input
                    id="edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">角色</Label>
                  <Select value={editForm.role} onValueChange={(value: any) => setEditForm({ ...editForm, role: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="USER">普通用户</SelectItem>
                      <SelectItem value="ADMIN">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveEdit} disabled={actionLoading}>
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  保存
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          <Dialog open={isResetPasswordDialogOpen} onOpenChange={setIsResetPasswordDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>重置密码</DialogTitle>
                <DialogDescription>
                  为用户 {user?.email} 重置密码
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {actionError && (
                  <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {actionError}
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="reset-password">新密码</Label>
                  <Input
                    id="reset-password"
                    type="password"
                    placeholder="至少6位密码"
                    value={resetPassword}
                    onChange={(e) => setResetPassword(e.target.value)}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsResetPasswordDialogOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleSaveResetPassword} disabled={actionLoading || resetPassword.length < 6}>
                  {actionLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  重置密码
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
  );
}
