import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path  = req.nextUrl.pathname

    // role-based route protection
    if (path.startsWith('/dashboard/hod') && token?.role !== 'hod') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    if (path.startsWith('/dashboard/coordinator') && token?.role !== 'coordinator') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }
    if (path.startsWith('/dashboard/student') && token?.role !== 'student') {
      return NextResponse.redirect(new URL('/unauthorized', req.url))
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized({ token }) {
        return !!token
      }
    }
  }
)

export const config = {
  matcher: ['/dashboard/:path*']
}