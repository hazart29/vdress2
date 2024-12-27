// middleware.ts (di dalam folder pages/api)
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const SECRET_KEY = process.env.JWT_SECRET_KEY!; 
const ALLOWED_ORIGIN = 'http://localhost:3000'; 

export async function middleware(req: NextRequest) {
  // 1. Autentikasi JWT (jika diperlukan untuk GET)
  const token = req.headers.get('authorization')?.split(' ')[1]; 

  if (token) { // Hanya verifikasi jika ada token
    try {
      const decoded = jwt.verify(token, SECRET_KEY);
    } catch (error) {
      return new NextResponse(
        JSON.stringify({ message: 'Invalid token' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
  }

  // 2. Validasi Referer (jika diperlukan untuk GET)
  const referer = req.headers.get('referer');

  if (referer && !referer.startsWith(ALLOWED_ORIGIN)) {
    return new NextResponse(
      JSON.stringify({ message: 'Forbidden' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // 3. Rate Limiting
  const ip = req.ip ?? 'unknown';
  const rateLimiter = new RateLimiterMemory({
    points: 10, 
    duration: 60, 
  });

  const rateLimiterKey = `api_rate_limit_${ip}`;
  try {
    await rateLimiter.consume(rateLimiterKey);
  } catch (error) {
    return new NextResponse(
      JSON.stringify({ message: 'Too many requests' }),
      { status: 429, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return NextResponse.redirect(new URL('/', req.url))
}

export const config = {
  matcher: [
    '/api/:path*', // Untuk method POST, PUT, PATCH, DELETE
    '/((?!api|_next/static|_next/image|.*\\.png$).*)'
  ],
};