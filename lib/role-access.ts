// lib/role-access.ts (Updated with management permissions)
import type { ValidRole } from "./auth";

export function getCountryFilterForRole(role: ValidRole): string {
  switch (role) {
    case "india_admin":
      return "India";
    case "france_admin":
      return "France";
    case "us_admin":
      return "USA";
    case "admin":
    default:
      return ""; // No filter for main admin
  }
}

export function getRoleDisplayName(role: ValidRole): string {
  switch (role) {
    case "admin":
      return "Global Admin";
    case "india_admin":
      return "India Admin";
    case "france_admin":
      return "France Admin";
    case "us_admin":
      return "USA Admin";
    default:
      return "Unknown Role";
  }
}

export function canAccessCountry(
  userRole: ValidRole,
  countryName: string
): boolean {
  if (userRole === "admin") {
    return true; // Main admin can access all countries
  }

  const allowedCountry = getCountryFilterForRole(userRole);
  return allowedCountry === countryName;
}

export function canManageEmployees(role: string): boolean {
  const r = role?.toLowerCase();
  return (
    r === "admin" ||
    r === "india_admin" ||
    r === "france_admin" ||
    r === "us_admin"
  );
}

export function getCountryRestrictionMessage(role: ValidRole): string {
  switch (role) {
    case "india_admin":
      return "You can only manage Indian employees and payroll";
    case "france_admin":
      return "You can only manage French employees and payroll";
    case "us_admin":
      return "You can only manage USA employees and payroll";
    case "admin":
      return "You have access to all countries";
    default:
      return "Access restricted";
  }
}

export interface RolePermissions {
  canViewAllCountries: boolean;
  allowedCountries: string[];
  canCreatePayroll: boolean;
  canEditPayroll: boolean;
  canDeletePayroll: boolean;
  canManageEmployeeStatus: boolean;
}

export function getRolePermissions(role: ValidRole): RolePermissions {
  const basePermissions = {
    canCreatePayroll: true,
    canEditPayroll: true,
    canDeletePayroll: false, // Generally restrict delete for safety
    canManageEmployeeStatus: true,
  };

  switch (role) {
    case "admin":
      return {
        ...basePermissions,
        canViewAllCountries: true,
        allowedCountries: ["India", "France", "USA"],
        canDeletePayroll: true, // Only main admin can delete
      };
    case "india_admin":
      return {
        ...basePermissions,
        canViewAllCountries: false,
        allowedCountries: ["India"],
      };
    case "france_admin":
      return {
        ...basePermissions,
        canViewAllCountries: false,
        allowedCountries: ["France"],
      };
    case "us_admin":
      return {
        ...basePermissions,
        canViewAllCountries: false,
        allowedCountries: ["USA"],
      };
    default:
      return {
        canViewAllCountries: false,
        allowedCountries: [],
        canCreatePayroll: false,
        canEditPayroll: false,
        canDeletePayroll: false,
        canManageEmployeeStatus: false,
      };
  }
}
