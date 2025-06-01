import { jwtDecode } from 'jwt-decode';

import { UserRole } from '../../constants/Roles';

export interface DecodedToken {
  id: number;
  email: string;
  role: UserRole;
  name: string;
  exp?: number;
  iat?: number;
}

export const decodeToken = (token: string): DecodedToken | null => {
  if (!token) {
    console.error('No token provided');
    return null;
  }

  try {
    // Log the token for debugging (remove in production)
    console.log('Raw token:', token);
    
    // Basic validation
    if (typeof token !== 'string') {
      console.error('Token must be a string');
      return null;
    }

    // Split and check parts without modifying the token
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format - expected 3 parts, got:', parts.length);
      return null;
    }

    // Log parts for debugging (remove in production)
    console.log('Token parts:', {
      header: parts[0],
      payload: parts[1],
      signature: parts[2]
    });

    try {
      // Try to decode without any sanitization
      const decoded = jwtDecode<DecodedToken>(token);
      
      // Log decoded data for debugging (remove in production)
      console.log('Decoded token:', decoded);      // Verify required fields
      if (!decoded || !decoded.id || !decoded.email || !decoded.role) {
        console.error('Token missing required fields:', decoded);
        return null;
      }

      // Check expiration
      if (decoded.exp && Date.now() >= decoded.exp * 1000) {
        console.error('Token expired at:', new Date(decoded.exp * 1000).toISOString());
        return null;
      }

      // Validate that the role is a valid UserRole enum value
      if (!Object.values(UserRole).includes(decoded.role as UserRole)) {
        console.error('Invalid role value in token:', decoded.role);
        return null;
      }

      return decoded;
    } catch (decodeError) {
      console.error('JWT decode error:', decodeError);
      
      // Try to decode parts individually
      try {
        const header = JSON.parse(atob(parts[0]));
        console.log('Header decoded successfully:', header);
      } catch (e) {
        console.error('Failed to decode header:', e);
      }

      try {
        const payload = JSON.parse(atob(parts[1]));
        console.log('Payload decoded successfully:', payload);
      } catch (e) {
        console.error('Failed to decode payload:', e);
      }

      return null;
    }
  } catch (e) {
    console.error('Top level error:', e);
    return null;
  }
};
