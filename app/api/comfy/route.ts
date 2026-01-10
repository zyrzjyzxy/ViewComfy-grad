import { ComfyUIService } from "@/services/comfyui-service";
import { type NextRequest, NextResponse } from 'next/server';
import { ErrorResponseFactory } from "@/models/errors";
import { IViewComfy } from "@/types/comfy-input";
import prisma from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

export const maxDuration = 180; // 3 minutes
export const dynamic = 'force-dynamic';

const errorResponseFactory = new ErrorResponseFactory();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

// 上传文件信息类型
interface UploadedFileInfo {
    key: string;
    originalName: string;
    uploadedName: string;
}

// 从输入中提取历史记录所需的字段
function extractHistoryFields(
    inputs: { key: string; value: any }[], 
    uploadedFiles: UploadedFileInfo[]
) {
    let textureName: string | null = null;
    let textureImage: string | null = null;
    let fashionName: string | null = null;
    let fashionImage: string | null = null;
    let fashionType: string | null = null;
    let seed: number | null = null;

    console.log('[extractHistoryFields] uploadedFiles:', uploadedFiles);

    // 从 viewComfy.inputs 提取文本值
    for (const input of inputs) {
        const keyLower = input.key.toLowerCase();
        const valueStr = String(input.value);
        
        console.log('[extractHistoryFields] Processing input:', input.key, '=', input.value);
        
        // 提取 seed (匹配 xxx-inputs-seed 格式)
        if (keyLower.includes('seed')) {
            const numValue = Number(input.value);
            if (!isNaN(numValue) && numValue > 0) {
                seed = numValue;
                console.log('[extractHistoryFields] Found seed:', seed);
            }
        }
        
        // 提取服装类型 - 精确匹配 "390-inputs-text" (轻量化) 或类似的服装类型输入
        // key 格式如 "390-inputs-text" 表示需要替换的服装类型
        if (input.key === '390-inputs-text' || input.key === '391-inputs-text') {
            const val = valueStr.trim();
            if (val && val.length < 100) {
                fashionType = val;
                console.log('[extractHistoryFields] Found fashionType from specific key:', fashionType);
            }
        }
    }

    // 使用上传后的实际文件名
    // 轻量化工作流: 187 = 服装, 188 = 纹理
    // 全量工作流: 189 = 服装, 190 = 纹理
    for (const file of uploadedFiles) {
        const { key, originalName, uploadedName } = file;
        
        // 构建 ComfyUI 查看图片的正确 URL - 使用上传后的实际文件名
        const imageUrl = `/view?filename=${encodeURIComponent(uploadedName)}&type=input&subfolder=`;
        
        // 检查是否是纹理图片 (188 或 190 节点)
        const isTexture = key.includes('188') || key.includes('190');
        
        // 检查是否是服装图片 (187 或 189 节点)  
        const isFashion = key.includes('187') || key.includes('189');
        
        if (isTexture && !textureName) {
            textureName = originalName;  // 显示原始文件名
            textureImage = imageUrl;      // 使用上传后的文件名访问
            console.log('[extractHistoryFields] Found texture:', originalName, '->', uploadedName);
        } else if (isFashion && !fashionName) {
            fashionName = originalName;
            fashionImage = imageUrl;
            console.log('[extractHistoryFields] Found fashion:', originalName, '->', uploadedName);
        }
    }
    
    // 如果没有通过 key 匹配到，按顺序分配
    if (uploadedFiles.length >= 1 && !fashionName) {
        const file = uploadedFiles[0];
        fashionName = file.originalName;
        fashionImage = `/view?filename=${encodeURIComponent(file.uploadedName)}&type=input&subfolder=`;
        console.log('[extractHistoryFields] Default first file as fashion:', file.originalName);
    }
    if (uploadedFiles.length >= 2 && !textureName) {
        const file = uploadedFiles[1];
        textureName = file.originalName;
        textureImage = `/view?filename=${encodeURIComponent(file.uploadedName)}&type=input&subfolder=`;
        console.log('[extractHistoryFields] Default second file as texture:', file.originalName);
    }

    console.log('[extractHistoryFields] Final result:', { textureName, textureImage, fashionName, fashionImage, fashionType, seed });
    return { textureName, textureImage, fashionName, fashionImage, fashionType, seed };
}

