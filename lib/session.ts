import type { User } from "./auth";

export interface SessionUser {
  id: number;
  email: string;
  role: string;
}

export function createSession(user: User): string {
  // Simple session token (in production, use proper JWT)
  const sessionData = {
    id: user.user_id,
    email: user.email,
    role: user.role,
    exp: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
  };
  return Buffer.from(JSON.stringify(sessionData)).toString("base64");
}

export async function getServerSession(): Promise<SessionUser | null> {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("session");

    if (!sessionCookie) {
      return null;
    }

    const sessionData = JSON.parse(
      Buffer.from(sessionCookie.value, "base64").toString()
    );

    // Check if session is expired
    if (Date.now() > sessionData.exp) {
      return null;
    }

    return {
      id: sessionData.id,
      email: sessionData.email,
      role: sessionData.role,
    };
  } catch {
    return null;
  }
}

export function getClientSession(): SessionUser | null {
  try {
    if (typeof document === "undefined") {
      return null;
    }

    const cookies = document.cookie.split(";");
    const sessionCookie = cookies.find((cookie) =>
      cookie.trim().startsWith("session=")
    );

    if (!sessionCookie) {
      return null;
    }

    const sessionValue = sessionCookie.split("=")[1];
    const sessionData = JSON.parse(
      Buffer.from(sessionValue, "base64").toString()
    );

    // Check if session is expired
    if (Date.now() > sessionData.exp) {
      return null;
    }

    return {
      id: sessionData.id,
      email: sessionData.email,
      role: sessionData.role,
    };
  } catch {
    return null;
  }
}

export const getSession = getServerSession;

export async function clearSession() {
  try {
    const { cookies } = await import("next/headers");
    const cookieStore = cookies();
    cookieStore.delete("session");
  } catch {
    // Fallback for client-side
    if (typeof document !== "undefined") {
      document.cookie =
        "session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
    }
  }
}
