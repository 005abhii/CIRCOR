// app/api/employees/route.ts (Updated GET method)
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let employees;

    // Admin can see all employees, others are restricted by country
    if (session.role === "admin") {
      employees = await sql`
        SELECT 
          e.employee_id,
          e.full_name,
          e.date_of_birth,
          e.start_date,
          e.currency_code,
          e.created_at,
          e.is_active,
          c.country_name
        FROM employee e
        JOIN country c ON e.country_id = c.country_id
        ORDER BY e.created_at DESC
      `;
    } else {
      // Country-specific admins
      const countryMap = {
        india_admin: "India",
        france_admin: "France",
        us_admin: "USA",
      };

      const allowedCountry =
        countryMap[session.role as keyof typeof countryMap];

      if (!allowedCountry) {
        return NextResponse.json({ error: "Invalid role" }, { status: 403 });
      }

      employees = await sql`
        SELECT 
          e.employee_id,
          e.full_name,
          e.date_of_birth,
          e.start_date,
          e.currency_code,
          e.created_at,
          e.is_active,
          c.country_name
        FROM employee e
        JOIN country c ON e.country_id = c.country_id
        WHERE c.country_name = ${allowedCountry}
        ORDER BY e.created_at DESC
      `;
    }

    return NextResponse.json({
      success: true,
      employees: employees || [],
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
