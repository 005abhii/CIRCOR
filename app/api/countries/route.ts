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

    const countries = await sql`
      SELECT country_id, country_name
      FROM country
      ORDER BY country_name ASC
    `;
    return NextResponse.json({ countries });
  } catch (error) {
    console.error("[v0] /api/countries error:", error);
    return NextResponse.json(
      { error: "Failed to load countries" },
      { status: 500 }
    );
  }
}
