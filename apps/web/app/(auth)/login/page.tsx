import { getT } from "@/lib/i18n/server"

import { SignInForm } from "./sign-in-form"

// Titles are part of the translated surface, so they are resolved per
// request like everything else rather than frozen at module load.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.auth.signIn} — ${t.appName}` }
}

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
