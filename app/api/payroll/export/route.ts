import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "../../../../lib/session"; // Assuming NextAuth.js is used
import { sql } from "../../../../lib/db"; // Assuming Vercel's Postgres client

export async function GET_EXPORT(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const format = searchParams.get("format") || "csv";
    const country = searchParams.get("country");
    const payPeriod = searchParams.get("payPeriod");

    let query = `
      SELECT 
        eu.employee_id,
        eu.full_name,
        eu.country_name,
        eu.currency_code,
        eu.period_start,
        eu.period_end,
        eu.payroll_type,
        eu.basic_salary,
        eu.bonus,
        eu.overtime_hours,
        eu.overtime_rate,
        eu.net_pay,
        eu.payroll_created_at
      FROM employee_universal eu
      WHERE eu.payroll_id IS NOT NULL
    `;

    // Role-based filtering
    if (session.role !== "admin") {
      const roleCountryMap: Record<string, string> = {
        india_admin: "India",
        france_admin: "France",
        us_admin: "USA",
      };

      const allowedCountry = roleCountryMap[session.role];
      if (allowedCountry) {
        query += ` AND eu.country_name = '${allowedCountry}'`;
      }
    }

    if (country && country !== "all") {
      query += ` AND LOWER(eu.country_name) = '${country.toLowerCase()}'`;
    }

    if (payPeriod && payPeriod !== "all") {
      query += ` AND eu.pay_period_id = ${payPeriod}`;
    }

    query += ` ORDER BY eu.payroll_created_at DESC`;

    const result = await sql`${sql.unsafe(query)}`;

    if (format === "csv") {
      const csvHeaders = [
        "Employee ID",
        "Full Name",
        "Country",
        "Currency",
        "Period Start",
        "Period End",
        "Payroll Type",
        "Basic Salary",
        "Bonus",
        "Overtime Hours",
        "Overtime Rate",
        "Net Pay",
        "Created At",
      ].join(",");

      const csvRows = (result as any[]).map((row: any) =>
        [
          row.employee_id,
          `"${row.full_name}"`,
          row.country_name,
          row.currency_code,
          row.period_start,
          row.period_end,
          `"${row.payroll_type || ""}"`,
          row.basic_salary || 0,
          row.bonus || 0,
          row.overtime_hours || 0,
          row.overtime_rate || 0,
          row.net_pay || 0,
          row.payroll_created_at,
        ].join(",")
      );

      const csv = [csvHeaders, ...csvRows].join("\n");

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="payroll-export-${
            new Date().toISOString().split("T")[0]
          }.csv"`,
          "Cache-Control": "no-cache",
        },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error exporting payroll data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Summary route fix
export async function GET_SUMMARY(request: NextRequest) {
  try {
    const session = await getServerSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const payPeriod = searchParams.get("payPeriod");

    let whereClause = "WHERE eu.payroll_id IS NOT NULL";
    if (payPeriod && payPeriod !== "all") {
      whereClause += ` AND eu.pay_period_id = ${payPeriod}`;
    }

    // Overall statistics
    const overallStatsQuery = `
      SELECT 
        COUNT(*) as total_payrolls,
        SUM(eu.net_pay) as total_payout,
        AVG(eu.basic_salary) as avg_salary,
        COUNT(DISTINCT eu.country_name) as countries_count
      FROM employee_universal eu
      ${whereClause}
    `;

    const overallStats = await sql`${sql.unsafe(overallStatsQuery)}`;

    // By country breakdown
    const countryBreakdownQuery = `
      SELECT 
        eu.country_name,
        eu.currency_code,
        COUNT(*) as employee_count,
        SUM(eu.net_pay) as total_payout,
        AVG(eu.net_pay) as avg_payout
      FROM employee_universal eu
      ${whereClause}
      GROUP BY eu.country_name, eu.currency_code
      ORDER BY total_payout DESC
    `;

    const countryBreakdown = await sql`${sql.unsafe(countryBreakdownQuery)}`;

    // Recent payrolls
    const recentPayrollsQuery = `
      SELECT 
        eu.payroll_id,
        eu.full_name,
        eu.country_name,
        eu.net_pay,
        eu.currency_code,
        eu.payroll_created_at
      FROM employee_universal eu
      ${whereClause}
      ORDER BY eu.payroll_created_at DESC
      LIMIT 5
    `;

    const recentPayrolls = await sql`${sql.unsafe(recentPayrollsQuery)}`;

    return NextResponse.json({
      overall: overallStats[0],
      byCountry: countryBreakdown,
      recent: recentPayrolls,
    });
  } catch (error) {
    console.error("Error fetching payroll summary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
