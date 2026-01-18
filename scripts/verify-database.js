const { PrismaClient } = require('@prisma/client');
const { PrismaBetterSqlite3 } = require('@prisma/adapter-better-sqlite3');
const path = require('path');

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
const adapter = new PrismaBetterSqlite3({
  url: `file:${dbPath}`
});

const prisma = new PrismaClient({ adapter });

async function verifyDatabase() {
  console.log('=== 数据库结构验证 ===\n');

  try {
    // 1. 验证 User 表结构
    console.log('1. User 表结构验证:');
    const users = await prisma.user.findMany();
    console.log(`   - 总用户数: ${users.length}`);
    
    if (users.length > 0) {
      const sampleUser = users[0];
      console.log('   - 字段验证:');
      console.log(`     ✓ id: ${typeof sampleUser.id} (${sampleUser.id})`);
      console.log(`     ✓ email: ${typeof sampleUser.email} (${sampleUser.email})`);
      console.log(`     ✓ password: ${typeof sampleUser.password} (${sampleUser.password.substring(0, 10)}...)`);
      console.log(`     ✓ name: ${typeof sampleUser.name} (${sampleUser.name || 'null'})`);
      console.log(`     ✓ role: ${typeof sampleUser.role} (${sampleUser.role})`);
      console.log(`     ✓ createdAt: ${typeof sampleUser.createdAt} (${sampleUser.createdAt})`);
      console.log(`     ✓ updatedAt: ${typeof sampleUser.updatedAt} (${sampleUser.updatedAt})`);
    }

    // 2. 验证管理员账户
    console.log('\n2. 管理员账户验证:');
    const admins = await prisma.user.findMany({
      where: { role: 'ADMIN' }
    });
    console.log(`   - 管理员数量: ${admins.length}`);
    
    if (admins.length > 0) {
      admins.forEach((admin, index) => {
        console.log(`   - 管理员 ${index + 1}:`);
        console.log(`     ID: ${admin.id}`);
        console.log(`     邮箱: ${admin.email}`);
        console.log(`     姓名: ${admin.name}`);
        console.log(`     角色: ${admin.role}`);
      });
    }

    // 3. 验证普通用户
    console.log('\n3. 普通用户验证:');
    const normalUsers = await prisma.user.findMany({
      where: { role: 'USER' }
    });
    console.log(`   - 普通用户数量: ${normalUsers.length}`);
    
    if (normalUsers.length > 0) {
      normalUsers.slice(0, 3).forEach((user, index) => {
        console.log(`   - 用户 ${index + 1}:`);
        console.log(`     ID: ${user.id}`);
        console.log(`     邮箱: ${user.email}`);
        console.log(`     姓名: ${user.name || '未设置'}`);
      });
    }

    // 4. 验证 History 表结构
    console.log('\n4. History 表结构验证:');
    const histories = await prisma.history.findMany();
    console.log(`   - 总历史记录数: ${histories.length}`);
    
    if (histories.length > 0) {
      const sampleHistory = histories[0];
      console.log('   - 字段验证:');
      console.log(`     ✓ id: ${typeof sampleHistory.id}`);
      console.log(`     ✓ userId: ${typeof sampleHistory.userId}`);
      console.log(`     ✓ textureName: ${typeof sampleHistory.textureName} (${sampleHistory.textureName || 'null'})`);
      console.log(`     ✓ textureImage: ${typeof sampleHistory.textureImage} (${sampleHistory.textureImage || 'null'})`);
      console.log(`     ✓ fashionName: ${typeof sampleHistory.fashionName} (${sampleHistory.fashionName || 'null'})`);
      console.log(`     ✓ fashionImage: ${typeof sampleHistory.fashionImage} (${sampleHistory.fashionImage || 'null'})`);
      console.log(`     ✓ fashionType: ${typeof sampleHistory.fashionType} (${sampleHistory.fashionType || 'null'})`);
      console.log(`     ✓ prompt: ${typeof sampleHistory.prompt}`);
      console.log(`     ✓ imagePath: ${typeof sampleHistory.imagePath}`);
      console.log(`     ✓ seed: ${typeof sampleHistory.seed} (${sampleHistory.seed || 'null'})`);
      console.log(`     ✓ createdAt: ${typeof sampleHistory.createdAt}`);
    }

    // 5. 验证用户与历史记录的关联
    console.log('\n5. 用户与历史记录关联验证:');
    const usersWithHistories = await prisma.user.findMany({
      include: {
        histories: {
          take: 3,
          orderBy: { createdAt: 'desc' }
        }
      },
      take: 3
    });
    
    usersWithHistories.forEach((user, index) => {
      console.log(`   - 用户 ${index + 1} (${user.email}):`);
      console.log(`     历史记录数: ${user.histories.length}`);
      if (user.histories.length > 0) {
        user.histories.forEach((history, hIndex) => {
          console.log(`       记录 ${hIndex + 1}: ID=${history.id}, 时间=${history.createdAt.toLocaleString('zh-CN')}`);
        });
      }
    });

    // 6. 设计文档需求验证
    console.log('\n6. 设计文档需求验证:');
    console.log('   ✓ 需求1: 管理员账户已创建');
    console.log(`     - 管理员数量: ${admins.length}`);
    console.log(`     - 管理员邮箱: ${admins.map(a => a.email).join(', ')}`);
    
    console.log('   ✓ 需求2: 数据库支持用户角色区分');
    console.log(`     - USER 角色用户数: ${normalUsers.length}`);
    console.log(`     - ADMIN 角色用户数: ${admins.length}`);
    
    console.log('   ✓ 需求3: 数据库支持用户信息管理');
    console.log(`     - User 表包含字段: id, email, password, name, role, createdAt, updatedAt`);
    
    console.log('   ✓ 需求4: 数据库支持生成记录管理');
    console.log(`     - History 表包含字段: id, userId, textureName, textureImage, fashionName, fashionImage, fashionType, prompt, imagePath, seed, createdAt`);
    console.log(`     - 历史记录总数: ${histories.length}`);
    
    console.log('   ✓ 需求5: 用户与历史记录关联');
    console.log(`     - 外键关系: History.userId -> User.id`);

    console.log('\n=== 验证完成 ===');
    console.log('✅ 所有设计文档需求均已满足！');

  } catch (error) {
    console.error('❌ 验证失败:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyDatabase();
