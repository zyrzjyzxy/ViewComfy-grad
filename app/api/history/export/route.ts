import prisma from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import JSZip from 'jszip';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';
const COMFY_URL = process.env.COMFY_API_URL || 'http://localhost:8188';

interface JwtPayload {
  userId: number;
  email: string;
}

interface HistoryRecord {
  id: number;
  textureName: string | null;
  textureImage: string | null;
  fashionName: string | null;
  fashionImage: string | null;
  fashionType: string | null;
  prompt: string;
  imagePath: string;
  seed: number | null;
  createdAt: Date;
}

// 格式化日期用于文件夹命名 (YYYYMMDD_HHmmss)
function formatDateForFolder(date: Date): string {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}_${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

// CSV 导出
async function exportAsCSV(histories: HistoryRecord[]): Promise<string> {
  // UTF-8 BOM for Excel compatibility
  const BOM = '\uFEFF';

  const headers = [
    'ID',
    '创建时间',
    '服装类型',
    '服装名称',
    '纹理名称',
    'Seed',
    'ZIP归档路径'
  ];

  const formatDate = (date: Date) => {
    const d = new Date(date);
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  const rows = histories.map(h => {
    const folderName = `${formatDateForFolder(h.createdAt)}_${h.id}`;
    return [
      h.id,
      formatDate(h.createdAt),
      h.fashionType || '',
      h.fashionName || '',
      h.textureName || '',
      h.seed ?? '',
      `${folderName}/generated.png`
    ];
  });

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\r\n');

  return BOM + csvContent;
}

// 从 ComfyUI 获取图片
async function fetchImage(imagePath: string): Promise<Buffer | null> {
  try {
    const url = imagePath.startsWith('http')
      ? imagePath
      : `${COMFY_URL}${imagePath}`;

    const response = await fetch(url);
    if (!response.ok) {
      console.error(`Failed to fetch image: ${url}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`Error fetching image ${imagePath}:`, error);
    return null;
  }
}

// ZIP 导出
async function exportAsZIP(histories: HistoryRecord[]): Promise<Uint8Array> {
  const zip = new JSZip();

  // 创建 manifest.json (保留作为索引)
  const manifest = histories.map((h) => {
    const folderName = `${formatDateForFolder(h.createdAt)}_${h.id}`;
    return {
      id: h.id,
      folder: folderName,
      createdAt: h.createdAt,
      fashionType: h.fashionType,
      fashionName: h.fashionName,
      textureName: h.textureName,
      seed: h.seed,
      prompt: h.prompt,
      files: {
        generated: `${folderName}/generated.png`,
        fashion: h.fashionImage ? `${folderName}/fashion.png` : null,
        texture: h.textureImage ? `${folderName}/texture.png` : null
      }
    };
  });

  zip.file('manifest.json', JSON.stringify(manifest, null, 2));

  for (let i = 0; i < histories.length; i++) {
    const h = histories[i];
    const folderName = `${formatDateForFolder(h.createdAt)}_${h.id}`;
    const folder = zip.folder(folderName);

    if (folder) {
      // 1. 生成图片
      const generatedData = await fetchImage(h.imagePath);
      if (generatedData) {
        folder.file('generated.png', generatedData);
      }

      // 2. 服装原图
      if (h.fashionImage) {
        const fashionData = await fetchImage(h.fashionImage);
        if (fashionData) {
          folder.file('fashion.png', fashionData);
        }
      }

      // 3. 纹理原图
      if (h.textureImage) {
        const textureData = await fetchImage(h.textureImage);
        if (textureData) {
          folder.file('texture.png', textureData);
        }
      }
    }
  }

  // 生成 ZIP - 使用 uint8array 类型以兼容 NextResponse
  const zipData = await zip.generateAsync({
    type: 'uint8array',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 }
  });

  return zipData;
}

export async function GET(request: NextRequest) {
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

    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'csv';
    const idsParam = searchParams.get('ids');

    // 构建查询条件
    const whereClause: { userId: number; id?: { in: number[] } } = {
      userId: decoded.userId
    };

    // 如果指定了 ids，则只导出选中的记录
    if (idsParam) {
      const ids = idsParam.split(',').map(id => parseInt(id)).filter(id => !isNaN(id));
      if (ids.length > 0) {
        whereClause.id = { in: ids };
      }
    }

    const histories = await prisma.history.findMany({
      where: whereClause,
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

    if (histories.length === 0) {
      return NextResponse.json({ error: '没有可导出的记录' }, { status: 404 });
    }

    if (format === 'zip') {
      const zipBuffer = await exportAsZIP(histories);

      return new NextResponse(zipBuffer as any, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="history_export_${Date.now()}.zip"`,
        },
      });
    } else {
      // 默认 CSV
      const csvContent = await exportAsCSV(histories);

      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="history_export_${Date.now()}.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('导出失败:', error);
    return NextResponse.json({ error: '导出失败' }, { status: 500 });
  }
}
