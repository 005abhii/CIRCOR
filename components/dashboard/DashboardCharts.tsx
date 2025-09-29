"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";

interface DashboardChartsProps {
  role: string;
  employeeData: any[];
  payrollData: any[];
}

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

export default function DashboardCharts({
  role,
  employeeData,
  payrollData,
}: DashboardChartsProps) {
  const formatCurrency = (value: number, currency?: string) => {
    const symbol = currency === "INR" ? "₹" : currency === "EUR" ? "€" : "$";
    return `${symbol}${(value / 1000).toFixed(0)}K`;
  };

  const formatMonth = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      year: "2-digit",
    });
  };

  const formatName = (fullName: string) => {
    // Truncate long names for better chart display
    return fullName.length > 15 ? `${fullName.substring(0, 15)}...` : fullName;
  };

  if (role === "admin") {
    return (
      <>
        {/* Global Employee Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Global Employee Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={employeeData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ country_name, employee_count, percent }) =>
                    `${country_name}: ${employee_count} (${(
                      percent * 100
                    ).toFixed(0)}%)`
                  }
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="employee_count"
                  nameKey="country_name"
                >
                  {employeeData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Global Payroll by Region */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Payroll by Region</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={payrollData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="country_name" />
                <YAxis tickFormatter={(value) => formatCurrency(value)} />
                <Tooltip
                  formatter={(value: number, name, props) => [
                    formatCurrency(value, props.payload.currency_code),
                    "Total Payroll",
                  ]}
                />
                <Bar dataKey="total_payroll" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </>
    );
  }

  // Regional admin charts - NEW DATA STRUCTURE
  const regionName =
    role === "india_admin"
      ? "India"
      : role === "france_admin"
      ? "France"
      : "US";

  const currencyCode =
    role === "india_admin" ? "INR" : role === "france_admin" ? "EUR" : "USD";

  // Format employee data for highest paid employees chart
  const highestPaidData = employeeData.map((item) => ({
    ...item,
    display_name: formatName(item.full_name),
    full_name: item.full_name, // Keep full name for tooltip
  }));

  // Format payroll data for high overtime chart
  const highOvertimeData = payrollData.map((item) => ({
    ...item,
    display_name: formatName(item.full_name),
    full_name: item.full_name, // Keep full name for tooltip
    period: `${formatMonth(item.period_start)} - ${formatMonth(
      item.period_end
    )}`,
  }));

  return (
    <>
      {/* Highest Paid Employees - PIE CHART
      <Card>
        <CardHeader>
          <CardTitle>{regionName} - Salary Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={highestPaidData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ display_name, highest_salary, percent }) =>
                  `${display_name}: ${formatCurrency(
                    highest_salary,
                    currencyCode
                  )} (${(percent * 100).toFixed(1)}%)`
                }
                outerRadius={100}
                fill="#8884d8"
                dataKey="highest_salary"
                nameKey="display_name"
              >
                {highestPaidData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number) => [
                  formatCurrency(value, currencyCode),
                  "Salary",
                ]}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Overtime Records - SIMPLIFIED BAR CHART */}
      {/* <Card>
        <CardHeader>
          <CardTitle>{regionName} - Overtime Hours by Employee</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={highOvertimeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="display_name"
                angle={-45}
                textAnchor="end"
                height={80}
                tick={{ fontSize: 10 }}
              />
              <YAxis tickFormatter={(value) => `${value}h`} />
              <Tooltip
                formatter={(value: number) => [
                  `${value} hours`,
                  "Overtime Hours",
                ]}
                labelFormatter={(label: any, payload: any) =>
                  payload?.[0]?.payload?.full_name || label
                }
              />
              <Bar dataKey="overtime_hours" fill="#00C49F" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>  */}
    </>
  );
}
