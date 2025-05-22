import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

const authSecret = process.env.NEXTAUTH_SECRET

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request, secret: authSecret })
  const isAuth = !!token
  const { pathname } = request.nextUrl
  const isAdmin = token?.role === 'admin'
  const isAuthPage = pathname === '/sign-in'

  if (!isAuth && !isAuthPage) {
    const signInUrl = new URL('/sign-in', request.url)
    return NextResponse.redirect(signInUrl)
  }

  if (isAuth && isAuthPage) {
    const redirectUrl = isAdmin
      ? new URL('/admin', request.url)
      : new URL('/student', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  if (pathname.startsWith('/admin') && token?.role !== 'admin') {
    const redirectUrl = new URL('/unauthorized', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/student/:path*',
    '/',
    '/sign-in',
  ],
}
