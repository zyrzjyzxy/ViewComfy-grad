// app/api/auth/login/route.ts
import prisma from '@/lib/prisma'
import bcrypt from 'bcrypt'
import { NextResponse } from 'next/server'
import { sign } from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-key'

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json()

    const user = await prisma.user.findUnique({ where: { email } })
    if (!user) {
      return NextResponse.json({ error: '用户不存在' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: '密码错误' }, { status: 401 })
    }

    // 生成 JWT token
    const token = sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' })

    return NextResponse.json({ token, user: { id: user.id, email: user.email, name: user.name } })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: '登录失败' }, { status: 500 })
  }
}
