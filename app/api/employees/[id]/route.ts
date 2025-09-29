// app/api/employee/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = params.id;

    // First, get the basic employee info
    const employeeRows = await sql`
      SELECT e.*, c.country_name 
      FROM employee e 
      LEFT JOIN country c ON e.country_id = c.country_id 
      WHERE e.employee_id = ${employeeId}
    `;

    if (employeeRows.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    const employee = employeeRows[0];

    // Get country-specific information based on country_id
    let countrySpecificData = {};

    if (employee.country_id === 1) {
      // India
      const indiaRows = await sql`
        SELECT aadhar_number, pan, bank_account, ifsc 
        FROM employee_india 
        WHERE employee_id = ${employeeId}
      `;
      if (indiaRows.length > 0) {
        countrySpecificData = indiaRows[0];
      }
    } else if (employee.country_id === 2) {
      // France
      const franceRows = await sql`
        SELECT numero_securite_sociale, bank_iban, department_code 
        FROM employee_france 
        WHERE employee_id = ${employeeId}
      `;
      if (franceRows.length > 0) {
        countrySpecificData = franceRows[0];
      }
    } else if (employee.country_id === 3) {
      // USA
      const usaRows = await sql`
        SELECT ssn, bank_account, routing_number 
        FROM employee_usa 
        WHERE employee_id = ${employeeId}
      `;
      if (usaRows.length > 0) {
        countrySpecificData = usaRows[0];
      }
    }

    // Combine all data
    const fullEmployeeData = {
      ...employee,
      ...countrySpecificData,
    };

    return NextResponse.json({ employee: fullEmployeeData });
  } catch (error) {
    console.error("Error fetching employee details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const employeeId = params.id;
    const body = await request.json();
    const {
      full_name,
      date_of_birth,
      start_date,
      country_id,
      currency_code,
      country_specific_data,
    } = body;

    // Update main employee record
    await sql`
      UPDATE employee 
      SET full_name = ${full_name}, 
          date_of_birth = ${date_of_birth}, 
          start_date = ${start_date}, 
          country_id = ${country_id}, 
          currency_code = ${currency_code}
      WHERE employee_id = ${employeeId}
    `;

    // Handle country-specific data
    if (country_specific_data) {
      if (country_id === 1) {
        // India - Use ON CONFLICT for upsert behavior
        await sql`
          INSERT INTO employee_india (employee_id, aadhar_number, pan, bank_account, ifsc) 
          VALUES (${employeeId}, ${country_specific_data.aadhar_number}, ${country_specific_data.pan}, ${country_specific_data.bank_account}, ${country_specific_data.ifsc}) 
          ON CONFLICT (employee_id) 
          DO UPDATE SET 
            aadhar_number = EXCLUDED.aadhar_number, 
            pan = EXCLUDED.pan, 
            bank_account = EXCLUDED.bank_account, 
            ifsc = EXCLUDED.ifsc
        `;
      } else if (country_id === 2) {
        // France
        await sql`
          INSERT INTO employee_france (employee_id, numero_securite_sociale, bank_iban, department_code) 
          VALUES (${employeeId}, ${country_specific_data.numero_securite_sociale}, ${country_specific_data.bank_iban}, ${country_specific_data.department_code}) 
          ON CONFLICT (employee_id) 
          DO UPDATE SET 
            numero_securite_sociale = EXCLUDED.numero_securite_sociale, 
            bank_iban = EXCLUDED.bank_iban, 
            department_code = EXCLUDED.department_code
        `;
      } else if (country_id === 3) {
        // USA
        await sql`
          INSERT INTO employee_usa (employee_id, ssn, bank_account, routing_number) 
          VALUES (${employeeId}, ${country_specific_data.ssn}, ${country_specific_data.bank_account}, ${country_specific_data.routing_number}) 
          ON CONFLICT (employee_id) 
          DO UPDATE SET 
            ssn = EXCLUDED.ssn, 
            bank_account = EXCLUDED.bank_account, 
            routing_number = EXCLUDED.routing_number
        `;
      }
    }

    return NextResponse.json({ message: "Employee updated successfully" });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
