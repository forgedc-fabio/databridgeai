"use client";

import { useActionState } from "react";
import { signIn } from "@/features/auth/actions/login";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginState = {
  error?: string;
};

async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    const result = await signIn(formData);
    if (result?.error) {
      // Map Supabase error messages to user-friendly copy
      if (
        result.error.includes("Invalid login credentials") ||
        result.error.includes("invalid") ||
        result.error.includes("Email not confirmed")
      ) {
        return { error: "Invalid email or password. Please try again." };
      }
      return { error: result.error };
    }
    return {};
  } catch (error) {
    // Network errors or unexpected failures
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return {
      error:
        "Unable to reach the authentication service. Please try again in a moment.",
    };
  }
}

export default function LoginPage() {
  const [state, formAction, isPending] = useActionState(loginAction, {});

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <h1 className="mb-6 text-xl font-semibold">DataBridge AI</h1>
      <Card className="w-full max-w-[400px]">
        <CardHeader>
          <CardTitle>Sign in to DataBridge AI</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                name="email"
                type="email"
                required
                autoFocus
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {state.error && (
              <p className="text-sm text-destructive">{state.error}</p>
            )}
            <Button
              type="submit"
              className="mt-2 w-full"
              disabled={isPending}
            >
              {isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
