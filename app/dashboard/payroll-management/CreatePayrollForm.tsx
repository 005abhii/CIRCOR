"use client";

import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, X, CheckSquare, Square, ChevronDown } from "lucide-react";
import { useToast } from "./components/ui/toast";

interface Employee {
  employee_id: string;
  full_name: string;
  country_name: string;
  currency_code: string;
}

interface PayPeriod {
  pay_period_id: number;
  period_start: string;
  period_end: string;
}

interface PayrollType {
  payroll_type_id: number;
  type_name: string;
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getCurrencySymbol(countryName: string): string {
  const countryLower = countryName.toLowerCase();
  switch (countryLower) {
    case "india":
      return "₹";
    case "france":
      return "€";
    case "usa":
      return "$";
    default:
      return "$";
  }
}

function formatCurrencyDisplay(amount: number, countryName: string): string {
  const symbol = getCurrencySymbol(countryName);
  return `${symbol}${amount.toFixed(2)}`;
}

function getDaysBetween(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

function filterPayPeriodsByCountry(
  payPeriods: PayPeriod[],
  countryName: string
): PayPeriod[] {
  if (!countryName) return payPeriods;

  const countryLower = countryName.toLowerCase();

  return payPeriods.filter((period) => {
    const days = getDaysBetween(period.period_start, period.period_end);

    if (countryLower === "usa") {
      return days >= 10 && days <= 20;
    }

    if (countryLower === "india" || countryLower === "france") {
      return days >= 25 && days <= 35;
    }

    return true;
  });
}

export function CreatePayrollForm({
  employees,
  payPeriods,
  payrollTypes,
}: {
  employees: Employee[];
  payPeriods: PayPeriod[];
  payrollTypes: PayrollType[];
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState("");
  const [selectedPayPeriod, setSelectedPayPeriod] = useState("");
  const [selectedPayrollTypes, setSelectedPayrollTypes] = useState<number[]>(
    []
  );
  const [showPayrollTypeDropdown, setShowPayrollTypeDropdown] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [showEmployeeDropdown, setShowEmployeeDropdown] = useState(false);

  // Form values
  const [basicSalary, setBasicSalary] = useState(0);
  const [bonus, setBonus] = useState(0);
  const [commission, setCommission] = useState(0);
  const [overtimeHours, setOvertimeHours] = useState(0);
  const [overtimeRate, setOvertimeRate] = useState(0);
  const [netPay, setNetPay] = useState(0);
  const { showToast, ToastContainer } = useToast();

  const selectedEmployeeData = employees.find(
    (emp) => emp.employee_id === selectedEmployee
  );
  const selectedCountry = selectedEmployeeData?.country_name || "";
  const currencySymbol = selectedCountry
    ? getCurrencySymbol(selectedCountry)
    : "$";

  const filteredPayPeriods = useMemo(() => {
    return filterPayPeriodsByCountry(payPeriods, selectedCountry);
  }, [payPeriods, selectedCountry]);

  useEffect(() => {
    setSelectedPayPeriod("");
  }, [selectedEmployee]);

  const filteredEmployees = employees.filter(
    (employee) =>
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.country_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSelectedEmployeeName = () => {
    const employee = employees.find(
      (emp) => emp.employee_id === selectedEmployee
    );
    return employee
      ? `${employee.full_name} (${employee.country_name})`
      : "Select employee";
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setShowEmployeeDropdown(false);
    setSearchTerm("");
  };

  const clearEmployeeSelection = () => {
    setSelectedEmployee("");
    setSearchTerm("");
  };

  // Toggle payroll type selection
  const togglePayrollType = (typeId: number) => {
    setSelectedPayrollTypes((prev) =>
      prev.includes(typeId)
        ? prev.filter((id) => id !== typeId)
        : [...prev, typeId]
    );
  };

  // Get selected type names for display
  const getSelectedTypeNames = () => {
    if (selectedPayrollTypes.length === 0) return "Select payroll types";
    return selectedPayrollTypes
      .map(
        (id) => payrollTypes.find((t) => t.payroll_type_id === id)?.type_name
      )
      .filter(Boolean)
      .join(", ");
  };

  // Calculate net pay based on selected types
  useEffect(() => {
    let calculatedNetPay = basicSalary;

    selectedPayrollTypes.forEach((typeId) => {
      const type = payrollTypes.find((t) => t.payroll_type_id === typeId);
      if (type) {
        switch (type.type_name.toLowerCase()) {
          case "bonus":
            calculatedNetPay += bonus;
            break;
          case "commission":
            calculatedNetPay += commission;
            break;
          case "overtime":
            calculatedNetPay += overtimeHours * overtimeRate;
            break;
        }
      }
    });

    setNetPay(calculatedNetPay);
  }, [
    basicSalary,
    bonus,
    commission,
    overtimeHours,
    overtimeRate,
    selectedPayrollTypes,
    payrollTypes,
  ]);

  // Reset optional fields when types are deselected
  useEffect(() => {
    const hasBonus = selectedPayrollTypes.some(
      (id) =>
        payrollTypes
          .find((t) => t.payroll_type_id === id)
          ?.type_name.toLowerCase() === "bonus"
    );
    const hasCommission = selectedPayrollTypes.some(
      (id) =>
        payrollTypes
          .find((t) => t.payroll_type_id === id)
          ?.type_name.toLowerCase() === "commission"
    );
    const hasOvertime = selectedPayrollTypes.some(
      (id) =>
        payrollTypes
          .find((t) => t.payroll_type_id === id)
          ?.type_name.toLowerCase() === "overtime"
    );

    if (!hasBonus) setBonus(0);
    if (!hasCommission) setCommission(0);
    if (!hasOvertime) {
      setOvertimeHours(0);
      setOvertimeRate(0);
    }
  }, [selectedPayrollTypes, payrollTypes]);

  const shouldShowField = (fieldName: string) => {
    return selectedPayrollTypes.some((typeId) => {
      const type = payrollTypes.find((t) => t.payroll_type_id === typeId);
      return type?.type_name.toLowerCase() === fieldName;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      const formData = new FormData();
      formData.append("employee_id", selectedEmployee);
      formData.append("pay_period_id", selectedPayPeriod);
      formData.append("payroll_type_ids", JSON.stringify(selectedPayrollTypes));
      formData.append("basic_salary", basicSalary.toString());
      formData.append("bonus", bonus.toString());
      formData.append("commission", commission.toString());
      formData.append("overtime_hours", overtimeHours.toString());
      formData.append("overtime_rate", overtimeRate.toString());
      formData.append("net_pay", netPay.toString());

      const response = await fetch("/api/payroll/create", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showToast("✅ Payroll created successfully!", "success");
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        showToast(`❌ ${result.error || "Failed to create payroll"}`, "error");
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      showToast("⚠️ Failed to create payroll. Please try again.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="employee_id">Employee *</Label>
            <div className="relative">
              <div
                className="flex items-center justify-between w-full px-3 py-2 text-sm border border-input bg-background rounded-md cursor-pointer hover:bg-accent"
                onClick={() => setShowEmployeeDropdown(!showEmployeeDropdown)}
              >
                <span
                  className={
                    selectedEmployee
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }
                >
                  {getSelectedEmployeeName()}
                </span>
                <div className="flex items-center gap-1">
                  {selectedEmployee && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearEmployeeSelection();
                      }}
                      className="p-1 hover:bg-muted rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                  <Search className="w-4 h-4 text-muted-foreground" />
                </div>
              </div>

              {showEmployeeDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                  <div className="p-2 border-b">
                    <div className="relative">
                      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search employees..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8"
                        autoFocus
                      />
                    </div>
                  </div>

                  <div className="max-h-60 overflow-y-auto">
                    {filteredEmployees.length > 0 ? (
                      filteredEmployees.map((employee) => (
                        <div
                          key={employee.employee_id}
                          className="px-3 py-2 text-sm hover:bg-accent cursor-pointer border-b last:border-b-0"
                          onClick={() =>
                            handleEmployeeSelect(employee.employee_id)
                          }
                        >
                          <div className="font-medium">
                            {employee.full_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {getCurrencySymbol(employee.country_name)}{" "}
                            {employee.country_name} • {employee.currency_code}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                        No employees found matching "{searchTerm}"
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <input
              type="hidden"
              name="employee_id"
              value={selectedEmployee}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="pay_period_id">
              Pay Period *
              {selectedCountry && (
                <span className="text-xs text-muted-foreground ml-2">
                  ({selectedCountry === "USA" ? "Bi-weekly" : "Monthly"})
                </span>
              )}
            </Label>
            <Select
              name="pay_period_id"
              value={selectedPayPeriod}
              onValueChange={setSelectedPayPeriod}
              required
              disabled={!selectedEmployee}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    !selectedEmployee
                      ? "Select employee first"
                      : "Select pay period"
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {filteredPayPeriods.length > 0 ? (
                  filteredPayPeriods.map((period) => {
                    const days = getDaysBetween(
                      period.period_start,
                      period.period_end
                    );
                    return (
                      <SelectItem
                        key={period.pay_period_id}
                        value={period.pay_period_id.toString()}
                      >
                        {formatDate(period.period_start)} -{" "}
                        {formatDate(period.period_end)}
                        <span className="text-xs text-muted-foreground ml-2">
                          ({days} days)
                        </span>
                      </SelectItem>
                    );
                  })
                ) : (
                  <SelectItem value="no-periods" disabled>
                    No {selectedCountry === "USA" ? "bi-weekly" : "monthly"}{" "}
                    periods available
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Multi-Select Payroll Types */}
          <div className="space-y-2 md:col-span-2">
            <Label>Payroll Types * (Select one or more)</Label>
            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setShowPayrollTypeDropdown(!showPayrollTypeDropdown)
                }
                className="flex items-center justify-between w-full px-3 py-2 text-sm border border-input bg-background rounded-md cursor-pointer hover:bg-accent"
              >
                <span
                  className={
                    selectedPayrollTypes.length === 0
                      ? "text-muted-foreground"
                      : "text-foreground"
                  }
                >
                  {getSelectedTypeNames()}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground transition-transform ${
                    showPayrollTypeDropdown ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showPayrollTypeDropdown && (
                <div className="absolute z-50 w-full mt-1 bg-popover border rounded-md shadow-lg">
                  {payrollTypes.map((type) => (
                    <div
                      key={type.payroll_type_id}
                      onClick={() => togglePayrollType(type.payroll_type_id)}
                      className="flex items-center px-3 py-2 hover:bg-accent cursor-pointer border-b last:border-b-0"
                    >
                      {selectedPayrollTypes.includes(type.payroll_type_id) ? (
                        <CheckSquare className="w-4 h-4 text-primary mr-3" />
                      ) : (
                        <Square className="w-4 h-4 text-muted-foreground mr-3" />
                      )}
                      <span className="text-sm font-medium">
                        {type.type_name}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Selected Types Display */}
            {selectedPayrollTypes.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedPayrollTypes.map((typeId) => {
                  const type = payrollTypes.find(
                    (t) => t.payroll_type_id === typeId
                  );
                  return (
                    <span
                      key={typeId}
                      className="inline-flex items-center px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium"
                    >
                      {type?.type_name}
                      <button
                        type="button"
                        onClick={() => togglePayrollType(typeId)}
                        className="ml-2 hover:bg-primary/20 rounded-full p-0.5"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="basic_salary">Basic Salary *</Label>
            <Input
              id="basic_salary"
              name="basic_salary"
              type="number"
              step="0.01"
              min="0"
              value={basicSalary || ""}
              onChange={(e) => setBasicSalary(Number(e.target.value) || 0)}
              placeholder="e.g. 5000.00"
              required
            />
          </div>
        </div>

        {/* Dynamic Fields Based on Payroll Types */}
        {selectedPayrollTypes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Additional Compensation Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                {shouldShowField("bonus") && (
                  <div className="space-y-2">
                    <Label htmlFor="bonus">Bonus Amount *</Label>
                    <Input
                      id="bonus"
                      name="bonus"
                      type="number"
                      step="0.01"
                      min="0"
                      value={bonus || ""}
                      onChange={(e) => setBonus(Number(e.target.value) || 0)}
                      placeholder="e.g. 1500.00"
                      required
                    />
                  </div>
                )}

                {shouldShowField("commission") && (
                  <div className="space-y-2">
                    <Label htmlFor="commission">Commission Amount *</Label>
                    <Input
                      id="commission"
                      name="commission"
                      type="number"
                      step="0.01"
                      min="0"
                      value={commission || ""}
                      onChange={(e) =>
                        setCommission(Number(e.target.value) || 0)
                      }
                      placeholder="e.g. 2000.00"
                      required
                    />
                  </div>
                )}

                {shouldShowField("overtime") && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="overtime_hours">Overtime Hours *</Label>
                      <Input
                        id="overtime_hours"
                        name="overtime_hours"
                        type="number"
                        step="0.25"
                        min="0"
                        value={overtimeHours || ""}
                        onChange={(e) =>
                          setOvertimeHours(Number(e.target.value) || 0)
                        }
                        placeholder="e.g. 8.5 hours"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="overtime_rate">Overtime Rate *</Label>
                      <Input
                        id="overtime_rate"
                        name="overtime_rate"
                        type="number"
                        step="0.01"
                        min="0"
                        value={overtimeRate || ""}
                        onChange={(e) =>
                          setOvertimeRate(Number(e.target.value) || 0)
                        }
                        placeholder="e.g. 45.00 per hour"
                        required
                      />
                    </div>
                  </>
                )}
              </div>

              {/* Calculation Summary */}
              {selectedEmployee && (
                <div className="mt-4 p-4 bg-muted/30 rounded-lg">
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">
                    Calculation Breakdown:
                  </h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span>Basic Salary:</span>
                      <span>
                        {formatCurrencyDisplay(basicSalary, selectedCountry)}
                      </span>
                    </div>

                    {shouldShowField("bonus") && bonus > 0 && (
                      <div className="flex justify-between">
                        <span>Bonus:</span>
                        <span>
                          {formatCurrencyDisplay(bonus, selectedCountry)}
                        </span>
                      </div>
                    )}

                    {shouldShowField("commission") && commission > 0 && (
                      <div className="flex justify-between">
                        <span>Commission:</span>
                        <span>
                          {formatCurrencyDisplay(commission, selectedCountry)}
                        </span>
                      </div>
                    )}

                    {shouldShowField("overtime") &&
                      overtimeHours > 0 &&
                      overtimeRate > 0 && (
                        <div className="flex justify-between">
                          <span>
                            Overtime ({overtimeHours}h × {currencySymbol}
                            {overtimeRate}):
                          </span>
                          <span>
                            {formatCurrencyDisplay(
                              overtimeHours * overtimeRate,
                              selectedCountry
                            )}
                          </span>
                        </div>
                      )}

                    <div className="border-t pt-1 mt-2 flex justify-between font-medium">
                      <span>Total Net Pay:</span>
                      <span>
                        {formatCurrencyDisplay(netPay, selectedCountry)}
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Net Pay */}
        <div className="space-y-2">
          <Label htmlFor="net_pay">Net Pay (Auto-calculated)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground font-semibold">
              {currencySymbol}
            </span>
            <Input
              id="net_pay"
              name="net_pay"
              type="text"
              value={netPay.toFixed(2)}
              readOnly
              className="bg-muted font-semibold text-lg pl-8"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline">
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={
              isSubmitting ||
              !selectedEmployee ||
              !selectedPayPeriod ||
              selectedPayrollTypes.length === 0 ||
              filteredPayPeriods.length === 0
            }
          >
            {isSubmitting ? "Creating..." : "Create Payroll"}
          </Button>
        </div>
      </form>
    </>
  );
}
