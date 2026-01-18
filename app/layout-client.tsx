"use client"
import "./globals.css";
import { SettingsService } from "@/services/settings-service";
import { DeployDialog } from '@/components/deploy/deploy-dialog';
import { TopNav } from '@/components/top-nav';
import { Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/components/ui/sidebar';
import { useEffect, useState, Suspense } from 'react';
import { Toaster } from 'sonner';
import { FileJson, SquarePlay, SquareTerminal, ImageIcon, History, User, Loader2, Users, FileText } from 'lucide-react';
import Link from 'next/link';
import { ImageComparisonProvider } from "@/components/comparison/image-comparison-provider";
import dynamic from "next/dynamic";
import { TeamSwitch } from "@/components/team-switcher";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const settingsService = new SettingsService();

const validUrls = ["/users/playground", "/apps"];

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
          router.push(`/users/playground?appId=${appId}`);
        } else if (!validUrls.includes(pathname)) {
          router.push("/apps");
        }
      } else {
        if (pathname === "/apps") {
          router.push("/users/editor");
        }
      }
    }
  }, [pathname, router, userManagement, appId]);



  const content = (
    <Suspense>
      <ImageComparisonProvider>
        <div className="flex flex-col h-screen w-full overflow-hidden" style={{ '--top-nav-height': '57px', '--sidebar-width': '12rem' } as React.CSSProperties}>
          
          {/* Conditional TopNav - only show on non-homepage, non-login pages */}
          {pathname !== '/' && pathname !== '/login' && (
            <TopNav />
          )}
          
          {/* Conditional layout based on path */}
          {pathname === '/' || pathname === '/login' ? (
            // For homepage and login page: no sidebar, no TopNav
            <main className="flex-1 overflow-x-auto overflow-y-hidden">
              <PageWrapper>
                {children}
              </PageWrapper>
            </main>
          ) : (
            // For other pages: with sidebar and TopNav
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
          )}
          
        </div>
        <DeployDialog open={deployWindow} setOpen={setDeployWindow} />
        <Toaster />
      </ImageComparisonProvider>
    </Suspense>
  );

  return content;
}

export function AppSidebar() {
  const pathname = usePathname();
  const isPlaygroundRouteEnabled = settingsService.getIsRunningInViewComfy() && settingsService.getIsViewMode();
  const { user, isAdmin } = useAuth();
  const [menuItems, setMenuItems] = useState<Array<{ title: string; url: string; icon: React.ElementType }>>([]);
  const [adminMenuItems, setAdminMenuItems] = useState<Array<{ title: string; url: string; icon: React.ElementType }>>([]);
  
  if (!showSidebar) {
    return <></>
  }
  
  // 使用useEffect在客户端加载时填充菜单内容，避免hydration mismatch
  useEffect(() => {
    const items: Array<{ title: string; url: string; icon: React.ElementType }> = [];
    const adminItems: Array<{ title: string; url: string; icon: React.ElementType }> = [];
    
    // Admin menu items
    if (isAdmin) {
      adminItems.push({
        title: "管理面板",
        url: "/admin",
        icon: User,
      });
      adminItems.push({
        title: "用户管理",
        url: "/admin/users",
        icon: Users,
      });
      adminItems.push({
        title: "生成记录",
        url: "/admin/histories",
        icon: FileText,
      });
    }
    
    // Regular user menu items
    if (settingsService.getIsRunningInViewComfy()) {
      if (settingsService.getIsViewMode()) {
        items.push({
          title: "Apps",
          url: "/apps",
          icon: SquarePlay,
        });
        items.push({
          title: "编辑工作流",
          url: "/users/editor",
          icon: FileJson,
        });
      }
    } else {
      if (!settingsService.getIsViewMode()) {
        items.push({
          title: "编辑工作流",
          url: "/users/editor",
          icon: FileJson,
        });
      }
    }
  
    items.push({
      title: "纹理替换",
      url: isPlaygroundRouteEnabled ? "" : "/users/playground",
      icon: SquareTerminal,
    });
  
    // 添加预设图片管理（仅非 ViewMode 时显示）
    if (!settingsService.getIsViewMode()) {
      items.push({
        title: "预设图片",
        url: "/users/preset-images",
        icon: ImageIcon,
      });
      items.push({
        title: "历史记录",
        url: "/users/history",
        icon: History,
      });
      items.push({
        title: "用户信息",
        url: "/users/profile",
        icon: User,
      });
    }
    
    setMenuItems(items);
    setAdminMenuItems(adminItems);
  }, [isAdmin, isPlaygroundRouteEnabled]);
  
  return (
    <Sidebar className={"mt-2"}>
      <SidebarContent className={`flex flex-col h-full overflow-y-auto border-r bg-background transition-all duration-300`} style={{ width: 'var(--sidebar-width)' }}>
        {/* Admin Menu Section */}
        {adminMenuItems.length > 0 && (
          <SidebarGroup>
            <div className="px-3 py-2 text-xs font-medium text-gray-500">管理功能</div>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminMenuItems.map((item) => (
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
        )}
        
        {/* User Menu Section */}
        {menuItems.length > 0 && (
          <SidebarGroup>
            {adminMenuItems.length > 0 && <div className="px-3 py-2 text-xs font-medium text-gray-500">用户功能</div>}
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => (
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
        )}
      </SidebarContent>
      <SidebarFooter className="border-r bg-background">
      </SidebarFooter>
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
  const publicPaths = ['/', '/login', '/register'];

  // Public paths check helper
  const isPublicPath = (path: string | null) => {
    if (!path) return false;
    return publicPaths.some(p => path === p || path.startsWith(`${p}/`));
  };

  const isPublic = isPublicPath(pathname);

  useEffect(() => {
    // If user management is disabled, we enforce our custom auth
    // Only redirect if the path is not public
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
