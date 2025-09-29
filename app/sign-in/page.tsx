import { SignInForm } from "@/components/auth/sign-in-form"
import Link from "next/link"

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight text-balance">Welcome back</h1>
          <p className="text-muted-foreground text-pretty">Sign in to your account to continue</p>
        </div>

        <SignInForm />

        <div className="text-center text-sm">
          <span className="text-muted-foreground">Don't have an account? </span>
          <Link href="/sign-up" className="text-accent hover:text-accent/80 font-medium transition-colors">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  )
}
