export interface User {
  userId: string;
  userName: string;
  centerId: string;
  centerName: string;
  email?: string;
  role?: string;
  permissions?: string[];
  token?: string;
}

export interface LoginRequest {
  centerId: string;
  loginId: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

export interface ServerGroup {
  groupId: string;
  groupName: string;
  serverUrl: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface AuthContextType extends AuthState {
  login: (credentials: LoginRequest) => Promise<LoginResponse>;
  logout: () => void;
  checkAuth: () => Promise<boolean>;
}