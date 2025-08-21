import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import jwt from 'jsonwebtoken';

interface JwtPayload {
  sub: string;
  [key: string]: any;
}

export async function getAuthenticatedUser(request: NextRequest): Promise<any | null> {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      console.error('JWT_SECRET is not set.');
      return null;
    }

    const decoded = jwt.verify(token, jwtSecret) as JwtPayload;

    if (!decoded || !decoded.sub) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: decoded.sub },
    });

    // Do not return password hash
    if (user) {
      const { password_hash, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }

    return null;

  } catch (error) {
    // Handle specific JWT errors
    if (error instanceof jwt.JsonWebTokenError) {
      console.error('JWT Error:', error.message);
    }
    if (error instanceof jwt.TokenExpiredError) {
      console.error('JWT Token Expired:', error.message);
    }
    
    return null;
  }
}
