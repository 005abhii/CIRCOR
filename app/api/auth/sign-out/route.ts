import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();

  // Clear the session cookie
  cookieStore.delete("session");

  // Redirect to home page
  return NextResponse.redirect(
    new URL("/", process.env.NEXT_PUBLIC_VERCEL_URL || "http://localhost:3000")
  );
}
