"use client";

import type React from "react";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Upload,
  FileText,
  Download,
  Loader2,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface CSVUploadProps {
  onUploadComplete?: () => void;
  restrictedCountry?: "India" | "France" | "USA" | null;
}

interface UploadResult {
  row: number;
  employee_id?: string;
  status: string;
  error?: string;
}

// Add at top of file
function normalizeDate(dateStr: string): string | null {
  if (!dateStr) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const [day, month, year] = dateStr.split("-");
    return `${year}-${month}-${day}`;
  }
  return null;
}
interface CSVUploadProps {
  restrictedCountry?: "India" | "France" | "USA" | null;
}
export function CSVUpload({
  onUploadComplete,
  restrictedCountry,
}: CSVUploadProps) {
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [uploadResults, setUploadResults] = useState<{
    successful: number;
    failed: number;
    results: UploadResult[];
    errors: UploadResult[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile && selectedFile.type === "text/csv") {
      setFile(selectedFile);
      setUploadResults(null);
    } else {
      toast({
        title: "Invalid file type",
        description: "Please select a CSV file",
        variant: "destructive",
      });
    }
  };

  const parseCSV = (csvText: string) => {
    const lines = csvText.split("\n").filter((line) => line.trim());
    if (lines.length < 2) {
      throw new Error("CSV must have at least a header row and one data row");
    }

    const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
    const employees = [];

    // Get country ID and currency for restricted users
    const getCountryInfo = (country: string) => {
      const countryMap: Record<string, { id: number; currency: string }> = {
        India: { id: 1, currency: "INR" },
        France: { id: 2, currency: "EUR" },
        USA: { id: 3, currency: "USD" },
      };
      return countryMap[country];
    };

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(",").map((v) => v.trim());
      if (values.length !== headers.length) continue;

      const employee: any = {};
      headers.forEach((header, index) => {
        const value = values[index];

        // Map CSV headers to database fields
        switch (header) {
          case "employee_id":
            employee.employee_id = Number.parseInt(value);
            break;
          case "full_name":
          case "name":
            employee.full_name = value;
            break;
          case "country_id":
            employee.country_id = Number.parseInt(value);
            break;
          case "currency_code":
          case "currency":
            employee.currency_code = value;
            break;
          case "date_of_birth":
          case "dob":
            employee.date_of_birth = normalizeDate(value);
            break;
          case "start_date":
            employee.start_date = normalizeDate(value);
            break;

          // Country-specific fields
          case "aadhar_number":
          case "pan":
          case "bank_account":
          case "ifsc":
          case "numero_securite_sociale":
          case "bank_iban":
          case "department_code":
          case "ssn":
          case "routing_number":
            if (!employee.country_specific_data) {
              employee.country_specific_data = {};
            }
            employee.country_specific_data[header] = value || null;
            break;
        }
      });

      // Override country and currency if restricted
      if (restrictedCountry) {
        const countryInfo = getCountryInfo(restrictedCountry);
        if (countryInfo) {
          employee.country_id = countryInfo.id;
          employee.currency_code = countryInfo.currency;
        }
      }

      if (
        employee.employee_id &&
        employee.full_name &&
        employee.country_id &&
        employee.currency_code
      ) {
        employees.push(employee);
      }
    }

    return employees;
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);
    try {
      const csvText = await file.text();
      const employees = parseCSV(csvText);

      if (employees.length === 0) {
        throw new Error("No valid employee records found in CSV");
      }

      const response = await fetch("/api/employees/bulk-upload", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ employees }),
      });

      if (response.ok) {
        const result = await response.json();
        setUploadResults(result);

        toast({
          title: "Upload Complete",
          description: `Successfully processed ${result.successful} employees, ${result.failed} failed`,
        });

        onUploadComplete?.();
      } else {
        const error = await response.json();
        toast({
          title: "Upload Failed",
          description: error.error || "Failed to upload employees",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description:
          error instanceof Error ? error.message : "Failed to process CSV file",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const downloadTemplate = () => {
    // Generate template based on restriction
    let csvContent = "";

    if (restrictedCountry === "India") {
      csvContent = `employee_id,full_name,date_of_birth,start_date,aadhar_number,pan,bank_account,ifsc
123456,John Doe,1990-01-15,2024-01-01,123456789012,ABCDE1234F,1234567890,SBIN0001234
789012,Jane Smith,1985-05-20,2024-02-01,987654321098,FGHIJ5678K,0987654321,ICIC0002345`;
    } else if (restrictedCountry === "France") {
      csvContent = `employee_id,full_name,date_of_birth,start_date,numero_securite_sociale,bank_iban,department_code
234567,Jean Dupont,1988-03-10,2024-01-15,123456789012345,FR1420041010050500013M02606,75
345678,Marie Martin,1992-07-22,2024-02-15,234567890123456,FR1420041010050500013M02607,69`;
    } else if (restrictedCountry === "USA") {
      csvContent = `employee_id,full_name,date_of_birth,start_date,ssn,bank_account,routing_number
345678,Bob Johnson,1992-03-10,2024-03-01,123-45-6789,9876543210,123456789
456789,Alice Wilson,1987-11-05,2024-03-15,987-65-4321,1234567890,987654321`;
    } else {
      // Admin template with all countries
      csvContent = `employee_id,full_name,country_id,currency_code,date_of_birth,start_date,aadhar_number,pan,bank_account,ifsc,numero_securite_sociale,bank_iban,department_code,ssn,routing_number
123456,John Doe,1,INR,1990-01-15,2024-01-01,123456789012,ABCDE1234F,1234567890,SBIN0001234,,,,,,
789012,Jane Smith,2,EUR,1985-05-20,2024-02-01,,,,,123456789012345,FR1420041010050500013M02606,75,,
345678,Bob Johnson,3,USD,1992-03-10,2024-03-01,,,,,,,123-45-6789,9876543210,123456789`;
    }

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `employee_template_${restrictedCountry || "all"}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const resetUpload = () => {
    setFile(null);
    setUploadResults(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Bulk Employee Upload {restrictedCountry && `(${restrictedCountry})`}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Button onClick={downloadTemplate} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Download Template
          </Button>
          <span className="text-sm text-muted-foreground">
            Download the CSV template to see the required format
            {restrictedCountry && ` for ${restrictedCountry}`}
          </span>
        </div>

        <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6">
          <div className="text-center space-y-4">
            {!file ? (
              <>
                <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Upload CSV File</p>
                  <p className="text-xs text-muted-foreground">
                    Select a CSV file with employee data
                    {restrictedCountry && ` for ${restrictedCountry}`}
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  variant="outline"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Select CSV File
                </Button>
              </>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <FileText className="h-8 w-8 text-accent" />
                  <div className="text-left">
                    <p className="font-medium">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleUpload}
                    disabled={loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Employees
                      </>
                    )}
                  </Button>
                  <Button onClick={resetUpload} variant="outline">
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {uploadResults && (
          <div className="space-y-4 border-t pt-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-800"
                >
                  {uploadResults.successful} Successful
                </Badge>
              </div>
              {uploadResults.failed > 0 && (
                <div className="flex items-center gap-2">
                  <XCircle className="h-5 w-5 text-red-500" />
                  <Badge variant="destructive">
                    {uploadResults.failed} Failed
                  </Badge>
                </div>
              )}
            </div>

            <Progress
              value={
                (uploadResults.successful /
                  (uploadResults.successful + uploadResults.failed)) *
                100
              }
              className="w-full"
            />

            {uploadResults.errors.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium text-sm text-destructive">
                  Errors:
                </h4>
                <div className="max-h-32 overflow-y-auto space-y-1">
                  {uploadResults.errors.map((error, index) => (
                    <div
                      key={index}
                      className="text-sm text-destructive bg-destructive/10 p-2 rounded"
                    >
                      Row {error.row}: {error.error}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong>CSV Format Requirements:</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Required columns: employee_id, full_name</li>
            {!restrictedCountry && (
              <>
                <li>Country IDs: 1=India, 2=France, 3=USA</li>
                <li>Currency codes: INR, EUR, USD</li>
              </>
            )}
            {restrictedCountry === "India" && (
              <li>Country automatically set to India (INR currency)</li>
            )}
            {restrictedCountry === "France" && (
              <li>Country automatically set to France (EUR currency)</li>
            )}
            {restrictedCountry === "USA" && (
              <li>Country automatically set to USA (USD currency)</li>
            )}
            <li>Date format: YYYY-MM-DD or DD-MM-YYYY</li>
            <li>Include country-specific fields as needed</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
