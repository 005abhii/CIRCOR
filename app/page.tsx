import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center space-y-8 max-w-md">
        <div className="space-y-4">
          <div className="w-16 h-16 bg-accent rounded-xl flex items-center justify-center mx-auto">
            <div className="w-8 h-8 bg-accent-foreground rounded-md"></div>
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            CIRCOR
          </h1>{" "}
          <h1 className="text-4xl font-semibold tracking-tight text-balance">
            Employee Payroll System
          </h1>
          <p className="text-muted-foreground text-pretty leading-relaxed">
            Access your payroll information, manage your profile, and stay
            connected with your global team.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            asChild
            className="h-11 bg-accent hover:bg-accent/90 text-accent-foreground"
          >
            <Link href="/sign-in">Sign in to your account</Link>
          </Button>
          <Button asChild variant="outline" className="h-11 bg-transparent">
            <Link href="/sign-up">Create new account</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
