# 管理员功能实现计划

## 1. 项目概述

本文档详细规划 iRetexturing 系统管理员功能的实现方案，包括管理员账户系统、用户管理、生成记录管理等核心功能。

## 2. 现有系统架构分析

### 2.1 数据库模型

当前系统使用 Prisma ORM + SQLite 数据库，包含以下模型：

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // 存储 bcrypt 加密后的密码
  name      String?  // 可选
  createdAt DateTime @default(now())
  histories History[]
}

model History {
  id              Int      @id @default(autoincrement())
  userId          Int
  user            User     @relation(fields: [userId], references: [id])
  textureName     String?
  textureImage    String?
  fashionName     String?
  fashionImage    String?
  fashionType     String?
  prompt          String
  imagePath       String
  seed            Int?
  createdAt       DateTime @default(now())
}
```

### 2.2 认证系统

- 使用 JWT token 进行身份验证
- AuthContext 提供全局认证状态管理
- API 路由：`/api/auth/login`, `/api/auth/register`
- 密码使用 bcrypt 加密（salt rounds: 10）
- JWT token 有效期：7 天

### 2.3 现有 API

- `/api/history` - 获取当前用户历史记录
- `/api/history/export` - 导出历史记录
- `/api/comfy` - ComfyUI 图像生成 API

## 3. 功能需求分析

根据设计文档，管理员功能需要实现：

1. **管理员账户系统**
   - 在登录界面附加管理员登录入口
   - 区分普通用户和管理员身份

2. **用户管理**
   - 查看所有用户的登录信息
   - 增删改用户登录信息和密码
   - 查看用户统计信息

3. **生成记录管理**
   - 查看所有用户的生成记录
   - 删除和管理所有用户的生成记录
   - 批量操作功能

## 4. 实现方案设计

### 4.1 数据库模型扩展

#### 4.1.1 修改 User 模型

```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  password  String   // 存储 bcrypt 加密后的密码
  name      String?  // 可选
  role      Role     @default(USER) // 新增：用户角色
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt // 新增：更新时间
  histories History[]
}

enum Role {
  USER     // 普通用户
  ADMIN    // 管理员
}
```

#### 4.1.2 数据库迁移

创建新的迁移文件，添加 `role` 和 `updatedAt` 字段。

### 4.2 认证系统扩展

#### 4.2.1 修改 AuthContext

```typescript
interface User {
  id: number;
  email: string;
  name?: string;
  role: 'USER' | 'ADMIN'; // 新增角色字段
}

