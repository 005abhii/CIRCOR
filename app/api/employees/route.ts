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
// Add this POST method to your app/api/employees/route.ts file

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has permission to create employees
    const canManage = [
      "admin",
      "india_admin",
      "france_admin",
      "us_admin",
    ].includes(session.role?.toLowerCase());

    if (!canManage) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      employee_id,
      full_name,
      date_of_birth,
      start_date,
      country_id,
      currency_code,
      country_specific_data,
    } = body;

    // Validate required fields
    if (!employee_id || !full_name || !country_id || !currency_code) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // For country-specific admins, verify they're creating in their allowed country
    if (session.role !== "admin") {
      const countryMap: Record<string, number> = {
        india_admin: 1,
        france_admin: 2,
        us_admin: 3,
      };

      const allowedCountryId = countryMap[session.role.toLowerCase()];
      if (allowedCountryId && country_id !== allowedCountryId) {
        return NextResponse.json(
          { error: "Cannot create employees for other countries" },
          { status: 403 }
        );
      }
    }

    // Check if employee_id already exists
    const existingEmployee = await sql`
      SELECT employee_id FROM employee WHERE employee_id = ${employee_id}
    `;

    if (existingEmployee.length > 0) {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 409 }
      );
    }

    // Insert main employee record
    await sql`
      INSERT INTO employee (
        employee_id, 
        full_name, 
        date_of_birth, 
        start_date, 
        country_id, 
        currency_code,
        is_active,
        created_at
      )
      VALUES (
        ${employee_id}, 
        ${full_name}, 
        ${date_of_birth || null}, 
        ${start_date || null}, 
        ${country_id}, 
        ${currency_code},
        true,
        NOW()
      )
    `;

    // Insert country-specific data if provided
    if (country_specific_data) {
      if (country_id === 1) {
        // India
        await sql`
          INSERT INTO employee_india (
            employee_id, 
            aadhar_number, 
            pan, 
            bank_account, 
            ifsc
          )
          VALUES (
            ${employee_id}, 
            ${country_specific_data.aadhar_number || null}, 
            ${country_specific_data.pan || null}, 
            ${country_specific_data.bank_account || null}, 
            ${country_specific_data.ifsc || null}
          )
        `;
      } else if (country_id === 2) {
        // France
        await sql`
          INSERT INTO employee_france (
            employee_id, 
            numero_securite_sociale, 
            bank_iban, 
            department_code
          )
          VALUES (
            ${employee_id}, 
            ${country_specific_data.numero_securite_sociale || null}, 
            ${country_specific_data.bank_iban || null}, 
            ${country_specific_data.department_code || null}
          )
        `;
      } else if (country_id === 3) {
        // USA
        await sql`
          INSERT INTO employee_usa (
            employee_id, 
            ssn, 
            bank_account, 
            routing_number
          )
          VALUES (
            ${employee_id}, 
            ${country_specific_data.ssn || null}, 
            ${country_specific_data.bank_account || null}, 
            ${country_specific_data.routing_number || null}
          )
        `;
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Employee created successfully",
        employee_id,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating employee:", error);

    // Handle unique constraint violations
    if (error.message?.includes("unique") || error.code === "23505") {
      return NextResponse.json(
        { error: "Employee ID already exists" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
