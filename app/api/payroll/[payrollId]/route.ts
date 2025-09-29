import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "@/lib/session";
import { sql } from "@/lib/db";

interface RouteParams {
  params: { payrollId: string };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  console.log("=== GET API Route Called ===");
  console.log("Requested payroll ID:", params.payrollId);

  try {
    console.log("1. About to call getServerSession...");
    const session = await getServerSession();

    console.log("2. Session result:", JSON.stringify(session, null, 2));
    console.log("3. Session exists:", !!session);
    console.log("4. Session user exists:", !!session);
    console.log("5. Session user email:", session?.email);

    if (!session) {
      console.log("❌ No session - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ Authentication successful");
    console.log("Executing query for payroll_id:", params.payrollId);

    const result = await sql`
      SELECT 
        p.payroll_id::text as payroll_id,
        p.employee_id,
        e.full_name,
        e.date_of_birth,
        e.start_date,
        c.country_name,
        e.currency_code,
        p.created_at,
        e.aadhar_number,
        e.pan,
        e.india_bank_account,
        e.ifsc,
        e.numero_securite_sociale,
        e.bank_iban,
        e.department_code,
        e.ssn,
        e.usa_bank_account,
        e.routing_number,
        pp.period_start,
        pp.period_end,
        pt.type_name as payroll_type,
        p.basic_salary,
        p.bonus,
        p.overtime_hours,
        p.overtime_rate,
        p.net_pay,
        p.created_at as payroll_created_at
      FROM payroll p
      JOIN employee e ON p.employee_id = e.employee_id
      JOIN country c ON e.country_id = c.country_id
      JOIN pay_period pp ON p.pay_period_id = pp.pay_period_id
      JOIN payroll_type pt ON p.payroll_type_id = pt.payroll_type_id
      WHERE p.payroll_id = ${params.payrollId}
    `;

    console.log("Query executed. Result count:", result.length);

    if (result.length === 0) {
      console.log("No payroll found for ID:", params.payrollId);
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    const payrollData = result[0];
    console.log("Found payroll for employee:", payrollData.full_name);

    return NextResponse.json(payrollData);
  } catch (error: any) {
    console.error("❌ Error in GET route:", error);
    console.error("Error stack:", error.stack);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        type: error.constructor.name,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  console.log("=== PUT API Route Called ===");
  console.log("Updating payroll ID:", params.payrollId);

  try {
    const session = await getServerSession();
    console.log("PUT - Session exists:", !!session);
    console.log("PUT - User email:", session?.email);

    if (!session) {
      console.log("❌ No session - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("✅ PUT Authentication successful");

    const payrollId = params.payrollId;
    const updateData = await request.json();
    console.log("Update data received:", updateData);

    // CRITICAL: Check if the employee associated with this payroll is still active
    const payrollCheck = await sql`
      SELECT 
        p.employee_id, 
        e.is_active, 
        e.full_name,
        c.country_name
      FROM payroll p
      JOIN employee e ON p.employee_id = e.employee_id
      JOIN country c ON e.country_id = c.country_id
      WHERE p.payroll_id = ${payrollId}
    `;

    if (payrollCheck.length === 0) {
      return NextResponse.json(
        { error: "Payroll record not found" },
        { status: 404 }
      );
    }

    const payrollRecord = payrollCheck[0];

    // Block editing payroll for inactive employees
    if (!payrollRecord.is_active) {
      return NextResponse.json(
        {
          error: `Cannot edit payroll for inactive employee: ${payrollRecord.full_name}. Please activate the employee first.`,
        },
        { status: 400 }
      );
    }

    // Check country access for non-admin users
    if (session.role !== "admin") {
      const countryMap: Record<string, string> = {
        india_admin: "India",
        france_admin: "France",
        us_admin: "USA",
      };

      const allowedCountry = countryMap[session.role];
      if (allowedCountry && payrollRecord.country_name !== allowedCountry) {
        return NextResponse.json(
          { error: "Cannot edit payroll for employees from other countries" },
          { status: 403 }
        );
      }
    }

    // Validate required fields
    if (!updateData.period_start || !updateData.period_end) {
      return NextResponse.json(
        { error: "period_start and period_end are required" },
        { status: 400 }
      );
    }

    // Proceed with update
    const result = await sql`
      UPDATE payroll 
      SET 
        basic_salary = ${updateData.basic_salary || null},
        bonus = ${updateData.bonus || null},
        overtime_hours = ${updateData.overtime_hours || null},
        overtime_rate = ${updateData.overtime_rate || null},
        net_pay = ${updateData.net_pay || null},
        payroll_type_id = ${updateData.payroll_type_id || null},
        pay_period_id = ${updateData.pay_period_id || null}
      WHERE payroll_id = ${payrollId}
      RETURNING *
    `;

    console.log("Update result:", result);

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Payroll not found or not updated" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Payroll updated successfully",
      data: result[0],
    });
  } catch (error: any) {
    console.error("❌ PUT Update error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        type: error.constructor.name,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  console.log("=== DELETE API Route Called ===");
  console.log("Deleting payroll ID:", params.payrollId);

  try {
    const session = await getServerSession();

    if (!session) {
      console.log("❌ No session - returning 401");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // First check if the payroll exists
    const existing = await sql`
      SELECT payroll_id FROM payroll 
      WHERE payroll_id = ${params.payrollId}
    `;

    if (existing.length === 0) {
      return NextResponse.json({ error: "Payroll not found" }, { status: 404 });
    }

    // Delete the payroll data row
    const result = await sql`
      DELETE FROM payroll 
      WHERE payroll_id = ${params.payrollId}
      RETURNING payroll_id
    `;

    console.log("Delete result:", result);

    return NextResponse.json({
      success: true,
      message: "Payroll deleted successfully",
      deletedId: result[0]?.payroll_id,
    });
  } catch (error: any) {
    console.error("❌ Delete error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error.message,
        type: error.constructor.name,
      },
      { status: 500 }
    );
  }
}
