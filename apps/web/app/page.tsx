import { Button } from "@workspace/ui/components/button"

import { signOut } from "@/actions/auth"
import { requireUser } from "@/lib/dal"
import { fa } from "@/lib/fa"

export default async function HomePage() {
  const user = await requireUser()

  return (
    <main className="mx-auto max-w-2xl p-6">
      <h1 className="text-2xl font-semibold">{fa.appName}</h1>
      <p className="text-muted-foreground mt-2">
        {user.displayName} — {user.role}
      </p>
      <form action={signOut} className="mt-6">
        <Button type="submit" variant="outline">
          {fa.auth.signOut}
        </Button>
      </form>
    </main>
  )
}
