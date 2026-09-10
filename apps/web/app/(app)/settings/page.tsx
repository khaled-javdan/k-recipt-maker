import Link from "next/link"
import { Button } from "@workspace/ui/components/button"

import { SettingsForm } from "@/components/settings-form"
import { getCurrentUser } from "@/lib/dal"
import { getSettings } from "@/lib/data"
import { getT } from "@/lib/i18n/server"

// Titles are part of the translated surface, so they are resolved per
// request like everything else rather than frozen at module load.
export async function generateMetadata() {
  const t = await getT()
  return { title: `${t.settings.title} — ${t.appName}` }
}

export default async function SettingsPage() {
  const t = await getT()

  const [settings, user] = await Promise.all([getSettings(), getCurrentUser()])

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t.settings.title}</h1>
        {user?.role === "ADMIN" ? (
          <Button
            variant="outline"
            render={<Link href="/settings/users" />}
            nativeButton={false}
          >
            {t.settings.users}
          </Button>
        ) : null}
      </div>
      <SettingsForm settings={settings} />
    </>
  )
}
