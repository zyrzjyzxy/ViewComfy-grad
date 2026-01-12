import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ModeToggle } from "./toggle";
import { IViewComfyState, useViewComfy } from "@/app/providers/view-comfy-provider";
import { useEffect, useState, useCallback } from "react";
import { Skeleton } from "@/components/ui/skeleton"
import Image from "next/image";
import { SignedIn, UserButton } from "@clerk/nextjs";
import { useBoundStore } from "@/stores/bound-store";
import { SettingsService } from "@/services/settings-service";
import { usePathname, useSearchParams, useRouter } from "next/navigation";
import { ITeam } from "@/types/user";
import { AppSwitcherDialog } from "@/components/apps/app-switcher-dialog";
import { useViewComfyApps, useGetTeamByAppId } from "@/hooks/use-data";
import type { IViewComfyApp } from "@/types/viewcomfy-app";
import { TeamSwitch } from "@/components/team-switcher";

const settingsServer = new SettingsService();

const getAppDetails = (params: {
    viewComfyState: IViewComfyState,
    currentTeam?: ITeam,
    pathname: string,
}): {
    title: string;
    img: string;

} => {
    const appDetails = {
        title: "iRetexturing智能纹理替换",
        img: "",
    };

    if (params.currentTeam) {
        let title = params.currentTeam.playgroundLandingName || "";
        if (!params.currentTeam.playgroundLandingName && !params.currentTeam.playgroundLandingLogoUrl) {
            title = "iRetexturing智能纹理替换";
        }
        appDetails.title = title;
        appDetails.img = params.currentTeam.playgroundLandingLogoUrl || "";
    } else {
        appDetails.title = params.viewComfyState.appTitle || "iRetexturing智能纹理替换";
        appDetails.img = params.viewComfyState.appImg || "";
    }

    return appDetails;
}

export function TopNav() {
    const userManagementEnabled = settingsServer.isUserManagementEnabled();
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const appId = searchParams?.get("appId");
    const { viewComfyState } = useViewComfy();
    const { currentTeam } = useBoundStore();
    const appDetails = getAppDetails({
        pathname,
        viewComfyState,
        currentTeam,
    });
    const [appTitle, setAppTitle] = useState(appDetails.title);
    const [appImg, setAppImg] = useState(appDetails.img);

    // App switching - fetch apps when in view mode
    const viewMode = settingsServer.getIsViewMode();
    const { teamId: appTeamId } = useGetTeamByAppId({ appId });
    const effectiveTeamId = currentTeam?.id ?? appTeamId;
    const { viewComfyApps, isLoading: isLoadingApps } = useViewComfyApps({ teamId: effectiveTeamId });

    // Handle app selection - updates URL without full navigation to preserve state
    const handleSelectApp = useCallback((app: IViewComfyApp) => {
        router.push(`/playground?appId=${app.appId}`, { scroll: false });
    }, [router]);

    // Determine if app switcher should be shown
    const showAppSwitcher = viewMode && appId && viewComfyApps && viewComfyApps.length > 1;

    useEffect(() => {

        const appDetails = getAppDetails({
            pathname,
            viewComfyState,
            currentTeam,
        });
        setAppTitle(appDetails.title);
        setAppImg(appDetails.img);

    }, [viewComfyState, pathname, currentTeam]);

    return (
        <nav className="flex items-center justify-between px-4 py-2 bg-background border-b gap-2">
            {/* LEFT: Logo + Title */}
            {!false ? (<div className="flex items-center">
                <ViewComfyIconButton appTitle={appTitle} appImg={appImg} />
                <span className="ml-2 text-lg font-semibold">{appTitle}</span>
            </div>) : (
                <div className="flex items-center gap-2">
                    <Skeleton className="w-[34px] h-[34px]" />
                    <Skeleton className="w-[200px] h-[24px]" />
                </div>
            )}

            {/* CENTER: App Switcher (only when app is selected and multiple apps exist) */}
            {showAppSwitcher && (
                <div className="flex-1 flex justify-center">
                    <AppSwitcherDialog
                        apps={viewComfyApps}
                        currentAppId={appId}
                        isLoading={isLoadingApps}
                        onSelectApp={handleSelectApp}
                    />
                </div>
            )}

            {/* Spacer when no app switcher (to maintain layout) */}
            {!showAppSwitcher && <div className="flex-1" />}


            <div className="flex items-center gap-2">
                {!settingsServer.getIsRunningInViewComfy() && (
                    <div>
                        
                    </div>
                )}
                {userManagementEnabled && (
                    <>
                    <TeamSwitch />
                    <SignedIn>
                        <UserButton />
                    </SignedIn>
                    </>
                )}
                <ModeToggle />
            </div>
        </nav>
    )
}

function ViewComfyIconButton({ appTitle, appImg }: { appTitle?: string, appImg?: string }) {
    const iconParams = {
        href: "https://viewcomfy.com",
        target: "_blank",
        rel: "noopener noreferrer"
    }
    if (settingsServer.getIsRunningInViewComfy()) {
        iconParams.href = "/apps";
        iconParams.rel = "";
        iconParams.target = "";
    }
 
    return (
        <Button variant={appImg ? "ghost" : "outline"} size="icon" aria-label="Home" className="p-0 overflow-hidden" style={{ width: 'auto', maxWidth: '120px', height: appImg ? '48px' : '34px' }}>
            {!appImg ? (
                <Link href={iconParams.href} target={iconParams.target} rel={iconParams.rel} className="flex items-center justify-center w-full h-full">
                    <Image
                        src="/favicon.ico"
                        alt={appTitle || ""}
                        className="object-contain max-h-[49px] w-fit"
                        width={34}
                        height={34}
                    />
                </Link>) : (
                <Link href={iconParams.href} target={iconParams.target} rel={iconParams.rel} className="flex items-center justify-center w-full h-full">
                    <Image
                        src={appImg}
                        alt={appTitle || ""}
                        className="object-contain max-h-[49px] w-fit"
                        width={120}
                        height={34}
                    />
                </Link>
            )}
        </Button>
    )
}