interface AuthContextType {
  user: User | null;
  isAdmin: boolean; // 新增：是否为管理员
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}
```

#### 4.2.2 修改登录 API

更新 `/api/auth/login/route.ts`，在返回的用户信息中包含角色字段。

#### 4.2.3 创建管理员登录验证中间件

创建 `lib/admin-auth.ts`，提供管理员权限验证函数：

```typescript
export function verifyAdminToken(token: string): { userId: number; email: string } {
  const decoded = verify(token, JWT_SECRET) as JwtPayload;
  const user = await prisma.user.findUnique({
    where: { id: decoded.userId }
  });
  
  if (!user || user.role !== 'ADMIN') {
    throw new Error('无管理员权限');
  }
  
  return decoded;
}
```

### 4.3 API 路由设计

#### 4.3.1 用户管理 API

**GET `/api/admin/users`**
- 功能：获取所有用户列表
- 权限：仅管理员
- 参数：
  - `page`: 页码（默认 1）
  - `limit`: 每页数量（默认 20）
  - `search`: 搜索关键词（邮箱或姓名）
- 返回：用户列表及分页信息

**GET `/api/admin/users/[id]`**
- 功能：获取指定用户详情
- 权限：仅管理员
- 返回：用户详细信息及历史记录统计

**POST `/api/admin/users`**
- 功能：创建新用户
- 权限：仅管理员
- 请求体：`{ email, password, name, role }`
- 返回：创建的用户信息

**PUT `/api/admin/users/[id]`**
- 功能：更新用户信息
- 权限：仅管理员
- 请求体：`{ email?, password?, name?, role? }`
- 返回：更新后的用户信息

**DELETE `/api/admin/users/[id]`**
- 功能：删除用户
- 权限：仅管理员
- 级联删除：同时删除用户的所有历史记录
- 返回：删除确认信息

**POST `/api/admin/users/[id]/reset-password`**
- 功能：重置用户密码
- 权限：仅管理员
- 请求体：`{ newPassword }`
- 返回：操作结果

#### 4.3.2 生成记录管理 API

**GET `/api/admin/histories`**
- 功能：获取所有用户的生成记录
- 权限：仅管理员
- 参数：
  - `page`: 页码
  - `limit`: 每页数量
  - `userId`: 筛选特定用户
  - `startDate`: 开始日期
  - `endDate`: 结束日期
- 返回：历史记录列表及分页信息

**DELETE `/api/admin/histories/[id]`**
- 功能：删除指定历史记录
- 权限：仅管理员
- 返回：删除确认信息

**DELETE `/api/admin/histories/batch`**
- 功能：批量删除历史记录
- 权限：仅管理员
- 请求体：`{ ids: number[] }`
- 返回：删除结果统计

**DELETE `/api/admin/histories/user/[userId]`**
- 功能：删除指定用户的所有历史记录
- 权限：仅管理员
- 返回：删除结果统计

#### 4.3.3 统计数据 API

**GET `/api/admin/stats`**
- 功能：获取系统统计数据
- 权限：仅管理员
- 返回：
  - 用户总数
  - 管理员数量
  - 历史记录总数
  - 今日新增用户数
  - 今日生成记录数
  - 存储空间使用情况

### 4.4 前端界面设计

#### 4.4.1 登录界面改造

在现有登录界面添加管理员登录选项：

```tsx
<div className="flex space-x-4 mb-4">
  <button
    className={`flex-1 py-2 px-4 rounded-lg ${!isAdminMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
    onClick={() => setIsAdminMode(false)}
  >
    用户登录
  </button>
  <button
    className={`flex-1 py-2 px-4 rounded-lg ${isAdminMode ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}
    onClick={() => setIsAdminMode(true)}
  >
    管理员登录
  </button>
</div>
```

#### 4.4.2 管理员仪表板页面

创建 `/app/admin/page.tsx`，包含：

1. **统计卡片区域**
   - 用户总数
   - 历史记录总数
   - 今日活跃用户
   - 存储使用情况

2. **导航菜单**
   - 用户管理
   - 生成记录管理
   - 系统设置

3. **快速操作**
   - 添加新用户
   - 查看最近记录
   - 系统日志

#### 4.4.3 用户管理页面

创建 `/app/admin/users/page.tsx`，包含：

1. **用户列表表格**
   - ID
   - 邮箱
   - 姓名
   - 角色
   - 创建时间
   - 操作按钮（编辑、删除、重置密码）

2. **搜索和筛选**
   - 邮箱/姓名搜索
   - 角色筛选
   - 日期范围筛选

3. **分页控制**

4. **用户详情弹窗**
   - 显示用户基本信息
   - 历史记录统计
   - 最近活动

#### 4.4.4 生成记录管理页面

创建 `/app/admin/histories/page.tsx`，包含：

1. **记录列表表格**
   - ID
   - 用户邮箱
   - 纹理名称
   - 服装名称
   - 服装类型
   - 生成时间
   - 操作按钮（查看、删除）

2. **筛选功能**
   - 用户筛选
   - 日期范围筛选
   - 服装类型筛选

3. **批量操作**
   - 批量删除
   - 批量导出

4. **图片预览**

#### 4.4.5 用户详情页面

创建 `/app/admin/users/[id]/page.tsx`，包含：

1. **用户基本信息**
2. **历史记录列表**
3. **操作按钮**
   - 编辑用户信息
   - 重置密码
   - 删除用户

### 4.5 权限控制

#### 4.5.1 路由保护

创建 `components/admin/AdminRouteGuard.tsx`：

```tsx
'use client';

import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminRouteGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push('/login');
      } else if (user.role !== 'ADMIN') {
        router.push('/editor');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <div>加载中...</div>;
  }

  if (!user || user.role !== 'ADMIN') {
    return null;
  }

  return <>{children}</>;
}
```

#### 4.5.2 API 路由保护

创建 `lib/admin-middleware.ts`：

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { verify } from 'jsonwebtoken';
import prisma from '@/lib/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key';

export async function verifyAdmin(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ error: '未登录' }, { status: 401 });
  }

  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = verify(token, JWT_SECRET) as { userId: number; email: string };
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });
    
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: '无管理员权限' }, { status: 403 });
    }
    
    return { success: true, user, decoded };
  } catch (error) {
    return NextResponse.json({ error: '无效 token' }, { status: 401 });
  }
}
```

