'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('=== AdminRouteGuard 调试 ===');
    console.log('用户状态:', user);
    console.log('加载状态:', isLoading);
    
    if (!isLoading) {
      if (!user) {
        console.log('用户未登录，跳转到登录页');
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        console.log('用户不是管理员，跳转到编辑器');
        router.push('/editor');
      } else {
        console.log('用户是管理员，允许访问');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    console.log('正在加载中...');
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">加载中...</span>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') {
    console.log('用户无权限访问，返回 null');
    return null;
  }

  console.log('用户有权限访问，渲染子组件');
  return <>{children}</>;
}
