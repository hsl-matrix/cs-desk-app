import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { centerId, loginId, password, rememberMe } = body;

    console.log('Login API called with:', { centerId, loginId, rememberMe });

    // Validate input
    if (!centerId || !loginId || !password) {
      return NextResponse.json(
        { success: false, message: '필수 입력값이 누락되었습니다.' },
        { status: 400 }
      );
    }

    // Attempt login using the new AuthService with 2-step process
    const response = await AuthService.login({
      centerId,
      loginId,
      password,
      rememberMe
    });

    console.log('Login response:', {
      success: response.success,
      hasToken: !!response.token,
      hasUser: !!response.user
    });

    if (response.success && response.token) {
      // Create response with cookie
      const res = NextResponse.json(response);

      // Set auth cookie
      const cookieOptions: any = {
        name: 'authToken',
        value: response.token,
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/'
      };

      // Only set maxAge if remember me is true (otherwise it's a session cookie)
      if (rememberMe) {
        cookieOptions.maxAge = 30 * 24 * 60 * 60; // 30 days
      } else {
        cookieOptions.maxAge = 24 * 60 * 60; // 1 day for non-remember me
      }

      res.cookies.set(cookieOptions);

      console.log('Setting auth cookie with token:', response.token?.substring(0, 20) + '...');
      return res;
    }

    return NextResponse.json(response, { status: 401 });
  } catch (error) {
    console.error('Login API error:', error);
    return NextResponse.json(
      { success: false, message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}