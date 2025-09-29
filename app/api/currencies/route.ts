import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "@/lib/session";

export async function GET() {
  try {
    // Require a session (any role can read)
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
      const currencies = await sql`
        SELECT currency_code, currency_name
        FROM currency
        ORDER BY currency_code ASC
      `;
      return NextResponse.json({ currencies });
    } catch (dbErr) {
      // Fallback if currency table doesn't exist
      console.warn("[v0] currency table missing; returning static fallback");
      const currencies = [
        { currency_code: "INR", currency_name: "Indian Rupee" },
        { currency_code: "EUR", currency_name: "Euro" },
        { currency_code: "USD", currency_name: "US Dollar" },
      ];
      return NextResponse.json({ currencies });
    }
  } catch (error) {
    console.error("[v0] /api/currencies error:", error);
    return NextResponse.json(
      { error: "Failed to load currencies" },
      { status: 500 }
    );
  }
}
