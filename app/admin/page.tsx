'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AdminRouteGuard from '@/components/admin/AdminRouteGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, Activity, HardDrive, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminDashboard() {
  const { user } = useAuth();
  const router = useRouter();
  const [stats, setStats] = useState({
    totalUsers: 0,
    adminCount: 0,
    totalHistories: 0,
    todayNewUsers: 0,
    todayHistories: 0,
    storageUsed: '0 MB',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('获取统计数据失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: '用户总数',
      value: stats.totalUsers,
      icon: Users,
      color: 'bg-blue-500',
      link: '/admin/users',
    },
    {
      title: '历史记录总数',
      value: stats.totalHistories,
      icon: FileText,
      color: 'bg-green-500',
      link: '/admin/histories',
    },
    {
      title: '今日新增用户',
      value: stats.todayNewUsers,
      icon: Activity,
      color: 'bg-purple-500',
      link: '/admin/users',
    },
    {
      title: '今日生成记录',
      value: stats.todayHistories,
      icon: Activity,
      color: 'bg-orange-500',
      link: '/admin/histories',
    },
    {
      title: '存储使用',
      value: stats.storageUsed,
      icon: HardDrive,
      color: 'bg-cyan-500',
      link: null,
    },
  ];

  const quickActions = [
    {
      title: '用户管理',
      description: '查看和管理所有用户',
      icon: Users,
      link: '/admin/users',
    },
    {
      title: '生成记录管理',
      description: '查看和管理所有生成记录',
      icon: FileText,
      link: '/admin/histories',
    },
  ];

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 border-t-2"></div>
      </div>
    );
  }

  return (
    <AdminRouteGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">管理后台</h1>
            <p className="text-gray-600 mt-2">欢迎回来，{user?.name || '管理员'}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
            {statCards.map((card, index) => (
              <Card
                key={index}
                className={`cursor-pointer hover:shadow-lg transition-shadow ${card.link ? 'hover:scale-105' : ''}`}
                onClick={() => card.link && router.push(card.link)}
              >
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {card.title}
                  </CardTitle>
                  <div className={`p-3 rounded-full ${card.color}`}>
                    <card.icon className="h-5 w-5 text-white" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">{card.value}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {quickActions.map((action, index) => (
              <Card
                key={index}
                className="cursor-pointer hover:shadow-lg transition-shadow hover:scale-105"
                onClick={() => router.push(action.link)}
              >
                <CardHeader>
                  <div className="flex items-center space-x-4">
                    <div className={`p-3 rounded-full bg-blue-500`}>
                      <action.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{action.title}</CardTitle>
                      <CardDescription className="text-gray-600">
                        {action.description}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <ArrowRight className="h-5 w-5" />
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </AdminRouteGuard>
    );
}
