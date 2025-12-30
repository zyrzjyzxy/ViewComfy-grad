'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import Image from 'next/image';

interface HistoryItem {
  id: number;
  prompt: string;
  imagePath: string;  // 例如: /outputs/xxx.png 或 ComfyUI 的 /view?filename=xxx.png
  createdAt: string;
}

export default function HistoryPage() {
  const { user } = useAuth();
  const [histories, setHistories] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      setError('请先登录');
      setLoading(false);
      return;
    }

    const fetchHistory = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('/api/history', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error('获取历史失败');
        const data = await res.json();
        setHistories(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [user]);

  // 如果未登录或加载中
  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800">请先登录</h2>
          <p className="mt-4 text-gray-600">登录后才能查看你的生成历史</p>
          <button
            onClick={() => window.open('/', '_self')}
            className="mt-6 rounded-lg bg-blue-600 px-8 py-3 text-white hover:bg-blue-700"
          >
            返回首页登录
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-xl text-gray-600">加载历史记录中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <h1 className="mb-10 text-center text-4xl font-bold text-gray-800">
          我的生成历史
        </h1>
        <p className="mb-8 text-center text-lg text-gray-600">
          共 {histories.length} 条记录
        </p>

        {error && (
          <div className="mb-8 text-center text-red-600">{error}</div>
        )}

        {histories.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl text-gray-500">暂无生成记录</p>
            <p className="mt-4 text-gray-600">去首页生成一些图片吧！</p>
            <button
              onClick={() => window.open('/', '_blank')}
              className="mt-8 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 px-8 py-4 text-white shadow-lg hover:from-green-600"
            >
              去生成图片
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
            {histories.map((item) => (
              <div
                key={item.id}
                className="overflow-hidden rounded-xl bg-white shadow-lg transition hover:shadow-2xl"
              >
                <div className="relative aspect-square">
                  <Image
                    src={item.imagePath.startsWith('http') ? item.imagePath : `http://localhost:8188${item.imagePath}`}
                    alt={item.prompt}
                    fill
                    className="object-cover"
                    unoptimized // ComfyUI 图片需关闭优化
                  />
                </div>
                <div className="p-4">
                  <p className="text-sm text-gray-700 line-clamp-2">
                    {item.prompt || '无提示词'}
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    {new Date(item.createdAt).toLocaleString('zh-CN')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
