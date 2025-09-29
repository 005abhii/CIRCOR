"use client";

import { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../../components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Search, RefreshCw, UserCheck, UserX, Loader2 } from "lucide-react";

interface Employee {
  employee_id: string;
  full_name: string;
  date_of_birth: string | null;
  start_date: string | null;
  country_name: string;
  currency_code: string;
  created_at: string;
  is_active: boolean;
}

interface EmployeeTableProps {
  // Expect exact country names returned by API: "India" | "France" | "USA"
  country?: string;
  onRowClick?: (employee: Employee) => void;
  canManage?: boolean; // New prop to determine if user can toggle status
}

export function EmployeeTable({
  country,
  onRowClick,
  canManage = false,
}: EmployeeTableProps) {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/employees");
      if (!response.ok) {
        throw new Error("Failed to fetch employees");
      }
      const data = await response.json();
      setEmployees(data.employees || []);
      setError(null);
    } catch (err) {
      setError("Failed to load employees");
      console.error("Error fetching employees:", err);
    } finally {
      setLoading(false);
    }
  };

  const toggleEmployeeStatus = async (
    employeeId: string,
    currentStatus: boolean
  ) => {
    if (!canManage) return;

    setUpdatingStatus(employeeId);
    try {
      const response = await fetch(`/api/employees/${employeeId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          is_active: !currentStatus,
        }),
      });

      if (response.ok) {
        // Update the employee in the local state
        setEmployees((prev) =>
          prev.map((emp) =>
            emp.employee_id === employeeId
              ? { ...emp, is_active: !currentStatus }
              : emp
          )
        );

        toast({
          title: "Success",
          description: `Employee ${
            !currentStatus ? "activated" : "deactivated"
          } successfully`,
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update employee status",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleRowClick = (employee: Employee) => {
    if (!employee.is_active) {
      toast({
        title: "Access Denied",
        description: "Cannot access inactive employee details",
        variant: "destructive",
      });
      return;
    }
    onRowClick?.(employee);
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const filteredEmployees = employees.filter((employee) => {
    const matchesSearch =
      employee.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employee_id.toString().includes(searchTerm) ||
      employee.country_name.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCountry = country ? employee.country_name === country : true;
    return matchesSearch && matchesCountry;
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Employee Directory</CardTitle>
          <Button
            onClick={fetchEmployees}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary">
            {filteredEmployees.length} employee
            {filteredEmployees.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-destructive text-sm mb-4 p-3 bg-destructive/10 rounded-md">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin mr-2" />
            Loading employees...
          </div>
        ) : filteredEmployees.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {searchTerm
              ? "No employees found matching your search."
              : "No employees found."}
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Employee ID</TableHead>
                  <TableHead>Full Name</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Date of Birth</TableHead>
                  <TableHead>Start Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  {canManage && <TableHead>Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee) => (
                  <TableRow
                    key={employee.employee_id}
                    className={`${
                      employee.is_active
                        ? "cursor-pointer hover:bg-muted"
                        : "cursor-not-allowed bg-muted/50 opacity-60"
                    }`}
                    onClick={() => handleRowClick(employee)}
                  >
                    <TableCell className="font-mono text-sm">
                      {employee.employee_id}
                    </TableCell>
                    <TableCell className="font-medium">
                      {employee.full_name}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{employee.country_name}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {employee.currency_code}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatDate(employee.date_of_birth)}</TableCell>
                    <TableCell>{formatDate(employee.start_date)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={employee.is_active ? "default" : "destructive"}
                        className={
                          employee.is_active
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : ""
                        }
                      >
                        {employee.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {formatDate(employee.created_at)}
                    </TableCell>
                    {canManage && (
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <Button
                          onClick={() =>
                            toggleEmployeeStatus(
                              employee.employee_id,
                              employee.is_active
                            )
                          }
                          disabled={updatingStatus === employee.employee_id}
                          size="sm"
                          variant={
                            employee.is_active ? "destructive" : "default"
                          }
                          className="h-8 px-2"
                        >
                          {updatingStatus === employee.employee_id ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                          ) : employee.is_active ? (
                            <>
                              <UserX className="h-3 w-3 mr-1" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <UserCheck className="h-3 w-3 mr-1" />
                              Activate
                            </>
                          )}
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
