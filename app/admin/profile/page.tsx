'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Mail, Calendar, Edit, Save, Loader2, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useRouter } from 'next/navigation';

export default function AdminProfile() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleUpdateProfile = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/admin/users/${user?.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profile),
      });

      if (response.ok) {
        const data = await response.json();
        // 更新本地用户信息
        localStorage.setItem('user', JSON.stringify(data.user));
        // 重新获取用户信息
        window.location.reload();
        setSuccess('个人信息更新成功');
        setIsEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || '更新失败');
      }
    } catch (error) {
      console.error('更新个人信息失败:', error);
      setError('更新失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">管理员信息</h1>
          <p className="text-gray-600">查看和管理您的管理员账户</p>
        </div>

        <Card className="max-w-2xl">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-xl">个人资料</CardTitle>
                <CardDescription>您的管理员账户信息</CardDescription>
              </div>
              {!isEditing ? (
                <Button onClick={() => setIsEditing(true)}>
                  <Edit className="mr-2 h-4 w-4" />
                  编辑
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => {
                    setIsEditing(false);
                    setProfile({
                      name: user?.name || '',
                      email: user?.email || '',
                    });
                  }} className="mr-2">
                    取消
                  </Button>
                  <Button onClick={handleUpdateProfile} disabled={loading}>
                    {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    保存
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md mb-4">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}
            
            {success && (
              <div className="flex items-center gap-2 text-sm text-success bg-success/10 p-3 rounded-md mb-4">
                ✅ {success}
              </div>
            )}

            <div className="space-y-6">
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center">
                    <User className="h-12 w-12 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">姓名</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!isEditing}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">邮箱</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={true}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-500">邮箱地址不可修改</p>
                </div>

                <div className="space-y-2">
                  <Label>角色</Label>
                  <div className="flex items-center gap-2 py-2 px-3 bg-gray-100 rounded-md">
                    <Shield className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">管理员</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>账户创建时间</Label>
                  <div className="py-2 px-3 bg-gray-100 rounded-md">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : 'N/A'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="max-w-2xl mt-6">
          <CardHeader>
            <CardTitle className="text-xl">安全设置</CardTitle>
            <CardDescription>管理您的账户安全</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => router.push('/admin/users/' + user?.id + '/reset-password')}
              >
                <Edit className="mr-2 h-4 w-4" />
                修改密码
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start text-destructive hover:text-destructive"
                onClick={() => {
                  if (confirm('确定要退出登录吗？')) {
                    logout();
                    router.push('/login');
                  }
                }}
              >
                <User className="mr-2 h-4 w-4" />
                退出登录
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}