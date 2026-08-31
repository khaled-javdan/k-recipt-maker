import { fa } from "@/lib/fa"

import { SignInForm } from "./sign-in-form"

export const metadata = { title: `${fa.auth.signIn} — ${fa.appName}` }

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>
}) {
  const { next } = await searchParams

  return (
    <main className="bg-muted/40 flex min-h-svh items-center justify-center p-6">
      <SignInForm next={next} />
    </main>
  )
}
