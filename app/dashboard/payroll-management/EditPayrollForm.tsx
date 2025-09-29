// EditPayrollForm.tsx with Toast Notifications
"use client";

import { useState, useEffect } from "react";
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
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  DollarSign,
  Clock,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useToast } from "./components/ui/toast"; // Import the toast hook

import type { PayrollData, Employee, PayPeriod, PayrollType } from "./page";

interface EditPayrollFormProps {
  payroll: PayrollData;
  employees?: Employee[];
  payPeriods?: PayPeriod[];
  payrollTypes?: PayrollType[];
}

function formatCurrency(amount: number, currencyCode: string): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function EditPayrollForm({
  payroll,
  employees = [],
  payPeriods = [],
  payrollTypes = [],
}: EditPayrollFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPayrollType, setSelectedPayrollType] = useState(
    payroll.payroll_type_id.toString()
  );
  const [selectedPayPeriod, setSelectedPayPeriod] = useState(
    payroll.pay_period_id.toString()
  );

  // Toast notifications
  const { showToast, ToastContainer } = useToast();

  // Form state for calculations
  const [basicSalary, setBasicSalary] = useState(
    Number(payroll.basic_salary) || 0
  );
  const [bonus, setBonus] = useState(Number(payroll.bonus) || 0);
  const [overtimeHours, setOvertimeHours] = useState(
    Number(payroll.overtime_hours) || 0
  );
  const [overtimeRate, setOvertimeRate] = useState(
    Number(payroll.overtime_rate) || 0
  );
  const [netPay, setNetPay] = useState(Number(payroll.net_pay) || 0);

  // Get selected payroll type name
  const selectedPayrollTypeName =
    payrollTypes.find(
      (type) => type.payroll_type_id.toString() === selectedPayrollType
    )?.type_name || payroll.payroll_type;

  // Calculate net pay based on payroll type and values
  useEffect(() => {
    let calculatedNetPay = 0;
    const overtimePay = overtimeHours * overtimeRate;

    switch (selectedPayrollTypeName.toLowerCase()) {
      case "regular":
        calculatedNetPay = basicSalary;
        break;
      case "bonus":
        calculatedNetPay = basicSalary + bonus;
        break;
      case "commission":
        calculatedNetPay = basicSalary + bonus; // Assuming bonus field is used for commission
        break;
      case "overtime":
        calculatedNetPay = basicSalary + overtimePay;
        break;
      default:
        // For unknown types, calculate basic + all additions
        calculatedNetPay = basicSalary + bonus + overtimePay;
    }

    setNetPay(calculatedNetPay);
  }, [
    basicSalary,
    bonus,
    overtimeHours,
    overtimeRate,
    selectedPayrollTypeName,
  ]);

  // Calculate overtime pay
  const overtimePay = overtimeHours * overtimeRate;

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);

    try {
      // Get the selected pay period data
      const selectedPeriod = payPeriods.find(
        (period) => period.pay_period_id.toString() === selectedPayPeriod
      );

      // Prepare JSON data with proper number conversion
      const updateData = {
        payroll_type_id: parseInt(selectedPayrollType),
        pay_period_id: parseInt(selectedPayPeriod),
        basic_salary: Number(basicSalary),
        bonus: Number(bonus),
        overtime_hours: Number(overtimeHours),
        overtime_rate: Number(overtimeRate),
        net_pay: Number(netPay),
        // Include period dates from the selected period or current payroll
        period_start: selectedPeriod
          ? selectedPeriod.period_start
          : payroll.period_start,
        period_end: selectedPeriod
          ? selectedPeriod.period_end
          : payroll.period_end,
        payroll_type: selectedPayrollTypeName,
      };

      console.log("Sending update data:", updateData);

      const response = await fetch(`/api/payroll/${payroll.payroll_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (response.ok) {
        // Success toast
        showToast(
          `Payroll updated successfully for ${
            payroll.full_name
          }! Net pay: ${formatCurrency(Number(netPay), payroll.currency_code)}`,
          "success"
        );

        // Reload after a short delay to show the success message
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        // Error toast
        showToast(
          result.error ||
            "Failed to update payroll. Please check your data and try again.",
          "error"
        );
        console.error("Server error:", result);
      }
    } catch (error) {
      console.error("Error:", error);
      showToast(
        "Network error occurred. Please check your connection and try again.",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Toast Container */}
      <ToastContainer />

      <div className="space-y-6">
        {/* Employee Info Header */}
        <div className="flex items-center gap-3 pb-4 border-b">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">{payroll.full_name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="outline" className="text-xs">
                {payroll.country_name}
              </Badge>
              <span>•</span>
              <span>{payroll.currency_code}</span>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Period & Type Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="w-4 h-4" />
                Period & Type
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="payroll_type_id">Payroll Type</Label>
                  <Select
                    name="payroll_type_id"
                    value={selectedPayrollType}
                    onValueChange={setSelectedPayrollType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={payroll.payroll_type_id.toString()}>
                        {payroll.payroll_type}
                      </SelectItem>
                      {payrollTypes
                        .filter(
                          (type) =>
                            type.payroll_type_id !== payroll.payroll_type_id
                        )
                        .map((type) => (
                          <SelectItem
                            key={type.payroll_type_id}
                            value={type.payroll_type_id.toString()}
                          >
                            {type.type_name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="pay_period_id">Pay Period</Label>
                  <Select
                    name="pay_period_id"
                    value={selectedPayPeriod}
                    onValueChange={setSelectedPayPeriod}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select period" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={payroll.pay_period_id.toString()}>
                        {formatDate(payroll.period_start)} -{" "}
                        {formatDate(payroll.period_end)}
                      </SelectItem>
                      {payPeriods
                        .filter(
                          (period) =>
                            period.pay_period_id !== payroll.pay_period_id
                        )
                        .map((period) => (
                          <SelectItem
                            key={period.pay_period_id}
                            value={period.pay_period_id.toString()}
                          >
                            {formatDate(period.period_start)} -{" "}
                            {formatDate(period.period_end)}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Salary Details Section */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Salary Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="basic_salary">Basic Salary *</Label>
                  <Input
                    id="basic_salary"
                    name="basic_salary"
                    type="number"
                    step="0.01"
                    min="0"
                    value={basicSalary}
                    onChange={(e) =>
                      setBasicSalary(Number(e.target.value) || 0)
                    }
                    className="font-medium"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bonus">
                    {selectedPayrollTypeName.toLowerCase() === "commission"
                      ? "Commission"
                      : "Bonus"}
                  </Label>
                  <Input
                    id="bonus"
                    name="bonus"
                    type="number"
                    step="0.01"
                    min="0"
                    value={bonus}
                    onChange={(e) => setBonus(Number(e.target.value) || 0)}
                    disabled={
                      selectedPayrollTypeName.toLowerCase() === "regular"
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overtime Section - only show if payroll type is overtime */}
          {(selectedPayrollTypeName.toLowerCase() === "overtime" ||
            overtimeHours > 0) && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  Overtime
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="overtime_hours">Hours</Label>
                    <Input
                      id="overtime_hours"
                      name="overtime_hours"
                      type="number"
                      step="0.25"
                      min="0"
                      value={overtimeHours}
                      onChange={(e) =>
                        setOvertimeHours(Number(e.target.value) || 0)
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="overtime_rate">Rate per Hour</Label>
                    <Input
                      id="overtime_rate"
                      name="overtime_rate"
                      type="number"
                      step="0.01"
                      min="0"
                      value={overtimeRate}
                      onChange={(e) =>
                        setOvertimeRate(Number(e.target.value) || 0)
                      }
                    />
                  </div>
                </div>

                {overtimePay > 0 && (
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="text-sm text-muted-foreground">
                      Total Overtime Pay
                    </div>
                    <div className="font-medium">
                      {formatCurrency(overtimePay, payroll.currency_code)}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Net Pay Section - Auto-calculated, read-only */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">
                Net Pay (Auto-calculated)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="net_pay">Final Amount</Label>
                <Input
                  id="net_pay"
                  name="net_pay"
                  type="number"
                  step="0.01"
                  value={Number(netPay).toFixed(2)}
                  readOnly
                  className="font-semibold text-lg bg-muted"
                />
              </div>

              {/* Calculation Summary */}
              <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                <div className="text-sm font-medium text-muted-foreground">
                  Calculation Breakdown ({selectedPayrollTypeName})
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Basic Salary:</span>
                    <span>
                      {formatCurrency(basicSalary, payroll.currency_code)}
                    </span>
                  </div>

                  {(selectedPayrollTypeName.toLowerCase() === "bonus" ||
                    selectedPayrollTypeName.toLowerCase() === "commission") &&
                    bonus > 0 && (
                      <div className="flex justify-between">
                        <span>
                          {selectedPayrollTypeName.toLowerCase() ===
                          "commission"
                            ? "Commission:"
                            : "Bonus:"}
                        </span>
                        <span>
                          {formatCurrency(bonus, payroll.currency_code)}
                        </span>
                      </div>
                    )}

                  {selectedPayrollTypeName.toLowerCase() === "overtime" &&
                    overtimePay > 0 && (
                      <div className="flex justify-between">
                        <span>Overtime Pay:</span>
                        <span>
                          {formatCurrency(overtimePay, payroll.currency_code)}
                        </span>
                      </div>
                    )}

                  <Separator className="my-2" />
                  <div className="flex justify-between font-medium">
                    <span>Net Pay:</span>
                    <span>
                      {formatCurrency(
                        Number(netPay) || 0,
                        payroll.currency_code
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Update Payroll
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
}
