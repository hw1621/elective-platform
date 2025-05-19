import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function POST(request: Request) {
  try {
    const { email, expectedRole } = await request.json()

    if (!email || !expectedRole) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Missing email or expectedRole parameter',
        },
        { status: 400 }
      )
    }

    if (!['student', 'admin'].includes(expectedRole)) {
      return NextResponse.json(
        {
          success: false,
          data: null,
          message: 'Invalid role',
        },
        { status: 400 }
      )
    }

    let user = null

    if (expectedRole === 'student') {
      user = await prisma.student.findFirst({
        where: { email },
        select: { id: true, email: true, user_name: true }
      })
    } else if (expectedRole === 'admin') {
      user = await prisma.admin.findFirst({
        where: { email },
        select: { id: true, email: true, user_name: true }
      })
    }

    return NextResponse.json({
      success: true,
      data: user,
    })
  } catch (error) {
    console.error('[POST /api/user-exists] Error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: `login error: ${(error as Error).message}`,
      },
      { status: 500 }
    )
  }
}
