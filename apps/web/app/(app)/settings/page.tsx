import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

import { SettingsForm } from "@/components/settings-form"
import { getCurrentUser } from "@/lib/dal"
import { getSettings } from "@/lib/data"
import { fa } from "@/lib/fa"

export const metadata = { title: `${fa.settings.title} — ${fa.appName}` }

export default async function SettingsPage() {
  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()])

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{fa.settings.title}</h1>
        {user?.role === "ADMIN" ? (
          <Button
            variant="outline"
            render={<Link href="/settings/users" />}
            nativeButton={false}
          >
            {fa.settings.users}
          </Button>
        ) : null}
      </div>
      <SettingsForm settings={settings} />
    </>
  )
}
