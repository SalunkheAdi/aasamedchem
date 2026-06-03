import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "super-secret-key-that-is-at-least-32-chars-long";
const COOKIE_NAME = "session_token";

export interface SessionUser {
  userId: string;
  email: string;
  role: "ADMIN" | "SELLER";
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function signToken(user: SessionUser): string {
  return jwt.sign(
    {
      userId: user.userId,
      email: user.email,
      role: user.role,
      username: user.username,
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}

export function verifyToken(token: string): SessionUser | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    if (
      typeof decoded === "object" &&
      decoded.userId &&
      decoded.email &&
      decoded.role &&
      decoded.username
    ) {
      return {
        userId: decoded.userId,
        email: decoded.email,
        role: decoded.role as "ADMIN" | "SELLER",
        username: decoded.username,
      };
    }
    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Extracts and verifies session token from request cookies.
 * Works inside Next.js App Router API Routes.
 */
export function getSession(cookiesList: { get: (name: string) => { value: string } | undefined }): SessionUser | null {
  const cookie = cookiesList.get(COOKIE_NAME);
  if (!cookie) return null;
  return verifyToken(cookie.value);
}

export { COOKIE_NAME };
