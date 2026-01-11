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
            router.push("/");
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
            <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
                <div className="flex items-center justify-center py-12">
                    <div className="mx-auto grid w-[350px] gap-6">
                        <div className="grid gap-2 text-center">
                            <h1 className="text-3xl font-bold">
                                Welcome to <br /> ViewComfy Cloud
                            </h1>
                            <p className="text-balance text-muted-foreground">
                                Login or Sign up to access the dashboard
                            </p>
                        </div>
                        <div className="grid gap-4">
                            <SignIn />
                        </div>
                    </div>
                </div>
                <div className="hidden lg:block lg:relative lg:overflow-hidden">
                    <Image
                        src="/view_comfy_logo.svg"
                        alt="ViewComfy Logo"
                        width={1920}
                        height={1080}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-h-full w-auto object-contain"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="w-full lg:grid lg:min-h-[600px] lg:grid-cols-2 xl:min-h-[800px]">
            <div className="flex items-center justify-center py-12">
                <div className="mx-auto grid w-[350px] gap-6">
                    <div className="grid gap-2 text-center">
                        <h1 className="text-3xl font-bold">
                            {isRegisterMode ? "创建账号" : "欢迎回来"}
                        </h1>
                        <p className="text-balance text-muted-foreground">
                            {isRegisterMode
                                ? "填写以下信息注册新账号"
                                : "请登录以继续使用系统"}
                        </p>
                    </div>

                    <form onSubmit={isRegisterMode ? handleRegister : handleLogin} className="grid gap-4">
                        {isRegisterMode && (
                            <div className="grid gap-2">
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

                        <div className="grid gap-2">
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

                        <div className="grid gap-2">
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

                        {isRegisterMode && (
                            <div className="grid gap-2">
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

                        <Button type="submit" className="w-full" disabled={loading}>
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {isRegisterMode ? "注册" : "登录"}
                        </Button>

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
                    </form>
                </div>
            </div>
            <div className="hidden lg:block lg:relative lg:overflow-hidden bg-muted">
                <div className="absolute inset-0 bg-zinc-900" />
                <Image
                    src="/view_comfy_logo.svg"
                    alt="ViewComfy Logo"
                    width={1920}
                    height={1080}
                    className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 max-h-full w-auto object-contain"
                    onError={(e) => {
                        e.currentTarget.style.display = 'none';
                    }}
                />
            </div>
        </div>
    );
}
