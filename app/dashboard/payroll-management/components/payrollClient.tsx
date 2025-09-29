// app/dashboard/payroll-management/components/PayrollClient.tsx - Complete fixed client component
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Plus,
  Search,
  Download,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";

interface PayrollData {
  payroll_id: string;
  employee_id: string;
  full_name: string;
  country_name: string;
  currency_code: string;
  period_start: string;
  period_end: string;
  payroll_type: string;
  basic_salary: number;
  bonus: number;
  net_pay: number;
  payroll_created_at: string;
}

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

interface Summary {
  overall: {
    total_payrolls: number;
    total_payout: number;
    avg_salary: number;
    countries_count: number;
  };
}

const PayrollManagement: React.FC = () => {
  const [payrollData, setPayrollData] = useState<PayrollData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [payPeriods, setPayPeriods] = useState<PayPeriod[]>([]);
  const [payrollTypes, setPayrollTypes] = useState<PayrollType[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    country: "all",
    payPeriod: "all",
  });
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState<PayrollData | null>(
    null
  );

  useEffect(() => {
    fetchPayrollData();
  }, [filters, pagination.page]);

  useEffect(() => {
    fetchEmployees();
    fetchPayPeriods();
    fetchPayrollTypes();
    fetchSummary();
  }, []);

  const fetchPayrollData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        ...filters,
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
      });

      const response = await fetch(`/api/payroll?${params}`);
      if (!response.ok) throw new Error("Failed to fetch payroll data");

      const data = await response.json();
      setPayrollData(data.data || []);
      setPagination((prev) => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0,
      }));
    } catch (error) {
      console.error("Error fetching payroll data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const response = await fetch("/api/employees");
      if (response.ok) {
        const data = await response.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchPayPeriods = async () => {
    try {
      const response = await fetch("/api/pay-periods");
      if (response.ok) {
        const data = await response.json();
        setPayPeriods(data);
      }
    } catch (error) {
      console.error("Error fetching pay periods:", error);
    }
  };

  const fetchPayrollTypes = async () => {
    try {
      const response = await fetch("/api/payroll-types");
      if (response.ok) {
        const data = await response.json();
        setPayrollTypes(data);
      }
    } catch (error) {
      console.error("Error fetching payroll types:", error);
    }
  };

  const fetchSummary = async () => {
    try {
      const params = new URLSearchParams({
        payPeriod: filters.payPeriod,
      });
      const response = await fetch(`/api/payroll/summary?${params}`);
      if (response.ok) {
        const data = await response.json();
        setSummary(data);
      }
    } catch (error) {
      console.error("Error fetching summary:", error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, page: 1 }));
  };

  const handleExport = async () => {
    try {
      const params = new URLSearchParams({
        ...filters,
        format: "csv",
      });

      const response = await fetch(`/api/payroll/export?${params}`);
      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payroll-export-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error exporting data:", error);
      alert("Export failed. Please try again.");
    }
  };

  const handleDelete = async (payrollId: string) => {
    try {
      const response = await fetch(`/api/payroll/${payrollId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchPayrollData();
        fetchSummary();
      } else {
        throw new Error("Delete failed");
      }
    } catch (error) {
      console.error("Error deleting payroll:", error);
      alert("Delete failed. Please try again.");
    }
  };

  const formatCurrency = (amount: number, currencyCode: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode || "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold">Payroll Management</h1>
          <p className="text-gray-600 text-lg">
            Create, process, and manage employee payroll
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Payroll
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Payroll Entry</DialogTitle>
              </DialogHeader>
              <CreatePayrollForm
                employees={employees}
                payPeriods={payPeriods}
                payrollTypes={payrollTypes}
                onSuccess={() => {
                  setCreateDialogOpen(false);
                  fetchPayrollData();
                  fetchSummary();
                }}
              />
            </DialogContent>
          </Dialog>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {/* {summary && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payrolls
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.overall?.total_payrolls || 0}
              </div>
              <p className="text-xs text-gray-500">Active payroll entries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Payout
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.overall?.total_payout || 0, "USD")}
              </div>
              <p className="text-xs text-gray-500">This period</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {summary.overall?.countries_count || 0}
              </div>
              <p className="text-xs text-gray-500">Active countries</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Salary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(summary.overall?.avg_salary || 0, "USD")}
              </div>
              <p className="text-xs text-gray-500">Across all employees</p>
            </CardContent>
          </Card>
        </div>
      )} */}

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by employee name..."
                  className="pl-10"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                />
              </div>
            </div>
            <Select
              value={filters.country}
              onValueChange={(value) => handleFilterChange("country", value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Countries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Countries</SelectItem>
                <SelectItem value="india">India</SelectItem>
                <SelectItem value="france">France</SelectItem>
                <SelectItem value="usa">USA</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.payPeriod}
              onValueChange={(value) => handleFilterChange("payPeriod", value)}
            >
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Pay Periods" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Periods</SelectItem>
                {payPeriods.map((period) => (
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
        </CardContent>
      </Card>

      {/* Payroll Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Payroll Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Pay Period</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Basic Salary</TableHead>
                  <TableHead>Bonus</TableHead>
                  <TableHead>Net Pay</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-gray-500">
                        Loading payroll data...
                      </div>
                    </TableCell>
                  </TableRow>
                ) : payrollData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-gray-500">
                        No payroll records found. Create your first payroll
                        entry.
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  payrollData.map((payroll) => (
                    <TableRow key={payroll.payroll_id}>
                      <TableCell className="font-medium">
                        <div>
                          <div>{payroll.full_name}</div>
                          <div className="text-xs text-gray-500">
                            ID: {payroll.employee_id}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{payroll.country_name}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{formatDate(payroll.period_start)}</div>
                          <div className="text-xs text-gray-500">
                            to {formatDate(payroll.period_end)}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {payroll.payroll_type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {formatCurrency(
                          payroll.basic_salary,
                          payroll.currency_code
                        )}
                      </TableCell>
                      <TableCell>
                        {payroll.bonus
                          ? formatCurrency(payroll.bonus, payroll.currency_code)
                          : "-"}
                      </TableCell>
                      <TableCell className="font-semibold">
                        {formatCurrency(payroll.net_pay, payroll.currency_code)}
                      </TableCell>
                      <TableCell>
                        {formatDate(payroll.payroll_created_at)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" asChild>
                            <Link
                              href={`/dashboard/payroll-management/${payroll.payroll_id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Link>
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedPayroll(payroll);
                              setEditDialogOpen(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Delete Payroll Entry
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this payroll
                                  entry for {payroll.full_name}? This action
                                  cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() =>
                                    handleDelete(payroll.payroll_id)
                                  }
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
                {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                of {pagination.total} results
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page - 1 }))
                  }
                  disabled={pagination.page <= 1}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </Button>
                <span className="text-sm">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setPagination((prev) => ({ ...prev, page: prev.page + 1 }))
                  }
                  disabled={pagination.page >= pagination.totalPages}
                >
                  Next
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      {selectedPayroll && (
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                Edit Payroll Entry - {selectedPayroll.full_name}
              </DialogTitle>
            </DialogHeader>
            <EditPayrollForm
              payroll={selectedPayroll}
              onSuccess={() => {
                setEditDialogOpen(false);
                setSelectedPayroll(null);
                fetchPayrollData();
                fetchSummary();
              }}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

// Create Payroll Form Component
interface CreatePayrollFormProps {
  employees: Employee[];
  payPeriods: PayPeriod[];
  payrollTypes: PayrollType[];
  onSuccess: () => void;
}

const CreatePayrollForm: React.FC<CreatePayrollFormProps> = ({
  employees,
  payPeriods,
  payrollTypes,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    employee_id: "",
    pay_period_id: "",
    payroll_type_id: "",
    basic_salary: "",
    bonus: "",
    overtime_hours: "",
    overtime_rate: "",
    net_pay: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formDataObj = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) formDataObj.append(key, value);
      });

      const response = await fetch("/api/payroll/create", {
        method: "POST",
        body: formDataObj,
      });

      if (response.ok) {
        onSuccess();
        setFormData({
          employee_id: "",
          pay_period_id: "",
          payroll_type_id: "",
          basic_salary: "",
          bonus: "",
          overtime_hours: "",
          overtime_rate: "",
          net_pay: "",
        });
      } else {
        throw new Error("Failed to create payroll");
      }
    } catch (error) {
      console.error("Error creating payroll:", error);
      alert("Failed to create payroll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="employee_id">Employee</Label>
          <Select
            value={formData.employee_id}
            onValueChange={(value) => handleChange("employee_id", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select employee" />
            </SelectTrigger>
            <SelectContent>
              {employees.map((employee) => (
                <SelectItem
                  key={employee.employee_id}
                  value={employee.employee_id}
                >
                  {employee.full_name} ({employee.country_name})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="pay_period_id">Pay Period</Label>
          <Select
            value={formData.pay_period_id}
            onValueChange={(value) => handleChange("pay_period_id", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select pay period" />
            </SelectTrigger>
            <SelectContent>
              {payPeriods.map((period) => (
                <SelectItem
                  key={period.pay_period_id}
                  value={period.pay_period_id.toString()}
                >
                  {new Date(period.period_start).toLocaleDateString()} -{" "}
                  {new Date(period.period_end).toLocaleDateString()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="payroll_type_id">Payroll Type</Label>
          <Select
            value={formData.payroll_type_id}
            onValueChange={(value) => handleChange("payroll_type_id", value)}
            required
          >
            <SelectTrigger>
              <SelectValue placeholder="Select payroll type" />
            </SelectTrigger>
            <SelectContent>
              {payrollTypes.map((type) => (
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
          <Label htmlFor="basic_salary">Basic Salary</Label>
          <Input
            id="basic_salary"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.basic_salary}
            onChange={(e) => handleChange("basic_salary", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bonus">Bonus (Optional)</Label>
          <Input
            id="bonus"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.bonus}
            onChange={(e) => handleChange("bonus", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="overtime_hours">Overtime Hours</Label>
          <Input
            id="overtime_hours"
            type="number"
            step="0.25"
            min="0"
            placeholder="0.00"
            value={formData.overtime_hours}
            onChange={(e) => handleChange("overtime_hours", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="overtime_rate">Overtime Rate</Label>
          <Input
            id="overtime_rate"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.overtime_rate}
            onChange={(e) => handleChange("overtime_rate", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="net_pay">Net Pay</Label>
          <Input
            id="net_pay"
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={formData.net_pay}
            onChange={(e) => handleChange("net_pay", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Payroll"}
        </Button>
      </div>
    </form>
  );
};

// Edit Payroll Form Component
interface EditPayrollFormProps {
  payroll: PayrollData;
  onSuccess: () => void;
}

const EditPayrollForm: React.FC<EditPayrollFormProps> = ({
  payroll,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    basic_salary: payroll.basic_salary?.toString() || "",
    bonus: payroll.bonus?.toString() || "",
    overtime_hours: "0",
    overtime_rate: "0",
    net_pay: payroll.net_pay?.toString() || "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`/api/payroll/${payroll.payroll_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          basic_salary: parseFloat(formData.basic_salary) || 0,
          bonus: parseFloat(formData.bonus) || 0,
          overtime_hours: parseFloat(formData.overtime_hours) || 0,
          overtime_rate: parseFloat(formData.overtime_rate) || 0,
          net_pay: parseFloat(formData.net_pay) || 0,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        throw new Error("Failed to update payroll");
      }
    } catch (error) {
      console.error("Error updating payroll:", error);
      alert("Failed to update payroll. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label>Employee</Label>
          <div className="p-2 bg-gray-50 rounded border">
            {payroll.full_name} ({payroll.country_name})
          </div>
        </div>

        <div className="space-y-2">
          <Label>Pay Period</Label>
          <div className="p-2 bg-gray-50 rounded border">
            {new Date(payroll.period_start).toLocaleDateString()} -{" "}
            {new Date(payroll.period_end).toLocaleDateString()}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="basic_salary">Basic Salary</Label>
          <Input
            id="basic_salary"
            type="number"
            step="0.01"
            min="0"
            value={formData.basic_salary}
            onChange={(e) => handleChange("basic_salary", e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="bonus">Bonus</Label>
          <Input
            id="bonus"
            type="number"
            step="0.01"
            min="0"
            value={formData.bonus}
            onChange={(e) => handleChange("bonus", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="overtime_hours">Overtime Hours</Label>
          <Input
            id="overtime_hours"
            type="number"
            step="0.25"
            min="0"
            value={formData.overtime_hours}
            onChange={(e) => handleChange("overtime_hours", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="overtime_rate">Overtime Rate</Label>
          <Input
            id="overtime_rate"
            type="number"
            step="0.01"
            min="0"
            value={formData.overtime_rate}
            onChange={(e) => handleChange("overtime_rate", e.target.value)}
          />
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="net_pay">Net Pay</Label>
          <Input
            id="net_pay"
            type="number"
            step="0.01"
            min="0"
            value={formData.net_pay}
            onChange={(e) => handleChange("net_pay", e.target.value)}
            required
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline">
          Cancel
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Updating..." : "Update Payroll"}
        </Button>
      </div>
    </form>
  );
};

export default PayrollManagement;
