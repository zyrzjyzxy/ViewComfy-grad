// app/api/auth/register/route.ts
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { email, password, name } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: '缺少邮箱或密码' }, { status: 400 })
    }

    // 检查用户是否已存在
    const existingUser = await prisma.user.findUnique({ where: { email } })
    if (existingUser) {
      return NextResponse.json({ error: '用户已存在' }, { status: 400 })
    }

    // 加密密码
    const hashedPassword = await bcrypt.hash(password, 10)

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
    })

    return NextResponse.json({ 
      message: '注册成功', 
      user: { 
        id: user.id, 
        email: user.email,
        name: user.name,
        role: user.role
      } 
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '注册失败' }, { status: 500 })
  }
}
