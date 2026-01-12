import { useFieldArray, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button";
import type { IViewComfyBase, IViewComfyWorkflow } from "@/app/providers/view-comfy-provider";
import { cn } from "@/lib/utils";
import { ViewComfyForm } from "@/components/view-comfy/view-comfy-form";
import { WandSparkles } from "lucide-react";
import "./PlaygroundForm.css";
import { useEffect } from "react";

export default function PlaygroundForm(props: {
    viewComfyJSON: IViewComfyWorkflow, onSubmit: (data: IViewComfyWorkflow) => void, loading: boolean
}) {
    const { viewComfyJSON, onSubmit, loading } = props;

    const defaultValues = {
        title: viewComfyJSON.title,
        description: viewComfyJSON.description,
        textOutputEnabled: viewComfyJSON.textOutputEnabled ?? false,
        viewcomfyEndpoint: viewComfyJSON.viewcomfyEndpoint ?? "",
        showOutputFileName: viewComfyJSON.showOutputFileName ?? false,
        // Ensure arrays are always defined so the form renderer never crashes
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
                textOutputEnabled: viewComfyJSON.textOutputEnabled ?? false,
                viewcomfyEndpoint: viewComfyJSON.viewcomfyEndpoint ?? "",
                showOutputFileName: viewComfyJSON.showOutputFileName ?? false,
                inputs: viewComfyJSON.inputs ?? [],
                advancedInputs: viewComfyJSON.advancedInputs ?? [],
            });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [viewComfyJSON]);


    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            <ViewComfyForm form={form} onSubmit={onSubmit} inputFieldArray={inputFieldArray} advancedFieldArray={advancedFieldArray} isLoading={loading}>
                <Button type="submit" className="w-full" disabled={loading}>
                    生成 <WandSparkles className={cn("size-5 ml-2")} />
                </Button>
            </ViewComfyForm>
        </div>
    )
}

