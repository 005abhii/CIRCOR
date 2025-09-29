// PayrollTable.tsx
"use client";

import { useState } from "react";
import { EditPayrollForm } from "./EditPayrollForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Edit, X, Search } from "lucide-react";

import type { PayrollData, Employee, PayPeriod, PayrollType } from "./page";

// format helpers
function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount);
}
function formatDate(date: string) {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

interface PayrollTableProps {
  payrollData: PayrollData[];
  employees?: Employee[];
  payPeriods?: PayPeriod[];
  payrollTypes?: PayrollType[];
}

export function PayrollTable({
  payrollData,
  employees = [],
  payPeriods = [],
  payrollTypes = [],
}: PayrollTableProps) {
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(
    null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Filter payroll data based on search term
  const filteredPayrollData = payrollData.filter((payroll) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      payroll.full_name.toLowerCase().includes(searchLower) ||
      payroll.country_name.toLowerCase().includes(searchLower) ||
      payroll.payroll_type.toLowerCase().includes(searchLower) ||
      payroll.net_pay.toString().includes(searchTerm) ||
      payroll.basic_salary.toString().includes(searchTerm) ||
      formatDate(payroll.period_start).toLowerCase().includes(searchLower) ||
      formatDate(payroll.period_end).toLowerCase().includes(searchLower)
    );
  });

  const handleEditClick = (payroll: PayrollData) => {
    setSelectedPayroll(payroll);
    setIsSidebarOpen(true);
  };

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
    setSelectedPayroll(null);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  return (
    <div className="relative">
      <div
        className={`transition-all duration-300 ${
          isSidebarOpen ? "mr-96" : ""
        }`}
      >
        {/* Search Bar */}
        <div className="mb-4 flex items-center gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by employee, country, type, amount..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <button
                onClick={clearSearch}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-muted rounded"
              >
                <X className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
          {searchTerm && (
            <div className="text-sm text-muted-foreground">
              {filteredPayrollData.length} of {payrollData.length} records
            </div>
          )}
        </div>

        <div className="rounded-md border overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableCell className="font-semibold">Employee</TableCell>
                  <TableCell className="font-semibold">Type</TableCell>
                  <TableCell className="font-semibold">Period</TableCell>
                  <TableCell className="font-semibold text-right">
                    Basic Salary
                  </TableCell>
                  <TableCell className="font-semibold text-right">
                    Bonus
                  </TableCell>
                  <TableCell className="font-semibold text-center">
                    OT Hours
                  </TableCell>
                  <TableCell className="font-semibold text-right">
                    OT Rate
                  </TableCell>
                  <TableCell className="font-semibold text-right">
                    Net Pay
                  </TableCell>
                  <TableCell className="font-semibold text-center">
                    Created
                  </TableCell>
                  <TableCell className="font-semibold text-center">
                    Actions
                  </TableCell>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPayrollData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={10}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchTerm
                        ? `No payroll records found matching "${searchTerm}"`
                        : "No payroll records found"}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredPayrollData.map((payroll) => (
                    <TableRow
                      key={payroll.payroll_id}
                      className={`hover:bg-muted/30 transition-colors ${
                        selectedPayroll?.payroll_id === payroll.payroll_id
                          ? "bg-blue-50 border-l-4 border-blue-500"
                          : ""
                      }`}
                    >
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-medium">{payroll.full_name}</div>
                          <div className="text-xs text-muted-foreground">
                            {payroll.country_name}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                          {payroll.payroll_type}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(payroll.period_start)}</div>
                          <div className="text-xs text-muted-foreground">
                            to {formatDate(payroll.period_end)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(
                          payroll.basic_salary,
                          payroll.currency_code
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        {payroll.bonus > 0
                          ? formatCurrency(payroll.bonus, payroll.currency_code)
                          : "-"}
                      </TableCell>
                      <TableCell className="text-center">
                        {payroll.overtime_hours > 0
                          ? payroll.overtime_hours
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        {payroll.overtime_rate > 0
                          ? formatCurrency(
                              payroll.overtime_rate,
                              payroll.currency_code
                            )
                          : "-"}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-green-600">
                        {formatCurrency(payroll.net_pay, payroll.currency_code)}
                      </TableCell>
                      <TableCell className="text-center text-sm text-muted-foreground">
                        {formatDate(payroll.created_at)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant={
                            selectedPayroll?.payroll_id === payroll.payroll_id
                              ? "default"
                              : "ghost"
                          }
                          size="sm"
                          onClick={() => handleEditClick(payroll)}
                          className="h-8 w-8 p-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Sidebar */}
      {isSidebarOpen && (
        <div className="fixed right-0 top-0 h-full w-96 bg-white border-l shadow-lg z-50 flex flex-col">
          {/* Sidebar Header */}
          <div className="flex items-center justify-between p-6 border-b bg-gray-50">
            <h2 className="text-xl font-semibold">Edit Payroll</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSidebarClose}
              className="h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Sidebar Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {selectedPayroll && (
              <EditPayrollForm
                payroll={selectedPayroll}
                employees={employees}
                payPeriods={payPeriods}
                payrollTypes={payrollTypes}
              />
            )}
          </div>
        </div>
      )}

      {/* Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
          onClick={handleSidebarClose}
        />
      )}
    </div>
  );
}
