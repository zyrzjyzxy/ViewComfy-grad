import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/admin-auth';

export async function GET(request: NextRequest) {
  const verification = await verifyAdminFromRequest(request);
  if (!verification.success) {
    if (verification.error === '未登录') {
      return createUnauthorizedResponse();
    }
    return createForbiddenResponse();
  }

  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const userId = searchParams.get('userId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const fashionType = searchParams.get('fashionType');

    const skip = (page - 1) * limit;

    const where: any = {};

    if (userId) {
      where.userId = parseInt(userId);
    }

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    if (fashionType && fashionType !== 'all') {
      where.fashionType = fashionType;
    }

    if (search) {
      where.OR = [
        { user: { email: { contains: search } } },
        { id: parseInt(search) || undefined },
      ];
    }

    const [histories, total] = await Promise.all([
      prisma.history.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      }),
      prisma.history.count({ where }),
    ]);

    return NextResponse.json({
      histories,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('获取历史记录列表失败:', error);
    return NextResponse.json({ error: '获取历史记录列表失败' }, { status: 500 });
  }
}
