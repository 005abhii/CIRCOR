// lib/payroll-utils.ts
import { sql } from "@/lib/db";

export interface PayrollCalculation {
  basicSalary: number;
  bonus: number;
  overtimePay: number;
  grossPay: number;
  deductions: CountrySpecificDeductions;
  netPay: number;
  currency: string;
}

export interface CountrySpecificDeductions {
  // India
  hra?: number;
  lta?: number;
  providentFund?: number;
  esic?: number;
  professionalTax?: number;
  gratuity?: number;

  // France
  thirteenthMonthBonus?: number;
  mutuelleSante?: number;
  transportAllowance?: number;
  prevoyance?: number;
  socialSecurity?: number;
  retirementContribution?: number;
  unemploymentInsurance?: number;

  // USA
  stockOptionsValue?: number;
  healthInsurance?: number;
  dentalContribution?: number;
  visionContribution?: number;
  unionDues?: number;
  cityTax?: number;
  socialSecurityTax?: number;
  medicare?: number;
  k401?: number;
  federalTax?: number;
  stateTax?: number;
}

export async function calculatePayroll(
  employeeId: string,
  basicSalary: number,
  bonus: number = 0,
  overtimeHours: number = 0,
  overtimeRate: number = 0
): Promise<PayrollCalculation> {
  // Get employee's country and currency
  const employeeData = await sql`
    SELECT c.country_name, e.currency_code
    FROM employee e
    JOIN country c ON e.country_id = c.country_id
    WHERE e.employee_id = ${employeeId}
  `;

  if (employeeData.length === 0) {
    throw new Error("Employee not found");
  }

  const { country_name: countryName, currency_code: currency } =
    employeeData[0];
  const overtimePay = overtimeHours * overtimeRate;
  const grossPay = basicSalary + bonus + overtimePay;

  let deductions: CountrySpecificDeductions = {};
  let totalDeductions = 0;

  switch (countryName.toLowerCase()) {
    case "india":
      deductions = calculateIndiaDeductions(basicSalary);
      totalDeductions =
        (deductions.providentFund || 0) +
        (deductions.esic || 0) +
        (deductions.professionalTax || 0);
      break;

    case "france":
      deductions = calculateFranceDeductions(basicSalary);
      totalDeductions =
        (deductions.socialSecurity || 0) +
        (deductions.retirementContribution || 0) +
        (deductions.unemploymentInsurance || 0);
      break;

    case "usa":
      deductions = calculateUSADeductions(basicSalary);
      totalDeductions =
        (deductions.socialSecurityTax || 0) +
        (deductions.medicare || 0) +
        (deductions.federalTax || 0) +
        (deductions.stateTax || 0) +
        (deductions.cityTax || 0) +
        (deductions.healthInsurance || 0);
      break;
  }

  const netPay = grossPay - totalDeductions;

  return {
    basicSalary,
    bonus,
    overtimePay,
    grossPay,
    deductions,
    netPay,
    currency,
  };
}

function calculateIndiaDeductions(
  basicSalary: number
): CountrySpecificDeductions {
  return {
    hra: basicSalary * 0.4, // 40% HRA
    lta: basicSalary * 0.1, // 10% LTA
    providentFund: basicSalary * 0.12, // 12% PF
    esic: Math.min(basicSalary * 0.0075, 150), // ESIC capped at 150
    professionalTax: 200, // Fixed professional tax
    gratuity: basicSalary * 0.04807, // Gratuity calculation
  };
}

function calculateFranceDeductions(
  basicSalary: number
): CountrySpecificDeductions {
  return {
    thirteenthMonthBonus: basicSalary / 12, // 13th month bonus (addition)
    mutuelleSante: basicSalary * 0.025, // Health insurance 2.5%
    transportAllowance: 50, // Fixed transport allowance (addition)
    prevoyance: basicSalary * 0.015, // Prevoyance 1.5%
    socialSecurity: basicSalary * 0.228, // Social security 22.8%
    retirementContribution: basicSalary * 0.0751, // Retirement 7.51%
    unemploymentInsurance: basicSalary * 0.057, // Unemployment 5.7%
  };
}

function calculateUSADeductions(
  basicSalary: number
): CountrySpecificDeductions {
  return {
    stockOptionsValue: 0, // Stock options (variable)
    healthInsurance: basicSalary * 0.05, // Health insurance 5%
    dentalContribution: basicSalary * 0.01, // Dental 1%
    visionContribution: basicSalary * 0.005, // Vision 0.5%
    unionDues: 0, // Union dues (variable)
    cityTax: basicSalary * 0.01, // City tax 1%
    socialSecurityTax: basicSalary * 0.062, // Social Security 6.2%
    medicare: basicSalary * 0.0145, // Medicare 1.45%
    k401: basicSalary * 0.06, // 401k contribution 6%
    federalTax: basicSalary * 0.22, // Federal tax 22%
    stateTax: basicSalary * 0.05, // State tax 5%
  };
}

export async function getPayrollDetails(payrollId: string) {
  const result = await sql`
    SELECT 
      eu.*
    FROM employee_universal eu
    WHERE eu.payroll_id = ${payrollId}
  `;

  return result[0] || null;
}

export async function getPayrollSummaryByPeriod(payPeriodId: number) {
  const result = await sql`
    SELECT 
      COUNT(*) as total_employees,
      SUM(basic_salary) as total_basic_salary,
      SUM(bonus) as total_bonus,
      SUM(net_pay) as total_net_pay,
      AVG(net_pay) as average_net_pay,
      country_name,
      currency_code
    FROM employee_universal
    WHERE pay_period_id = ${payPeriodId}
    GROUP BY country_name, currency_code
  `;

  return result;
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const currencyMap: Record<string, string> = {
    INR: "en-IN",
    EUR: "en-FR",
    USD: "en-US",
  };

  const locale = currencyMap[currencyCode] || "en-US";

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

export function validatePayrollData(data: {
  employeeId: string;
  basicSalary: number;
  payPeriodId: number;
  payrollTypeId: number;
}) {
  const errors: string[] = [];

  if (!data.employeeId) {
    errors.push("Employee ID is required");
  }

  if (!data.basicSalary || data.basicSalary <= 0) {
    errors.push("Basic salary must be greater than 0");
  }

  if (!data.payPeriodId) {
    errors.push("Pay period is required");
  }

  if (!data.payrollTypeId) {
    errors.push("Payroll type is required");
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
