import { type NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function GET(request: NextRequest) {
  const cookieStore = cookies();

  // Clear the session cookie
  cookieStore.delete("session");

  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

  return NextResponse.redirect(new URL("/", baseUrl));
}

export async function POST(request: NextRequest) {
  const cookieStore = cookies();

  // Clear the session cookie
  cookieStore.delete("session");

  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

  return NextResponse.redirect(new URL("/", baseUrl));
}
