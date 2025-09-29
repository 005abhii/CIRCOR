import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { sql } from "@/lib/db";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CreatePayrollForm } from "./CreatePayrollForm";
import { getCountryFilterForRole, getRoleDisplayName } from "@/lib/role-access";
import { PayrollTable } from "./PayrollTable";

// Types for payroll data
export interface PayrollData {
  payroll_id: string;
  employee_id: string;
  pay_period_id: number;
  payroll_type_id: number;
  full_name: string;
  country_name: string;
  currency_code: string;
  period_start: string;
  period_end: string;
  payroll_type: string;
  basic_salary: number;
  bonus: number;
  overtime_hours: number;
  overtime_rate: number;
  net_pay: number;
  created_at: string;
}

export interface Employee {
  employee_id: string;
  full_name: string;
  country_name: string;
  currency_code: string;
}

export interface PayPeriod {
  pay_period_id: number;
  period_start: string;
  period_end: string;
}

export interface PayrollType {
  payroll_type_id: number;
  type_name: string;
}

// Update these functions in your payroll page.tsx

async function getPayrollData(userRole: string): Promise<PayrollData[]> {
  const allowedCountry = getCountryFilterForRole(userRole as any);

  const result = await sql`
    SELECT 
      p.payroll_id::text as payroll_id,
      p.employee_id,
      p.pay_period_id,
      p.payroll_type_id,
      e.full_name,
      c.country_name,
      cur.currency_code,
      pp.period_start::text as period_start,
      pp.period_end::text as period_end,
      pt.type_name as payroll_type,
      p.basic_salary::numeric as basic_salary,
      COALESCE(p.bonus, 0)::numeric as bonus,
      COALESCE(p.overtime_hours, 0)::numeric as overtime_hours,
      COALESCE(p.overtime_rate, 0)::numeric as overtime_rate,
      p.net_pay::numeric as net_pay,
      p.created_at::text as created_at
    FROM payroll p
    JOIN employee e ON p.employee_id = e.employee_id
    JOIN country c ON e.country_id = c.country_id
    JOIN currency cur ON e.currency_code = cur.currency_code
    JOIN pay_period pp ON p.pay_period_id = pp.pay_period_id
    JOIN payroll_type pt ON p.payroll_type_id = pt.payroll_type_id
    WHERE e.is_active = true
    ${allowedCountry ? sql`AND c.country_name = ${allowedCountry}` : sql``}
    ORDER BY p.created_at DESC
  `;

  return result as PayrollData[];
}

async function getEmployees(userRole: string): Promise<Employee[]> {
  const allowedCountry = getCountryFilterForRole(userRole as any);

  const result = await sql`
    SELECT DISTINCT
      e.employee_id,
      e.full_name,
      c.country_name,
      e.currency_code
    FROM employee e
    JOIN country c ON e.country_id = c.country_id
    WHERE e.is_active = true
    ${allowedCountry ? sql`AND c.country_name = ${allowedCountry}` : sql``}
    ORDER BY e.full_name
  `;
  return result as Employee[];
}

async function getPayPeriods(): Promise<PayPeriod[]> {
  const result = await sql`
    SELECT pay_period_id, period_start, period_end
    FROM pay_period
    ORDER BY period_start DESC
  `;
  return result as PayPeriod[];
}

async function getPayrollTypes(): Promise<PayrollType[]> {
  const result = await sql`
    SELECT payroll_type_id, type_name
    FROM payroll_type
    ORDER BY type_name
  `;
  return result as PayrollType[];
}

export default async function PayrollManagementPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const [payrollData, employees, payPeriods, payrollTypes] = await Promise.all([
    getPayrollData(session.role),
    getEmployees(session.role),
    getPayPeriods(),
    getPayrollTypes(),
  ]);

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
                    className="text-sm font-medium  "
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
          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">Payroll Management</h1>
                <Badge variant="outline" className="text-xs">
                  {getRoleDisplayName(session.role as any)}
                </Badge>
              </div>
              <p className="text-muted-foreground text-lg">
                Create, process, and manage employee payroll
                {session.role !== "admin" && " for your region"}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Dialog>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Payroll
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Create New Payroll Entry</DialogTitle>
                  </DialogHeader>
                  <CreatePayrollForm
                    employees={employees}
                    payPeriods={payPeriods}
                    payrollTypes={payrollTypes}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Payroll Summary Cards */}
          <div className="grid gap-4 md:grid-cols-3 justify-center text-center">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Payrolls
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{payrollData.length}</div>
                <p className="text-xs text-muted-foreground">
                  Active payroll entries
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Employees
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(payrollData.map((p) => p.employee_id)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Unique employees
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Countries</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {new Set(payrollData.map((p) => p.country_name)).size}
                </div>
                <p className="text-xs text-muted-foreground">
                  Active countries
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Payroll Table */}
          <Card>
            <CardHeader>
              <CardTitle>All Payroll Records</CardTitle>
            </CardHeader>
            <CardContent>
              <PayrollTable
                payrollData={payrollData}
                employees={employees}
                payPeriods={payPeriods}
                payrollTypes={payrollTypes}
              />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
