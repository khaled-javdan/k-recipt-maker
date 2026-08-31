"use client"

import { useActionState } from "react"
import { Button } from "@workspace/ui/components/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"
import { Input } from "@workspace/ui/components/input"
import { Label } from "@workspace/ui/components/label"

import { signIn, type SignInState } from "@/actions/auth"
import { fa } from "@/lib/fa"

export function SignInForm({ next }: { next?: string }) {
  const [state, formAction, pending] = useActionState<SignInState, FormData>(
    signIn,
    {}
  )

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{fa.auth.signInTitle}</CardTitle>
        <CardDescription>{fa.auth.signInSubtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}

          <div className="grid gap-2">
            <Label htmlFor="username">{fa.auth.username}</Label>
            {/* Credentials are Latin, so these two fields opt out of RTL. */}
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              dir="ltr"
              required
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="password">{fa.auth.password}</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              dir="ltr"
              required
            />
          </div>

          {state.error ? (
            <p role="alert" className="text-destructive text-sm">
              {state.error}
            </p>
          ) : null}

          <Button type="submit" disabled={pending} className="w-full">
            {pending ? fa.auth.signingIn : fa.auth.signIn}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
