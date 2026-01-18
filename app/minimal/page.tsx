export default function MinimalPage() {
    return (
        <div className="font-sans">
            <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-50">
                <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
                    <div>
                        <div className="text-2xl font-bold">iRetexturing</div>
                        <div className="text-sm text-gray-600">智能纹理替换</div>
                    </div>
                    <a href="/login" className="px-4 py-2 bg-orange-500 text-white text-decoration-none rounded-md font-medium">登录</a>
                </div>
            </nav>
            <div className="pt-24 text-center pb-12">
                <h1 className="text-3xl font-bold">Welcome to iRetexturing</h1>
                <p className="text-lg mt-2">智能纹理替换系统</p>
                <p className="mt-4 text-gray-600">Click the login button above to access the system</p>
            </div>
        </div>
    );
}