### 4.6 侧边栏导航扩展

修改侧边栏，为管理员添加管理入口：

```tsx
{user?.role === 'ADMIN' && (
  <>
    <div className="px-3 py-2 text-xs font-semibold text-gray-500">
      管理功能
    </div>
    <SidebarItem
      href="/admin"
      icon={Shield}
      label="管理后台"
    />
  </>
)}
```

## 5. 实施步骤

### 阶段一：数据库和认证系统（1-2天）

1. **数据库迁移**
   - [ ] 修改 `prisma/schema.prisma`，添加 `role` 和 `updatedAt` 字段
   - [ ] 运行 `npx prisma migrate dev --name add_admin_role`
   - [ ] 创建初始管理员账户（通过数据库脚本）

2. **认证系统扩展**
   - [ ] 修改 `context/AuthContext.tsx`，添加角色字段和 `isAdmin` 属性
   - [ ] 更新 `app/api/auth/login/route.ts`，返回角色信息
   - [ ] 创建 `lib/admin-auth.ts`，提供管理员验证函数

3. **测试认证**
   - [ ] 测试管理员登录
   - [ ] 测试普通用户登录
   - [ ] 测试角色权限验证

### 阶段二：后端 API 开发（2-3天）

1. **用户管理 API**
   - [ ] 创建 `app/api/admin/users/route.ts`（GET, POST）
   - [ ] 创建 `app/api/admin/users/[id]/route.ts`（GET, PUT, DELETE）
   - [ ] 创建 `app/api/admin/users/[id]/reset-password/route.ts`（POST）

2. **生成记录管理 API**
   - [ ] 创建 `app/api/admin/histories/route.ts`（GET）
   - [ ] 创建 `app/api/admin/histories/[id]/route.ts`（DELETE）
   - [ ] 创建 `app/api/admin/histories/batch/route.ts`（DELETE）
   - [ ] 创建 `app/api/admin/histories/user/[userId]/route.ts`（DELETE）

3. **统计数据 API**
   - [ ] 创建 `app/api/admin/stats/route.ts`（GET）

4. **API 测试**
   - [ ] 使用 Postman 或类似工具测试所有 API
   - [ ] 测试权限验证
   - [ ] 测试错误处理

### 阶段三：前端界面开发（3-4天）

1. **登录界面改造**
   - [ ] 修改 `app/login/[[...login]]/page.tsx`，添加管理员登录选项
   - [ ] 添加管理员登录样式

2. **权限保护组件**
   - [ ] 创建 `components/admin/AdminRouteGuard.tsx`
   - [ ] 创建 `lib/admin-middleware.ts`

3. **管理员仪表板**
   - [ ] 创建 `app/admin/page.tsx`
   - [ ] 创建统计卡片组件
   - [ ] 创建导航菜单组件

4. **用户管理界面**
   - [ ] 创建 `app/admin/users/page.tsx`
   - [ ] 创建用户列表表格
   - [ ] 创建搜索和筛选功能
   - [ ] 创建用户详情弹窗
   - [ ] 创建编辑用户弹窗
   - [ ] 创建重置密码弹窗

5. **生成记录管理界面**
   - [ ] 创建 `app/admin/histories/page.tsx`
   - [ ] 创建记录列表表格
   - [ ] 创建筛选功能
   - [ ] 创建批量操作功能
   - [ ] 创建图片预览组件

6. **用户详情页面**
   - [ ] 创建 `app/admin/users/[id]/page.tsx`
   - [ ] 显示用户信息
   - [ ] 显示历史记录

7. **侧边栏扩展**
   - [ ] 修改侧边栏组件，添加管理入口

### 阶段四：测试和优化（1-2天）

1. **功能测试**
   - [ ] 测试所有管理员功能
   - [ ] 测试权限控制
   - [ ] 测试边界情况

2. **UI/UX 优化**
   - [ ] 优化响应式设计
   - [ ] 添加加载状态
   - [ ] 添加错误提示
   - [ ] 添加确认对话框

3. **性能优化**
   - [ ] 优化数据库查询
   - [ ] 添加分页
   - [ ] 添加缓存

