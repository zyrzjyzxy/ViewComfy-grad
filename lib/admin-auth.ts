import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export interface JwtPayload {
  userId: number;
  email: string;
}

export interface AdminVerificationResult {
  success: boolean;
  user?: {
    id: number;
    email: string;
    name?: string;
    role: string;
  };
  error?: string;
}

export async function verifyAdminToken(token: string): Promise<{ userId: number; email: string }> {
  const decoded = verify(token, JWT_SECRET) as JwtPayload;
  return decoded;
}

export async function verifyAdminFromRequest(request: Request): Promise<AdminVerificationResult> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { success: false, error: '未登录' };
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user) {
      return { success: false, error: '用户不存在' };
    }
    
    if (user.role !== 'ADMIN') {
      return { success: false, error: '无管理员权限' };
    }
    
    return {
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || undefined,
        role: user.role
      }
    };
  } catch (error) {
    console.error('Token 验证失败:', error);
    return { success: false, error: '无效 token' };
  }
}

export function createUnauthorizedResponse(message: string = '未登录') {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' }
  });
}

export function createForbiddenResponse(message: string = '无管理员权限') {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' }
  });
}
