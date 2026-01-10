import { useEffect, useState, useCallback, useImperativeHandle, forwardRef } from 'react';
import { useViewComfy, type IViewComfyBase } from "@/app/providers/view-comfy-provider";
import { useForm, useFieldArray } from 'react-hook-form';
import { ViewComfyForm } from '@/components/view-comfy/view-comfy-form';
import { toast } from "sonner";
import { buildViewComfyJSON } from '@/lib/utils';

interface ViewComfyFormEditorProps {
    onSubmit: (data: IViewComfyBase) => void;
    viewComfyJSON: IViewComfyBase;
}

export interface ViewComfyFormEditorRef {
    saveCurrentForm: () => void;
}

const ViewComfyFormEditor = forwardRef<ViewComfyFormEditorRef, ViewComfyFormEditorProps>(
    ({ onSubmit, viewComfyJSON }, ref) => {

    const { viewComfyState } = useViewComfy();
    // const [downloadJson, setDownloadJson] = useState<boolean>(false); // Removed
    const [saveToFile, setSaveToFile] = useState<boolean>(false);

    const defaultValues: IViewComfyBase = {
        title: viewComfyJSON.title,
        description: viewComfyJSON.description,
        textOutputEnabled: viewComfyJSON.textOutputEnabled,
        viewcomfyEndpoint: viewComfyJSON.viewcomfyEndpoint,
        showOutputFileName: viewComfyJSON.showOutputFileName,
        previewImages: viewComfyJSON.previewImages ?? [],
        inputs: viewComfyJSON.inputs ?? [],
        advancedInputs: viewComfyJSON.advancedInputs ?? [],
    }

    const form = useForm<IViewComfyBase>({
        defaultValues,
        mode: "onChange",
        reValidateMode: "onChange"
    });

    const inputFieldArray = useFieldArray({
        control: form.control,
        name: "inputs"
    });

    const advancedFieldArray = useFieldArray({
        control: form.control,
        name: "advancedInputs"
    });

    useEffect(() => {
        if (viewComfyJSON) {
            form.reset({
                title: viewComfyJSON.title,
                description: viewComfyJSON.description,
                textOutputEnabled: viewComfyJSON.textOutputEnabled,
                viewcomfyEndpoint: viewComfyJSON.viewcomfyEndpoint,
                showOutputFileName: viewComfyJSON.showOutputFileName,
                previewImages: viewComfyJSON.previewImages ?? [],
                inputs: viewComfyJSON.inputs ?? [],
                advancedInputs: viewComfyJSON.advancedInputs ?? [],
            }, { keepErrors: true });
        }
    }, [viewComfyJSON, form]);


    function submitOnCLick(data: IViewComfyBase) {
        onSubmit(data);
        setSaveToFile(true);
    }

    // Save to project root directory via API
    const saveToProjectRoot = useCallback(async () => {
        if (!saveToFile) return;
        
        try {
            const viewComfyJSON = buildViewComfyJSON({ viewComfyState });
            const response = await fetch('/api/playground/save', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ viewComfyJSON }),
            });

            if (response.ok) {
                toast.success("Saved to project!", {
                    description: "view_comfy.json saved. Go to Playground to run it.",
                    duration: 3000,
                });
            } else {
                const error = await response.json();
                toast.error("Save failed", {
                    description: error.error || "Failed to save file",
                    duration: 5000,
                });
            }
        } catch (error) {
            toast.error("Save failed", {
                description: "Network error while saving",
                duration: 5000,
            });
        } finally {
            setSaveToFile(false);
        }
    }, [saveToFile, viewComfyState]);

    useEffect(() => {
        saveToProjectRoot();
    }, [saveToProjectRoot]);

    // Expose saveCurrentForm method to parent component via ref
    useImperativeHandle(ref, () => ({
        saveCurrentForm: () => {
            const currentFormData = form.getValues();
            onSubmit(currentFormData);
        }
    }));


    function downloadViewComfyJSON(data: IViewComfyBase) {
        // First, update the application state
        onSubmit(data);

        // Then, construct the JSON manually with the *current* data + existing state
        // to avoid waiting for async state updates/re-renders.
        
        let updatedViewComfys = [...viewComfyState.viewComfys];

        if (viewComfyState.currentViewComfy) {
            // Updating existing workflow in the list
            const currentId = viewComfyState.currentViewComfy.viewComfyJSON.id;
            updatedViewComfys = updatedViewComfys.map(vc => {
                if (vc.viewComfyJSON.id === currentId) {
                    // Merge the new data with existing viewComfyJSON, preserving the id
                    return {
                        viewComfyJSON: {
                            ...data,
                            id: currentId  // Ensure we keep the original ID
                        },
                        workflowApiJSON: vc.workflowApiJSON  // Keep the original workflowApiJSON
                    };
                }
                return vc;
            });
        } else {
            // Adding a new workflow from draft
            const newWorkflow = {
                viewComfyJSON: { ...data, id: Math.random().toString(16).slice(2) },
                workflowApiJSON: viewComfyState.viewComfyDraft?.workflowApiJSON
            };
            updatedViewComfys.push(newWorkflow);
        }

        // Create a temporary state to use the utility function
        const tempState = {
            ...viewComfyState,
            viewComfys: updatedViewComfys
        };

        const viewComfyJSONOutput = buildViewComfyJSON({ viewComfyState: tempState });
        const jsonString = JSON.stringify(viewComfyJSONOutput, null, 2);
        
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = 'view_comfy.json';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    }
/*
    // Removed legacy useEffect-based download approach that caused race conditions
    // useEffect(() => { ... }, [downloadJson, viewComfyState]); 
*/
    return (
        <div className="flex flex-col h-full overflow-hidden">
            <ViewComfyForm
                form={form}
                onSubmit={submitOnCLick}
                inputFieldArray={inputFieldArray}
                advancedFieldArray={advancedFieldArray}
                editMode={true}
                downloadViewComfyJSON={downloadViewComfyJSON}
            >
            </ViewComfyForm>
        </div>
    );
});

ViewComfyFormEditor.displayName = 'ViewComfyFormEditor';

export default ViewComfyFormEditor;

export function parseWorkflowApiTypeToInputHtmlType(type: string): HTMLInputElement["type"] {

    switch (type) {
        case "string":
            return "text";
        case "number":
            return "number";
        case "bigint":
            return "number";
        case "boolean":
            return "checkbox";
        case "float":
            return "number";
        case "long-text":
            return "text";
        default:
            return "text";
    }
}

