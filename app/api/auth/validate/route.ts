import { NextRequest, NextResponse } from 'next/server';
import { AuthService } from '@/lib/services/authService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '토큰이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    const isValid = await AuthService.validateToken(token);

    return NextResponse.json(
      { success: isValid, valid: isValid },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validate API error:', error);
    return NextResponse.json(
      { success: false, message: '토큰 검증 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('authToken')?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: '인증되지 않았습니다.' },
        { status: 401 }
      );
    }

    const isValid = await AuthService.validateToken(token);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: '유효하지 않은 토큰입니다.' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: true, message: '인증된 사용자입니다.' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Validate GET API error:', error);
    return NextResponse.json(
      { success: false, message: '인증 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}