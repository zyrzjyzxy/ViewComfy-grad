import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// Check if user management is enabled at module load time
const userManagementEnabled = process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
    // 路由重定向规则：将旧路径重定向到新的 /users/ 路径
    const { pathname } = request.nextUrl;
    
    // 定义重定向映射
    const redirectMap: Record<string, string> = {
        '/editor': '/users/editor',
        '/playground': '/users/playground',
        '/preset-images': '/users/preset-images',
        '/history': '/users/history',
        '/profile': '/users/profile'
    };
    
    // 检查是否需要重定向
    if (redirectMap[pathname]) {
        const newUrl = request.nextUrl.clone();
        newUrl.pathname = redirectMap[pathname];
        return NextResponse.redirect(newUrl, 301); // 使用 301 永久重定向
    }
    
    // If user management is disabled, allow all requests immediately
    // This avoids loading Clerk modules entirely
    if (!userManagementEnabled) {
        return NextResponse.next();
    }

    // Only import Clerk when needed (dynamic import)
    const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");
    const isPublicRoute = createRouteMatcher(["/", "/login(.*)", "/users(.*)"]);

    // If enabled, run Clerk middleware
    return clerkMiddleware(async (auth, req) => {
        const { userId, redirectToSignIn } = await auth();

        if (!userId && !isPublicRoute(req)) {
            return redirectToSignIn();
        }
    })(request, event);
}

export const config = {
    matcher: [
        // Skip Next.js internals and all static files
        "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
        // Run for API routes only if using Clerk (which we're not)
        // "/(api|trpc)(.*)",
    ],
};
