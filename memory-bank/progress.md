预计总开发时间： 7-11 天

1. 阶段一（1-2天） ：数据库迁移和认证系统扩展
2. 阶段二（2-3天） ：后端 API 开发
3. 阶段三（3-4天） ：前端界面开发
4. 阶段四（1-2天） ：测试和优化






# 进度更新

- [x] 实现了数据库迁移和认证系统扩展，包括用户登录、注册、密码重置等功能。
  - ✅ 数据库模型扩展：添加 role 和 updatedAt 字段
  - ✅ 创建初始管理员账户（admin@iretexturing.com / admin123456）
  - ✅ 修改 AuthContext，添加角色字段和 isAdmin 属性
  - ✅ 更新登录 API，返回角色信息
  - ✅ 更新注册 API，支持角色设置
  - ✅ 创建管理员验证函数 lib/admin-auth.ts

- [x] 实现了后端 API 开发，包括用户管理、生成记录管理和统计数据等功能。
  - ✅ 用户管理 API：GET /api/admin/users（获取用户列表，支持搜索和分页）
  - ✅ 用户管理 API：POST /api/admin/users（创建新用户）
  - ✅ 用户管理 API：GET /api/admin/users/[id]（获取用户详情）
  - ✅ 用户管理 API：PUT /api/admin/users/[id]（更新用户信息）
  - ✅ 用户管理 API：DELETE /api/admin/users/[id]（删除用户）
  - ✅ 用户管理 API：POST /api/admin/users/[id]/reset-password（重置用户密码）
  - ✅ 生成记录管理 API：GET /api/admin/histories（获取所有历史记录，支持筛选和分页）
  - ✅ 生成记录管理 API：DELETE /api/admin/histories/[id]（删除指定记录）
  - ✅ 生成记录管理 API：DELETE /api/admin/histories/batch（批量删除记录）
  - ✅ 生成记录管理 API：DELETE /api/admin/histories/user/[userId]（删除用户所有记录）
  - ✅ 统计数据 API：GET /api/admin/stats（获取系统统计数据）

- [x] 实现了前端界面开发，包括登录界面改造、权限保护、管理员仪表板、用户管理、生成记录管理等。
  - ✅ 创建权限保护组件 AdminRouteGuard
  - ✅ 修改登录界面，添加管理员登录选项
  - ✅ 创建管理员仪表板页面 /admin/page.tsx
  - ✅ 创建用户管理页面 /admin/users/page.tsx
  - ✅ 创建生成记录管理页面 /admin/histories/page.tsx
  - ✅ 创建用户详情页面 /admin/users/[id]/page.tsx
  - ✅ 修改侧边栏，添加管理入口



  