import path from "node:path";
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import type { IInput } from "@/types/input";
import * as constants from "@/config/constants";
import { getComfyUIRandomSeed } from "@/lib/utils";
import { ComfyUIAPIService } from "../services/comfyui-api-service";

const COMFY_INPUTS_DIR = path.join(process.cwd(), "comfy", "inputs");
const COMFY_WORKFLOWS_DIR = path.join(process.cwd(), "comfy", "workflows");

export class ComfyWorkflow {
   
  private workflow: { [key: string]: any };
  private workflowFileName: string;
  private workflowFilePath: string;
  private id: string;

  constructor(workflow: object) {
    this.workflow = workflow;
    this.id = crypto.randomUUID();
    this.workflowFileName = `workflow_${this.id}.json`;
    this.workflowFilePath = path.join(COMFY_WORKFLOWS_DIR, this.workflowFileName);
  }

  // 存储上传后的文件信息
  private uploadedFiles: { key: string; originalName: string; uploadedName: string }[] = [];

  public getUploadedFiles() {
    return this.uploadedFiles;
  }

  public async setViewComfy(viewComfy: IInput[], comfyUIService: ComfyUIAPIService) {
    this.uploadedFiles = []; // 重置
    
    try {
      console.log("=== ViewComfy Inputs ===");
      console.log(JSON.stringify(viewComfy.map(i => ({ key: i.key, value: i.value instanceof File ? `File: ${i.value.name}` : i.value })), null, 2));
      
      for (const input of viewComfy) {
        // Skip inputs with null/undefined values
        if (input.value === null || input.value === undefined) {
          console.log(`Skipping null/undefined input: ${input.key}`);
          continue;
        }
        
        const pathParts = input.key.split("-");
        console.log(`Processing input: ${input.key} -> path: ${JSON.stringify(pathParts)}`);
         
        let obj: any = this.workflow;
        for (let i = 0; i < pathParts.length - 1; i++) {
          if (i === pathParts.length - 1) {
            continue;
          }
          obj = obj[pathParts[i]];
        }
        if (input.value instanceof File) {
          if (pathParts[pathParts.length - 1] === "viewcomfymask") {
            await this.uploadMaskToComfy({
              comfyUIService,
              maskFile: input.value,
              maskKeyParam: input.key,
              viewComfy,
            })
          } else {
            // 使用 ComfyUI 的上传 API 上传图片
            const uploadedFileName = await this.uploadImageToComfy(input.value, comfyUIService);
            console.log(`Uploaded image to ComfyUI: ${input.value.name} -> ${uploadedFileName}`);
            
            // 只传文件名给 workflow，不是完整路径
            obj[pathParts[pathParts.length - 1]] = uploadedFileName;
            
            // 记录上传的文件信息
            this.uploadedFiles.push({
              key: input.key,
              originalName: input.value.name,
              uploadedName: uploadedFileName
            });
            console.log(`[UploadedFiles] Tracked: ${input.key} -> ${uploadedFileName}`);
          }
        } else {
          obj[pathParts[pathParts.length - 1]] = input.value;
        }
      }
      
      console.log("=== Final Workflow (LoadImage nodes) ===");
      for (const key in this.workflow) {
        const node = this.workflow[key];
        if (node.class_type === "LoadImage" || node.class_type === "LoadImageMask") {
          console.log(`Node ${key} (${node.class_type}):`, JSON.stringify(node.inputs, null, 2));
        }
      }
    } catch (error) {
      console.error(error);
    }

    for (const key in this.workflow) {
      const node = this.workflow[key];
      switch (node.class_type) {
        case "SaveImage":
        case "VHS_VideoCombine":
          node.inputs.filename_prefix = this.getFileNamePrefix();
          break;

        default:
          Object.keys(node.inputs).forEach((key) => {
            if (
              constants.SEED_LIKE_INPUT_VALUES.some(str => key.includes(str))
              && node.inputs[key] === Number.MIN_VALUE
            ) {
              const newSeed = this.getNewSeed();
              node.inputs[key] = newSeed;
            }
          });
      }
    }
  }

  public getWorkflow() {
    return this.workflow;
  }

