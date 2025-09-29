import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getServerSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const country = searchParams.get("country");
    const payPeriod = searchParams.get("payPeriod");
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    // Build base query with role-based filtering
    let countQuery = `
      SELECT COUNT(*) as total
      FROM employee_universal eu
      WHERE eu.payroll_id IS NOT NULL
    `;

    let dataQuery = `
      SELECT 
        eu.payroll_id,
        eu.employee_id,
        eu.full_name,
        eu.country_name,
        eu.currency_code,
        eu.period_start,
        eu.period_end,
        eu.payroll_type,
        eu.basic_salary,
        eu.bonus,
        eu.net_pay,
        eu.payroll_created_at
      FROM employee_universal eu
      WHERE eu.payroll_id IS NOT NULL
    `;

    // Apply role-based filtering
    if (session.role !== "admin") {
      const roleCountryMap: Record<string, string> = {
        india_admin: "India",
        france_admin: "France",
        us_admin: "USA",
      };

      const allowedCountry = roleCountryMap[session.role];
      if (allowedCountry) {
        countQuery += ` AND eu.country_name = '${allowedCountry}'`;
        dataQuery += ` AND eu.country_name = '${allowedCountry}'`;
      }
    }

    // Apply additional filters
    if (country && country !== "all") {
      countQuery += ` AND LOWER(eu.country_name) = '${country.toLowerCase()}'`;
      dataQuery += ` AND LOWER(eu.country_name) = '${country.toLowerCase()}'`;
    }

    if (payPeriod && payPeriod !== "all") {
      countQuery += ` AND eu.pay_period_id = ${parseInt(payPeriod)}`;
      dataQuery += ` AND eu.pay_period_id = ${parseInt(payPeriod)}`;
    }

    if (search && search.trim()) {
      const searchTerm = search.toLowerCase().trim();
      countQuery += ` AND LOWER(eu.full_name) ILIKE '%${searchTerm}%'`;
      dataQuery += ` AND LOWER(eu.full_name) ILIKE '%${searchTerm}%'`;
    }

    dataQuery += ` ORDER BY eu.payroll_created_at DESC LIMIT ${limit} OFFSET ${offset}`;

    // Execute queries
    const [countResult, result] = await Promise.all([
      sql`${sql.unsafe(countQuery)}`,
      sql`${sql.unsafe(dataQuery)}`,
    ]);

    return NextResponse.json({
      data: result,
      pagination: {
        total: parseInt(countResult[0].total as string),
        page,
        limit,
        totalPages: Math.ceil(parseInt(countResult[0].total as string) / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching payroll data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
