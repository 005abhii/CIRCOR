import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";
import { EmployeeManagementClient } from "./employee-management-client";

export default async function EmployeeManagementPage() {
  const session = await getSession();
  if (!session) redirect("/sign-in");

  return <EmployeeManagementClient session={session} />;
}
