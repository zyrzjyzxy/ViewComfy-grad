"use client"

export default function HomePage() {
    return (
        <div>
            {/* Minimal navigation */}
            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                backgroundColor: 'white',
                borderBottom: '1px solid #e5e7eb',
                zIndex: 1000
            }}>
                <div style={{
                    maxWidth: '1200px',
                    margin: '0 auto',
                    padding: '16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                }}>
                    <div>
                        <h1 style={{ fontSize: '24px', fontWeight: 'bold', margin: 0 }}>iRetexturing</h1>
                        <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>智能纹理替换</p>
                    </div>
                    <button
                        style={{
                            padding: '8px 16px',
                            backgroundColor: '#f97316',
                            color: 'white',
                            border: 'none',
                            borderRadius: '6px',
                            fontWeight: '500',
                            cursor: 'pointer'
                        }}
                        onClick={() => {
                            // 强制刷新页面以清除可能的缓存问题
                            window.location.href = '/login';
                        }}
                    >
                        登录
                    </button>
                </div>
            </div>

            {/* Simple content */}
            <div style={{ paddingTop: '100px', padding: '20px' }}>
                <h2>Welcome to iRetexturing</h2>
                <p>智能纹理替换系统 - 像编辑文字一样编辑物体表面</p>
                <p>Click the login button above to access the system</p>
            </div>
        </div>
    );
}

