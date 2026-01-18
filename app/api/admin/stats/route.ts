import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { verifyAdminFromRequest, createUnauthorizedResponse, createForbiddenResponse } from '@/lib/admin-auth';
import fs from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const verification = await verifyAdminFromRequest(request);
  if (!verification.success) {
    if (verification.error === '未登录') {
      return createUnauthorizedResponse();
    }
    return createForbiddenResponse();
  }

  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalUsers,
      adminCount,
      totalHistories,
      todayNewUsers,
      todayHistories,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.history.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.history.count({
        where: {
          createdAt: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
    ]);

    let storageUsed = 0;
    const publicDir = path.join(process.cwd(), 'public');
    
    try {
      if (fs.existsSync(publicDir)) {
        const calculateDirSize = (dirPath: string): number => {
          let size = 0;
          const files = fs.readdirSync(dirPath);
          
          for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
              size += calculateDirSize(filePath);
            } else if (stats.isFile()) {
              size += stats.size;
            }
          }
          
          return size;
        };

        storageUsed = calculateDirSize(publicDir);
      }
    } catch (error) {
      console.error('计算存储空间失败:', error);
    }

    const storageUsedMB = (storageUsed / (1024 * 1024)).toFixed(2);

    return NextResponse.json({
      stats: {
        totalUsers,
        adminCount,
        totalHistories,
        todayNewUsers,
        todayHistories,
        storageUsed: `${storageUsedMB} MB`,
      },
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return NextResponse.json({ error: '获取统计数据失败' }, { status: 500 });
  }
}
