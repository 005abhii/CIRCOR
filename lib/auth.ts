import bcrypt from "bcryptjs";
import { sql } from "./db";

export interface User {
  user_id: number;
  email: string;
  role: string;
  created_at: string;
}

export const VALID_ROLES = [
  "admin",
  "india_admin",
  "france_admin",
  "us_admin",
] as const;
export type ValidRole = (typeof VALID_ROLES)[number];

export function isValidRole(role: string): role is ValidRole {
  return VALID_ROLES.includes(role as ValidRole);
}

export async function createUser(
  email: string,
  password: string,
  role: string
): Promise<User> {
  if (!isValidRole(role)) {
    throw new Error(`Invalid role. Must be one of: ${VALID_ROLES.join(", ")}`);
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 12);

  const result = await sql`
    INSERT INTO users (email, password, role, created_at)
    VALUES (${email}, ${hashedPassword}, ${role}, NOW())
    RETURNING user_id, email, role, created_at
  `;

  return result[0] as User;
}

export async function verifyUser(
  email: string,
  password: string
): Promise<User | null> {
  const result = await sql`
    SELECT user_id, email, password, role, created_at
    FROM users
    WHERE email = ${email}
  `;

  if (result.length === 0) {
    return null;
  }

  const user = result[0];

  // Verify password
  const isValid = await bcrypt.compare(password, user.password);

  if (!isValid) {
    return null;
  }

  // Return user without password
  return {
    user_id: user.user_id,
    email: user.email,
    role: user.role,
    created_at: user.created_at,
  };
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const result = await sql`
    SELECT user_id, email, role, created_at
    FROM users
    WHERE email = ${email}
  `;

  return result.length > 0 ? (result[0] as User) : null;
}
