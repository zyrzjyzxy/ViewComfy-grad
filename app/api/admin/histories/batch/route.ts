import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/admin-auth';

export async function DELETE(request: NextRequest) {
  const verification = await verifyAdminFromRequest(request);
  if (!verification.success) {
    if (verification.error === '未登录') {
      return createUnauthorizedResponse();
    }
    return createForbiddenResponse();
  }

  try {
    const { ids } = await request.json();

    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: '请提供要删除的历史记录ID列表' }, { status: 400 });
    }

    const validIds = ids.filter(id => !isNaN(parseInt(id)));
    if (validIds.length === 0) {
      return NextResponse.json({ error: '无效的历史记录ID' }, { status: 400 });
    }

    const result = await prisma.history.deleteMany({
      where: {
        id: { in: validIds.map(id => parseInt(id)) },
      },
    });

    return NextResponse.json({
      message: '批量删除成功',
      deletedCount: result.count,
      deletedIds: validIds,
    });
  } catch (error) {
    console.error('批量删除历史记录失败:', error);
    return NextResponse.json({ error: '批量删除历史记录失败' }, { status: 500 });
  }
}
