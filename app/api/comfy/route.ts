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
            // We'll save the first output file for now, or you might want to save all
            // The outputFiles here are what ComfyUIService returns.
            // We need to modify ComfyUIService to return outputFiles along with the stream.
            // Assuming ComfyUIService.runWorkflow returns { stream, outputFiles } now.
            
            // Wait, ComfyUIService.runWorkflow currently returns just a stream.
            // We need to modify ComfyUIService.runWorkflow to return the file info as well so we can save it.
            // However, the stream is created asynchronously.
            
            // Let's look at ComfyUIService.runWorkflow again.
            // It gets outputFiles BEFORE creating the stream.
            // So we can return outputFiles from runWorkflow.
            
             const firstFile = outputFiles[0];
             let imagePath = '';
             if (typeof firstFile === 'string') {
                 try {
                     const dict = JSON.parse(firstFile);
                     if (dict?.filename) imagePath = dict.filename;
                 } catch {}
             } else {
                 imagePath = firstFile.name; // Or however we get the name/path
             }

             if (imagePath) {
                 await prisma.history.create({
                     data: {
                         userId,
                         prompt: JSON.stringify(viewComfy.inputs), // Store inputs as prompt for now
                         imagePath: imagePath, // This might need to be a full URL or relative path
                         // seed: ... // If we can extract seed from workflow or inputs
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
