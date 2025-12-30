import { ComfyUIService } from '@/app/services/comfyui-service';
import { type NextRequest, NextResponse } from 'next/server';
import { ErrorResponseFactory } from '@/app/models/errors';
import { IViewComfy } from '@/app/interfaces/comfy-input';
import prisma from '@/lib/prisma';
import { verify } from 'jsonwebtoken';

const errorResponseFactory = new ErrorResponseFactory();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

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
                viewComfy.inputs.push({ key, value });
            }
        }
    }

    if (!viewComfy) {
        return new NextResponse("viewComfy is required", { status: 400 });
    }

    try {
        const comfyUIService = new ComfyUIService();
        const { stream, outputFiles } = await comfyUIService.runWorkflow({ workflow, viewComfy });

        // Save history if user is logged in
        if (userId && outputFiles && outputFiles.length > 0) {
             // The outputFiles here are what ComfyUIService returns.
             const firstFile = outputFiles[0] as any;
             let imagePath = '';
             
             // Handle object structure from ComfyUI API
             if (typeof firstFile === 'object' && firstFile.filename) {
                 const params = new URLSearchParams({
                     filename: firstFile.filename,
                     subfolder: firstFile.subfolder || '',
                     type: firstFile.type || 'output'
                 });
                 imagePath = `/view?${params.toString()}`;
             } 
             // Fallback for other structures if any
             else if (typeof firstFile === 'string') {
                 try {
                     const dict = JSON.parse(firstFile);
                     if (dict?.filename) {
                        const params = new URLSearchParams({
                            filename: dict.filename,
                            subfolder: dict.subfolder || '',
                            type: dict.type || 'output'
                        });
                        imagePath = `/view?${params.toString()}`;
                     }
                 } catch {}
             }

             if (imagePath) {
                 await prisma.history.create({
                     data: {
                         userId,
                         prompt: JSON.stringify(viewComfy.inputs), 
                         imagePath: imagePath, 
                     }
                 });
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
        const responseError = errorResponseFactory.getErrorResponse(error);

        return NextResponse.json(responseError, {
            status: 500,
        });
    }
}
