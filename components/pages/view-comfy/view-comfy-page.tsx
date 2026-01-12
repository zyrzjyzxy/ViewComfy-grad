import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Dropzone } from '@/components/ui/dropzone';
import ViewComfyFormEditor, { type ViewComfyFormEditorRef } from '@/components/pages/view-comfy/view-comfy-form-editor';
import { workflowAPItoViewComfy } from '@/lib/workflow-api-parser';
import { useState, useEffect, useRef } from 'react';
import { ActionType, type IViewComfy, type IViewComfyBase, type IViewComfyJSON, useViewComfy } from '@/app/providers/view-comfy-provider';
import { Label } from '@/components/ui/label';
import { ErrorAlertDialog } from '@/components/ui/error-alert-dialog';
import WorkflowSwitcher from '@/components/workflow-switchter';
import { Input } from '@/components/ui/input';
import WorkflowSelector from '@/components/workflow-selector';
import { FileJson, Loader2 } from 'lucide-react';

class WorkflowJSONError extends Error {
    constructor() {
        super("不支持 Workflow.json 文件，请使用 workflow_api.json");
    }
}



export default function ViewComfyPage() {

    const [file, setFile] = useState<File | null>(null);
    const { viewComfyState, viewComfyStateDispatcher } = useViewComfy();
    const [errorDialog, setErrorDialog] = useState<{ open: boolean, error: Error | undefined }>({ open: false, error: undefined });
    const [appTitle, setAppTitle] = useState<string>(viewComfyState.appTitle || "");
    const [appImg, setAppImg] = useState<string>(viewComfyState.appImg || "");
    const [appImgError, setAppImgError] = useState<string | undefined>(undefined);
    const [workflowSelectorOpen, setWorkflowSelectorOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const formEditorRef = useRef<ViewComfyFormEditorRef>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleOnBlur = (inputBlur: "appTitle" | "appImg") => {
        if (inputBlur === "appTitle") {
            viewComfyStateDispatcher({ type: ActionType.SET_APP_TITLE, payload: appTitle });
        } else if (inputBlur === "appImg") {
            setAppImgError(undefined);
            if (!appImg) {
                viewComfyStateDispatcher({ type: ActionType.SET_APP_IMG, payload: "" });
            } else {
                try {
                    new URL(appImg);
                    viewComfyStateDispatcher({ type: ActionType.SET_APP_IMG, payload: appImg });
                } catch (error) {
                    console.error('Error parsing image URL:', error);
                    setAppImgError("Invalid image URL");
                }
            }
        }
    }

    useEffect(() => {
        setAppTitle(viewComfyState.appTitle || "");
    }, [viewComfyState.appTitle]);

    useEffect(() => {
        setAppImg(viewComfyState.appImg || "");
    }, [viewComfyState.appImg]);


    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const content = e.target?.result as string;
                    const parsed = JSON.parse(content);
                    if (parsed.file_type === "view_comfy") {
                        viewComfyStateDispatcher({
                            type: ActionType.INIT_VIEW_COMFY,
                            payload: parsed as IViewComfyJSON
                        });
                    } else if (parsed.last_node_id) {
                        throw new WorkflowJSONError();
                    }
                    else {
                        viewComfyStateDispatcher({
                            type: ActionType.SET_VIEW_COMFY_DRAFT,
                            payload: { viewComfyJSON: workflowAPItoViewComfy(parsed), workflowApiJSON: parsed, file }
                        });
                    }
                } catch (error) {
                    console.error('Error parsing JSON:', error);
                    setErrorDialog({ open: true, error: error as Error });
                    viewComfyStateDispatcher({
                        type: ActionType.SET_VIEW_COMFY_DRAFT,
                        payload: undefined
                    });
                } finally {
                    setFile(null);
                }
            };
            reader.readAsText(file);
        }
    }, [file, viewComfyStateDispatcher]);


    const getDropZoneText = () => {
        if (viewComfyState.viewComfyDraft?.viewComfyJSON) {
            return <div className="text-muted-foreground text-lg">
                拖拽你的 <b>workflow_api.json</b> 开始
            </div>
        }
        return <div className="text-muted-foreground text-lg">
            拖拽你的 <b>workflow_api.json</b> 或 <b>view_comfy.json</b> 开始
        </div>
    }

    const showDeleteWorkflowButton = () => {
        return viewComfyState.currentViewComfy;
    }

    const deleteViewComfyJSON = () => {
        if (viewComfyState.currentViewComfy) {
            viewComfyStateDispatcher({
                type: ActionType.REMOVE_VIEW_COMFY,
                payload: viewComfyState.currentViewComfy,
            });
        }
    }

    const showDropZone = () => {
        return !viewComfyState.viewComfyDraft
    }

    const getOnSubmit = (data: IViewComfyBase) => {
        if (viewComfyState.currentViewComfy) {
            viewComfyStateDispatcher({
                type: ActionType.UPDATE_VIEW_COMFY,
                payload: {
                    id: viewComfyState.currentViewComfy.viewComfyJSON
                        .id,
                    viewComfy: {
                        viewComfyJSON: {
                            ...data,
                            id: viewComfyState.currentViewComfy
                                .viewComfyJSON.id,
                        },
                        file: viewComfyState.viewComfyDraft?.file,
                        workflowApiJSON:
                            viewComfyState.viewComfyDraft
                                ?.workflowApiJSON,
                    },
                },
            });
        } else {
            if (data.title === "") {
                data.title = `My Awesome Workflow ${viewComfyState.viewComfys.length + 1}`;
            }

            viewComfyStateDispatcher({
                type: ActionType.ADD_VIEW_COMFY,
                payload: { viewComfyJSON: { ...data, id: Math.random().toString(16).slice(2) }, file: viewComfyState.viewComfyDraft?.file, workflowApiJSON: viewComfyState.viewComfyDraft?.workflowApiJSON }
            });
        }
    }

    const handleSelectPredefinedWorkflow = async (workflow: any) => {
        try {
            // 从public文件夹加载预定义工作流
            const response = await fetch(`/${workflow.filePath}`);
            if (!response.ok) {
                throw new Error(`Failed to load workflow: ${workflow.title}`);
            }
            const content = await response.json();
            
            if (content.file_type === "view_comfy") {
                // 直接加载view_comfy.json格式
                if (viewComfyState.viewComfys.length > 0) {
                    viewComfyStateDispatcher({
                        type: ActionType.IMPORT_VIEW_COMFY,
                        payload: content as IViewComfyJSON
                    });
                } else {
                    viewComfyStateDispatcher({
                        type: ActionType.INIT_VIEW_COMFY,
                        payload: content as IViewComfyJSON
                    });
                }
            } else {
                // 转换workflow_api.json格式
                viewComfyStateDispatcher({
                    type: ActionType.SET_VIEW_COMFY_DRAFT,
                    payload: { viewComfyJSON: workflowAPItoViewComfy(content), workflowApiJSON: content }
                });
            }
            setWorkflowSelectorOpen(false);
        } catch (error) {
            console.error('Error loading predefined workflow:', error);
            setErrorDialog({ open: true, error: error as Error });
        }
    }

    const onSelectChange = (data: IViewComfy) => {
        return viewComfyStateDispatcher({
            type: ActionType.UPDATE_CURRENT_VIEW_COMFY,
            payload: { ...data }
        });
    }

    const addWorkflowOnClick = () => {
        // First, save the current workflow using the form editor's ref
        if (formEditorRef.current && viewComfyState.viewComfyDraft?.viewComfyJSON) {
            formEditorRef.current.saveCurrentForm();
        }
        
        // Small delay to ensure the save action completes before resetting
        setTimeout(() => {
            // Then reset to allow adding a new workflow
            viewComfyStateDispatcher({
                type: ActionType.RESET_CURRENT_AND_DRAFT_VIEW_COMFY,
                payload: undefined
            });
        }, 100);
    }

    // 服务器端渲染时返回 null，避免 hydration mismatch
    if (!mounted) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">加载中...</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">
            <Header title="编辑工作流" icon={<FileJson className="h-5 w-5" />}>
            </Header>
            <main className="flex-1 overflow-hidden p-2 pb-12">
                {showDropZone() && (
                    <div className="flex flex-col w-full h-full overflow-hidden">
                        <div className="w-full mt-10 sm:w-1/2 sm:h-1/2 mx-auto">
                            <div className="mb-6 flex gap-4 flex-col items-center">
                                <Dropzone
                                    onChange={setFile}
                                    fileExtensions={[".json"]}
                                    className="custom-dropzone w-full h-full"
                                    inputPlaceholder={getDropZoneText()}
                                />
                                <div className="flex items-center gap-4 w-full">
                                    <div className="flex-1 h-px bg-gray-300"></div>
                                    <span className="text-gray-500 text-sm">或</span>
                                    <div className="flex-1 h-px bg-gray-300"></div>
                                </div>
                                <Button 
                                    onClick={() => setWorkflowSelectorOpen(true)}
                                    variant="outline"
                                    className="w-full sm:w-auto"
                                >
                                    选择预定义工作流
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {!showDropZone() && (
                    <>
                        {viewComfyState.viewComfyDraft?.viewComfyJSON && (
                            <div className="flex flex-col w-full h-full overflow-hidden">
                                {(viewComfyState.viewComfys.length > 0 && viewComfyState.currentViewComfy) && (
                                    <div className="w-full flex flex-wrap items-center gap-4 mb-4 pl-1">
                                        <div className="w-1/2 flex">
                                            <div className="w-full flex gap-4">
                                                <div className="grid w-1/2 items-center gap-1.5">
                                                    <Label htmlFor="appTitle">应用标题</Label>
                                                    <Input id="appTitle" placeholder="iRetexturing" value={appTitle} onBlur={() => handleOnBlur("appTitle")} onChange={(e) => setAppTitle(e.target.value)} />
                                                </div>

                                                <div className="grid w-full items-center gap-1.5 pr-4">
                                                    <Label htmlFor="appImg">应用图片 URL</Label>
                                                    <Input id="appImg" placeholder="https://example.com/image.png" value={appImg} onBlur={() => handleOnBlur("appImg")} onChange={(e) => setAppImg(e.target.value)} />
                                                </div>
                                            </div>
                                            {appImgError && (
                                                <p className="text-sm font-medium text-red-500 mt-1">
                                                    {appImgError}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <div className="w-full flex flex-wrap items-center gap-4 mb-4 ml-1">
                                    {(viewComfyState.viewComfys.length > 0 && viewComfyState.currentViewComfy) && (
                                        <div className="flex">
                                            <WorkflowSwitcher viewComfys={viewComfyState.viewComfys} currentViewComfy={viewComfyState.currentViewComfy} onSelectChange={onSelectChange} />
                                        </div>
                                    )}
                                    {showDeleteWorkflowButton() && (
                                        <div className="flex gap-2">
                                            <Button
                                                variant="destructive"
                                                onClick={deleteViewComfyJSON}
                                            >
                                                删除工作流
                                            </Button>
                                            <Button onClick={addWorkflowOnClick}>
                                                添加工作流
                                            </Button>
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1 overflow-hidden">
                                    <ViewComfyFormEditor ref={formEditorRef} onSubmit={getOnSubmit} viewComfyJSON={viewComfyState.viewComfyDraft?.viewComfyJSON} />
                                </div>
                            </div>
                        )}
                    </>
                )}
            </main>
            <ErrorAlertDialog
                open={errorDialog.open}
                errorDescription={getErrorText(errorDialog.error)}
                onClose={() => setErrorDialog({ open: false, error: undefined })} />
            
            <WorkflowSelector
                open={workflowSelectorOpen}
                onClose={() => setWorkflowSelectorOpen(false)}
                onSelect={handleSelectPredefinedWorkflow}
            />
        </div>
    )
}

function getErrorText(error: Error | undefined) {
    if (!error) {
        return <> </>
    }
    if (error instanceof WorkflowJSONError) {
        return <>
            看起来您上传了 workflow.json 而不是 workflow_api.json <br />
            要生成 workflow_api.json，请在 ComfyUI 设置中启用开发者模式选项，并使用“保存（API 格式）”按钮导出。
        </>
    }

    return <> 解析 JSON 时发生错误，最常见的原因是 JSON 无效或为空。 <br /> <b> 错误详情： </b> <br /> {error.message} </>

}
