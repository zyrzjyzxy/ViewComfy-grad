'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import AuthModal from '@/components/AuthModal';
import PlaygroundPage from "@/components/pages/playground/playground-page";
import { Suspense } from "react";

export default function Page() {
  const { user, logout, isLoading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const requireLogin = () => {
    if (!user) {
      setShowAuthModal(true);
      return false;
    }
    return true;
  };

  return (
    <Suspense>
      {/* 顶部导航栏 - 保持简洁美观 */}
      <header className="fixed top-0 left-0 right-0 z-40 border-b bg-white/80 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900">ComfyUI 生图平台</h1>

          <div className="flex items-center gap-6">
            {isLoading ? (
              <span className="text-sm text-gray-500">加载中...</span>
            ) : user ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-700">欢迎，{user.email}</span>
                <button
                  onClick={logout}
                  className="rounded-lg bg-gray-200 px-5 py-2.5 text-sm font-medium transition hover:bg-gray-300"
                >
                  退出登录
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAuthModal(true)}
                className="rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-7 py-3 font-semibold text-white shadow-md transition hover:from-blue-700 hover:to-indigo-700"
              >
                登录 / 注册
              </button>
            )}
          </div>
        </div>
      </header>

      {/* 主内容区 - 从顶部导航下方开始，避免被遮挡 */}
      <main className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 pt-20">
        <div className="mx-auto max-w-7xl px-6">
          {/* ——核心：传入 requireLogin 回调，让 Playground 内部判断是否登录—— */}
          <PlaygroundPage requireLogin={requireLogin} />
        </div>
      </main>

      {/* 登录/注册弹窗 */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </Suspense>
  );
}