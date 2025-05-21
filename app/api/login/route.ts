import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'

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

//Get student info
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session) {
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: 'Unauthorized',
      },
      { status: 401 }
    )
  }

  if (!session.user?.email) {
    return NextResponse.json({
      success: false,
      message: 'Email not found in session',
      data: null,
    }, { status: 400 })
  }

  try {
    const student = await prisma.student.findFirst({
      where: {
        email: session.user.email,
      },
      select: {
        id: true,
        email: true,
        user_name: true,
        academic_year_id: true,
        program_id: true,
      }
    })

    if (!student) {
      return NextResponse.json({
        success: false,
        message: 'Student not found',
        data: null,
      })
    } else {
      return NextResponse.json({
        success: true,
        message: 'Student found',
        data: student,
      })
    }
  } catch (error) {
    console.error('[GET /api/user-exists] Error:', error)
    return NextResponse.json(
      {
        success: false,
        data: null,
        message: `Error to fetch student info: ${(error as Error).message}`,
      }, { status: 500 } )
  }
}
