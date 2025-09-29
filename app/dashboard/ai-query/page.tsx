import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import AIQueryPageClient from "./client";

export default async function AIQueryPage() {
  const session = await getSession();

  if (!session) {
    redirect("/sign-in");
  }

  return <AIQueryPageClient session={session} />;
}
