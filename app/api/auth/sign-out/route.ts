import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();

  // Clear the session cookie
  cookieStore.delete("session");

  // Construct base URL properly
  const baseUrl = process.env.NEXT_PUBLIC_VERCEL_URL
    ? `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`
    : "http://localhost:3000";

  // Redirect to home page
  return NextResponse.redirect(new URL("/", baseUrl));
}
