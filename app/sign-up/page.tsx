import { SignUpForm } from "@/components/auth/sign-up-form"
import Link from "next/link"

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Create your account</h1>
          <p className="text-muted-foreground text-pretty">Get started with your employee portal</p>
        </div>

        <SignUpForm />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Already have an account? </span>
          <Link href="/sign-in" className="text-accent hover:text-accent/80 font-medium transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
