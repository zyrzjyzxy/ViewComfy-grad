"use client"

import HeroSection from "@/components/HeroSection";

export default function HomePage() {
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
                            onClick={(e) => {
                                // 阻止默认行为
                                e.preventDefault();
                                e.stopPropagation();
                                
                                try {
                                    // 使用更兼容的跳转方式
                                    window.location.assign('/login');
                                } catch (error) {
                                    // 降级方案
                                    window.location.href = '/login';
                                }
                            }}
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

