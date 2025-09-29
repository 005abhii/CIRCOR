import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { sql } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import DashboardCharts from "@/components/dashboard/DashboardCharts";

function getRoleGreeting(role: string): string {
  switch (role) {
    case "india_admin":
      return "Namaste";
    case "france_admin":
      return "Hola"; // As requested by user
    case "us_admin":
      return "Hi";
    case "admin":
      return "Hello";
    default:
      return "Welcome";
  }
}

function getRoleTitle(role: string): string {
  switch (role) {
    case "india_admin":
      return "India Admin Dashboard";
    case "france_admin":
      return "France Admin Dashboard";
    case "us_admin":
      return "US Admin Dashboard";
    case "admin":
      return "Super Admin Dashboard";
    default:
      return "Dashboard";
  }
}

async function getDashboardData(role: string) {
  try {
    let employeeData: any[] = [];
    let payrollData: any[] = [];
    let upcomingPayroll: any[] = [];

    if (role === "admin") {
      // Super admin sees all data
      employeeData = await sql`
        SELECT 
          c.country_name,
          COUNT(*)::int as employee_count
        FROM employee e
        JOIN country c ON e.country_id = c.country_id
        GROUP BY c.country_name
        ORDER BY employee_count DESC
      `;

      payrollData = await sql`
        SELECT 
          c.country_name,
          cur.currency_code,
          SUM(p.net_pay)::numeric as total_payroll
        FROM payroll p
        JOIN employee e ON p.employee_id = e.employee_id
        JOIN country c ON e.country_id = c.country_id
        JOIN currency cur ON e.currency_code = cur.currency_code
        WHERE p.created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY c.country_name, cur.currency_code
        ORDER BY total_payroll DESC
      `;
    }

    // Keep upcoming payroll unchanged...
    if (role === "admin") {
      upcomingPayroll = await sql`
        SELECT 
          pp.period_end,
          pp.period_start,
          COUNT(DISTINCT p.employee_id)::int as employee_count,
          c.country_name,
          SUM(p.net_pay)::numeric as estimated_total
        FROM pay_period pp
        LEFT JOIN payroll p ON pp.pay_period_id = p.pay_period_id
        LEFT JOIN employee e ON p.employee_id = e.employee_id
        LEFT JOIN country c ON e.country_id = c.country_id
        WHERE pp.period_end >= CURRENT_DATE 
          AND pp.period_end <= CURRENT_DATE + INTERVAL '60 days'
        GROUP BY pp.period_end, pp.period_start, c.country_name
        ORDER BY pp.period_end
      `;
    }
    return {
      employeeData: employeeData || [],
      payrollData: payrollData || [],
      upcomingPayroll: upcomingPayroll || [],
    };
  } catch (error) {
    console.error("Database query error:", error);
    return {
      employeeData: [],
      payrollData: [],
      upcomingPayroll: [],
    };
  }
}
export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const greeting = getRoleGreeting(session.role);
  const title = getRoleTitle(session.role);
  const dashboardData = await getDashboardData(session.role);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <nav className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-accent-foreground rounded-sm"></div>
                </div>
                <span className="text-lg font-semibold">Employee Portal</span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/dashboard" className="text-sm font-medium">
                    Dashboard
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href="/dashboard/employee-management"
                    className="text-sm font-medium"
                  >
                    Employee Management
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href="/dashboard/payroll-management"
                    className="text-sm font-medium"
                  >
                    Payroll Management
                  </Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link
                    href="/dashboard/ai-query"
                    className="text-sm font-medium"
                  >
                    AI Query
                  </Link>
                </Button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">
                {session.email}
              </span>
              <Button variant="outline" size="sm" asChild>
                <Link href="/api/auth/sign-out">Sign out</Link>
              </Button>
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          {/* Welcome Section */}
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-balance">
              {greeting}! Welcome to your {title}
            </h1>
            <p className="text-muted-foreground text-lg">
              Manage your regional operations and access your administrative
              tools
            </p>
          </div>

          {/* Charts Section */}
          <div className="grid gap-6 lg:grid-cols-2">
            <DashboardCharts
              role={session.role}
              employeeData={dashboardData.employeeData}
              payrollData={dashboardData.payrollData}
            />
          </div>

          {/* Calendar Section */}
          {/* <div className="grid gap-6">
            <PayrollCalendar
              upcomingPayroll={dashboardData.upcomingPayroll}
              role={session.role}
            />
          </div> */}

          {/* Role-specific Content Cards */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {session.role === "admin" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Global Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Access global employee data and manage all regional
                      operations
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Create and manage admin accounts for all regions
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>System Settings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Configure global system settings and policies
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {session.role === "india_admin" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>India Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Manage Indian employee records and payroll information
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>INR Payroll</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Process payroll in Indian Rupees and manage local benefits
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Ensure compliance with Indian labor laws and regulations
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {session.role === "france_admin" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>France Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Manage French employee records and payroll information
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>EUR Payroll</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Process payroll in Euros and manage European benefits
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>GDPR Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Ensure GDPR compliance and French labor law adherence
                    </p>
                  </CardContent>
                </Card>
              </>
            )}

            {session.role === "us_admin" && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>US Employees</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Manage US employee records and payroll information
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>USD Payroll</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Process payroll in US Dollars and manage benefits
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <CardTitle>Tax Compliance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">
                      Manage US tax compliance and state-specific regulations
                    </p>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