export async function POST(request: NextRequest) {
    const authHeader = request.headers.get('authorization');
    let userId: number | undefined;

    if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        try {
            const decoded = verify(token, JWT_SECRET) as { userId: number };
            userId = decoded.userId;
        } catch (error) {
            console.warn('Invalid token:', error);
        }
    }

    const formData = await request.formData();
    let workflow = undefined;
    if (formData.get('workflow') && formData.get('workflow') !== 'undefined') {
        workflow = JSON.parse(formData.get('workflow') as string);
    }

    let viewComfy: IViewComfy = {inputs: [], textOutputEnabled: false};
    if (formData.get('viewComfy') && formData.get('viewComfy') !== 'undefined') {
        viewComfy = JSON.parse(formData.get('viewComfy') as string);
    }

    for (const [key, value] of Array.from(formData.entries())) {
        if (key !== 'workflow') {
            if (value instanceof File) {
                console.log(`[ViewComfy API] Receiving file - Key: ${key}, Name: ${value.name}, Size: ${value.size}`);
                viewComfy.inputs.push({ key, value });
            }
        }
    }

    if (!viewComfy) {
        return new NextResponse("viewComfy is required", { status: 400 });
    }

    try {
        const comfyUIService = new ComfyUIService();
        const { stream, outputFiles, uploadedFiles } = await comfyUIService.runWorkflow({ workflow, viewComfy });

        console.log('[Comfy API] outputFiles received:', outputFiles);
        console.log('[Comfy API] outputFiles length:', outputFiles?.length);
        console.log('[Comfy API] uploadedFiles:', uploadedFiles);
        console.log('[Comfy API] userId:', userId);

        // Save history if user is logged in
        if (userId && outputFiles && outputFiles.length > 0) {
             // 找到第一个真正的图片文件对象（有 filename 属性）
             const imageFile = outputFiles.find((f: any) => 
                 typeof f === 'object' && f !== null && f.filename
             ) as any;
             
             console.log('[Comfy API] Found image file:', imageFile);
             
             if (!imageFile) {
                 console.log('[Comfy API] No image file found in outputFiles, skipping history save');
             } else {
                 let imagePath = '';
                 
                 // Handle object structure from ComfyUI API
                 if (typeof imageFile === 'object' && imageFile.filename) {
                     const params = new URLSearchParams({
                         filename: imageFile.filename,
                         subfolder: imageFile.subfolder || '',
                         type: imageFile.type || 'output'
                     });
                     imagePath = `/view?${params.toString()}`;
                 }

                 if (imagePath) {
                     // 提取历史记录字段 - 使用上传后的实际文件名
                     const historyFields = extractHistoryFields(viewComfy.inputs, uploadedFiles || []);
                     
                     console.log('[History] Saving with fields:', {
                         userId,
                         imagePath,
                         ...historyFields
                     });

                     await prisma.history.create({
                         data: {
                             userId,
                             prompt: JSON.stringify(viewComfy.inputs), 
                             imagePath: imagePath,
                             textureName: historyFields.textureName,
                             textureImage: historyFields.textureImage,
                             fashionName: historyFields.fashionName,
                             fashionImage: historyFields.fashionImage,
                             fashionType: historyFields.fashionType,
                             seed: historyFields.seed,
                         }
                     });
                     console.log('[History] Saved successfully');
                 }
             }
        }

        return new NextResponse<ReadableStream<Uint8Array>>(stream, {
            headers: {
                'Content-Type': 'application/octet-stream',
                'Content-Disposition': 'attachment; filename="generated_images.bin"'
            }
        });
        // biome-ignore lint/suspicious/noExplicitAny: <explanation>
    } catch (error: unknown) {
        console.error('[Comfy API] Error:', error);
        const responseError = errorResponseFactory.getErrorResponse(error);

        return NextResponse.json(responseError, {
            status: 500,
        });
    }
}
