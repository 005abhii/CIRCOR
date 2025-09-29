import { type NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { employees } = body;

    if (!employees || !Array.isArray(employees) || employees.length === 0) {
      return NextResponse.json(
        { error: "No employee data provided" },
        { status: 400 }
      );
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < employees.length; i++) {
      const employee = employees[i];
      try {
        // Validate required fields
        if (
          !employee.employee_id ||
          !employee.full_name ||
          !employee.country_id ||
          !employee.currency_code
        ) {
          errors.push({ row: i + 1, error: "Missing required fields" });
          continue;
        }

        // Insert main employee record
        await sql`
          INSERT INTO employee (employee_id, country_id, full_name, date_of_birth, start_date, currency_code, created_by)
          VALUES (${employee.employee_id}, ${employee.country_id}, ${
          employee.full_name
        }, ${employee.date_of_birth || null}, ${employee.start_date || null}, ${
          employee.currency_code
        }, ${session.id})
        `;

        // Insert country-specific data if provided
        if (employee.country_specific_data) {
          const { country_id, country_specific_data } = employee;

          if (country_id === 1 && country_specific_data.aadhar_number) {
            // India
            await sql`
              INSERT INTO employee_india (employee_id, aadhar_number, pan, bank_account, ifsc)
              VALUES (${employee.employee_id}, ${
              country_specific_data.aadhar_number
            }, ${country_specific_data.pan || null}, ${
              country_specific_data.bank_account || null
            }, ${country_specific_data.ifsc || null})
            `;
          } else if (
            country_id === 2 &&
            country_specific_data.numero_securite_sociale
          ) {
            // France
            await sql`
              INSERT INTO employee_france (employee_id, numero_securite_sociale, bank_iban, department_code)
              VALUES (${employee.employee_id}, ${
              country_specific_data.numero_securite_sociale
            }, ${country_specific_data.bank_iban || null}, ${
              country_specific_data.department_code || null
            })
            `;
          } else if (country_id === 3 && country_specific_data.ssn) {
            // USA
            await sql`
              INSERT INTO employee_usa (employee_id, ssn, bank_account, routing_number)
              VALUES (${employee.employee_id}, ${country_specific_data.ssn}, ${
              country_specific_data.bank_account || null
            }, ${country_specific_data.routing_number || null})
            `;
          }
        }

        results.push({
          row: i + 1,
          employee_id: employee.employee_id,
          status: "success",
        });
      } catch (error) {
        console.error(`Error creating employee at row ${i + 1}:`, error);
        errors.push({ row: i + 1, error: "Failed to create employee" });
      }
    }

    return NextResponse.json({
      message: `Processed ${employees.length} employees`,
      successful: results.length,
      failed: errors.length,
      results,
      errors,
    });
  } catch (error) {
    console.error("Error in bulk upload:", error);
    return NextResponse.json(
      { error: "Failed to process bulk upload" },
      { status: 500 }
    );
  }
}
