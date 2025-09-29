"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  X,
  Edit,
  Save,
  User,
  Calendar,
  MapPin,
  CreditCard,
  Loader2,
} from "lucide-react";

interface Employee {
  employee_id: string;
  full_name: string;
  date_of_birth: string | null;
  start_date: string | null;
  country_name: string;
  currency_code: string;
  created_at: string;
}

interface EmployeeDetails extends Employee {
  country_id: number;
  // India specific
  aadhar_number?: string;
  pan?: string;
  bank_account?: string;
  ifsc?: string;
  // France specific
  numero_securite_sociale?: string;
  bank_iban?: string;
  department_code?: string;
  // USA specific
  ssn?: string;
  routing_number?: string;
}

interface EmployeeDetailPanelProps {
  employee: Employee;
  onClose: () => void;
  restrictedCountry?: "India" | "France" | "USA" | null;
}

export function EmployeeDetailPanel({
  employee,
  onClose,
  restrictedCountry,
}: EmployeeDetailPanelProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [employeeDetails, setEmployeeDetails] =
    useState<EmployeeDetails | null>(null);
  const [editData, setEditData] = useState<Partial<EmployeeDetails>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchEmployeeDetails();
  }, [employee.employee_id]);

  const fetchEmployeeDetails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/employees/${employee.employee_id}`);
      if (response.ok) {
        const data = await response.json();
        setEmployeeDetails(data.employee);
        // Only initialize region-specific data for editing
        const regionSpecificData: Partial<EmployeeDetails> = {};
        if (data.employee.country_id === 1) {
          regionSpecificData.aadhar_number = data.employee.aadhar_number || "";
          regionSpecificData.pan = data.employee.pan || "";
          regionSpecificData.bank_account = data.employee.bank_account || "";
          regionSpecificData.ifsc = data.employee.ifsc || "";
        } else if (data.employee.country_id === 2) {
          regionSpecificData.numero_securite_sociale =
            data.employee.numero_securite_sociale || "";
          regionSpecificData.bank_iban = data.employee.bank_iban || "";
          regionSpecificData.department_code =
            data.employee.department_code || "";
        } else if (data.employee.country_id === 3) {
          regionSpecificData.ssn = data.employee.ssn || "";
          regionSpecificData.bank_account = data.employee.bank_account || "";
          regionSpecificData.routing_number =
            data.employee.routing_number || "";
        }
        setEditData(regionSpecificData);
      } else {
        toast({
          title: "Error",
          description: "Failed to load employee details",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load employee details",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaveLoading(true);
    try {
      const countryId = employeeDetails?.country_id;
      let countrySpecificData = null;

      // Prepare only country-specific data for update
      if (countryId === 1) {
        countrySpecificData = {
          aadhar_number: editData.aadhar_number || null,
          pan: editData.pan || null,
          bank_account: editData.bank_account || null,
          ifsc: editData.ifsc || null,
        };
      } else if (countryId === 2) {
        countrySpecificData = {
          numero_securite_sociale: editData.numero_securite_sociale || null,
          bank_iban: editData.bank_iban || null,
          department_code: editData.department_code || null,
        };
      } else if (countryId === 3) {
        countrySpecificData = {
          ssn: editData.ssn || null,
          bank_account: editData.bank_account || null,
          routing_number: editData.routing_number || null,
        };
      }

      const response = await fetch(`/api/employees/${employee.employee_id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Keep existing basic info unchanged
          full_name: employeeDetails?.full_name,
          date_of_birth: employeeDetails?.date_of_birth,
          start_date: employeeDetails?.start_date,
          country_id: employeeDetails?.country_id,
          currency_code: employeeDetails?.currency_code,
          country_specific_data: countrySpecificData,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description:
            "Employee region-specific information updated successfully",
        });
        setIsEditing(false);
        fetchEmployeeDetails(); // Refresh data
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to update employee",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update employee",
        variant: "destructive",
      });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset only region-specific data
    const regionSpecificData: Partial<EmployeeDetails> = {};
    if (employeeDetails?.country_id === 1) {
      regionSpecificData.aadhar_number = employeeDetails.aadhar_number || "";
      regionSpecificData.pan = employeeDetails.pan || "";
      regionSpecificData.bank_account = employeeDetails.bank_account || "";
      regionSpecificData.ifsc = employeeDetails.ifsc || "";
    } else if (employeeDetails?.country_id === 2) {
      regionSpecificData.numero_securite_sociale =
        employeeDetails.numero_securite_sociale || "";
      regionSpecificData.bank_iban = employeeDetails.bank_iban || "";
      regionSpecificData.department_code =
        employeeDetails.department_code || "";
    } else if (employeeDetails?.country_id === 3) {
      regionSpecificData.ssn = employeeDetails.ssn || "";
      regionSpecificData.bank_account = employeeDetails.bank_account || "";
      regionSpecificData.routing_number = employeeDetails.routing_number || "";
    }
    setEditData(regionSpecificData);
    setIsEditing(false);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Not specified";
    return new Date(dateString).toLocaleDateString();
  };

  // Only show edit button if there's region-specific information to edit
  const hasRegionSpecificInfo =
    employeeDetails?.country_id &&
    [1, 2, 3].includes(employeeDetails.country_id);

  if (loading) {
    return (
      <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50">
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-background border-l shadow-lg z-50 overflow-y-auto">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Employee Details</h2>
          <div className="flex gap-2">
            {hasRegionSpecificInfo && !isEditing ? (
              <Button
                onClick={() => setIsEditing(true)}
                size="sm"
                variant="outline"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
            ) : hasRegionSpecificInfo && isEditing ? (
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  size="sm"
                  disabled={saveLoading}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {saveLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Save
                </Button>
                <Button onClick={handleCancel} size="sm" variant="outline">
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
              </div>
            ) : null}
            <Button onClick={onClose} size="sm" variant="ghost">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {employeeDetails && (
          <div className="space-y-6">
            {/* Basic Information - Read Only */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Basic Information
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Read Only
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Employee ID</Label>
                  <div className="mt-1 font-mono text-sm bg-muted p-2 rounded">
                    {employeeDetails.employee_id}
                  </div>
                </div>

                <div>
                  <Label>Full Name</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    {employeeDetails.full_name}
                  </div>
                </div>

                <div>
                  <Label>Country</Label>
                  <div className="mt-1">
                    <Badge variant="outline">
                      {employeeDetails.country_name}
                    </Badge>
                  </div>
                </div>

                <div>
                  <Label>Currency</Label>
                  <div className="mt-1">
                    <Badge variant="secondary">
                      {employeeDetails.currency_code}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Important Dates - Read Only */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Important Dates
                  <Badge variant="secondary" className="ml-auto text-xs">
                    Read Only
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Date of Birth</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    {formatDate(employeeDetails.date_of_birth)}
                  </div>
                </div>

                <div>
                  <Label>Start Date</Label>
                  <div className="mt-1 p-2 bg-muted rounded">
                    {formatDate(employeeDetails.start_date)}
                  </div>
                </div>

                <div>
                  <Label>Created</Label>
                  <div className="mt-1 p-2 bg-muted rounded text-sm text-muted-foreground">
                    {formatDate(employeeDetails.created_at)}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Country-specific information - Editable */}
            {employeeDetails.country_id === 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    India-specific Information
                    <Badge variant="outline" className="ml-auto text-xs">
                      Editable
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="aadhar_number">Aadhar Number</Label>
                    {isEditing ? (
                      <Input
                        id="aadhar_number"
                        value={editData.aadhar_number || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            aadhar_number: e.target.value,
                          })
                        }
                        maxLength={12}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.aadhar_number || "Not specified"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="pan">PAN</Label>
                    {isEditing ? (
                      <Input
                        id="pan"
                        value={editData.pan || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, pan: e.target.value })
                        }
                        maxLength={10}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.pan || "Not specified"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bank_account">Bank Account</Label>
                    {isEditing ? (
                      <Input
                        id="bank_account"
                        value={editData.bank_account || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            bank_account: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.bank_account || "Not specified"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="ifsc">IFSC Code</Label>
                    {isEditing ? (
                      <Input
                        id="ifsc"
                        value={editData.ifsc || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, ifsc: e.target.value })
                        }
                        maxLength={11}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.ifsc || "Not specified"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {employeeDetails.country_id === 2 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    France-specific Information
                    <Badge variant="outline" className="ml-auto text-xs">
                      Editable
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="numero_securite_sociale">
                      Social Security Number
                    </Label>
                    {isEditing ? (
                      <Input
                        id="numero_securite_sociale"
                        value={editData.numero_securite_sociale || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            numero_securite_sociale: e.target.value,
                          })
                        }
                        maxLength={15}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.numero_securite_sociale ||
                          "Not specified"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bank_iban">Bank IBAN</Label>
                    {isEditing ? (
                      <Input
                        id="bank_iban"
                        value={editData.bank_iban || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            bank_iban: e.target.value,
                          })
                        }
                        maxLength={34}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.bank_iban || "Not specified"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="department_code">Department Code</Label>
                    {isEditing ? (
                      <Input
                        id="department_code"
                        value={editData.department_code || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            department_code: e.target.value,
                          })
                        }
                        maxLength={2}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.department_code || "Not specified"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {employeeDetails.country_id === 3 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    USA-specific Information
                    <Badge variant="outline" className="ml-auto text-xs">
                      Editable
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="ssn">Social Security Number</Label>
                    {isEditing ? (
                      <Input
                        id="ssn"
                        value={editData.ssn || ""}
                        onChange={(e) =>
                          setEditData({ ...editData, ssn: e.target.value })
                        }
                        maxLength={11}
                        placeholder="XXX-XX-XXXX"
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.ssn || "Not specified"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="bank_account_usa">Bank Account</Label>
                    {isEditing ? (
                      <Input
                        id="bank_account_usa"
                        value={editData.bank_account || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            bank_account: e.target.value,
                          })
                        }
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.bank_account || "Not specified"}
                      </div>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="routing_number">Routing Number</Label>
                    {isEditing ? (
                      <Input
                        id="routing_number"
                        value={editData.routing_number || ""}
                        onChange={(e) =>
                          setEditData({
                            ...editData,
                            routing_number: e.target.value,
                          })
                        }
                        maxLength={9}
                        className="mt-1"
                      />
                    ) : (
                      <div className="mt-1 p-2 bg-muted rounded">
                        {employeeDetails.routing_number || "Not specified"}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