4. **安全检查**
   - [ ] 检查 SQL 注入风险
   - [ ] 检查 XSS 风险
   - [ ] 检查 CSRF 风险
   - [ ] 检查敏感信息泄露

## 6. 技术细节

### 6.1 数据库初始化脚本

创建 `scripts/create-admin.ts`，用于创建初始管理员账户：

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createAdmin() {
  const email = 'admin@iretexturing.com';
  const password = 'admin123456';
  const name = '系统管理员';

  const hashedPassword = await bcrypt.hash(password, 10);

  const admin = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
      role: 'ADMIN',
    },
  });

  console.log('管理员账户创建成功:', admin);
}

createAdmin()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
```

### 6.2 环境变量

在 `.env.local` 中添加：

```env
# JWT 密钥（生产环境必须更改）
JWT_SECRET=your-super-secret-key-change-in-production

# 管理员邮箱（可选，用于验证）
ADMIN_EMAIL=admin@iretexturing.com
```

### 6.3 错误处理

统一错误响应格式：

```typescript
{
  error: string;      // 错误信息
  code?: string;      // 错误代码
  details?: any;      // 详细信息
}
```

常见错误代码：
- `UNAUTHORIZED`: 未登录
- `FORBIDDEN`: 无权限
- `NOT_FOUND`: 资源不存在
- `VALIDATION_ERROR`: 参数验证失败
- `INTERNAL_ERROR`: 服务器内部错误

### 6.4 日志记录

创建 `lib/logger.ts`，记录管理员操作：

```typescript
export async function logAdminAction(
  adminId: number,
  action: string,
  target: string,
  details?: any
) {
  // 记录到数据库或文件
  console.log(`[ADMIN] User ${adminId} performed ${action} on ${target}`, details);
}
```

## 7. 安全考虑

### 7.1 权限验证

- 所有管理员 API 必须验证管理员权限
- 前端路由必须使用 AdminRouteGuard 保护
- 敏感操作（删除、重置密码）需要二次确认

### 7.2 数据验证

- 所有输入数据必须验证
- 邮箱格式验证
- 密码强度验证（至少 8 位，包含字母和数字）
- 角色枚举验证

### 7.3 审计日志

- 记录所有管理员操作
- 记录操作时间、操作人、操作内容
- 便于追溯和审计

### 7.4 密码安全

- 管理员密码必须符合安全要求
- 重置密码时生成临时密码
- 建议管理员定期更换密码

## 8. 未来扩展

### 8.1 功能扩展

1. **系统设置**
   - 系统配置管理
   - 邮件通知设置
   - 存储配额管理

2. **日志管理**
   - 操作日志查看
   - 错误日志查看
   - 日志导出功能

3. **数据分析**
   - 用户行为分析
   - 生成记录统计
   - 存储使用趋势

4. **备份和恢复**
   - 数据库备份
   - 数据恢复
   - 自动备份配置

### 8.2 性能优化

1. **缓存策略**
   - Redis 缓存统计数据
   - 缓存用户列表
   - 缓存历史记录

2. **数据库优化**
   - 添加索引
   - 优化查询
   - 数据库分表

3. **CDN 加速**
   - 图片 CDN
   - 静态资源 CDN

## 9. 风险和挑战

### 9.1 技术风险

1. **数据库迁移风险**
   - 现有数据兼容性
   - 迁移失败回滚方案

2. **权限控制风险**
   - 权限验证遗漏
   - 权限提升漏洞

3. **性能风险**
   - 大量数据查询性能
   - 并发操作性能

### 9.2 缓解措施

1. **测试充分**
   - 单元测试
   - 集成测试
   - 压力测试

2. **代码审查**
   - 代码规范检查
   - 安全审查
   - 性能审查

3. **监控和告警**
   - 系统监控
   - 错误告警
   - 性能监控

## 10. 总结

本实现计划详细规划了 iRetexturing 系统管理员功能的完整实现方案，包括：

1. 数据库模型扩展
2. 认证系统改造
3. 后端 API 开发
4. 前端界面开发
5. 权限控制机制
6. 安全考虑

预计总开发时间：7-11 天

关键成功因素：
- 严格的权限控制
- 完善的错误处理
- 良好的用户体验
- 充分的测试覆盖
- 详细的安全考虑

通过本计划的实施，系统将具备完整的管理员功能，能够有效管理用户和生成记录，为系统运维提供强有力的支持。
