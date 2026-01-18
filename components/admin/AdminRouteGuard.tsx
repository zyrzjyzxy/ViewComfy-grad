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
        router.push('/users/editor');
      } else {
        console.log('用户是管理员，允许访问');
      }
    }
  }, [user, isLoading, router]);

  // 在isLoading为false前，始终返回loading状态
  // 避免服务端和客户端渲染不一致导致的hydration mismatch
  if (isLoading) {
    console.log('正在加载中...');
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">加载中...</span>
      </div>
    );
  }

  // 只在客户端进行权限校验和跳转
  // 避免服务端和客户端渲染结果不一致
  return <>{children}</>;
}
