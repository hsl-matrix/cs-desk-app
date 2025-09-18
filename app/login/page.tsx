'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Lock, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function LoginPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    centerId: '',
    loginId: '',
    password: '',
    rememberMe: false
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [serverInfo, setServerInfo] = useState<string | null>(null);

  // Load saved credentials from cookie if "remember me" was checked
  useEffect(() => {
    const cookies = document.cookie.split(';');
    const rememberMeCookie = cookies.find(c => c.trim().startsWith('rememberMe='));

    if (rememberMeCookie) {
      try {
        const value = rememberMeCookie.split('=')[1];
        const data = JSON.parse(decodeURIComponent(value));
        setFormData(prev => ({
          ...prev,
          centerId: data.centerId || '',
          loginId: data.loginId || '',
          rememberMe: true
        }));
      } catch (error) {
        console.error('Failed to parse remember me cookie:', error);
      }
    }
  }, []);

  // Update server info when center ID changes
  useEffect(() => {
    // Remove hardcoded server info since we're using real API
    setServerInfo(null);
  }, [formData.centerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // API 라우트를 통해 로그인 (쿠키 설정을 위해)
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          centerId: formData.centerId,
          loginId: formData.loginId,
          password: formData.password,
          rememberMe: formData.rememberMe
        }),
      });

      const data = await response.json();

      if (data.success) {
        // localStorage에도 저장
        if (data.token && data.user) {
          localStorage.setItem('authToken', data.token);
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        // 로그인 성공 시 바로 페이지 이동
        console.log('Login successful, redirecting to dashboard...');
        window.location.href = '/';
      } else {
        setError(data.message || '로그인에 실패했습니다.');
        setIsLoading(false);
      }
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다.');
      console.error('Login error:', err);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-900 dark:to-slate-800">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <div className="flex size-12 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="size-6" />
            </div>
          </div>
          <CardTitle className="text-2xl text-center">Call Center Desk</CardTitle>
          <CardDescription className="text-center">
            상담 시스템에 로그인하세요
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="centerId">센터 ID</Label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="centerId"
                  type="text"
                  placeholder="예: 1001"
                  value={formData.centerId}
                  onChange={(e) => setFormData({ ...formData, centerId: e.target.value })}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
              {serverInfo && (
                <p className="text-xs text-muted-foreground">{serverInfo}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="loginId">아이디</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="loginId"
                  type="text"
                  placeholder="아이디를 입력하세요"
                  value={formData.loginId}
                  onChange={(e) => setFormData({ ...formData, loginId: e.target.value })}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">비밀번호</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10"
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={formData.rememberMe}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, rememberMe: checked as boolean })
                }
                disabled={isLoading}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal cursor-pointer"
              >
                로그인 정보 저장
              </Label>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  로그인 중...
                </>
              ) : (
                '로그인'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}