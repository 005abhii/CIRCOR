// app/dashboard/payroll-management/[payrollId]/page.tsx
import { redirect, notFound } from "next/navigation";
import { getSession } from "@/lib/session";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { sql } from "@/lib/db";
import {
  getPayrollDetails,
  formatCurrency,
} from "../../../../lib/payroll-utols";
import Link from "next/link";
import { ArrowLeft, Download, Edit, Trash2, Calculator } from "lucide-react";

interface PayrollDetailsProps {
  params: {
    payrollId: string;
  };
}

async function getFullPayrollDetails(payrollId: string) {
  const result = await sql`
    SELECT 
      eu.*
    FROM employee_universal eu
    WHERE eu.payroll_id = ${payrollId}
  `;

  return result[0] || null;
}

export default async function PayrollDetailsPage({
  params,
}: PayrollDetailsProps) {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  const payrollDetails = await getFullPayrollDetails(params.payrollId);

  if (!payrollDetails) {
    notFound();
  }

  const {
    employee_id,
    full_name,
    country_name,
    currency_code,
    period_start,
    period_end,
    payroll_type,
    basic_salary,
    bonus,
    overtime_hours,
    overtime_rate,
    net_pay,
    payroll_created_at,

    // India specific
    hra,
    lta,
    provident_fund,
    esic,
    professional_tax,
    gratuity,

    // France specific
    thirteenth_month_bonus,
    mutuelle_sante,
    transport_allowance,
    prevoyance,
    fr_social_security,
    retirement_contribution,
    unemployment_insurance,

    // USA specific
    stock_options_value,
    health_insurance,
    dental_contribution,
    vision_contribution,
    union_dues,
    city_tax,
    us_social_security,
    medicare,
    _401k,
    federal_tax,
    state_tax,
  } = payrollDetails;

  const overtimePay = (overtime_hours || 0) * (overtime_rate || 0);
  const grossPay = (basic_salary || 0) + (bonus || 0) + overtimePay;

  // Calculate deductions based on country
  let deductions: Array<{ label: string; amount: number }> = [];
  let additions: Array<{ label: string; amount: number }> = [];

  switch (country_name?.toLowerCase()) {
    case "india":
      if (hra) additions.push({ label: "HRA", amount: hra });
      if (lta) additions.push({ label: "LTA", amount: lta });
      if (provident_fund)
        deductions.push({ label: "Provident Fund", amount: provident_fund });
      if (esic) deductions.push({ label: "ESIC", amount: esic });
      if (professional_tax)
        deductions.push({
          label: "Professional Tax",
          amount: professional_tax,
        });
      if (gratuity) additions.push({ label: "Gratuity", amount: gratuity });
      break;

    case "france":
      if (thirteenth_month_bonus)
        additions.push({
          label: "13th Month Bonus",
          amount: thirteenth_month_bonus,
        });
      if (transport_allowance)
        additions.push({
          label: "Transport Allowance",
          amount: transport_allowance,
        });
      if (mutuelle_sante)
        deductions.push({ label: "Mutuelle Santé", amount: mutuelle_sante });
      if (prevoyance)
        deductions.push({ label: "Prévoyance", amount: prevoyance });
      if (fr_social_security)
        deductions.push({
          label: "Social Security",
          amount: fr_social_security,
        });
      if (retirement_contribution)
        deductions.push({
          label: "Retirement",
          amount: retirement_contribution,
        });
      if (unemployment_insurance)
        deductions.push({
          label: "Unemployment Insurance",
          amount: unemployment_insurance,
        });
      break;

    case "usa":
      if (stock_options_value)
        additions.push({ label: "Stock Options", amount: stock_options_value });
      if (health_insurance)
        deductions.push({
          label: "Health Insurance",
          amount: health_insurance,
        });
      if (dental_contribution)
        deductions.push({ label: "Dental", amount: dental_contribution });
      if (vision_contribution)
        deductions.push({ label: "Vision", amount: vision_contribution });
      if (union_dues)
        deductions.push({ label: "Union Dues", amount: union_dues });
      if (city_tax) deductions.push({ label: "City Tax", amount: city_tax });
      if (us_social_security)
        deductions.push({
          label: "Social Security",
          amount: us_social_security,
        });
      if (medicare) deductions.push({ label: "Medicare", amount: medicare });
      if (_401k) deductions.push({ label: "401(k)", amount: _401k });
      if (federal_tax)
        deductions.push({ label: "Federal Tax", amount: federal_tax });
      if (state_tax) deductions.push({ label: "State Tax", amount: state_tax });
      break;
  }

  const totalAdditions = additions.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = deductions.reduce(
    (sum, item) => sum + item.amount,
    0
  );

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
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/payroll-management">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Payroll
                </Link>
              </Button>
              <div>
                <h1 className="text-3xl font-bold">Payroll Details</h1>
                <p className="text-muted-foreground text-lg">
                  {full_name} - {country_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline">
                <Edit className="w-4 h-4 mr-2" />
                Edit
              </Button>
              <Button variant="outline">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button
                variant="outline"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Employee & Period Info */}
            <div className="lg:col-span-1 space-y-6">
              {/* Employee Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Employee Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Name
                    </span>
                    <p className="text-lg font-semibold">{full_name}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Employee ID
                    </span>
                    <p>{employee_id}</p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Country
                    </span>
                    <div className="mt-1">
                      <Badge variant="outline">{country_name}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Currency
                    </span>
                    <p>{currency_code}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Pay Period Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Pay Period</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Period
                    </span>
                    <p>
                      {new Date(period_start).toLocaleDateString()} -{" "}
                      {new Date(period_end).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Payroll Type
                    </span>
                    <div className="mt-1">
                      <Badge variant="secondary">{payroll_type}</Badge>
                    </div>
                  </div>
                  <div>
                    <span className="text-sm font-medium text-muted-foreground">
                      Created
                    </span>
                    <p>{new Date(payroll_created_at).toLocaleDateString()}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Payroll Breakdown */}
            <div className="lg:col-span-2 space-y-6">
              {/* Salary Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calculator className="w-5 h-5" />
                    Salary Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Basic Components */}
                    <div className="space-y-3">
                      <h3 className="font-medium text-lg">Basic Components</h3>
                      <div className="grid gap-3">
                        <div className="flex justify-between items-center py-2">
                          <span>Basic Salary</span>
                          <span className="font-medium">
                            {formatCurrency(basic_salary, currency_code)}
                          </span>
                        </div>
                        {bonus > 0 && (
                          <div className="flex justify-between items-center py-2">
                            <span>Bonus</span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(bonus, currency_code)}
                            </span>
                          </div>
                        )}
                        {overtimePay > 0 && (
                          <div className="flex justify-between items-center py-2">
                            <span>
                              Overtime Pay ({overtime_hours}h ×{" "}
                              {formatCurrency(overtime_rate, currency_code)})
                            </span>
                            <span className="font-medium text-green-600">
                              {formatCurrency(overtimePay, currency_code)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <Separator />

                    {/* Additions */}
                    {additions.length > 0 && (
                      <>
                        <div className="space-y-3">
                          <h3 className="font-medium text-lg text-green-600">
                            Additions
                          </h3>
                          <div className="grid gap-3">
                            {additions.map((addition, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2"
                              >
                                <span>{addition.label}</span>
                                <span className="font-medium text-green-600">
                                  +
                                  {formatCurrency(
                                    addition.amount,
                                    currency_code
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center py-2 border-t">
                            <span className="font-medium">Total Additions</span>
                            <span className="font-bold text-green-600">
                              +{formatCurrency(totalAdditions, currency_code)}
                            </span>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Deductions */}
                    {deductions.length > 0 && (
                      <>
                        <div className="space-y-3">
                          <h3 className="font-medium text-lg text-red-600">
                            Deductions
                          </h3>
                          <div className="grid gap-3">
                            {deductions.map((deduction, index) => (
                              <div
                                key={index}
                                className="flex justify-between items-center py-2"
                              >
                                <span>{deduction.label}</span>
                                <span className="font-medium text-red-600">
                                  -
                                  {formatCurrency(
                                    deduction.amount,
                                    currency_code
                                  )}
                                </span>
                              </div>
                            ))}
                          </div>
                          <div className="flex justify-between items-center py-2 border-t">
                            <span className="font-medium">
                              Total Deductions
                            </span>
                            <span className="font-bold text-red-600">
                              -{formatCurrency(totalDeductions, currency_code)}
                            </span>
                          </div>
                        </div>
                        <Separator />
                      </>
                    )}

                    {/* Final Calculation */}
                    <div className="space-y-3 bg-accent/50 p-4 rounded-lg">
                      <div className="flex justify-between items-center py-1">
                        <span className="font-medium">Gross Pay</span>
                        <span className="font-bold">
                          {formatCurrency(
                            grossPay + totalAdditions,
                            currency_code
                          )}
                        </span>
                      </div>
                      <div className="flex justify-between items-center py-1">
                        <span className="font-medium">Total Deductions</span>
                        <span className="font-bold text-red-600">
                          -{formatCurrency(totalDeductions, currency_code)}
                        </span>
                      </div>
                      <Separator />
                      <div className="flex justify-between items-center py-2">
                        <span className="text-lg font-bold">Net Pay</span>
                        <span className="text-2xl font-bold text-primary">
                          {formatCurrency(net_pay, currency_code)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
