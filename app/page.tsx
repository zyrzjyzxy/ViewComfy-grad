"use client"

import HeroSection from "@/components/HeroSection";
import { useAuth } from "@/context/AuthContext";

export default function HomePage() {
    const { user } = useAuth();

    const handleLoginClick = (e: React.MouseEvent) => {
        // 阻止默认行为
        e.preventDefault();
        e.stopPropagation();
        
        try {
            // 检查用户是否已经登录
            if (user) {
                // 已登录，根据用户角色跳转到相应页面
                if (user.role === 'ADMIN') {
                        window.location.assign('/admin');
                    } else {
                        window.location.assign('/users/editor');
                    }
            } else {
                // 未登录，跳转到login页面
                window.location.assign('/login');
            }
        } catch (error) {
            // 降级方案
            if (user) {
                if (user.role === 'ADMIN') {
                    window.location.href = '/admin';
                } else {
                    window.location.href = '/users/editor';
                }
            } else {
                window.location.href = '/login';
            }
        }
    };

    return (
        <div className="min-h-screen bg-white">
            {/* Minimal navigation */}
            <div className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div>
                            <h1 className="text-xl font-bold">iRetexturing</h1>
                            <p className="text-sm text-gray-600">智能纹理替换</p>
                        </div>
                        <button
                            className="px-4 py-2 bg-orange-600 text-white font-medium rounded-md hover:bg-orange-700 transition-colors"
                            onClick={handleLoginClick}
                        >
                            登录
                        </button>
                    </div>
                </div>
            </div>

            {/* Hero Section */}
            <div className="pt-16">
                <HeroSection />
            </div>
        </div>
    );
}

