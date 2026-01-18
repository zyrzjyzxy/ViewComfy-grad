import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/admin-auth';

interface RouteContext {
  params: Promise<{ userId: string }>;
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const verification = await verifyAdminFromRequest(request);
  if (!verification.success) {
    if (verification.error === '未登录') {
      return createUnauthorizedResponse();
    }
    return createForbiddenResponse();
  }

  try {
    const { userId } = await context.params;
    const targetUserId = parseInt(userId);

    if (isNaN(targetUserId)) {
      return NextResponse.json({ error: '无效的用户ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      select: {
        id: true,
        email: true,
        _count: {
          select: {
            histories: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    const result = await prisma.history.deleteMany({
      where: {
        userId: targetUserId,
      },
    });

    return NextResponse.json({
      message: '用户历史记录删除成功',
      deletedCount: result.count,
      userId: targetUserId,
      userEmail: user.email,
    });
  } catch (error) {
    console.error('删除用户历史记录失败:', error);
    return NextResponse.json({ error: '删除用户历史记录失败' }, { status: 500 });
  }
}
