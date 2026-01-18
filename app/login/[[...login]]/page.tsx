"use client";

import Image from "next/image";
import { SignIn } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";
import { SettingsService } from "@/services/settings-service";
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";

const settingsService = new SettingsService();

export default function Login() {
    const userManagementEnabled = settingsService.isUserManagementEnabled();
    const { login, register, user } = useAuth();
    const router = useRouter();

    // Form state
    const [isRegisterMode, setIsRegisterMode] = useState(false);
    const [isAdminMode, setIsAdminMode] = useState(false);
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [name, setName] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [loading, setLoading] = useState(false);

    // If already logged in, redirect to home
    useEffect(() => {
        if (user && !userManagementEnabled) {
            router.push("/");
        }
    }, [user, userManagementEnabled, router]);

    const resetForm = () => {
        setEmail("");
        setPassword("");
        setConfirmPassword("");
        setName("");
        setError("");
        setSuccess("");
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");
        try {
            await login(email, password);
            // Navigation handled by AuthContext now
        } catch (err: any) {
            setError(err.message || "登录失败");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");
        setSuccess("");

        // Validate passwords match
        if (password !== confirmPassword) {
            setError("两次输入的密码不一致");
            setLoading(false);
            return;
        }

        // Validate password length
        if (password.length < 6) {
            setError("密码长度至少为6位");
            setLoading(false);
            return;
        }

        try {
            await register(email, password, name || undefined);
            setSuccess("注册成功！请登录");
            // Switch to login mode after successful registration
            setTimeout(() => {
                setIsRegisterMode(false);
                setPassword("");
                setConfirmPassword("");
                setSuccess("");
            }, 1500);
        } catch (err: any) {
            setError(err.message || "注册失败");
        } finally {
            setLoading(false);
        }
    };

    const toggleMode = () => {
        setIsRegisterMode(!isRegisterMode);
        setError("");
        setSuccess("");
        setPassword("");
        setConfirmPassword("");
    };

    if (userManagementEnabled) {
        return (
            <div className="w-full min-h-screen flex flex-col lg:flex-row">
                {/* 左侧图片区域 */}
                <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                    <Image
                        src="/charlota-blunarova-r5xHI_H44aM-unsplash.jpg"
                        alt="Fashion Design Sketches"
                        width={1920}
                        height={1080}
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                </div>
                
                {/* 右侧登录表单区域 */}
                <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
                    <div className="w-full max-w-md space-y-8">
                        {/* 返回首页按钮 */}
                        <div className="flex justify-start">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-foreground"
                                onClick={() => router.push("/")}
                            >
                                ← 返回首页
                            </Button>
                        </div>
                        
                        <div className="text-center space-y-2">
                            <h1 className="text-3xl font-bold">
                                Welcome to <br /> ViewComfy Cloud
                            </h1>
                            <p className="text-muted-foreground">
                                Login or Sign up to access the dashboard
                            </p>
                        </div>
                        <div className="space-y-4">
                            <SignIn />
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full min-h-screen flex flex-col lg:flex-row">
            {/* 左侧图片区域 */}
            <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
                <Image
                    src="/charlota-blunarova-r5xHI_H44aM-unsplash.jpg"
                    alt="Fashion Design Sketches"
                    width={1920}
                    height={1080}
                    className="absolute inset-0 w-full h-full object-cover"
                />
            </div>
            
            {/* 右侧登录表单区域 */}
            <div className="lg:w-1/2 flex items-center justify-center p-4 sm:p-6 md:p-8">
                <div className="w-full max-w-md space-y-8">
                    {/* 返回首页按钮 */}
                    <div className="flex justify-start">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-muted-foreground hover:text-foreground"
                            onClick={() => router.push("/")}
                        >
                            ← 返回首页
                        </Button>
                    </div>
                    
                    <div className="text-center space-y-2">
                        <h1 className="text-3xl font-bold">
                            登录
                        </h1>
                        <p className="text-muted-foreground">
                            请输入您的账号密码登录
                        </p>
                    </div>

                    {/* 登录模式切换 */}
                    <div className="flex space-x-4 mb-4">
                        <button
                            type="button"
                            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${!isAdminMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => setIsAdminMode(false)}
                        >
                            用户登录
                        </button>
                        <button
                            type="button"
                            className={`flex-1 py-2 px-4 rounded-lg transition-colors ${isAdminMode ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                            onClick={() => setIsAdminMode(true)}
                        >
                            管理员登录
                        </button>
                    </div>

                    <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="space-y-4">
                        {!isAdminMode && isRegisterMode && (
                            <div className="space-y-2">
                                <Label htmlFor="name">用户名（可选）</Label>
                                <Input
                                    id="name"
                                    type="text"
                                    placeholder="输入您的用户名"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label htmlFor="email">邮箱</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">密码</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder={isRegisterMode ? "至少6位密码" : "输入密码"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                        {!isAdminMode && isRegisterMode && (
                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">确认密码</Label>
                                <Input
                                    id="confirmPassword"
                                    type="password"
                                    placeholder="再次输入密码"
                                    required
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                />
                            </div>
                        )}
                        {error && (
                            <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
                                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                {error}
                            </div>
                        )}
                        {success && (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-100 p-3 rounded-md">
                                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                                {success}
                            </div>
                        )}
                        <Button 
                            type="submit" 
                            className="w-full bg-orange-600 hover:bg-orange-700 text-white" 
                            disabled={loading}
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isRegisterMode ? "注册" : "登录"}
                        </Button>
                        {!isAdminMode && (
                            <div className="text-center text-sm">
                                {isRegisterMode ? (
                                    <>
                                        已有账号？{" "}
                                        <button
                                            type="button"
                                            className="underline text-primary hover:text-primary/80"
                                            onClick={toggleMode}
                                        >
                                            立即登录
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        还没有账号？{" "}
                                        <button
                                            type="button"
                                            className="underline text-primary hover:text-primary/80"
                                            onClick={toggleMode}
                                        >
                                            立即注册
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
