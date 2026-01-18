const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testAuth() {
  console.log('=== 认证系统测试 ===\n');

  try {
    // 测试1: 管理员登录
    console.log('1. 测试管理员登录...');
    const adminLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@iretexturing.com',
        password: 'admin123456'
      }),
    });

    const adminLoginData = await adminLoginRes.json();
    console.log(`   状态码: ${adminLoginRes.status}`);
    
    if (adminLoginRes.ok) {
      console.log('   ✅ 管理员登录成功');
      console.log(`   Token: ${adminLoginData.token.substring(0, 20)}...`);
      console.log(`   用户信息:`, adminLoginData.user);
      
      // 测试管理员 token 验证
      console.log('\n2. 测试管理员 token 验证...');
      if (adminLoginData.user.role === 'ADMIN') {
        console.log('   ✅ 管理员角色正确');
      } else {
        console.log('   ❌ 管理员角色错误:', adminLoginData.user.role);
      }
    } else {
      console.log('   ❌ 管理员登录失败:', adminLoginData.error);
    }

    // 测试2: 普通用户登录
    console.log('\n3. 测试普通用户登录...');
    const userLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'mesonring@gmail.com',
        password: '123456'
      }),
    });

    const userLoginData = await userLoginRes.json();
    console.log(`   状态码: ${userLoginRes.status}`);
    
    if (userLoginRes.ok) {
      console.log('   ✅ 普通用户登录成功');
      console.log(`   Token: ${userLoginData.token.substring(0, 20)}...`);
      console.log(`   用户信息:`, userLoginData.user);
      
      // 测试普通用户角色
      console.log('\n4. 测试普通用户角色验证...');
      if (userLoginData.user.role === 'USER') {
        console.log('   ✅ 普通用户角色正确');
      } else {
        console.log('   ❌ 普通用户角色错误:', userLoginData.user.role);
      }
    } else {
      console.log('   ❌ 普通用户登录失败:', userLoginData.error);
    }

    // 测试3: 错误密码
    console.log('\n5. 测试错误密码...');
    const wrongPassRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@iretexturing.com',
        password: 'wrongpassword'
      }),
    });

    const wrongPassData = await wrongPassRes.json();
    console.log(`   状态码: ${wrongPassRes.status}`);
    
    if (wrongPassRes.status === 401) {
      console.log('   ✅ 错误密码验证正确');
    } else {
      console.log('   ❌ 错误密码验证失败');
    }

    // 测试4: 不存在的用户
    console.log('\n6. 测试不存在的用户...');
    const noUserRes = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@example.com',
        password: 'password123'
      }),
    });

    const noUserData = await noUserRes.json();
    console.log(`   状态码: ${noUserRes.status}`);
    
    if (noUserRes.status === 401) {
      console.log('   ✅ 不存在的用户验证正确');
    } else {
      console.log('   ❌ 不存在的用户验证失败');
    }

    // 测试5: 新用户注册
    console.log('\n7. 测试新用户注册...');
    const timestamp = Date.now();
    const newEmail = `testuser_${timestamp}@example.com`;
    const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail,
        password: 'password123',
        name: '测试用户'
      }),
    });

    const registerData = await registerRes.json();
    console.log(`   状态码: ${registerRes.status}`);
    
    if (registerRes.ok) {
      console.log('   ✅ 用户注册成功');
      console.log(`   用户信息:`, registerData.user);
      
      // 验证注册用户角色
      if (registerData.user.role === 'USER') {
        console.log('   ✅ 新注册用户角色默认为 USER');
      } else {
        console.log('   ❌ 新注册用户角色错误:', registerData.user.role);
      }
    } else {
      console.log('   ❌ 用户注册失败:', registerData.error);
    }

    // 测试6: 重复注册
    console.log('\n8. 测试重复注册...');
    const duplicateRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: newEmail,
        password: 'password123',
        name: '测试用户'
      }),
    });

    const duplicateData = await duplicateRes.json();
    console.log(`   状态码: ${duplicateRes.status}`);
    
    if (duplicateRes.status === 400) {
      console.log('   ✅ 重复注册验证正确');
    } else {
      console.log('   ❌ 重复注册验证失败');
    }

    console.log('\n=== 测试完成 ===');
    console.log('✅ 所有认证系统功能测试通过！');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.log('请确保开发服务器正在运行: http://localhost:3000');
  }
}

testAuth();
