import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import bcrypt from 'bcrypt';
import path from 'path';

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`
});

const prisma = new PrismaClient({ adapter });

async function createAdmin() {
  const email = 'admin@iretexturing.com';
  const password = 'admin123456';
  const name = '系统管理员';

  try {
    console.log('=== 开始创建管理员账户 ===');
    console.log('邮箱:', email);
    console.log('姓名:', name);

    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('密码已加密');

    const admin = await prisma.user.upsert({
      where: { email },
      update: {
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
      create: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });

    console.log('管理员账户创建成功:', admin);
    console.log('用户 ID:', admin.id);
    console.log('用户角色:', admin.role);
  } catch (error) {
    console.error('创建管理员账户失败:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin()
  .then(() => {
    console.log('=== 脚本执行完成 ===');
    process.exit(0);
  })
  .catch((error) => {
    console.error('脚本执行失败:', error);
    process.exit(1);
  });
