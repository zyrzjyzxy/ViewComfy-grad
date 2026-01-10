import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

interface JwtPayload {
  userId: number;
  email: string;
}

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verify(token, JWT_SECRET) as JwtPayload;
    
    if (!decoded.userId) {
      return NextResponse.json({ error: '无效 token 格式' }, { status: 401 });
    }
    
    const histories = await prisma.history.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        textureName: true,
        textureImage: true,
        fashionName: true,
        fashionImage: true,
        fashionType: true,
        prompt: true,
        imagePath: true,
        seed: true,
        createdAt: true,
      },
    });

    return NextResponse.json(histories);
  } catch (error) {
    console.error('Token 验证失败:', error);
    return NextResponse.json({ error: '无效 token' }, { status: 401 });
  }
}

// POST - 创建新的历史记录
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: number };
    const body = await request.json();
    
    const history = await prisma.history.create({
      data: {
        userId: decoded.userId,
        textureName: body.textureName || null,
        textureImage: body.textureImage || null,
        fashionName: body.fashionName || null,
        fashionImage: body.fashionImage || null,
        fashionType: body.fashionType || null,
        prompt: body.prompt || '',
        imagePath: body.imagePath,
        seed: body.seed || null,
      },
    });

    return NextResponse.json(history);
  } catch (error) {
    console.error('创建历史记录失败:', error);
    return NextResponse.json({ error: '创建历史记录失败' }, { status: 500 });
  }
}

// DELETE - 删除历史记录
export async function DELETE(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: number };
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: '缺少记录ID' }, { status: 400 });
    }

    // 确保只能删除自己的记录
    const history = await prisma.history.findFirst({
      where: { id: parseInt(id), userId: decoded.userId },
    });

    if (!history) {
      return NextResponse.json({ error: '记录不存在' }, { status: 404 });
    }

    await prisma.history.delete({
      where: { id: parseInt(id) },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: '删除失败' }, { status: 500 });
  }
}
