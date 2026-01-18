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
    const isAdmin = user?.role === 'ADMIN';
    
    // 渲染用户功能按钮
    const renderUserFeatures = () => {
        return (
            <>
                <div className="text-xs text-gray-400 mb-2 px-2">用户功能</div>
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
                            onClick={() => {
                                onTabChange(TabValue.Playground);
                                window.location.href = '/users/playground';
                            }}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<FileJson className="size-5" />}
                            label="编辑器工作台"
                            isActive={currentTab === TabValue.Editor}
                            onClick={() => {
                                onTabChange(TabValue.Editor);
                                window.location.href = '/users/editor';
                            }}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<ImageIcon className="size-5" />}
                            label="预设图片"
                            isActive={currentTab === TabValue.PresetImages}
                            onClick={() => {
                                onTabChange(TabValue.PresetImages);
                                window.location.href = '/users/preset-images';
                            }}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<History className="size-5" />}
                            label="历史记录"
                            isActive={currentTab === TabValue.History}
                            onClick={() => {
                                onTabChange(TabValue.History);
                                window.location.href = '/users/history';
                            }}
                            isSmallScreen={isSmallScreen}
                        />
                    </>
                ) : (
                    <>
                        <SidebarButton
                            icon={<FileJson className="size-5" />}
                            label="编辑器工作台"
                            isActive={currentTab === TabValue.Editor}
                            onClick={() => {
                                onTabChange(TabValue.Editor);
                                window.location.href = '/users/editor';
                            }}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<SquareTerminal className="size-5" />}
                            label="Playground"
                            isActive={currentTab === TabValue.Playground}
                            onClick={() => {
                                onTabChange(TabValue.Playground);
                                window.location.href = '/users/playground';
                            }}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<ImageIcon className="size-5" />}
                            label="预设图片"
                            isActive={currentTab === TabValue.PresetImages}
                            onClick={() => {
                                onTabChange(TabValue.PresetImages);
                                window.location.href = '/users/preset-images';
                            }}
                            isSmallScreen={isSmallScreen}
                        />
                        <SidebarButton
                            icon={<History className="size-5" />}
                            label="历史记录"
                            isActive={currentTab === TabValue.History}
                            onClick={() => {
                                onTabChange(TabValue.History);
                                window.location.href = '/users/history';
                            }}
                            isSmallScreen={isSmallScreen}
                        />
                    </>
                )}
            </>
        );
    };

    // 渲染管理员功能按钮
    const renderAdminFeatures = () => {
        return (
            <>
                <div className="text-xs text-gray-400 mb-2 px-2">管理功能</div>
                {/* 用户管理 */}
                <SidebarButton
                    icon={<Users className="size-5" />}
                    label="用户管理"
                    isActive={currentTab === TabValue.Admin}
                    onClick={() => {
                        onTabChange(TabValue.Admin);
                        window.location.href = '/admin/users';
                    }}
                    isSmallScreen={isSmallScreen}
                />
                
                {/* 记录管理 */}
                <SidebarButton
                    icon={<FileText className="size-5" />}
                    label="记录管理"
                    isActive={currentTab === TabValue.Admin}
                    onClick={() => {
                        onTabChange(TabValue.Admin);
                        window.location.href = '/admin/histories';
                    }}
                    isSmallScreen={isSmallScreen}
                />
                
                {/* 统计数据 */}
                <SidebarButton
                    icon={<BarChart3 className="size-5" />}
                    label="统计数据"
                    isActive={currentTab === TabValue.Admin}
                    onClick={() => {
                        onTabChange(TabValue.Admin);
                        window.location.href = '/admin';
                    }}
                    isSmallScreen={isSmallScreen}
                />
                
                {/* 管理员信息 */}
                <SidebarButton
                    icon={<Shield className="size-5" />}
                    label="管理员信息"
                    isActive={currentTab === TabValue.Admin}
                    onClick={() => {
                        onTabChange(TabValue.Admin);
                        window.location.href = '/admin/profile';
                    }}
                    isSmallScreen={isSmallScreen}
                />
            </>
        );
    };

    // 侧边栏内容渲染
    const sidebarContent = (
        <>
            <nav className="grow space-y-2 p-2">
                <div className="flex items-center justify-center py-4">
                    <h1 className={`text-xl font-bold ${isAdmin ? 'text-white' : ''}`}>iRetexturing</h1>
                </div>
                
                {/* 角色标识 */}
                <div className={`text-center py-1 px-2 mb-2 rounded-full text-xs font-medium ${isAdmin ? 'bg-blue-600 text-white' : 'bg-green-600 text-white'}`}>
                    {isAdmin ? '管理员' : '普通用户'}
                </div>
                
                {/* 普通用户只显示用户功能 */}
                {!isAdmin && renderUserFeatures()}
                
                {/* 管理员显示双重功能 */}
                {isAdmin && (
                    <>
                        {renderAdminFeatures()}
                        <div className="border-t border-gray-700 my-2"></div>
                        {renderUserFeatures()}
                    </>
                )}
            </nav>
            <nav className={`sticky bottom-0 p-2 ${isAdmin ? 'bg-gray-800 border-t border-gray-700' : 'bg-background border-t'}`}>
                <Link href="https://github.com/ViewComfy/ViewComfy" target="_blank" rel="noopener noreferrer">
                    {isSmallScreen ? (
                        <TooltipButton
                            icon={<LifeBuoy className="size-5" />}
                            label="Help"
                            tooltipContent="Help"
                            variant="outline"
                            className={isAdmin ? "border-gray-600 text-white hover:bg-gray-700" : ""}
                        />
                    ) : (
                        <Button 
                            variant="outline" 
                            className={`w-full justify-start ${isAdmin ? 'border-gray-600 text-white hover:bg-gray-700' : ''}`}
                        >
                            <LifeBuoy className="size-5 mr-2" />
                            Help
                        </Button>
                    )}
                </Link>
            </nav>
        </>
    );

    // 渲染侧边栏，根据角色应用不同样式
    return (
        <aside className={`flex flex-col h-full overflow-y-auto border-r transition-all duration-300 ${isSmallScreen ? 'w-12' : 'w-48'} ${isAdmin ? 'bg-gray-900 text-white' : 'bg-background text-gray-900'}`}>
            {sidebarContent}
        </aside>
    )
}
