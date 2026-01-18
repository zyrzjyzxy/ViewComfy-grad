import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/admin-auth';

interface RouteContext {
  params: Promise<{ id: string }>;
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
    const { id } = await context.params;
    const historyId = parseInt(id);

    if (isNaN(historyId)) {
      return NextResponse.json({ error: '无效的历史记录ID' }, { status: 400 });
    }

    const history = await prisma.history.findUnique({ where: { id: historyId } });
    if (!history) {
      return NextResponse.json({ error: '历史记录不存在' }, { status: 404 });
    }

    await prisma.history.delete({
      where: { id: historyId },
    });

    return NextResponse.json({ message: '历史记录删除成功', deletedId: historyId });
  } catch (error) {
    console.error('删除历史记录失败:', error);
    return NextResponse.json({ error: '删除历史记录失败' }, { status: 500 });
  }
}
