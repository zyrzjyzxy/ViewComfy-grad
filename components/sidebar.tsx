import { SquareTerminal, LifeBuoy, FileJson, Cloud, SquarePlay, ImageIcon, History, Shield, BarChart3, Users, FileText, ChevronDown, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TooltipButton } from "@/components/ui/tooltip-button";
import Link from "next/link";
import { useMediaQuery } from "@/hooks/use-media-query";
import { SettingsService } from "@/services/settings-service";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";

export enum TabValue {
    Playground = 'playground',
    Apps = 'apps',
    Editor = 'editor',
    PresetImages = 'preset-images',
    History = 'history',
    Admin = 'admin'
}

interface SidebarProps {
    currentTab: TabValue;
    onTabChange: (tab: TabValue) => void;
    deployWindow: boolean;
    onDeployWindow: (deployWindow: boolean) => void;
}

const settingsService = new SettingsService();
const { user } = useAuth();
const isSmallScreen = useMediaQuery("(max-width: 1024px)");

const SidebarButton = ({ icon, label, isActive, onClick, isSmallScreen, hasSubmenu, isSubmenuOpen, onToggleSubmenu }: { icon: React.ReactNode, label: string, isActive: boolean, onClick: () => void, isSmallScreen: boolean, hasSubmenu?: boolean, isSubmenuOpen?: boolean, onToggleSubmenu?: () => void }) => {
    if (isSmallScreen) {
        return (
            <TooltipButton
                icon={icon}
                label={label}
                tooltipContent={label}
                className={isActive ? 'bg-muted' : ''}
                onClick={onClick}
            />
        )
    }
    return (
        <div className="w-full">
            <Button
                variant={isActive ? "secondary" : "ghost"}
                className="w-full justify-start"
                onClick={onClick}
            >
                {icon}
                <span className="ml-2 flex-1 text-left">{label}</span>
                {hasSubmenu && (
                    isSubmenuOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
                )}
            </Button>
            {hasSubmenu && isSubmenuOpen && (
                <div className="ml-4 mt-1 space-y-1">
                    <Button
                        variant={isActive && label === '管理后台' ? "secondary" : "ghost"}
                        className="w-full justify-start text-sm h-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = '/admin';
                        }}
                    >
                        <BarChart3 className="h-3.5 w-3.5 mr-2" />
                        统计数据
                    </Button>
                    <Button
                        variant={isActive && label === '管理后台' ? "secondary" : "ghost"}
                        className="w-full justify-start text-sm h-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = '/admin/users';
                        }}
                    >
                        <Users className="h-3.5 w-3.5 mr-2" />
                        用户管理
                    </Button>
                    <Button
                        variant={isActive && label === '管理后台' ? "secondary" : "ghost"}
                        className="w-full justify-start text-sm h-8"
                        onClick={(e) => {
                            e.stopPropagation();
                            window.location.href = '/admin/histories';
                        }}
                    >
                        <FileText className="h-3.5 w-3.5 mr-2" />
                        记录管理
                    </Button>
                </div>
            )}
        </div>
    )
}

export function Sidebar({ currentTab, onTabChange, deployWindow, onDeployWindow }: SidebarProps) {
    const viewMode = process.env.NEXT_PUBLIC_VIEW_MODE === "true";
    const [adminSubmenuOpen, setAdminSubmenuOpen] = useState(false);

    return (
        <aside className={`flex flex-col h-full overflow-y-auto border-r bg-background transition-all duration-300 ${isSmallScreen ? 'w-12' : 'w-48'}`}>
            <nav className="grow space-y-2 p-2">
                {settingsService.getIsViewMode() ? (
                    <>
                        {settingsService.getIsRunningInViewComfy() &&
                            <SidebarButton
                                icon={<SquarePlay className="size-5" />}
                                label="Apps"
                                isActive={currentTab === TabValue.Apps}
                                onClick={() => onTabChange(TabValue.Apps)}
                                isSmallScreen={isSmallScreen}
                            />
                        }
                        <SidebarButton
                            icon={<SquareTerminal className="size-5" />}
                            label="Playground"
                            isActive={currentTab === TabValue.Playground}
                            onClick={() => onTabChange(TabValue.Playground)}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<FileJson className="size-5" />}
                            label="Editor"
                            isActive={currentTab === TabValue.Editor}
                            onClick={() => onTabChange(TabValue.Editor)}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<SquareTerminal className="size-5" />}
                            label="Playground"
                            isActive={currentTab === TabValue.Playground}
                            onClick={() => onTabChange(TabValue.Playground)}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<ImageIcon className="size-5" />}
                            label="预设图片"
                            isActive={currentTab === TabValue.PresetImages}
                            onClick={() => onTabChange(TabValue.PresetImages)}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<History className="size-5" />}
                            label="历史记录"
                            isActive={currentTab === TabValue.History}
                            onClick={() => onTabChange(TabValue.History)}
                            isSmallScreen={isSmallScreen}
                        />
                        {user?.role === 'ADMIN' && (
                            <SidebarButton
                                icon={<Shield className="size-5" />}
                                label="管理后台"
                                isActive={currentTab === TabValue.Admin}
                                onClick={() => {
                                    onTabChange(TabValue.Admin);
                                    setAdminSubmenuOpen(!adminSubmenuOpen);
                                }}
                                isSmallScreen={isSmallScreen}
                                hasSubmenu={true}
                                isSubmenuOpen={adminSubmenuOpen}
                                onToggleSubmenu={() => setAdminSubmenuOpen(!adminSubmenuOpen)}
                            />
                        )}
                    </>
                ) : (
                    <>
                        <SidebarButton
                            icon={<FileJson className="size-5" />}
                            label="Editor"
                            isActive={currentTab === TabValue.Editor}
                            onClick={() => onTabChange(TabValue.Editor)}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<SquareTerminal className="size-5" />}
                            label="Playground"
                            isActive={currentTab === TabValue.Playground}
                            onClick={() => onTabChange(TabValue.Playground)}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<ImageIcon className="size-5" />}
                            label="预设图片"
                            isActive={currentTab === TabValue.PresetImages}
                            onClick={() => onTabChange(TabValue.PresetImages)}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<History className="size-5" />}
                            label="历史记录"
                            isActive={currentTab === TabValue.History}
                            onClick={() => onTabChange(TabValue.History)}
                            isSmallScreen={isSmallScreen}
                        />
                        {user?.role === 'ADMIN' && (
                            <SidebarButton
                                icon={<Shield className="size-5" />}
                                label="管理后台"
                                isActive={currentTab === TabValue.Admin}
                                onClick={() => {
                                    onTabChange(TabValue.Admin);
                                    setAdminSubmenuOpen(!adminSubmenuOpen);
                                }}
                                isSmallScreen={isSmallScreen}
                                hasSubmenu={true}
                                isSubmenuOpen={adminSubmenuOpen}
                                onToggleSubmenu={() => setAdminSubmenuOpen(!adminSubmenuOpen)}
                            />
                        )}
                    </>
                )}
            </nav>
            <nav className="sticky bottom-0 p-2 bg-background border-t">
                <Link href="https://github.com/ViewComfy/ViewComfy" target="_blank" rel="noopener noreferrer">
                    {isSmallScreen ? (
                        <TooltipButton
                            icon={<LifeBuoy className="size-5" />}
                            label="Help"
                            tooltipContent="Help"
                            variant="outline"
                        />
                    ) : (
                        <Button variant="outline" className="w-full justify-start">
                            <LifeBuoy className="size-5 mr-2" />
                            Help
                        </Button>
                    )}
                </Link>
            </nav>
        </aside>
    )
}