  public getWorkflowFilePath() {
    return this.workflowFilePath;
  }

  public getWorkflowFileName() {
    return this.workflowFileName;
  }

  public getFileNamePrefix() {
    return `${this.id}_`;
  }

  public getNewSeed() {
    return getComfyUIRandomSeed();
  }

  // Upload image to ComfyUI via API - 直接使用原始文件名
  private async uploadImageToComfy(file: File, comfyUIService: ComfyUIAPIService): Promise<string> {
    // 直接使用原始文件名，ComfyUI 会处理重名情况
    const fileName = file.name;
    
    const formData = new FormData();
    formData.append('image', file, fileName);
    formData.append('type', 'input');
    formData.append('overwrite', 'false'); // 不覆盖，让 ComfyUI 自动重命名
    
    const response = await comfyUIService.uploadImageDirect(formData);
    
    console.log(`[uploadImageToComfy] Uploaded: ${file.name} -> ${response.name}`);
    
    // Return the filename that ComfyUI will use
    return response.name;
  }

  private async createFileFromInput(file: File) {
    // 直接使用原始文件名，如果重名则添加数字后缀
    const originalName = file.name;
    const ext = path.extname(originalName);
    const baseName = path.basename(originalName, ext);
    
    let fileName = originalName;
    let filePath = path.join(COMFY_INPUTS_DIR, fileName);
    let counter = 1;
    
    // 检查文件是否存在，如果存在则添加后缀
    while (await this.fileExists(filePath)) {
      fileName = `${baseName}_${counter}${ext}`;
      filePath = path.join(COMFY_INPUTS_DIR, fileName);
      counter++;
    }
    
    console.log(`[createFileFromInput] Saving file: ${originalName} -> ${fileName}`);
    
    const fileBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(fileBuffer));
    return filePath;
  }

  // 检查文件是否存在
  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private async uploadMaskToComfy(params: {
    maskFile: File,
    maskKeyParam: string,
    viewComfy: IInput[],
    comfyUIService: ComfyUIAPIService
  }) {
    const { maskKeyParam, maskFile, viewComfy, comfyUIService } = params;
    const originalFilePath = maskKeyParam.slice(0, "-viewcomfymask".length)
    const originalFilePathKeys = originalFilePath.split("-");
     
    let obj: any = this.workflow;
    for (let i = 0; i < originalFilePathKeys.length - 1; i++) {
      if (i === originalFilePathKeys.length - 1) {
        continue;
      }
      obj = obj[originalFilePathKeys[i]];
    }
    const unmaskedPath = obj[originalFilePathKeys[originalFilePathKeys.length - 1]];
    const unmaskedFilename = unmaskedPath.slice(COMFY_INPUTS_DIR.length + 1);
    let viewComfyInput = undefined;
    for (const input of viewComfy) {
      if (input.key === originalFilePath) {
        viewComfyInput = input;
        break;
      }
    }

    if (!viewComfyInput) {
      throw new Error("Cannot find the original parameter to map to the mask");
    }
    const originalFile = viewComfyInput.value as File;

    const clipspaceMaskFilename = this.getMaskFilename("mask", this.id);

    await comfyUIService.uploadMask({
      maskFileName: clipspaceMaskFilename,
      maskFile,
      originalFileRef: unmaskedFilename
    });

    const clipspacePaintedFilename = this.getMaskFilename("painted", this.id);

    await comfyUIService.uploadImage({
      imageFile: originalFile,
      imageFileName: clipspacePaintedFilename,
      originalFileRef: unmaskedFilename
    });

    const clipspacePaintedMaskFilename = this.getMaskFilename("painted-masked", this.id);
    await comfyUIService.uploadMask({
      maskFileName: clipspacePaintedMaskFilename,
      maskFile,
      originalFileRef: clipspacePaintedFilename
    });

    obj[originalFilePathKeys[originalFilePathKeys.length - 1]] = `clipspace/${clipspacePaintedMaskFilename} [input]`

  }

  private getMaskFilename(filename: string, id: string) {
    return `clipspace-${filename}-${id}.png`
  }
}
