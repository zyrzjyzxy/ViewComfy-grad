export default function MinimalPage() {
    return (
        <html>
            <head>
                <title>iRetexturing</title>
                <style>
                    body {
                        font-family: Arial, sans-serif;
                        margin: 0;
                        padding: 0;
                    }
                    .nav {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        background-color: white;
                        border-bottom: 1px solid #e5e7eb;
                        z-index: 1000;
                    }
                    .nav-content {
                        max-width: 1200px;
                        margin: 0 auto;
                        padding: 16px;
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
                    }
                    .brand {
                        font-size: 24px;
                        font-weight: bold;
                    }
                    .login-btn {
                        padding: 8px 16px;
                        background-color: #f97316;
                        color: white;
                        text-decoration: none;
                        border-radius: 6px;
                        font-weight: 500;
                    }
                    .hero {
                        padding-top: 100px;
                        text-align: center;
                        padding-bottom: 50px;
                    }
                </style>
            </head>
            <body>
                <nav class="nav">
                    <div class="nav-content">
                        <div>
                            <div class="brand">iRetexturing</div>
                            <div style="font-size: 14px; color: #6b7280;">智能纹理替换</div>
                        </div>
                        <a href="/login" class="login-btn">登录</a>
                    </div>
                </nav>
                <div class="hero">
                    <h1>Welcome to iRetexturing</h1>
                    <p>智能纹理替换系统</p>
                    <p>Click the login button above to access the system</p>
                </div>
            </body>
        </html>
    );
}