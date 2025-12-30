import prisma from '@/lib/prisma';
import { NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: number };
    
    const histories = await prisma.history.findMany({
      where: { userId: decoded.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        prompt: true,
        imagePath: true,
        createdAt: true,
      },
    });

    return NextResponse.json(histories);
  } catch {
    return NextResponse.json({ error: '无效 token' }, { status: 401 });
  }
}
