"use client";

import type React from "react";

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
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus } from "lucide-react";

interface Country {
  country_id: number;
  country_name: string;
}

interface Currency {
  currency_code: string;
  currency_name: string;
}

interface AddEmployeeFormProps {
  restrictedCountry?: "India" | "France" | "USA" | null;
}

export function AddEmployeeForm({ restrictedCountry }: AddEmployeeFormProps) {
  const [loading, setLoading] = useState(false);
  const [countries, setCountries] = useState<Country[]>([]);
  const [currencies, setCurrencies] = useState<Currency[]>([]);
  const [formData, setFormData] = useState({
    employee_id: "",
    full_name: "",
    date_of_birth: "",
    start_date: "",
    country_id: "",
    currency_code: "",
    // Country-specific fields
    aadhar_number: "",
    pan: "",
    bank_account: "",
    ifsc: "",
    numero_securite_sociale: "",
    bank_iban: "",
    department_code: "",
    ssn: "",
    routing_number: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchCountries();
    fetchCurrencies();
  }, []);

  useEffect(() => {
    // Auto-select country and currency if restricted
    if (restrictedCountry && countries.length > 0) {
      const countryMap: Record<string, { id: number; currency: string }> = {
        India: { id: 1, currency: "INR" },
        France: { id: 2, currency: "EUR" },
        USA: { id: 3, currency: "USD" },
      };

      const countryInfo = countryMap[restrictedCountry];
      if (countryInfo) {
        setFormData((prev) => ({
          ...prev,
          country_id: countryInfo.id.toString(),
          currency_code: countryInfo.currency,
        }));
      }
    }
  }, [restrictedCountry, countries]);

  const fetchCountries = async () => {
    try {
      const response = await fetch("/api/countries");
      if (response.ok) {
        const data = await response.json();
        setCountries(data.countries || []);
      }
    } catch (error) {
      console.error("Error fetching countries:", error);
    }
  };

  const fetchCurrencies = async () => {
    try {
      const response = await fetch("/api/currencies");
      if (response.ok) {
        const data = await response.json();
        setCurrencies(data.currencies || []);
      }
    } catch (error) {
      console.error("Error fetching currencies:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const countryId = Number.parseInt(formData.country_id);
      let countrySpecificData = null;

      // Prepare country-specific data
      if (countryId === 1 && formData.aadhar_number) {
        // India
        countrySpecificData = {
          aadhar_number: formData.aadhar_number,
          pan: formData.pan,
          bank_account: formData.bank_account,
          ifsc: formData.ifsc,
        };
      } else if (countryId === 2 && formData.numero_securite_sociale) {
        // France
        countrySpecificData = {
          numero_securite_sociale: formData.numero_securite_sociale,
          bank_iban: formData.bank_iban,
          department_code: formData.department_code,
        };
      } else if (countryId === 3 && formData.ssn) {
        // USA
        countrySpecificData = {
          ssn: formData.ssn,
          bank_account: formData.bank_account,
          routing_number: formData.routing_number,
        };
      }

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          employee_id: Number.parseInt(formData.employee_id),
          full_name: formData.full_name,
          date_of_birth: formData.date_of_birth || null,
          start_date: formData.start_date || null,
          country_id: countryId,
          currency_code: formData.currency_code,
          country_specific_data: countrySpecificData,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Employee created successfully",
        });
        // Reset form
        setFormData({
          employee_id: "",
          full_name: "",
          date_of_birth: "",
          start_date: "",
          country_id: restrictedCountry ? formData.country_id : "",
          currency_code: restrictedCountry ? formData.currency_code : "",
          aadhar_number: "",
          pan: "",
          bank_account: "",
          ifsc: "",
          numero_securite_sociale: "",
          bank_iban: "",
          department_code: "",
          ssn: "",
          routing_number: "",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Error",
          description: error.error || "Failed to create employee",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedCountryId = Number.parseInt(formData.country_id);

  // Filter countries and currencies based on restriction
  const availableCountries = restrictedCountry
    ? countries.filter((country) => country.country_name === restrictedCountry)
    : countries;

  const availableCurrencies = restrictedCountry
    ? currencies.filter((currency) => {
        const countryToCurrency: Record<string, string> = {
          India: "INR",
          France: "EUR",
          USA: "USD",
        };
        return currency.currency_code === countryToCurrency[restrictedCountry];
      })
    : currencies;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5" />
          Add New Employee {restrictedCountry && `(${restrictedCountry})`}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="employee_id">Employee ID *</Label>
              <Input
                id="employee_id"
                type="number"
                value={formData.employee_id}
                onChange={(e) =>
                  setFormData({ ...formData, employee_id: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name *</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="country">Country *</Label>
              <Select
                value={formData.country_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, country_id: value })
                }
                disabled={!!restrictedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {availableCountries.map((country) => (
                    <SelectItem
                      key={country.country_id}
                      value={country.country_id.toString()}
                    >
                      {country.country_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency *</Label>
              <Select
                value={formData.currency_code}
                onValueChange={(value) =>
                  setFormData({ ...formData, currency_code: value })
                }
                disabled={!!restrictedCountry}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {availableCurrencies.map((currency) => (
                    <SelectItem
                      key={currency.currency_code}
                      value={currency.currency_code}
                    >
                      {currency.currency_code} - {currency.currency_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Date of Birth</Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth}
                onChange={(e) =>
                  setFormData({ ...formData, date_of_birth: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="start_date">Start Date</Label>
              <Input
                id="start_date"
                type="date"
                value={formData.start_date}
                onChange={(e) =>
                  setFormData({ ...formData, start_date: e.target.value })
                }
              />
            </div>
          </div>

          {/* Country-specific fields */}
          {selectedCountryId === 1 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                India-specific Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="aadhar_number">Aadhar Number</Label>
                  <Input
                    id="aadhar_number"
                    value={formData.aadhar_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        aadhar_number: e.target.value,
                      })
                    }
                    maxLength={12}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pan">PAN</Label>
                  <Input
                    id="pan"
                    value={formData.pan}
                    onChange={(e) =>
                      setFormData({ ...formData, pan: e.target.value })
                    }
                    maxLength={10}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account">Bank Account</Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_account: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="ifsc">IFSC Code</Label>
                  <Input
                    id="ifsc"
                    value={formData.ifsc}
                    onChange={(e) =>
                      setFormData({ ...formData, ifsc: e.target.value })
                    }
                    maxLength={11}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedCountryId === 2 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                France-specific Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="numero_securite_sociale">
                    Social Security Number
                  </Label>
                  <Input
                    id="numero_securite_sociale"
                    value={formData.numero_securite_sociale}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        numero_securite_sociale: e.target.value,
                      })
                    }
                    maxLength={15}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_iban">Bank IBAN</Label>
                  <Input
                    id="bank_iban"
                    value={formData.bank_iban}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_iban: e.target.value })
                    }
                    maxLength={34}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department_code">Department Code</Label>
                  <Input
                    id="department_code"
                    value={formData.department_code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        department_code: e.target.value,
                      })
                    }
                    maxLength={2}
                  />
                </div>
              </div>
            </div>
          )}

          {selectedCountryId === 3 && (
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-medium text-sm text-muted-foreground">
                USA-specific Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="ssn">Social Security Number</Label>
                  <Input
                    id="ssn"
                    value={formData.ssn}
                    onChange={(e) =>
                      setFormData({ ...formData, ssn: e.target.value })
                    }
                    placeholder="XXX-XX-XXXX"
                    maxLength={11}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="bank_account_usa">Bank Account</Label>
                  <Input
                    id="bank_account_usa"
                    value={formData.bank_account}
                    onChange={(e) =>
                      setFormData({ ...formData, bank_account: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routing_number">Routing Number</Label>
                  <Input
                    id="routing_number"
                    value={formData.routing_number}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        routing_number: e.target.value,
                      })
                    }
                    maxLength={9}
                  />
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Employee...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Employee
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
