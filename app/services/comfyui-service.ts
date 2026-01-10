import path from "node:path";
import { createReadStream } from "node:fs";
import { Readable } from "node:stream";
import type { IComfyInput } from "@/app/interfaces/comfy-input";
import { ComfyWorkflow } from "@/app/models/comfy-workflow";
import fs from "node:fs/promises";
import { ComfyErrorHandler } from "@/app/helpers/comfy-error-handler";
import { ComfyError, ComfyWorkflowError } from "@/app/models/errors";
import { ComfyUIAPIService } from "@/app/services/comfyui-api-service";
import { missingViewComfyFileError, viewComfyFileName } from "@/app/constants";
import { SettingsService } from "@/app/services/settings-service";
import mime from 'mime-types';

const settingsService = new SettingsService();
export class ComfyUIService {
    private comfyErrorHandler: ComfyErrorHandler;
    private comfyUIAPIService: ComfyUIAPIService;
    private clientId: string;

    constructor() {
        this.clientId = crypto.randomUUID();
        this.comfyErrorHandler = new ComfyErrorHandler();
        this.comfyUIAPIService = new ComfyUIAPIService(this.clientId);
    }

    async runWorkflow(args: IComfyInput) {
        let workflow = args.workflow;

        if (!workflow) {
            workflow = await this.getLocalWorkflow();
        }

        const comfyWorkflow = new ComfyWorkflow(workflow);
        await comfyWorkflow.setViewComfy(args.viewComfy.inputs, this.comfyUIAPIService);

        try {

            const promptData = await this.comfyUIAPIService.queuePrompt(workflow);
            const outputFiles = promptData.outputFiles;
            const comfyUIAPIService = this.comfyUIAPIService;
            const getFileFromComfyOutputDirectory = this.getFileFromComfyOutputDirectory;

            if (outputFiles.length === 0) {
                throw new ComfyWorkflowError({
                    message: "No output files found",
                    errors: ['Make sure your workflow contains at least one node that saves an output to the ComfyUI output folder. eg. "Save Image" or "Video Combine" from comfyui-videohelpersuite'],
                });
            }

            const stream = new ReadableStream<Uint8Array>({
                async start(controller) {
                    for (const file of outputFiles) {
                        try {
                            let inputStream: ReadableStream<any> | null = null;
                            let fileName = "";
                            let mimeType = "";

                            if (typeof file === "string") {
                                try {
                                    const dict = JSON.parse(file);
                                    if (typeof dict === "object" && dict?.type === "output") {
                                        fileName = dict?.filename || "";
                                        if (fileName) {
                                            inputStream = await getFileFromComfyOutputDirectory({ fileName });
                                            mimeType = mime.lookup(fileName) || "application/octet-stream";
                                        } else {
                                            throw new Error("Does not have a filename");
                                        }
                                    } else {
                                        throw new Error(`Output has a wrong shape: ${file}`);
                                    }
                                } catch (error) {
                                    console.error(error);
                                    continue;
                                }
                            }
                            else {
                                const response = await comfyUIAPIService.getOutputFiles({ file });
                                inputStream = response.body;
                                fileName = file.filename;
                                mimeType = response.headers.get("content-type") || mime.lookup(fileName) || "application/octet-stream";
                            }
                            
                            if (!inputStream) {
                                console.error("Failed to get input stream for file", fileName);
                                continue;
                            }

                            const mimeInfo = `Content-Type: ${mimeType}\r\n\r\n`;
                            const fileNameInfo = `Content-Disposition: attachment; filename="${fileName}"\r\n\r\n`;
                            controller.enqueue(new TextEncoder().encode(mimeInfo));
                            controller.enqueue(new TextEncoder().encode(fileNameInfo));
                            
                            const reader = inputStream.getReader();
                            while (true) {
                                const { done, value } = await reader.read();
                                if (done) break;
                                if (value) controller.enqueue(value);
                            }

                            controller.enqueue(new TextEncoder().encode("\r\n--BLOB_SEPARATOR--\r\n"));
                        } catch (error) {
                            console.error("Failed to get output file");
                            console.error(error);
                        }
                    }
                    comfyUIAPIService.close();
                    controller.close();
                },
            });
            return { stream, outputFiles };

            // biome-ignore lint/suspicious/noExplicitAny: <explanation>
        } catch (error: unknown) {
            this.comfyUIAPIService.close();
            console.error("Failed to run the workflow");
            console.error({ error });

            if (error instanceof ComfyWorkflowError) {
                throw error;
            }

            const comfyError =
                this.comfyErrorHandler.tryToParseWorkflowError(error);
            if (comfyError) {
                throw comfyError;
            }

            throw new ComfyWorkflowError({
                message: "Error running workflow",
                errors: [
                    "Something went wrong running the workflow, the most common cases are missing nodes and running out of Vram. Make sure that you can run this workflow in your local comfy",
                ],
            });
        }
    }

    private async getLocalWorkflow(): Promise<object> {
        const missingWorkflowError = new ComfyError({
            message: "Failed to launch ComfyUI",
            errors: [missingViewComfyFileError],
        });

        let workflow = undefined;

        try {
            const filePath = path.join(process.cwd(), viewComfyFileName);
            const fileContent = await fs.readFile(filePath, "utf8");
            workflow = JSON.parse(fileContent);
        
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (_error) {
            throw missingWorkflowError;
        }

        if (!workflow) {
            throw missingWorkflowError;
        }

        for (const w of workflow.workflows as { [key: string]: object }[]) {
            for (const key in w) {
                if (key === "workflowApiJSON") {
                    return w[key];
                }
            }
        }

        throw new ComfyWorkflowError({
            message: "Failed to find workflowApiJSON",
            errors: ["Failed to find workflowApiJSON"],
        });
    }

    async getFileFromComfyOutputDirectory({ fileName }: { fileName: string }): Promise<ReadableStream> {
        const filePath = path.join(settingsService.getComfyOutputDirectory(), fileName);
        const nodeStream = createReadStream(filePath);
        return Readable.toWeb(nodeStream) as ReadableStream;
    }

}