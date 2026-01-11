import { NextResponse } from "next/server";
import type { NextRequest, NextFetchEvent } from "next/server";

// Check if user management is enabled at module load time
const userManagementEnabled = process.env.NEXT_PUBLIC_USER_MANAGEMENT === "true";

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
    // If user management is disabled, allow all requests immediately
    // This avoids loading Clerk modules entirely
    if (!userManagementEnabled) {
        return NextResponse.next();
    }

    // Only import Clerk when needed (dynamic import)
    const { clerkMiddleware, createRouteMatcher } = await import("@clerk/nextjs/server");
    const isPublicRoute = createRouteMatcher(["/login(.*)"]);

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
