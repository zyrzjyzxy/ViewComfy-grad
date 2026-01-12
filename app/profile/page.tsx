'use client';

import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, LogOut, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProfilePage() {
    const { user, logout, isLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, router]);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (!user) {
        return null; // Will redirect
    }

    const handleLogout = () => {
        logout();
        router.push('/login');
    };

    return (
        <div className="container max-w-2xl py-10">
            <h1 className="text-3xl font-bold mb-8 flex items-center gap-2">
                <User className="h-8 w-8" />
                用户信息
            </h1>

            <Card>
                <CardHeader className="space-y-1">
                    <CardTitle className="text-2xl">个人资料</CardTitle>
                    <CardDescription>
                        查看您的账户信息
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex flex-col items-center space-y-4 sm:flex-row sm:space-x-6 sm:space-y-0 text-center sm:text-left">
                        <Avatar className="h-24 w-24">
                            <AvatarImage src={`https://avatar.vercel.sh/${user.email}`} alt={user.name || user.email} />
                            <AvatarFallback><User className="h-10 w-10" /></AvatarFallback>
                        </Avatar>
                        <div>
                            <h3 className="text-xl font-medium">{user.name || '未设置昵称'}</h3>
                            <p className="text-muted-foreground">{user.email}</p>
                            <p className="text-sm text-muted-foreground mt-1">ID: {user.id}</p>
                        </div>
                    </div>

                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">邮箱地址</Label>
                            <Input id="email" value={user.email} readOnly disabled />
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="username">用户名称</Label>
                            <Input id="username" value={user.name || ''} placeholder="未设置" readOnly disabled />
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-between">
                    <Button variant="outline" onClick={() => router.back()}>
                        返回
                    </Button>
                    <Button variant="destructive" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        退出登录
                    </Button>
                </CardFooter>
            </Card>
        </div>
    );
}
