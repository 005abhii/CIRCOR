import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const employee_id = formData.get("employee_id") as string;
    const pay_period_id = formData.get("pay_period_id") as string;
    const payroll_type_ids = JSON.parse(
      formData.get("payroll_type_ids") as string
    );
    const basic_salary = parseFloat(formData.get("basic_salary") as string);
    const bonus = parseFloat(formData.get("bonus") as string) || 0;
    const commission = parseFloat(formData.get("commission") as string) || 0;
    const overtime_hours =
      parseFloat(formData.get("overtime_hours") as string) || 0;
    const overtime_rate =
      parseFloat(formData.get("overtime_rate") as string) || 0;
    const net_pay = parseFloat(formData.get("net_pay") as string);

    // Validate payroll types array
    if (!Array.isArray(payroll_type_ids) || payroll_type_ids.length === 0) {
      return NextResponse.json(
        { error: "At least one payroll type must be selected" },
        { status: 400 }
      );
    }

    // Employee active check
    const employeeCheck = await sql`
      SELECT e.employee_id, e.is_active, c.country_name
      FROM employee e
      JOIN country c ON e.country_id = c.country_id
      WHERE e.employee_id = ${employee_id}
    `;

    if (employeeCheck.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const employee = employeeCheck[0];

    if (!employee.is_active) {
      return NextResponse.json(
        { error: "Cannot create payroll for inactive employee" },
        { status: 400 }
      );
    }

    // Country access check
    if (session.role !== "admin") {
      const countryMap: Record<string, string> = {
        india_admin: "India",
        france_admin: "France",
        us_admin: "USA",
      };

      const allowedCountry = countryMap[session.role];
      if (allowedCountry && employee.country_name !== allowedCountry) {
        return NextResponse.json(
          { error: "Cannot create payroll for employees from other countries" },
          { status: 403 }
        );
      }
    }

    // Check for duplicate
    const duplicateCheck = await sql`
      SELECT payroll_id 
      FROM payroll 
      WHERE employee_id = ${employee_id} 
      AND pay_period_id = ${pay_period_id}
    `;

    if (duplicateCheck.length > 0) {
      return NextResponse.json(
        {
          error:
            "Payroll already exists for this employee in the selected period",
        },
        { status: 400 }
      );
    }

    // Create payroll entry (use first type for the main record)
    // Combine bonus and commission into bonus field
    const result = await sql`
      INSERT INTO payroll (
        employee_id, 
        pay_period_id, 
        payroll_type_id,
        basic_salary, 
        bonus, 
        overtime_hours, 
        overtime_rate, 
        net_pay, 
        created_at
      )
      VALUES (
        ${employee_id}, 
        ${pay_period_id}, 
        ${payroll_type_ids[0]},
        ${basic_salary}, 
        ${bonus + commission}, 
        ${overtime_hours}, 
        ${overtime_rate}, 
        ${net_pay}, 
        NOW()
      )
      RETURNING payroll_id
    `;

    const payrollId = result[0].payroll_id;

    // Insert all selected payroll types into junction table
    for (const typeId of payroll_type_ids) {
      await sql`
        INSERT INTO payroll_payroll_type (payroll_id, payroll_type_id)
        VALUES (${payrollId}, ${typeId})
      `;
    }

    // Get payroll type names for response
    const typeNames = await sql`
      SELECT type_name 
      FROM payroll_type 
      WHERE payroll_type_id = ANY(${payroll_type_ids})
    `;

    return NextResponse.json({
      success: true,
      message: "Payroll created successfully",
      payroll_id: payrollId,
      payroll_types: typeNames.map((t: any) => t.type_name),
    });
  } catch (error) {
    console.error("Error creating payroll:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
