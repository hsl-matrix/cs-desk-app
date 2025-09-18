import { LoginRequest, LoginResponse, ServerGroup, User } from '@/lib/types/auth';
import { SignJWT } from 'jose';

const GATEWAY_URL = process.env.NEXT_PUBLIC_GATEWAY_URL || 'https://desk.matrixcloud.kr';
const ACCESS_KEY = process.env.NEXT_PUBLIC_ACCESS_KEY || '';
const ACTION_KEY = process.env.NEXT_PUBLIC_ACTION_KEY || '';
const JWT_SECRET = process.env.NEXT_PUBLIC_JWT_SECRET || '9bf39a4b8382e6fe8b5748c578ef21ee8622d9940fa4f87ff11c683ffef492ea';

interface ServerGroupResponse {
  status: number;
  code: string;
  message: string;
  data?: {
    id: number;
    centerId: number;
    centerid: string;
    serverGroup: string;
    subscribe: string;
    serviceOptions: string;
    chatProviders: string;
    license: string;
    licenseCount: number;
    ipccAddr: string;
    ipccDomain: string;
    dashDomain: string;
    ctiDomain: string | null;
    externalCenterid: string;
  };
  remark?: string | null;
}

interface MatrixLoginResponse {
  status: number;
  code: string;
  message: string;
  data?: {
    result: boolean;
    User: {
      id: number;
      centerId: number;
      groupId: number;
      teamId: number;
      userId: number;
      sippeerId: number;
      userid: string;
      name: string;
      email: string;
      role: string;
    };
  };
  remark?: string | null;
}

