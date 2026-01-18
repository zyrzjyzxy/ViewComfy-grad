import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/admin-auth';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const verification = await verifyAdminFromRequest(request);
  if (!verification.success) {
    if (verification.error === '未登录') {
      return createUnauthorizedResponse();
    }
    return createForbiddenResponse();
  }

  try {
    const { id } = await context.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: '无效的用户ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        histories: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            textureName: true,
            fashionName: true,
            fashionType: true,
            createdAt: true,
          },
        },
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

    return NextResponse.json({
      user: {
        ...user,
        historyCount: user._count.histories,
      },
    });
  } catch (error) {
    console.error('获取用户详情失败:', error);
    return NextResponse.json({ error: '获取用户详情失败' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const verification = await verifyAdminFromRequest(request);
  if (!verification.success) {
    if (verification.error === '未登录') {
      return createUnauthorizedResponse();
    }
    return createForbiddenResponse();
  }

  try {
    const { id } = await context.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: '无效的用户ID' }, { status: 400 });
    }

    const { email, password, name, role } = await request.json();

    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return NextResponse.json({ error: '用户不存在' }, { status: 404 });
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return NextResponse.json({ error: '邮箱已被使用' }, { status: 400 });
      }
    }

    const updateData: any = {};
    if (email) updateData.email = email;
    if (name !== undefined) updateData.name = name;
    if (role) updateData.role = role;

    if (password) {
      const bcrypt = require('bcrypt');
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ message: '用户更新成功', user: updatedUser });
  } catch (error) {
    console.error('更新用户失败:', error);
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 });
  }
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
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return NextResponse.json({ error: '无效的用户ID' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
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

    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: '用户删除成功',
      deletedUser: {
        id: user.id,
        email: user.email,
        historyCount: user._count.histories,
      },
    });
  } catch (error) {
    console.error('删除用户失败:', error);
    return NextResponse.json({ error: '删除用户失败' }, { status: 500 });
  }
}
