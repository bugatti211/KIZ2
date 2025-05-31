import { jwtDecode } from 'jwt-decode';

export interface DecodedToken {
  email: string;
  role?: string;
  exp?: number;
  [key: string]: any;
}

export const decodeToken = (token: string): DecodedToken | null => {
  if (!token) return null;

  try {
    // Validate token format
    if (!token.includes('.') || token.split('.').length !== 3) {
      console.error('Invalid token format');
      return null;
    }

    // Use jwt-decode library to safely decode the token
    const decoded = jwtDecode<DecodedToken>(token);

    // Ensure we have valid data
    if (!decoded || typeof decoded !== 'object') {
      console.error('Invalid token payload format');
      return null;
    }    // Return typed object with decoded values and defaults
    return {
      ...decoded,
      email: decoded.email || '',
      role: decoded.role || '',
      exp: decoded.exp || 0
    };
  } catch (e) {
    console.error('Token decode error:', e);
    return null;
  }
};
