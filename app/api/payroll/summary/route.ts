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
    const payPeriod = searchParams.get("payPeriod");

    let whereClause = "WHERE eu.payroll_id IS NOT NULL";
    if (payPeriod && payPeriod !== "all") {
      whereClause += ` AND eu.pay_period_id = ${payPeriod}`;
    }

    // Overall statistics
    const overallStats = await sql`
      SELECT 
        COUNT(*) as total_payrolls,
        SUM(eu.net_pay) as total_payout,
        AVG(eu.basic_salary) as avg_salary,
        COUNT(DISTINCT eu.country_name) as countries_count
      FROM employee_universal eu
      ${sql.unsafe(whereClause)}
    `;

    // By country breakdown
    const countryBreakdown = await sql`
      SELECT 
        eu.country_name,
        eu.currency_code,
        COUNT(*) as employee_count,
        SUM(eu.net_pay) as total_payout,
        AVG(eu.net_pay) as avg_payout
      FROM employee_universal eu
      ${sql.unsafe(whereClause)}
      GROUP BY eu.country_name, eu.currency_code
      ORDER BY total_payout DESC
    `;

    // Recent payrolls
    const recentPayrolls = await sql`
      SELECT 
        eu.payroll_id,
        eu.full_name,
        eu.country_name,
        eu.net_pay,
        eu.currency_code,
        eu.payroll_created_at
      FROM employee_universal eu
      ${sql.unsafe(whereClause)}
      ORDER BY eu.payroll_created_at DESC
      LIMIT 5
    `;

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
