"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EmployeeTable } from "@/components/employee/employee-table";
import { AddEmployeeForm } from "@/components/employee/add-employee-form";
import { CSVUpload } from "@/components/employee/csv-upload";
import { EmployeeDetailPanel } from "../../../components/employee/employee-detail";
import { Users, UserPlus, Upload } from "lucide-react";
import { getCountryFilterForRole, getRoleDisplayName } from "@/lib/role-access";
import { Badge } from "@/components/ui/badge";

function roleToCountryName(role: string): "India" | "France" | "USA" | null {
  const r = role?.toLowerCase();
  if (r === "admin") return null;
  if (r === "india_admin" || r === "indian") return "India";
  if (r === "france_admin" || r === "france") return "France";
  if (r === "us_admin" || r === "us") return "USA";
  return null;
}

function canManageEmployees(role: string): boolean {
  const r = role?.toLowerCase();
  return (
    r === "admin" ||
    r === "india_admin" ||
    r === "france_admin" ||
    r === "us_admin"
  );
}

export function EmployeeManagementClient({ session }: { session: any }) {
  const [selectedEmployee, setSelectedEmployee] = useState<any | null>(null);

  const isAdmin = session.role?.toLowerCase() === "admin";
  const countryName = roleToCountryName(session.role);
  const canManage = canManageEmployees(session.role);

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
                    className="text-sm font-medium "
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
                    className="text-sm font-medium "
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

      {/* Main */}
      <main className="container mx-auto px-4 py-8">
        <div className="space-y-8">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold">Employee Management</h1>
              <Badge variant="outline" className="text-xs">
                {getRoleDisplayName(session.role as any)}
              </Badge>
            </div>
            <p className="text-muted-foreground text-lg">
              Manage employee records, create new profiles, and handle bulk
              operations {session.role !== "admin" && " for your region"}
            </p>
          </div>
          <Tabs defaultValue="directory" className="space-y-6 w-full">
            <TabsList
              className={`grid ${
                canManage ? "grid-cols-3" : "grid-cols-1"
              } w-full`}
            >
              <TabsTrigger value="directory">Directory</TabsTrigger>
              {canManage && (
                <TabsTrigger value="add-employee">Add Employee</TabsTrigger>
              )}
              {canManage && (
                <TabsTrigger value="bulk-upload">Bulk Upload</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="directory">
              {isAdmin ? (
                <Card>
                  {/* <CardHeader>
                    <CardTitle>All Employees</CardTitle>
                  </CardHeader> */}
                  <CardContent>
                    <EmployeeTable
                      onRowClick={setSelectedEmployee}
                      canManage={canManage}
                    />
                  </CardContent>
                </Card>
              ) : countryName ? (
                <Card>
                  {/* <CardHeader>
                    <CardTitle>{countryName} Employees</CardTitle>
                  </CardHeader> */}
                  <CardContent>
                    <EmployeeTable
                      country={countryName}
                      onRowClick={setSelectedEmployee}
                      canManage={canManage}
                    />
                  </CardContent>
                </Card>
              ) : (
                <div className="text-sm text-muted-foreground">
                  You do not have access to the directory.
                </div>
              )}
            </TabsContent>

            {canManage && (
              <TabsContent value="add-employee">
                <AddEmployeeForm restrictedCountry={countryName} />
              </TabsContent>
            )}

            {canManage && (
              <TabsContent value="bulk-upload">
                <CSVUpload restrictedCountry={countryName} />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </main>

      {/* Slide-out detail panel */}
      {selectedEmployee && (
        <EmployeeDetailPanel
          employee={selectedEmployee}
          onClose={() => setSelectedEmployee(null)}
          restrictedCountry={countryName}
        />
      )}
    </div>
  );
}
