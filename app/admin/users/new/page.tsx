'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function CreateUser() {
  const { user: adminUser } = useAuth();
  const router = useRouter();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    role: 'USER' as 'USER' | 'ADMIN',
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (formData.password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (formData.password.length < 6) {
      setError('密码长度至少为6位');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/admin/users');
        }, 1500);
      } else {
        const data = await response.json();
        setError(data.error || '创建用户失败');
      }
    } catch (error) {
      setError('创建用户失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-2xl mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.push('/admin/users')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            返回用户列表
          </Button>
          <h1 className="text-3xl font-bold text-gray-900">创建新用户</h1>
          <p className="text-gray-600 mt-2">填写用户信息以创建新账户</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>用户信息</CardTitle>
            <CardDescription>请填写以下信息创建新用户</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  {error}
                </div>
              )}

              {success && (
                <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 p-3 rounded-md">
                  <CheckCircle className="h-4 w-4 flex-shrink-0" />
                  用户创建成功！正在跳转...
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">邮箱 *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">密码 *</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="至少6位密码"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  required
                  disabled={loading || success}
                />
                <p className="text-xs text-gray-500">密码长度至少为6位</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password">确认密码 *</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="再次输入密码"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading || success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">姓名</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="用户姓名（可选）"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  disabled={loading || success}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="role">角色 *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: any) => setFormData({ ...formData, role: value })}
                  disabled={loading || success}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USER">普通用户</SelectItem>
                    <SelectItem value="ADMIN">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push('/admin/users')}
                  disabled={loading || success}
                  className="flex-1"
                >
                  取消
                </Button>
                <Button
                  type="submit"
                  disabled={loading || success || !formData.email || !formData.password || formData.password.length < 6 || formData.password !== confirmPassword}
                  className="flex-1"
                >
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  {success ? <CheckCircle className="mr-2 h-4 w-4" /> : null}
                  {success ? '创建成功' : '创建用户'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
