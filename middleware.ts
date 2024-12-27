// // middleware.ts (di dalam folder /src/middleware.ts)
// import { NextRequest, NextResponse } from 'next/server';
// import jwt from 'jsonwebtoken';
// import { RateLimiterMemory } from 'rate-limiter-flexible';

// const SECRET_KEY = process.env.JWT_SECRET_KEY!;
// const ALLOWED_ORIGIN = 'http://localhost:3000';
// const ALLOWED_USER_AGENT = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36'; // Ganti dengan user-agent aplikasi Anda

// export async function middleware(req: NextRequest) {
//   console.log('Middleware triggered');
//   // 1. Periksa User-Agent
//   const userAgent = req.headers.get('user-agent');
//   if (!userAgent || !userAgent.includes(ALLOWED_USER_AGENT)) {
//     return new NextResponse(
//       JSON.stringify({ message: 'Forbidden: Unauthorized user agent' }),
//       { status: 403, headers: { 'Content-Type': 'application/json' } }
//     );
//   }

//   // 2. Autentikasi JWT (jika diperlukan untuk GET)
//   const token = req.headers.get('authorization')?.split(' ')[1];
//   if (token) { // Hanya verifikasi jika ada token
//     try {
//       jwt.verify(token, SECRET_KEY);
//     } catch (error) {
//       return new NextResponse(
//         JSON.stringify({ message: 'Invalid token' }),
//         { status: 401, headers: { 'Content-Type': 'application/json' } }
//       );
//     }
//   }

//   // 3. Validasi Referer (jika diperlukan untuk GET)
//   const referer = req.headers.get('referer');
//   if (referer && !referer.startsWith(ALLOWED_ORIGIN)) {
//     return new NextResponse(
//       JSON.stringify({ message: 'Forbidden' }),
//       { status: 403, headers: { 'Content-Type': 'application/json' } }
//     );
//   }

//   // 4. Rate Limiting
//   const ip = req.ip ?? 'unknown';
//   const rateLimiter = new RateLimiterMemory({
//     points: 10,
//     duration: 60,
//   });

//   const rateLimiterKey = `api_rate_limit_${ip}`;
//   try {
//     await rateLimiter.consume(rateLimiterKey);
//   } catch (error) {
//     return new NextResponse(
//       JSON.stringify({ message: 'Too many requests' }),
//       { status: 429, headers: { 'Content-Type': 'application/json' } }
//     );
//   }

//   return NextResponse.next();
// }

// export const config = {
//   matcher: [
//     '/api/:path*', // Untuk method POST, PUT, PATCH, DELETE
//     '/src/:path*', // Untuk method POST, PUT, PATCH, DELETE
//     '/api/auth/signin', // Hanya untuk sign-in
//     '/api/auth/csrf' // Hanya untuk csrf
//   ],
// };


import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
 
// This function can be marked `async` if using `await` inside
export function middleware(request: NextRequest) {
  return NextResponse.redirect(new URL('/home', request.url))
}
 
// See "Matching Paths" below to learn more
export const config = {
  matcher: [
    '/api/:path*',
    'api/shop/:patch*'
  ],
}
