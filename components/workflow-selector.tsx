'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';

export interface IPredefinedWorkflow {
    id: string;
    title: string;
    description: string;
    filePath: string;
}

interface IWorkflowSelectorProps {
    open: boolean;
    onSelect: (workflow: IPredefinedWorkflow) => void;
    onClose: () => void;
}

const PREDEFINED_WORKFLOWS: IPredefinedWorkflow[] = [
    {
        id: 'light-texture',
        title: '工作流1：轻量纹理替换工作流',
        description: '轻量级纹理替换工作流，配置简洁，适合快速测试',
        filePath: 'view_comfy_light.json',
    },
    {
        id: 'full-texture',
        title: '工作流2：全量纹理替换工作流',
        description: '完整功能的纹理替换工作流，包含所有高级选项',
        filePath: 'view_comfy_full.json',
    },
    {
        id: 'test',
        title: '工作流3：运行测试工作流',
        description: '用于测试系统可行性的基础工作流',
        filePath: 'view_comfy_test.json',
    },
];

export default function WorkflowSelector({
    open,
    onSelect,
    onClose,
}: IWorkflowSelectorProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSelectWorkflow = async (workflow: IPredefinedWorkflow) => {
        setLoading(true);
        setError(null);
        try {
            onSelect(workflow);
        } catch (err) {
            setError(err instanceof Error ? err.message : '选择工作流失败');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>选择预定义工作流</DialogTitle>
                    <DialogDescription>
                        选择以下工作流之一开始，或导入自定义工作流
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {PREDEFINED_WORKFLOWS.map((workflow) => (
                        <button
                            key={workflow.id}
                            onClick={() => handleSelectWorkflow(workflow)}
                            disabled={loading}
                            className="text-left p-4 border rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-base mb-1">
                                        {workflow.title}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {workflow.description}
                                    </p>
                                </div>
                                <Badge variant="outline" className="ml-2">
                                    选择
                                </Badge>
                            </div>
                        </button>
                    ))}
                </div>

                {error && (
                    <div className="text-red-600 text-sm p-2 bg-red-50 rounded">
                        {error}
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}

export { PREDEFINED_WORKFLOWS };
