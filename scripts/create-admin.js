const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');
const bcrypt = require('bcrypt');

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
    const hashedPassword = await bcrypt.hash(password, 10);

    const admin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });

    console.log('管理员账户创建成功:', {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: admin.role,
    });
    console.log('登录信息:');
    console.log('  邮箱:', email);
    console.log('  密码:', password);
  } catch (error) {
    if (error.code === 'P2002') {
      console.error('错误: 管理员账户已存在');
    } else {
      console.error('创建管理员账户失败:', error);
    }
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
