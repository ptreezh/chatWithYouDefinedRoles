import { jwtDecode } from 'jwt-decode';

const AUTH_TOKEN_KEY = 'authToken';

interface DecodedToken {
  sub: string;
  email: string;
  name: string;
  role: string;
  exp: number;
  [key: string]: any;
}

export const getToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

export const setToken = (token: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_TOKEN_KEY, token);
};

export const removeToken = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_TOKEN_KEY);
};

export const getDecodedToken = (): DecodedToken | null => {
  const token = getToken();
  if (!token) return null;

  try {
    const decoded = jwtDecode<DecodedToken>(token);
    // Check if the token is expired
    if (decoded.exp * 1000 < Date.now()) {
      removeToken();
      return null;
    }
    return decoded;
  } catch (error) {
    console.error('Failed to decode token:', error);
    removeToken(); // Remove invalid token
    return null;
  }
};

export const isAuthenticated = (): boolean => {
  return getDecodedToken() !== null;
};

export const logout = (): void => {
  removeToken();
  // Redirect to login page to clear any session state
  if (typeof window !== 'undefined') {
    window.location.href = '/auth';
  }
};
