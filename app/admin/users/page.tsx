'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Trash2, KeyRound, User as UserIcon } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface User {
  id: number;
  email: string;
  name: string | null;
  role: 'USER' | 'ADMIN';
  createdAt: string;
  updatedAt: string;
  historyCount: number;
}

export default function AdminUsers() {
  const { user: adminUser } = useAuth();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'USER' | 'ADMIN'>('ALL');
  const limit = 20;

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isResetPasswordDialogOpen, setIsResetPasswordDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ email: '', name: '', role: 'USER' });
  const [resetPassword, setResetPassword] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  useEffect(() => {
    fetchUsers();
  }, [page, search, roleFilter]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });

      if (search) {
        params.append('search', search);
      }

      if (roleFilter !== 'ALL') {
        params.append('role', roleFilter);
      }

      const response = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.users);
        setTotal(data.pagination.total);
      }
    } catch (error) {
      console.error('获取用户列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setEditForm({
      email: user.email,
      name: user.name || '',
      role: user.role,
    });
    setIsEditDialogOpen(true);
  };

  const handleResetPassword = (user: User) => {
    setSelectedUser(user);
    setResetPassword('');
    setIsResetPasswordDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleSaveEdit = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        setIsEditDialogOpen(false);
        fetchUsers();
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
      const response = await fetch(`/api/admin/users/${selectedUser?.id}/reset-password`, {
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

  const handleConfirmDelete = async () => {
    setActionLoading(true);
    setActionError('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${selectedUser?.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setIsDeleteDialogOpen(false);
        setSelectedUser(null);
        fetchUsers();
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
          <h1 className="text-3xl font-bold text-gray-900">用户管理</h1>
          <p className="text-gray-600">查看和管理所有用户</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div className="flex flex-1 gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="搜索邮箱或姓名..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={roleFilter} onValueChange={(value: any) => setRoleFilter(value)}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="筛选角色" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">全部角色</SelectItem>
                    <SelectItem value="USER">普通用户</SelectItem>
                    <SelectItem value="ADMIN">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={() => router.push('/admin/users/new')}>
                <Plus className="mr-2 h-4 w-4" />
                添加用户
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : users.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                <UserIcon className="h-12 w-12 mb-4" />
                <p>暂无用户</p>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>邮箱</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>历史记录数</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>{user.name || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === 'ADMIN' ? 'default' : 'secondary'}>
                            {user.role === 'ADMIN' ? '管理员' : '普通用户'}
                          </Badge>
                        </TableCell>
                        <TableCell>{user.historyCount}</TableCell>
                        <TableCell>
                          {new Date(user.createdAt).toLocaleString('zh-CN')}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(user)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleResetPassword(user)}
                            >
                              <KeyRound className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(user)}
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
              </>
            )}
          </CardContent>
        </Card>

        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑用户</DialogTitle>
              <DialogDescription>修改用户信息</DialogDescription>
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
                为用户 {selectedUser?.email} 重置密码
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

        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>确认删除</DialogTitle>
              <DialogDescription>
                确定要删除用户 {selectedUser?.email} 吗？此操作将同时删除该用户的所有历史记录。
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {actionError && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {actionError}
                </div>
              )}
              <div className="bg-gray-50 p-4 rounded-md">
                <p className="text-sm">
                  <strong>用户：</strong>{selectedUser?.email}
                </p>
                <p className="text-sm">
                  <strong>历史记录：</strong>{selectedUser?.historyCount} 条
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                取消
              </Button>
              <Button onClick={handleConfirmDelete} disabled={actionLoading} className="bg-destructive hover:bg-destructive/90">
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
