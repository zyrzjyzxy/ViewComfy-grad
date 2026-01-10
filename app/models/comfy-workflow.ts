import path from "node:path";
import fs from 'node:fs/promises';
import crypto from 'node:crypto';
import type { IInput } from "@/app/interfaces/input";
import * as constants from "@/app/constants";
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

  public async setViewComfy(viewComfy: IInput[], comfyUIService: ComfyUIAPIService) {
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
            // Upload image to ComfyUI via API and get the filename
            const uploadedFileName = await this.uploadImageToComfy(input.value, comfyUIService);
            console.log(`Uploaded image: ${input.value.name} -> ${uploadedFileName}`);
            obj[pathParts[pathParts.length - 1]] = uploadedFileName;
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

  // Upload image to ComfyUI via API
  private async uploadImageToComfy(file: File, comfyUIService: ComfyUIAPIService): Promise<string> {
    // Generate a unique suffix to prevent overwriting files with the same name (e.g. image.png from clipboard)
    const uniqueSuffix = crypto.randomUUID().split('-')[0];
    const fileName = `${this.getFileNamePrefix()}${uniqueSuffix}_${file.name}`;
    
    const formData = new FormData();
    formData.append('image', file, fileName);
    formData.append('type', 'input');
    formData.append('overwrite', 'true');
    
    const response = await comfyUIService.uploadImageDirect(formData);
    
    // Return the filename that ComfyUI will use
    return response.name;
  }

  private async createFileFromInput(file: File) {
    const fileName = `${this.getFileNamePrefix()}${file.name}`;
    const filePath = path.join(COMFY_INPUTS_DIR, fileName);
    const fileBuffer = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(fileBuffer));
    return filePath;
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
