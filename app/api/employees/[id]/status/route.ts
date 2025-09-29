// app/api/employees/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check authentication
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user can manage employees
    if (!canManageEmployees(session.role as any)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { is_active } = await request.json();
    const employeeId = params.id;

    // For country-specific admins, verify they can manage this employee
    if (session.role !== "admin") {
      const employeeCountryCheck = await sql`
        SELECT c.country_name 
        FROM employee e 
        JOIN country c ON e.country_id = c.country_id 
        WHERE e.employee_id = ${employeeId}
      `;

      if (employeeCountryCheck.length === 0) {
        return NextResponse.json(
          { error: "Employee not found" },
          { status: 404 }
        );
      }

      const employeeCountry = employeeCountryCheck[0].country_name;
      const userCountryAccess: Record<string, string> = {
        india_admin: "India",
        france_admin: "France",
        us_admin: "USA",
      };

      if (
        userCountryAccess[session.role] &&
        userCountryAccess[session.role] !== employeeCountry
      ) {
        return NextResponse.json(
          { error: "Cannot manage employees from other countries" },
          { status: 403 }
        );
      }
    }

    // Update employee status
    const result = await sql`
      UPDATE employee 
      SET is_active = ${is_active}
      WHERE employee_id = ${employeeId}
      RETURNING employee_id, is_active
    `;

    if (result.length === 0) {
      return NextResponse.json(
        { error: "Employee not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Employee ${
        is_active ? "activated" : "deactivated"
      } successfully`,
      employee: result[0],
    });
  } catch (error) {
    console.error("Error updating employee status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to check management permissions
function canManageEmployees(role: string): boolean {
  const managementRoles = ["admin", "india_admin", "france_admin", "us_admin"];
  return managementRoles.includes(role?.toLowerCase());
}
