"use client"
import "./globals.css";
import { SettingsService } from "@/services/settings-service";
import { DeployDialog } from '@/components/deploy/deploy-dialog';
import { TopNav } from '@/components/top-nav';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/components/ui/sidebar';
import { useEffect, useState, Suspense } from 'react';
import { Toaster } from 'sonner';
import { FileJson, SquarePlay, SquareTerminal, ImageIcon, History, User, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { ImageComparisonProvider } from "@/components/comparison/image-comparison-provider";
import dynamic from "next/dynamic";
import { TeamSwitch } from "@/components/team-switcher";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const settingsService = new SettingsService();

const validUrls = ["/playground", "/apps"];

const showSidebar = !(settingsService.getIsRunningInViewComfy() && settingsService.getIsViewMode());

export default function ClientRootLayout({ children }: { children: React.ReactNode }) {
  const [deployWindow, setDeployWindow] = useState<boolean>(false);
  const userManagement = settingsService.isUserManagementEnabled();
  const searchParams = useSearchParams();
  const router = useRouter();
  const appId: string | null | undefined = searchParams?.get("appId");
  const pathname = usePathname();


  useEffect(() => {
    if (settingsService.getIsRunningInViewComfy()) {
      if (settingsService.getIsViewMode()) {
        if (appId) {
          router.push(`/playground?appId=${appId}`);
        } else if (!validUrls.includes(pathname)) {
          router.push("/apps");
        }
      } else {
        if (pathname === "/" || pathname === "/apps") {
          router.push("/editor");
        }
      }
    } else {
      if (pathname === "/") {
        router.push("/editor");
      }
    }
  }, [pathname, router, userManagement, appId]);



  const content = (
    <Suspense>
      <ImageComparisonProvider>
        <div className="flex flex-col h-screen w-full overflow-hidden" style={{ '--top-nav-height': '57px', '--sidebar-width': '12rem' } as React.CSSProperties}>
          <TopNav />
          <SidebarProvider>
            <div className="flex flex-1 overflow-hidden">
              <AppSidebar />
              <main className={`flex-1 overflow-x-auto overflow-y-hidden ${showSidebar ? 'ml-[var(--sidebar-width)]' : ''}`}>
                <PageWrapper>
                  {children}
                </PageWrapper>
              </main>
            </div>
          </SidebarProvider>
        </div>
        <DeployDialog open={deployWindow} setOpen={setDeployWindow} />
        <Toaster />
      </ImageComparisonProvider>
    </Suspense>
  );

  return content;
}

export function AppSidebar() {
  const items = [];
  const pathname = usePathname();
  const isPlaygroundRouteEnabled = settingsService.getIsRunningInViewComfy() && settingsService.getIsViewMode();
  if (!showSidebar) {
    return <></>
  }
  if (settingsService.getIsRunningInViewComfy()) {
    if (settingsService.getIsViewMode()) {
      items.push({
        title: "Apps",
        url: "/apps",
        icon: SquarePlay,
      });
      items.push({
        title: "编辑工作流",
        url: "/editor",
        icon: FileJson,
      });
    }
  } else {
    if (!settingsService.getIsViewMode()) {
      items.push({
        title: "编辑工作流",
        url: "/editor",
        icon: FileJson,
      });
    }
  };

  items.push({
    title: "纹理替换",
    url: isPlaygroundRouteEnabled ? "" : "/playground",
    icon: SquareTerminal,
  });

  // 添加预设图片管理（仅非 ViewMode 时显示）
  if (!settingsService.getIsViewMode()) {
    items.push({
      title: "预设图片",
      url: "/preset-images",
      icon: ImageIcon,
    });
    items.push({
      title: "历史记录",
      url: "/history",
      icon: History,
    });
    items.push({
      title: "用户信息",
      url: "/profile",
      icon: User,
    });
  }

  return (
    <Sidebar className={"mt-2"}>
      <SidebarContent className={`flex flex-col h-full overflow-y-auto border-r bg-background transition-all duration-300`} style={{ width: 'var(--sidebar-width)' }}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon className="size-5" />
                      <span className="ml-2">{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-r bg-background">
      </ SidebarFooter>
    </Sidebar>
  )
}

// Dynamically import the authenticated wrapper component
const AuthenticatedWrapper = dynamic(
  () => import("@/components/auth/authenticated-wrapper"),
  { ssr: false }
);

function PageWrapper({ children }: { children: React.ReactNode }) {
  const userManagement = settingsService.isUserManagementEnabled();
  const { user, isLoading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  // Public paths that don't require authentication
  const publicPaths = ['/login', '/register'];

  // Public paths check helper
  const isPublicPath = (path: string | null) => {
    if (!path) return false;
    return publicPaths.some(p => path === p || path.startsWith(`${p}/`));
  };

  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    // If user management is disabled, we enforce our custom auth
    if (userManagement !== true && !isLoading && !user && !isPublic) {
      router.push('/login');
    }
  }, [user, isLoading, pathname, router, userManagement, isPublic]);

  // If user management is enabled, wrap the app content with authentication
  if (userManagement === true) {
    return <AuthenticatedWrapper>
      {children}
    </AuthenticatedWrapper>;
  }

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // If not authenticated and not on a public path, don't render content (wait for redirect)
  if (!user && !isPublic) {
    return null;
  }

  // Otherwise render the app content directly
  return children
}