export class AuthService {
  private static generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get server group information from center ID
   * API: POST https://desk.matrixcloud.kr/matrixGw/center-operations/server-group
   */
  static async getServerGroup(centerId: string): Promise<{
    success: boolean;
    data?: any;
    message?: string;
  }> {
    const normalizedCenterId = centerId.trim();

    try {
      const traceId = this.generateTraceId();
      const endpoint = `${GATEWAY_URL}/matrixGw/center-operations/server-group`;

      console.log('Calling server group API:', endpoint);
      console.log('Center ID:', centerId);
      console.log('Access Key:', ACCESS_KEY ? '***' + ACCESS_KEY.slice(-4) : 'NOT SET');

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'trace-id': traceId,
          'access-key': ACCESS_KEY,
        },
        body: JSON.stringify({
          centerid: normalizedCenterId
        })
      });

      const data: ServerGroupResponse = await response.json();

      console.log('Server group response:', data);

      if (!response.ok || data.code !== 'SUCCESS' || !data.data) {
        return {
          success: false,
          message: data.message || '서버 그룹 조회에 실패했습니다.'
        };
      }

      return {
        success: true,
        data: {
          serverGroup: data.data.serverGroup,
          serverUrl: data.data.dashDomain || data.data.ipccDomain,
          centerName: data.data.centerid,
          centerId: data.data.centerId,
          ipccDomain: data.data.ipccDomain,
          dashDomain: data.data.dashDomain,
          license: data.data.license,
          licenseCount: data.data.licenseCount,
          serviceOptions: data.data.serviceOptions,
          chatProviders: data.data.chatProviders,
          rawData: data.data,
        }
      };
    } catch (error) {
      console.error('Error getting server group:', error);
      return {
        success: false,
        message: '네트워크 오류가 발생했습니다.'
      };
    }
  }

  /**
   * Login with center ID (two-step process)
   * 1. Get server group from center ID
   * 2. Login using the server group's API endpoint
   */
  static async login(credentials: LoginRequest): Promise<LoginResponse> {
    console.log('AuthService.login called with:', {
      centerId: credentials.centerId,
      loginId: credentials.loginId
    });

    try {
      // Step 1: Get server group information
      const serverGroupResponse = await this.getServerGroup(credentials.centerId);

      if (!serverGroupResponse.success || !serverGroupResponse.data) {
        return {
          success: false,
          message: serverGroupResponse.message || '서버 그룹 조회에 실패했습니다.'
        };
      }

      const { serverGroup, serverUrl, centerName } = serverGroupResponse.data;
      console.log('Server group found:', { serverGroup, serverUrl, centerName });

      // Step 2: Login using the server-specific endpoint
      const isEmail = credentials.loginId.includes('@');
      const traceId = this.generateTraceId();
      const loginEndpoint = `${GATEWAY_URL}/matrixIpcc/${serverGroup}/api/apps/login`;

      console.log('Calling login API:', loginEndpoint);

      const loginResponse = await fetch(loginEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'trace-id': traceId,
          'action-key': ACTION_KEY,
          'client-ip': '127.0.0.1',
        },
        body: JSON.stringify({
          serverGroup,
          centerId: serverGroupResponse.data.centerId || 1,
          userid: !isEmail ? credentials.loginId : null,
          email: isEmail ? credentials.loginId : null,
          password: credentials.password,
          expiresIn: '7d',
          referer: 'cs-app',
        })
      });

      const loginData: MatrixLoginResponse = await loginResponse.json();

      // Get apps-token from response header
      const appsToken = loginResponse.headers.get('apps-token');

      console.log('Login response:', {
        status: loginData.status,
        code: loginData.code,
        hasToken: !!appsToken
      });

      if (!loginResponse.ok || loginData.code !== 'SUCCESS' || !loginData.data?.result) {
        return {
          success: false,
          message: loginData.message || '로그인에 실패했습니다.'
        };
      }

      if (loginData.data && appsToken) {
        const { User: apiUser } = loginData.data;

        // Map API role to application role
        let mappedRole = 'agent';
        if (apiUser.role === 'SYSTEM') {
          mappedRole = 'admin';
        } else if (apiUser.role === 'CENTER') {
          mappedRole = 'center';
        }

        const enrichedUser: User = {
          userId: apiUser.userid,
          userName: apiUser.name,
          centerId: credentials.centerId,
          centerName: centerName,
          email: apiUser.email,
          role: mappedRole,
          permissions: [],
        };

        // Generate our own JWT token
        const secret = new TextEncoder().encode(JWT_SECRET);

        const jwtPayload = {
          id: apiUser.id,
          userId: apiUser.userid,
          userid: apiUser.userid,
          name: apiUser.name,
          email: apiUser.email,
          role: mappedRole,
          centerId: credentials.centerId,
          centerName,
          centerUserid: credentials.centerId,
          serverGroup,
          groupId: apiUser.groupId,
          teamId: apiUser.teamId,
        };

        const ourToken = await new SignJWT(jwtPayload)
          .setProtectedHeader({ alg: 'HS256' })
          .setIssuedAt()
          .setExpirationTime('7d')
          .sign(secret);

        // Store authentication data
        if (typeof window !== 'undefined') {
          localStorage.setItem('serverGroup', serverGroup);
          localStorage.setItem('serverUrl', serverUrl);
          localStorage.setItem('centerId', credentials.centerId.toLowerCase());
          localStorage.setItem('apps-token', appsToken);
          localStorage.setItem('token', ourToken);
          localStorage.setItem('authToken', ourToken);
          localStorage.setItem('user', JSON.stringify(enrichedUser));
        }

        return {
          success: true,
          user: enrichedUser,
          token: ourToken,
          message: '로그인 성공'
        };
      }

      return {
        success: false,
        message: '로그인 토큰을 받지 못했습니다.'
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: '로그인 중 네트워크 오류가 발생했습니다.'
      };
    }
  }

  static async logout(): Promise<void> {
    // Clear any stored tokens or session data
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('serverGroup');
      localStorage.removeItem('serverUrl');
      localStorage.removeItem('centerId');
      localStorage.removeItem('apps-token');
      document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC';
    }
  }

  static async validateToken(token: string): Promise<boolean> {
    try {
      // For JWT tokens, we need to decode and check expiration
      const parts = token.split('.');
      if (parts.length === 3) {
        // It's a JWT token
        const payload = JSON.parse(atob(parts[1]));
        const exp = payload.exp;
        if (exp) {
          // JWT exp is in seconds, convert to milliseconds
          return exp * 1000 > Date.now();
        }
      }
    } catch {
      return false;
    }

    try {
      const url = `${GATEWAY_URL}/api/auth/validate`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'access-key': ACCESS_KEY,
          'action-key': ACTION_KEY,
        },
        body: JSON.stringify({ token })
      });
      const result = await response.json();
      return result.success === true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  }
}