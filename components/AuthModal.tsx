'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register'; // 默认登录
}

export default function AuthModal({ isOpen, onClose, initialMode = 'login' }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login, register } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name || undefined);
      }
      onClose(); // 成功后关闭弹窗
    } catch (err: any) {
      setError(err.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === 'login' ? 'register' : 'login');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-2xl">
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
          {mode === 'login' ? '欢迎回来' : '创建账号'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <input
              type="text"
              placeholder="姓名（可选）"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
            />
          )}

          <input
            type="email"
            placeholder="邮箱地址"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />

          <input
            type="password"
            placeholder="密码"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none"
          />

          {error && (
            <p className="rounded bg-red-50 px-4 py-2 text-sm text-red-600">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 py-4 font-semibold text-white shadow-lg hover:from-blue-700 hover:to-indigo-700 disabled:opacity-70"
          >
            {loading ? '处理中...' : mode === 'login' ? '立即登录' : '注册账号'}
          </button>
        </form>

        <div className="mt-6 text-center text-gray-600">
          <span>
            {mode === 'login' ? '还没有账号？' : '已有账号？'}
          </span>
          <button
            onClick={switchMode}
            className="ml-2 font-semibold text-blue-600 hover:underline"
          >
            {mode === 'login' ? '立即注册' : '直接登录'}
          </button>
        </div>
        
        <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
            ✕
        </button>
      </div>
    </div>
  );
}
